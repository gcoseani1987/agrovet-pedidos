import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { db } from '@/lib/db'
import type { LocalPedido } from '@/lib/db'
import type { Cliente } from '@/types/database'
import { EstadoPedidoBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { OrderCardSkeleton, SkeletonList } from '@/components/ui/Skeleton'
import { formatARS, formatFechaCorta } from '@/utils/formatters'
import type { EstadoPedido } from '@/types/database'

type FiltroEstado = EstadoPedido | 'todos'

const FILTROS: { value: FiltroEstado; label: string }[] = [
  { value: 'todos',           label: 'Todos' },
  { value: 'pendiente_sync',  label: 'Sin sync' },
  { value: 'enviado',         label: 'Enviados' },
  { value: 'procesado',       label: 'Procesados' },
  { value: 'borrador',        label: 'Borradores' },
]

export function Orders() {
  const [pedidos, setPedidos] = useState<LocalPedido[]>([])
  const [clienteMap, setClienteMap] = useState<Map<string, Cliente>>(new Map())
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<FiltroEstado>('todos')

  useEffect(() => {
    async function cargar() {
      const ps = await db.pedidos
        .orderBy('created_at')
        .reverse()
        .limit(100)
        .toArray()

      setPedidos(ps)

      // Cargar clientes únicos de una sola vez
      const clienteIds = [...new Set(ps.map(p => p.cliente_id))]
      const clientes = await db.clientes.bulkGet(clienteIds)
      const map = new Map<string, Cliente>()
      clientes.forEach(c => { if (c) map.set(c.id, c) })
      setClienteMap(map)

      setLoading(false)
    }
    cargar()
  }, [])

  const pedidosFiltrados = useMemo(() => {
    if (filtro === 'todos') return pedidos
    return pedidos.filter(p => p.estado === filtro)
  }, [pedidos, filtro])

  // Totales para el header
  const pendientesSync = pedidos.filter(p => p.estado === 'pendiente_sync').length
  const totalHoy = pedidos
    .filter(p => {
      const hoy = new Date()
      const fecha = new Date(p.created_at)
      return fecha.toDateString() === hoy.toDateString()
    })
    .reduce((sum, p) => sum + p.total, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
          <Link to="/pedidos/nuevo">
            <Button size="sm">+ Nuevo</Button>
          </Link>
        </div>

        {/* Resumen rápido */}
        {!loading && pedidos.length > 0 && (
          <div className="flex gap-4 px-4 pb-2">
            {pendientesSync > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-500" />
                <span className="text-xs text-gray-600">{pendientesSync} sin sync</span>
              </div>
            )}
            {totalHoy > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-xs text-gray-600">Hoy: {formatARS(totalHoy)}</span>
              </div>
            )}
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {FILTROS.map(f => {
            const count = f.value === 'todos'
              ? pedidos.length
              : pedidos.filter(p => p.estado === f.value).length
            if (f.value !== 'todos' && count === 0) return null
            return (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={[
                  'flex-none px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors flex items-center gap-1',
                  filtro === f.value
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-300',
                ].join(' ')}
              >
                {f.label}
                <span className={[
                  'text-xs rounded-full px-1.5 py-0.5 font-bold',
                  filtro === f.value ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600',
                ].join(' ')}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 px-4 py-3">
        {loading ? (
          <SkeletonList count={5}>
            <OrderCardSkeleton />
          </SkeletonList>
        ) : pedidosFiltrados.length === 0 ? (
          <EmptyState filtro={filtro} />
        ) : (
          <div className="flex flex-col gap-2">
            {pedidosFiltrados.map(pedido => {
              const cliente = clienteMap.get(pedido.cliente_id)
              return (
                <Link
                  key={pedido.id}
                  to={`/pedidos/${pedido.id}`}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 touch-manipulation"
                >
                  {/* Fila superior */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-sm font-semibold text-gray-500">
                      {pedido.numero ?? `#${pedido.id.slice(0, 8)}`}
                    </span>
                    <EstadoPedidoBadge estado={pedido.estado} />
                  </div>

                  {/* Cliente */}
                  {cliente && (
                    <p className="font-semibold text-gray-900 truncate text-sm mb-1">
                      {cliente.razon_social}
                    </p>
                  )}

                  {/* Fila inferior */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {formatFechaCorta(pedido.created_at)}
                    </p>
                    <p className="font-bold text-gray-900">
                      {formatARS(pedido.total)}
                    </p>
                  </div>

                  {/* Alerta de conflicto */}
                  {pedido.tiene_conflicto && (
                    <p className="text-xs text-orange-600 mt-1.5 truncate">
                      ⚠️ {pedido.conflicto_detalle}
                    </p>
                  )}

                  {/* Error de sync */}
                  {pedido._sync_error && (
                    <p className="text-xs text-red-500 mt-1 truncate">
                      ✕ {pedido._sync_error}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ filtro }: { filtro: FiltroEstado }) {
  if (filtro !== 'todos') {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-3xl mb-2">🔍</p>
        <p>Sin pedidos en este estado</p>
      </div>
    )
  }
  return (
    <div className="text-center py-12 text-gray-400">
      <div className="text-4xl mb-3">📋</div>
      <p className="font-medium text-gray-600">Todavía no hay pedidos</p>
      <p className="text-sm mt-1 mb-4">¡Creá tu primer pedido!</p>
      <Link to="/pedidos/nuevo">
        <Button>Nuevo pedido</Button>
      </Link>
    </div>
  )
}
