import Dexie, { type Table } from 'dexie'
import type {
  Categoria,
  Producto,
  ListaPrecio,
  Precio,
  Cliente,
  Pedido,
  PedidoItem,
  Vendedor,
} from '@/types/database'

// ------ Tipos extendidos para Dexie (con campos de sync) ------

export interface LocalPedido extends Pedido {
  _synced: 0 | 1          // 0 = pendiente, 1 = sincronizado (Dexie indexa numbers, no booleans)
  _sync_error: string | null
}

export interface LocalCliente extends Cliente {
  _synced: 0 | 1
  _sync_error: string | null
}

// ------ Definición de la base de datos ------

class AgroVetDB extends Dexie {
  // Tablas de catálogo (se sincronizan desde Supabase, solo lectura local)
  categorias!: Table<Categoria, number>
  productos!: Table<Producto, string>
  listas_precios!: Table<ListaPrecio, number>
  precios!: Table<Precio, number>

  // Tablas con datos del vendedor
  vendedor!: Table<Vendedor, string>
  clientes!: Table<LocalCliente, string>

  // Pedidos (pueden originarse offline)
  pedidos!: Table<LocalPedido, string>
  pedido_items!: Table<PedidoItem, string>

  constructor() {
    super('agrovet-pedidos')

    // v1: schema inicial (sin índices compuestos ni multi-entry)
    this.version(1).stores({
      categorias:    'id',
      productos:     'id',
      listas_precios:'id',
      precios:       'id',
      vendedor:      'id',
      clientes:      'id',
      pedidos:       'id',
      pedido_items:  'id',
    })

    // v2: schema completo con todos los índices
    this.version(2).stores({
      categorias:    'id, nombre, activo',
      productos:     'id, codigo, nombre, categoria_id, activo',
      listas_precios:'id, nombre, activo',
      precios:       'id, [producto_id+lista_precio_id], producto_id, lista_precio_id',
      vendedor:      'id',
      clientes:      'id, vendedor_id, razon_social, cuit, localidad, estado, _synced',
      pedidos:       'id, vendedor_id, cliente_id, estado, created_at, _synced',
      pedido_items:  'id, pedido_id, producto_id',
    })
  }
}

export const db = new AgroVetDB()

// ------ Helpers ------

/** Precio de un producto para una lista dada, desde IndexedDB */
export async function getPrecioLocal(
  productoId: string,
  listaPrecioId: number
): Promise<number | null> {
  const precio = await db.precios
    .where('[producto_id+lista_precio_id]')
    .equals([productoId, listaPrecioId])
    .first()
  return precio?.precio ?? null
}

/** Todos los pedidos pendientes de sincronización */
export async function getPedidosPendientes(): Promise<LocalPedido[]> {
  return db.pedidos
    .where('_synced')
    .equals(0)
    .toArray()
}

/** Items de un pedido */
export async function getItemsPedido(pedidoId: string): Promise<PedidoItem[]> {
  return db.pedido_items
    .where('pedido_id')
    .equals(pedidoId)
    .toArray()
}

/** Limpia y recarga el catálogo completo (se llama al hacer sync) */
export async function recargarCatalogo(data: {
  categorias: Categoria[]
  productos: Producto[]
  listas_precios: ListaPrecio[]
  precios: Precio[]
}): Promise<void> {
  await db.transaction('rw', [
    db.categorias,
    db.productos,
    db.listas_precios,
    db.precios,
  ], async () => {
    await db.categorias.clear()
    await db.productos.clear()
    await db.listas_precios.clear()
    await db.precios.clear()

    await db.categorias.bulkPut(data.categorias)
    await db.productos.bulkPut(data.productos)
    await db.listas_precios.bulkPut(data.listas_precios)
    await db.precios.bulkPut(data.precios)
  })
}

/** Recarga los clientes del servidor, preservando los que están pendientes de sync. */
export async function recargarClientes(clientes: Cliente[]): Promise<void> {
  await db.transaction('rw', db.clientes, async () => {
    // Mantener los clientes locales que aún no se sincronizaron
    const pendientes = await db.clientes.where('_synced').equals(0).toArray()
    const pendientesIds = new Set(pendientes.map(p => p.id))

    // Borrar solo los ya sincronizados (los del servidor son la fuente de verdad)
    await db.clientes
      .filter(c => c._synced === 1)
      .delete()

    // Insertar los del servidor marcados como sincronizados
    const nuevos: LocalCliente[] = clientes
      .filter(c => !pendientesIds.has(c.id))  // no pisar los pendientes locales
      .map(c => ({ ...c, _synced: 1, _sync_error: null }))

    await db.clientes.bulkPut(nuevos)
  })
}
