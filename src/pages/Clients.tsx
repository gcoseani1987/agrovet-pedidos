import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { db } from '@/lib/db'
import type { LocalCliente } from '@/lib/db'
import { Input } from '@/components/ui/Input'
import { EstadoClienteBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ClientCardSkeleton, SkeletonList } from '@/components/ui/Skeleton'
import { useCartStore } from '@/store/cartStore'

export function Clients() {
  const [clientes, setClientes] = useState<LocalCliente[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const { setCliente, cliente: clienteActivo } = useCartStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Si viene de /catalogo o /pedidos/nuevo, después de elegir cliente volvemos allá
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo

  useEffect(() => {
    db.clientes.orderBy('razon_social').toArray().then(data => {
      setClientes(data)
      setLoading(false)
    })
  }, [])

  const clientesFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    if (!q) return clientes
    return clientes.filter(c =>
      c.razon_social.toLowerCase().includes(q)
      || c.cuit.includes(q)
      || (c.localidad ?? '').toLowerCase().includes(q)
      || (c.nombre_fantasia ?? '').toLowerCase().includes(q)
    )
  }, [clientes, busqueda])

  const handleSeleccionar = (cliente: LocalCliente) => {
    setCliente(cliente)
    navigate(returnTo ?? '/catalogo')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
          <Link to="/clientes/nuevo">
            <Button size="sm">+ Nuevo</Button>
          </Link>
        </div>
        <Input
          placeholder="Buscar por nombre, CUIT o localidad..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          leftIcon={<span>🔍</span>}
        />

        {clienteActivo && (
          <p className="text-xs text-primary-700 mt-2">
            ✓ Activo: <span className="font-semibold">{clienteActivo.razon_social}</span>
          </p>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 px-4 py-3">
        {loading ? (
          <SkeletonList count={5}><ClientCardSkeleton /></SkeletonList>
        ) : clientes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-medium text-gray-600">Sin clientes sincronizados</p>
            <p className="text-sm mt-1">Sincronizá desde el Inicio para cargar tus clientes.</p>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p>Sin resultados para "{busqueda}"</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">
              {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}
            </p>
            <div className="flex flex-col gap-2">
              {clientesFiltrados.map(cliente => {
                const esActivo = clienteActivo?.id === cliente.id
                return (
                  <button
                    key={cliente.id}
                    onClick={() => handleSeleccionar(cliente)}
                    className={[
                      'text-left w-full rounded-xl p-4 shadow-sm border-2 transition-colors touch-manipulation',
                      esActivo
                        ? 'bg-primary-50 border-primary-400'
                        : 'bg-white border-gray-100 active:bg-gray-50',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {esActivo && <span className="text-primary-600 text-sm">✓</span>}
                          <p className="font-semibold text-gray-900 truncate">{cliente.razon_social}</p>
                        </div>
                        {cliente.nombre_fantasia && (
                          <p className="text-sm text-gray-500 truncate">{cliente.nombre_fantasia}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <p className="text-xs text-gray-400 font-mono">{cliente.cuit}</p>
                          {cliente.localidad && (
                            <p className="text-xs text-gray-400">📍 {cliente.localidad}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-none">
                        <EstadoClienteBadge estado={cliente.estado} />
                        {cliente._synced === 0 && (
                          <span className="text-xs text-accent-600">⏳ Sin sync</span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
