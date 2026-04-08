import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useCartStore, cartItemsToPedidoItems, type CartItem } from '@/store/cartStore'
import { useSyncStore } from '@/store/syncStore'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Stepper } from '@/components/ui/Stepper'
import { formatARS } from '@/utils/formatters'
import type { Producto } from '@/types/database'
import type { LocalPedido } from '@/lib/db'

type Step = 'cliente' | 'productos' | 'resumen'

export function OrderNew() {
  const navigate = useNavigate()
  const { vendedor } = useAuthStore()
  const {
    pedidoId, cliente, lista_precio_id, items, descuento_general,
    subtotalBruto, totalFinal, observaciones,
    actualizarCantidad, actualizarDescuentoItem,
    removerItem, setDescuentoGeneral, setObservaciones, limpiarCarrito,
  } = useCartStore()
  const { incrementarPendientes } = useSyncStore()
  const isOnline = useNetworkStatus()
  const [step, setStep] = useState<Step>(cliente ? 'productos' : 'cliente')
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  // Ir directo a productos si ya hay cliente
  useEffect(() => {
    if (cliente && step === 'cliente') setStep('productos')
  }, [cliente, step])

  const handleConfirmar = async () => {
    if (!cliente || !vendedor || items.length === 0) return
    setSaving(true)

    const ahora = new Date().toISOString()
    const pedido: LocalPedido = {
      id: pedidoId,
      vendedor_id: vendedor.id,
      cliente_id: cliente.id,
      numero: null,
      estado: isOnline ? 'enviado' : 'pendiente_sync',
      total: totalFinal,
      descuento_general,
      observaciones: observaciones ?? null,
      lista_precio_id: lista_precio_id!,
      tiene_conflicto: false,
      conflicto_detalle: null,
      created_at: ahora,
      synced_at: null,
      updated_at: ahora,
      _synced: 0,
      _sync_error: null,
    }

    const pedidoItems = cartItemsToPedidoItems(items, pedidoId)

    // 1. Guardar en Dexie siempre
    await db.transaction('rw', [db.pedidos, db.pedido_items], async () => {
      await db.pedidos.add(pedido)
      await db.pedido_items.bulkAdd(pedidoItems)
    })

    // 2. Si hay conexión, subir a Supabase
    if (isOnline) {
      const { error: errPedido } = await supabase.from('pedidos').insert({
        id: pedido.id,
        vendedor_id: pedido.vendedor_id,
        cliente_id: pedido.cliente_id,
        estado: 'enviado',
        total: pedido.total,
        descuento_general: pedido.descuento_general,
        observaciones: pedido.observaciones,
        lista_precio_id: pedido.lista_precio_id,
        tiene_conflicto: false,
        conflicto_detalle: null,
        created_at: pedido.created_at,
        updated_at: pedido.updated_at,
      } as never)

      if (!errPedido) {
        if (pedidoItems.length > 0) {
          await supabase.from('pedido_items').insert(pedidoItems as never[])
        }
        // Leer el número generado por el trigger
        const { data } = await supabase
          .from('pedidos')
          .select('numero, synced_at')
          .eq('id', pedido.id)
          .single<{ numero: string | null; synced_at: string | null }>()
        if (data) {
          await db.pedidos.update(pedido.id, {
            _synced: 1,
            numero: data.numero,
            synced_at: data.synced_at,
            estado: 'enviado',
          })
        }
      }
    } else {
      incrementarPendientes()
    }

    const idGuardado = pedidoId
    limpiarCarrito()
    setSavedId(idGuardado)
    setSaving(false)
  }

  if (savedId) {
    return <PedidoConfirmado pedidoId={savedId} isOnline={isOnline} />
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header con steps */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200 touch-manipulation"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-gray-900 text-lg">Nuevo pedido</h1>
          {items.length > 0 && (
            <span className="ml-auto bg-primary-100 text-primary-700 text-sm font-bold px-2 py-0.5 rounded-full">
              {items.length} ítem{items.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Stepper visual */}
        <div className="flex items-center gap-0 px-4 pb-3">
          {(['cliente', 'productos', 'resumen'] as Step[]).map((s, i) => {
            const labels = ['1. Cliente', '2. Productos', '3. Resumen']
            const done = step === 'productos' && s === 'cliente'
              || step === 'resumen' && s !== 'resumen'
            const active = step === s
            return (
              <div key={s} className="flex items-center flex-1">
                <button
                  onClick={() => {
                    if (s === 'cliente') setStep('cliente')
                    if (s === 'productos' && cliente) setStep('productos')
                    if (s === 'resumen' && items.length > 0) setStep('resumen')
                  }}
                  className={[
                    'text-xs font-semibold px-2 py-1 rounded-full transition-colors',
                    active ? 'bg-primary-600 text-white' :
                    done ? 'text-primary-600' : 'text-gray-400',
                  ].join(' ')}
                >
                  {labels[i]}
                </button>
                {i < 2 && <div className={`flex-1 h-0.5 mx-1 ${done ? 'bg-primary-400' : 'bg-gray-200'}`} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Contenido por step */}
      {step === 'cliente' && (
        <StepCliente onContinuar={() => setStep('productos')} />
      )}
      {step === 'productos' && (
        <StepProductos
          items={items}
          listaPrecioId={lista_precio_id}
          limiteDescuento={vendedor?.limite_descuento ?? 0}
          onActualizarCantidad={actualizarCantidad}
          onActualizarDescuento={actualizarDescuentoItem}
          onRemover={removerItem}
          onContinuar={() => setStep('resumen')}
        />
      )}
      {step === 'resumen' && (
        <StepResumen
          items={items}
          subtotalBruto={subtotalBruto}
          totalFinal={totalFinal}
          descuentoGeneral={descuento_general}
          limiteDescuento={vendedor?.limite_descuento ?? 0}
          observaciones={observaciones ?? ''}
          isOnline={isOnline}
          saving={saving}
          onDescuentoGeneral={setDescuentoGeneral}
          onObservaciones={setObservaciones}
          onConfirmar={handleConfirmar}
        />
      )}
    </div>
  )
}

// ---- Step 1: Seleccionar cliente ----

function StepCliente({ onContinuar }: { onContinuar: () => void }) {
  const { cliente, setCliente } = useCartStore()

  if (cliente) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="bg-primary-50 border-2 border-primary-300 rounded-2xl p-4">
          <p className="text-xs text-primary-600 font-semibold mb-1">Cliente seleccionado</p>
          <p className="font-bold text-gray-900 text-lg">{cliente.razon_social}</p>
          {cliente.localidad && <p className="text-sm text-gray-500">📍 {cliente.localidad}</p>}
        </div>
        <Button fullWidth size="lg" onClick={onContinuar}>
          Continuar con este cliente →
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => setCliente(null as never)}
        >
          Cambiar cliente
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6 items-center text-center">
      <div className="text-5xl">👥</div>
      <p className="text-gray-600">Primero seleccioná un cliente para el pedido.</p>
      <Link to="/clientes" state={{ returnTo: '/pedidos/nuevo' }} className="w-full">
        <Button fullWidth size="lg">Ir a Clientes</Button>
      </Link>
    </div>
  )
}

// ---- Step 2: Agregar productos ----

interface StepProductosProps {
  items: CartItem[]
  listaPrecioId: number | null
  limiteDescuento: number
  onActualizarCantidad: (id: string, qty: number) => void
  onActualizarDescuento: (id: string, dto: number) => void
  onRemover: (id: string) => void
  onContinuar: () => void
}

function StepProductos({
  items, listaPrecioId, limiteDescuento,
  onActualizarCantidad, onActualizarDescuento, onRemover, onContinuar,
}: StepProductosProps) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<Array<Producto & { precio?: number }>>([])
  const [buscando, setBuscando] = useState(false)
  const [mostrarBuscador, setMostrarBuscador] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Precios de la lista del cliente
  const [precioMap, setPrecioMap] = useState<Map<string, number>>(new Map())
  useEffect(() => {
    if (!listaPrecioId) return
    db.precios.where('lista_precio_id').equals(listaPrecioId).toArray().then(ps => {
      setPrecioMap(new Map(ps.map(p => [p.producto_id, p.precio])))
    })
  }, [listaPrecioId])

  // Buscar en Dexie
  useEffect(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) { setResultados([]); return }
    setBuscando(true)
    db.productos
      .filter(p => p.activo && (
        p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
      ))
      .limit(20)
      .toArray()
      .then(prods => {
        const conPrecio = prods.map(p => ({
          ...p,
          precio: precioMap.get(p.id),
        }))
        setResultados(conPrecio)
        setBuscando(false)
      })
  }, [busqueda, precioMap])

  const handleAgregar = (prod: Producto & { precio?: number }) => {
    if (!prod.precio) return
    useCartStore.getState().agregarItem(prod, 1, prod.precio)
    setBusqueda('')
    setResultados([])
    setMostrarBuscador(false)
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Buscador para agregar productos */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        {mostrarBuscador ? (
          <div className="flex flex-col gap-2">
            <Input
              ref={searchRef}
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              leftIcon={<span>🔍</span>}
              autoFocus
            />
            {/* Resultados del buscador */}
            {resultados.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg max-h-64 overflow-y-auto">
                {resultados.map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => handleAgregar(prod)}
                    className="w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 flex items-center justify-between gap-2 touch-manipulation"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-mono">{prod.codigo}</p>
                      <p className="font-semibold text-gray-900 text-sm truncate">{prod.nombre}</p>
                      <p className="text-xs text-gray-500">{prod.presentacion}</p>
                    </div>
                    <div className="text-right flex-none">
                      {prod.precio !== undefined ? (
                        <p className="font-bold text-primary-700 text-sm">{formatARS(prod.precio)}</p>
                      ) : (
                        <p className="text-xs text-red-400">Sin precio</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {busqueda && !buscando && resultados.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">Sin resultados</p>
            )}
            <button
              onClick={() => { setMostrarBuscador(false); setBusqueda('') }}
              className="text-sm text-gray-500 text-center py-1"
            >
              Cancelar búsqueda
            </button>
          </div>
        ) : (
          <Button
            fullWidth
            variant="secondary"
            onClick={() => { setMostrarBuscador(true); setTimeout(() => searchRef.current?.focus(), 100) }}
          >
            + Agregar producto
          </Button>
        )}
      </div>

      {/* Lista de ítems en el carrito */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 px-6 text-center">
          <div className="text-5xl mb-3">🛒</div>
          <p className="font-medium">El pedido está vacío</p>
          <p className="text-sm mt-1">Buscá productos arriba para agregar.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-gray-100">
            {items.map(item => (
              <CartItemRow
                key={item.id}
                item={item}
                limiteDescuento={limiteDescuento}
                onCantidad={qty => onActualizarCantidad(item.id, qty)}
                onDescuento={dto => onActualizarDescuento(item.id, dto)}
                onRemover={() => onRemover(item.id)}
              />
            ))}
          </div>

          {/* Total y continuar */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500">Total parcial</p>
              <p className="text-xl font-bold text-gray-900">{formatARS(useCartStore.getState().totalFinal)}</p>
            </div>
            <Button size="lg" onClick={onContinuar}>
              Revisar pedido →
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

interface CartItemRowProps {
  item: CartItem
  limiteDescuento: number
  onCantidad: (qty: number) => void
  onDescuento: (dto: number) => void
  onRemover: () => void
}

function CartItemRow({ item, limiteDescuento, onCantidad, onDescuento, onRemover }: CartItemRowProps) {
  const [mostrarDto, setMostrarDto] = useState(item.descuento_item > 0)

  return (
    <div className="bg-white px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-snug">{item.producto.nombre}</p>
          <p className="text-xs text-gray-500">{item.producto.presentacion}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{formatARS(item.precio_unitario)} / u</p>
        </div>
        <button
          onClick={onRemover}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 active:bg-red-50 touch-manipulation flex-none"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center justify-between mt-2 gap-3">
        <Stepper
          value={item.cantidad}
          onChange={onCantidad}
          min={1}
          step={item.producto.unidad_venta === 'kg' || item.producto.unidad_venta === 'litro' ? 0.5 : 1}
          decimals={item.producto.unidad_venta === 'kg' || item.producto.unidad_venta === 'litro' ? 1 : 0}
        />
        <div className="text-right">
          {item.descuento_item > 0 && (
            <p className="text-xs text-accent-600 line-through">{formatARS(item.cantidad * item.precio_unitario)}</p>
          )}
          <p className="font-bold text-gray-900">{formatARS(item.subtotal)}</p>
        </div>
      </div>

      {/* Descuento por ítem */}
      {mostrarDto ? (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">Descuento:</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={limiteDescuento}
            step={0.5}
            value={item.descuento_item}
            onChange={e => {
              const v = Math.min(parseFloat(e.target.value) || 0, limiteDescuento)
              onDescuento(v)
            }}
            className="w-16 text-center border-2 border-gray-300 rounded-lg py-1 text-sm focus:border-primary-500 focus:outline-none"
          />
          <span className="text-xs text-gray-500">% (máx {limiteDescuento}%)</span>
          {item.descuento_item === 0 && (
            <button onClick={() => setMostrarDto(false)} className="text-xs text-gray-400 ml-1">✕</button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setMostrarDto(true)}
          className="mt-1 text-xs text-primary-600 underline"
        >
          + Descuento
        </button>
      )}
    </div>
  )
}

// ---- Step 3: Resumen y confirmación ----

interface StepResumenProps {
  items: CartItem[]
  subtotalBruto: number
  totalFinal: number
  descuentoGeneral: number
  limiteDescuento: number
  observaciones: string
  isOnline: boolean
  saving: boolean
  onDescuentoGeneral: (v: number) => void
  onObservaciones: (v: string) => void
  onConfirmar: () => void
}

function StepResumen({
  items, subtotalBruto, totalFinal, descuentoGeneral, limiteDescuento,
  observaciones, isOnline, saving, onDescuentoGeneral, onObservaciones, onConfirmar,
}: StepResumenProps) {
  const cliente = useCartStore(s => s.cliente)

  return (
    <div className="flex flex-col gap-4 px-4 py-4 pb-8">
      {/* Cliente */}
      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4">
        <p className="text-xs text-primary-600 font-semibold">Cliente</p>
        <p className="font-bold text-gray-900">{cliente?.razon_social}</p>
        {cliente?.localidad && <p className="text-sm text-gray-500">📍 {cliente.localidad}</p>}
      </div>

      {/* Ítems */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-semibold text-gray-700">
            {items.length} producto{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{item.producto.nombre}</p>
              <p className="text-xs text-gray-400">
                {item.cantidad} × {formatARS(item.precio_unitario)}
                {item.descuento_item > 0 && ` − ${item.descuento_item}%`}
              </p>
            </div>
            <p className="font-bold text-gray-900 ml-3 flex-none">{formatARS(item.subtotal)}</p>
          </div>
        ))}
      </div>

      {/* Descuento general */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-gray-700">Descuento general</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={limiteDescuento}
              step={0.5}
              value={descuentoGeneral}
              onChange={e => onDescuentoGeneral(Math.min(parseFloat(e.target.value) || 0, limiteDescuento))}
              className="w-16 text-center border-2 border-gray-300 rounded-lg py-1.5 text-sm focus:border-primary-500 focus:outline-none"
            />
            <span className="text-sm text-gray-500">% (máx {limiteDescuento}%)</span>
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="font-semibold text-gray-700 mb-2">Observaciones</p>
        <textarea
          placeholder="Indicaciones de entrega, referencias, etc."
          value={observaciones}
          onChange={e => onObservaciones(e.target.value)}
          rows={3}
          className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 resize-none"
        />
      </div>

      {/* Totales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Subtotal</span>
          <span>{formatARS(subtotalBruto)}</span>
        </div>
        {descuentoGeneral > 0 && (
          <div className="flex justify-between text-sm text-accent-600 mb-1">
            <span>Descuento {descuentoGeneral}%</span>
            <span>− {formatARS(subtotalBruto * descuentoGeneral / 100)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xl text-gray-900 pt-2 border-t border-gray-100 mt-2">
          <span>TOTAL</span>
          <span>{formatARS(totalFinal)}</span>
        </div>
      </div>

      {/* Estado de conexión */}
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
          📡 Sin conexión — el pedido se guardará localmente y se enviará cuando vuelva la conexión.
        </div>
      )}

      <Button
        size="lg"
        fullWidth
        loading={saving}
        onClick={onConfirmar}
        disabled={items.length === 0}
      >
        {isOnline ? '✓ Confirmar y enviar pedido' : '💾 Guardar pedido (offline)'}
      </Button>
    </div>
  )
}

// ---- Confirmación ----

function PedidoConfirmado({ pedidoId, isOnline }: { pedidoId: string; isOnline: boolean }) {
  const [numero, setNumero] = useState<string | null>(null)

  useEffect(() => {
    db.pedidos.get(pedidoId).then(p => setNumero(p?.numero ?? null))
  }, [pedidoId])

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center">
      <div className="text-6xl mb-4">{isOnline ? '✅' : '💾'}</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {isOnline ? '¡Pedido enviado!' : 'Pedido guardado'}
      </h2>
      {numero && (
        <p className="text-primary-700 font-mono font-bold text-lg mb-1">#{numero}</p>
      )}
      <p className="text-gray-500 text-sm mb-8">
        {isOnline
          ? 'El pedido fue enviado correctamente.'
          : 'Se sincronizará automáticamente cuando haya conexión.'}
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link to={`/pedidos/${pedidoId}`}>
          <Button fullWidth variant="secondary">Ver detalle del pedido</Button>
        </Link>
        <Link to="/pedidos/nuevo">
          <Button fullWidth>Nuevo pedido</Button>
        </Link>
        <Link to="/dashboard">
          <Button fullWidth variant="ghost">Ir al inicio</Button>
        </Link>
      </div>
    </div>
  )
}
