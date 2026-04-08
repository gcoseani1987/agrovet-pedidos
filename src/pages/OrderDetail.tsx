import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '@/lib/db'
import type { LocalPedido } from '@/lib/db'
import type { PedidoItem, Cliente, Producto } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { EstadoPedidoBadge } from '@/components/ui/Badge'
import { formatARS, formatFecha, labelCondicionIva } from '@/utils/formatters'
import { generarLinkWhatsApp } from '@/utils/whatsapp'
import { useSyncStore } from '@/store/syncStore'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

interface ItemCompleto extends PedidoItem {
  producto: Producto
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { sincronizar } = useSyncStore()
  const isOnline = useNetworkStatus()

  const [pedido, setPedido] = useState<LocalPedido | null>(null)
  const [items, setItems] = useState<ItemCompleto[]>([])
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function cargar() {
      const [p, rawItems] = await Promise.all([
        db.pedidos.get(id!),
        db.pedido_items.where('pedido_id').equals(id!).toArray(),
      ])
      if (!p) { setLoading(false); return }
      setPedido(p)

      // Cargar productos para cada ítem
      const productIds = [...new Set(rawItems.map(i => i.producto_id))]
      const prods = await db.productos.bulkGet(productIds)
      const prodMap = new Map(prods.filter(Boolean).map(p => [p!.id, p!]))

      const itemsCompletos: ItemCompleto[] = rawItems
        .filter(i => prodMap.has(i.producto_id))
        .map(i => ({ ...i, producto: prodMap.get(i.producto_id)! }))
      setItems(itemsCompletos)

      if (p.cliente_id) {
        const c = await db.clientes.get(p.cliente_id)
        setCliente(c ?? null)
      }
      setLoading(false)
    }
    cargar()
  }, [id])

  const handleWhatsApp = () => {
    if (!pedido || !cliente) return
    const url = generarLinkWhatsApp(pedido, cliente, items)
    window.open(url, '_blank')
  }

  const handleSincronizar = async () => {
    await sincronizar()
    // Recargar el pedido para ver si cambió el estado
    if (id) {
      const p = await db.pedidos.get(id)
      if (p) setPedido(p)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center text-gray-400">Cargando...</div>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="flex flex-col h-full">
        <TopBar onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center text-gray-400">Pedido no encontrado</div>
      </div>
    )
  }

  const subtotalBruto = pedido.descuento_general > 0
    ? +(pedido.total / (1 - pedido.descuento_general / 100)).toFixed(2)
    : pedido.total

  return (
    <div className="flex flex-col min-h-full">
      <TopBar onBack={() => navigate(-1)} />

      {/* Header */}
      <div className="bg-primary-700 px-4 pt-4 pb-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-primary-200 text-sm font-mono">
            {pedido.numero ?? `#${pedido.id.slice(0, 8)}`}
          </p>
          <EstadoPedidoBadge estado={pedido.estado} />
        </div>
        <p className="text-white font-bold text-2xl">{formatARS(pedido.total)}</p>
        <p className="text-primary-300 text-sm mt-1">{formatFecha(pedido.created_at)}</p>
        {pedido.synced_at && (
          <p className="text-primary-400 text-xs mt-0.5">
            Sincronizado: {formatFecha(pedido.synced_at)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 -mt-3">

        {/* Alerta de conflicto */}
        {pedido.tiene_conflicto && (
          <div className="bg-orange-50 border border-orange-300 rounded-2xl p-4">
            <p className="font-semibold text-orange-800">⚠️ Pedido con conflicto</p>
            <p className="text-sm text-orange-700 mt-1">{pedido.conflicto_detalle}</p>
          </div>
        )}

        {/* Alerta pendiente de sync */}
        {pedido.estado === 'pendiente_sync' && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4">
            <p className="font-semibold text-yellow-800">📡 Pendiente de sincronización</p>
            <p className="text-sm text-yellow-700 mt-1 mb-3">
              Este pedido fue creado sin conexión y aún no fue enviado al servidor.
            </p>
            {isOnline && (
              <Button variant="secondary" fullWidth onClick={handleSincronizar}>
                Sincronizar ahora
              </Button>
            )}
          </div>
        )}

        {/* Cliente */}
        {cliente && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">Cliente</p>
            <p className="font-bold text-gray-900">{cliente.razon_social}</p>
            {cliente.nombre_fantasia && (
              <p className="text-sm text-gray-500">{cliente.nombre_fantasia}</p>
            )}
            <div className="flex gap-3 mt-1">
              <p className="text-xs text-gray-400 font-mono">{cliente.cuit}</p>
              <p className="text-xs text-gray-400">{labelCondicionIva(cliente.condicion_iva)}</p>
            </div>
            {cliente.localidad && (
              <p className="text-xs text-gray-400 mt-0.5">📍 {cliente.localidad}</p>
            )}
          </div>
        )}

        {/* Ítems */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-700">
              {items.length} producto{items.length !== 1 ? 's' : ''}
            </p>
          </div>
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.producto.nombre}</p>
                <p className="text-xs text-gray-500">{item.producto.presentacion}</p>
                <p className="text-xs text-gray-400">
                  {item.cantidad} × {formatARS(item.precio_unitario)}
                  {item.descuento_item > 0 && (
                    <span className="text-accent-600"> − {item.descuento_item}%</span>
                  )}
                </p>
              </div>
              <p className="font-bold text-gray-900 ml-3 flex-none text-sm">{formatARS(item.subtotal)}</p>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          {pedido.descuento_general > 0 && (
            <>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Subtotal</span>
                <span>{formatARS(subtotalBruto)}</span>
              </div>
              <div className="flex justify-between text-sm text-accent-600 mb-1">
                <span>Descuento general {pedido.descuento_general}%</span>
                <span>− {formatARS(subtotalBruto * pedido.descuento_general / 100)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold text-xl text-gray-900 pt-2 border-t border-gray-100">
            <span>TOTAL</span>
            <span>{formatARS(pedido.total)}</span>
          </div>
        </div>

        {/* Observaciones */}
        {pedido.observaciones && (
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 font-semibold mb-1">Observaciones</p>
            <p className="text-sm text-gray-700">{pedido.observaciones}</p>
          </div>
        )}

        {/* Acciones */}
        {cliente && (
          <Button
            fullWidth
            size="lg"
            variant="secondary"
            onClick={handleWhatsApp}
            className="bg-green-50 border-green-500 text-green-700 hover:bg-green-100"
          >
            <span className="text-xl">💬</span>
            Compartir por WhatsApp
          </Button>
        )}
      </div>
    </div>
  )
}

function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-primary-700 sticky top-0 z-10">
      <button
        onClick={onBack}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-800 active:bg-primary-900 touch-manipulation"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <p className="text-white font-bold">Detalle del pedido</p>
    </div>
  )
}
