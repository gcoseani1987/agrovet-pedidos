import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db } from '@/lib/db'
import type { LocalCliente } from '@/lib/db'
import type { Pedido } from '@/types/database'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/Button'
import { EstadoClienteBadge, EstadoPedidoBadge } from '@/components/ui/Badge'
import { formatCUIT, formatARS, formatFechaCorta, labelCondicionIva } from '@/utils/formatters'

export function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState<LocalCliente | null>(null)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const { setCliente: setClienteActivo, cliente: clienteActivo } = useCartStore()

  useEffect(() => {
    if (!id) return
    async function cargar() {
      const [c, ps] = await Promise.all([
        db.clientes.get(id!),
        db.pedidos.where('cliente_id').equals(id!).reverse().sortBy('created_at'),
      ])
      setCliente(c ?? null)
      setPedidos(ps as unknown as Pedido[])
      setLoading(false)
    }
    cargar()
  }, [id])

  const handleSeleccionar = () => {
    if (!cliente) return
    setClienteActivo(cliente)
    navigate('/catalogo')
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="flex flex-col h-full">
        <TopBar onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center text-gray-400">
            <p className="text-4xl mb-2">👤</p>
            <p>Cliente no encontrado</p>
          </div>
        </div>
      </div>
    )
  }

  const esActivo = clienteActivo?.id === cliente.id

  return (
    <div className="flex flex-col min-h-full">
      <TopBar onBack={() => navigate(-1)} />

      {/* Header del cliente */}
      <div className="bg-primary-700 px-4 pt-4 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white leading-tight">{cliente.razon_social}</h1>
            {cliente.nombre_fantasia && (
              <p className="text-primary-200 text-sm mt-0.5">{cliente.nombre_fantasia}</p>
            )}
          </div>
          <EstadoClienteBadge estado={cliente.estado} />
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-primary-200 text-sm font-mono">{formatCUIT(cliente.cuit)}</span>
          <span className="text-primary-400">·</span>
          <span className="text-primary-200 text-sm">{labelCondicionIva(cliente.condicion_iva)}</span>
        </div>
      </div>

      {/* Botón de acción principal */}
      <div className="px-4 -mt-4 mb-4">
        <div className="bg-white rounded-2xl shadow-md p-3 flex gap-3">
          <Button
            fullWidth
            size="lg"
            onClick={handleSeleccionar}
            variant={esActivo ? 'secondary' : 'primary'}
          >
            {esActivo ? '✓ Cliente seleccionado' : 'Seleccionar para pedido'}
          </Button>
          <Link to="/pedidos/nuevo">
            <Button size="lg" variant="secondary">
              📋
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-6">
        {/* Datos de contacto */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-3">Contacto</h2>
          <div className="flex flex-col gap-2">
            {cliente.telefono && (
              <a href={`tel:${cliente.telefono}`} className="flex items-center gap-3 py-1">
                <span className="text-xl">📞</span>
                <span className="text-gray-900">{cliente.telefono}</span>
              </a>
            )}
            {cliente.email && (
              <a href={`mailto:${cliente.email}`} className="flex items-center gap-3 py-1">
                <span className="text-xl">✉️</span>
                <span className="text-gray-900 truncate">{cliente.email}</span>
              </a>
            )}
            {(cliente.localidad || cliente.direccion) && (
              <div className="flex items-start gap-3 py-1">
                <span className="text-xl">📍</span>
                <div>
                  {cliente.direccion && <p className="text-gray-900">{cliente.direccion}</p>}
                  {cliente.localidad && (
                    <p className="text-gray-600 text-sm">
                      {cliente.localidad}{cliente.provincia ? `, ${cliente.provincia}` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
            {!cliente.telefono && !cliente.email && !cliente.localidad && (
              <p className="text-gray-400 text-sm">Sin datos de contacto</p>
            )}
          </div>
        </div>

        {/* Observaciones */}
        {cliente.observaciones && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-yellow-700 mb-1">Observaciones</p>
            <p className="text-sm text-yellow-900">{cliente.observaciones}</p>
          </div>
        )}

        {/* Historial de pedidos */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-3">
            Pedidos {pedidos.length > 0 && <span className="text-gray-400 font-normal">({pedidos.length})</span>}
          </h2>
          {pedidos.length === 0 ? (
            <p className="text-sm text-gray-400">Sin pedidos registrados</p>
          ) : (
            <div className="flex flex-col gap-2">
              {pedidos.slice(0, 5).map(p => (
                <Link
                  key={p.id}
                  to={`/pedidos/${p.id}`}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-mono font-semibold text-gray-600">
                      {p.numero ?? `#${p.id.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-gray-400">{formatFechaCorta(p.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <EstadoPedidoBadge estado={p.estado} />
                    <p className="text-sm font-bold text-gray-900">{formatARS(p.total)}</p>
                  </div>
                </Link>
              ))}
              {pedidos.length > 5 && (
                <p className="text-xs text-gray-400 text-center pt-1">
                  +{pedidos.length - 5} pedidos más
                </p>
              )}
            </div>
          )}
        </div>
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
    </div>
  )
}
