import { supabase } from './supabase'
import {
  db,
  recargarCatalogo,
  recargarClientes,
  getPedidosPendientes,
  getItemsPedido,
  getPrecioLocal,
} from './db'
import { formatARS } from '@/utils/formatters'
import type { PedidoInsert, PedidoItemInsert } from '@/types/database'

// ============================================================
// Metadata de sincronización (en localStorage)
// ============================================================

const META_KEY = 'agrovet-sync-meta'

interface SyncMeta {
  ultima_sync: string | null
}

function getSyncMeta(): SyncMeta {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? 'null') ?? { ultima_sync: null }
  } catch {
    return { ultima_sync: null }
  }
}

function setSyncMeta(meta: Partial<SyncMeta>): void {
  const current = getSyncMeta()
  localStorage.setItem(META_KEY, JSON.stringify({ ...current, ...meta }))
}

export function getUltimaSync(): string | null {
  return getSyncMeta().ultima_sync
}

// ============================================================
// Tipos de resultado
// ============================================================

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

export interface SyncStats {
  clientesSubidos: number
  pedidosSubidos: number
  pedidosConConflicto: number
  errores: string[]
}

export interface SyncResult {
  status: SyncStatus
  stats: SyncStats
}

// ============================================================
// Punto de entrada principal
// ============================================================

export async function sincronizarTodo(
  onProgress?: (msg: string) => void
): Promise<SyncResult> {
  const stats: SyncStats = {
    clientesSubidos: 0,
    pedidosSubidos: 0,
    pedidosConConflicto: 0,
    errores: [],
  }

  try {
    // 1. Catálogo (descarga completa — siempre fresco para detectar conflictos de precio)
    onProgress?.('Actualizando catálogo...')
    await sincronizarCatalogo()

    // 2. Subir clientes nuevos creados offline ANTES de los pedidos
    //    (los pedidos pueden referenciar clientes que aún no están en el servidor)
    onProgress?.('Subiendo clientes nuevos...')
    const resClientes = await subirClientesPendientes()
    stats.clientesSubidos = resClientes.subidos
    stats.errores.push(...resClientes.errores)

    // 3. Descargar clientes actualizados (incluye los recién aprobados)
    onProgress?.('Actualizando clientes...')
    await sincronizarClientes()

    // 4. Subir pedidos pendientes (el catálogo ya está fresco: podemos detectar conflictos)
    onProgress?.('Enviando pedidos pendientes...')
    const resPedidos = await subirPedidosPendientes()
    stats.pedidosSubidos = resPedidos.subidos
    stats.pedidosConConflicto = resPedidos.conConflicto
    stats.errores.push(...resPedidos.errores)

    setSyncMeta({ ultima_sync: new Date().toISOString() })

    const status = stats.errores.length > 0 ? 'error' : 'success'
    return { status, stats }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido en la sincronización'
    stats.errores.push(msg)
    return { status: 'error', stats }
  }
}

// ============================================================
// 1. Catálogo
// ============================================================

async function sincronizarCatalogo(): Promise<void> {
  const [
    { data: categorias, error: eCat },
    { data: productos, error: eProd },
    { data: listas, error: eListas },
    { data: precios, error: ePrecios },
  ] = await Promise.all([
    supabase.from('categorias').select('*').eq('activo', true),
    supabase.from('productos').select('*').eq('activo', true),
    supabase.from('listas_precios').select('*').eq('activo', true),
    supabase.from('precios').select('*'),
  ])

  if (eCat || eProd || eListas || ePrecios) {
    throw new Error('No se pudo descargar el catálogo. Verificá tu conexión.')
  }

  await recargarCatalogo({
    categorias: categorias ?? [],
    productos: productos ?? [],
    listas_precios: listas ?? [],
    precios: precios ?? [],
  })
}

// ============================================================
// 2. Subir clientes pendientes
// ============================================================

async function subirClientesPendientes(): Promise<{ subidos: number; errores: string[] }> {
  const pendientes = await db.clientes.where('_synced').equals(0).toArray()
  let subidos = 0
  const errores: string[] = []

  for (const cliente of pendientes) {
    try {
      const { error } = await supabase.from('clientes').upsert({
        id: cliente.id,
        vendedor_id: cliente.vendedor_id,
        razon_social: cliente.razon_social,
        nombre_fantasia: cliente.nombre_fantasia,
        cuit: cliente.cuit,
        condicion_iva: cliente.condicion_iva,
        lista_precio_id: cliente.lista_precio_id,
        telefono: cliente.telefono,
        email: cliente.email,
        direccion: cliente.direccion,
        localidad: cliente.localidad,
        provincia: cliente.provincia,
        observaciones: cliente.observaciones,
        estado: cliente.estado,
        created_at: cliente.created_at,
        updated_at: cliente.updated_at,
      } as never)

      if (error) throw new Error(error.message)

      await db.clientes.update(cliente.id, { _synced: 1, _sync_error: null })
      subidos++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      await db.clientes.update(cliente.id, { _sync_error: msg })
      errores.push(`Cliente ${cliente.razon_social}: ${msg}`)
    }
  }

  return { subidos, errores }
}

// ============================================================
// 3. Descargar clientes del vendedor
// ============================================================

async function sincronizarClientes(): Promise<void> {
  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('*, lista_precio:listas_precios(id, nombre)')

  if (error) throw new Error('No se pudieron descargar los clientes.')
  await recargarClientes(clientes ?? [])
}

// ============================================================
// 4. Subir pedidos pendientes con detección de conflictos
// ============================================================

interface PedidosResult {
  subidos: number
  conConflicto: number
  errores: string[]
}

async function subirPedidosPendientes(): Promise<PedidosResult> {
  const pendientes = await getPedidosPendientes()
  let subidos = 0
  let conConflicto = 0
  const errores: string[] = []

  for (const pedido of pendientes) {
    try {
      const items = await getItemsPedido(pedido.id)

      // --- Detección de conflictos ---
      // El catálogo en Dexie ya fue actualizado en el paso 1,
      // así que comparamos contra los precios más frescos disponibles.
      const conflictos: string[] = []

      for (const item of items) {
        // Verificar que el producto sigue activo
        const producto = await db.productos.get(item.producto_id)
        if (!producto || !producto.activo) {
          conflictos.push(`"${producto?.nombre ?? item.producto_id}" ya no está disponible en el catálogo`)
          continue
        }

        // Verificar si el precio cambió (umbral: 1%)
        const precioActual = await getPrecioLocal(item.producto_id, pedido.lista_precio_id)
        if (precioActual === null) {
          conflictos.push(`"${producto.nombre}" no tiene precio en la lista actual`)
        } else {
          const diff = Math.abs(precioActual - item.precio_unitario) / item.precio_unitario
          if (diff > 0.01) {
            conflictos.push(
              `"${producto.nombre}": precio actualizado de ${formatARS(item.precio_unitario)} a ${formatARS(precioActual)}`
            )
          }
        }
      }

      const tieneConflicto = conflictos.length > 0
      const conflictoDetalle = tieneConflicto ? conflictos.join(' · ') : null

      // --- Insertar pedido en Supabase ---
      const pedidoInsert: PedidoInsert = {
        id: pedido.id,
        vendedor_id: pedido.vendedor_id,
        cliente_id: pedido.cliente_id,
        estado: 'enviado',
        total: pedido.total,
        descuento_general: pedido.descuento_general,
        observaciones: pedido.observaciones,
        lista_precio_id: pedido.lista_precio_id,
        tiene_conflicto: tieneConflicto,
        conflicto_detalle: conflictoDetalle,
        created_at: pedido.created_at,
        updated_at: new Date().toISOString(),
      }

      const { error: errPedido } = await supabase
        .from('pedidos')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(pedidoInsert as any)

      if (errPedido) throw new Error(errPedido.message)

      // --- Insertar ítems ---
      if (items.length > 0) {
        const itemsInsert: PedidoItemInsert[] = items.map(item => ({
          id: item.id,
          pedido_id: item.pedido_id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento_item: item.descuento_item,
          subtotal: item.subtotal,
          observaciones: item.observaciones,
        }))
        const { error: errItems } = await supabase
          .from('pedido_items')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .upsert(itemsInsert as any)
        if (errItems) throw new Error(errItems.message)
      }

      // --- Leer número generado por el trigger ---
      const { data: datosFrescos } = await supabase
        .from('pedidos')
        .select('numero, synced_at')
        .eq('id', pedido.id)
        .single<{ numero: string | null; synced_at: string | null }>()

      // --- Actualizar Dexie ---
      await db.pedidos.update(pedido.id, {
        _synced: 1,
        _sync_error: null,
        estado: 'enviado',
        numero: datosFrescos?.numero ?? null,
        synced_at: datosFrescos?.synced_at ?? new Date().toISOString(),
        tiene_conflicto: tieneConflicto,
        conflicto_detalle: conflictoDetalle,
      })

      subidos++
      if (tieneConflicto) conConflicto++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      await db.pedidos.update(pedido.id, { _sync_error: msg })
      errores.push(`Pedido ${pedido.id.slice(0, 8)}: ${msg}`)
    }
  }

  return { subidos, conConflicto, errores }
}

// ============================================================
// Helpers de conteo
// ============================================================

export async function contarPedidosPendientes(): Promise<number> {
  return db.pedidos.where('_synced').equals(0).count()
}

export async function contarClientesPendientes(): Promise<number> {
  return db.clientes.where('_synced').equals(0).count()
}

export async function contarTotalPendientes(): Promise<number> {
  const [p, c] = await Promise.all([contarPedidosPendientes(), contarClientesPendientes()])
  return p + c
}
