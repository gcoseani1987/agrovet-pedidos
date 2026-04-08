import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useSyncStore } from '@/store/syncStore'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { Button } from '@/components/ui/Button'

function formatRelativo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'hace un momento'
  if (mins === 1) return 'hace 1 min'
  if (mins < 60) return `hace ${mins} min`
  const hs = Math.floor(mins / 60)
  if (hs < 24) return hs === 1 ? 'hace 1 hora' : `hace ${hs} horas`
  const dias = Math.floor(hs / 24)
  return dias === 1 ? 'hace 1 día' : `hace ${dias} días`
}

export function Dashboard() {
  const vendedor = useAuthStore(s => s.vendedor)
  const signOut = useAuthStore(s => s.signOut)
  const {
    status, pendientes, pedidosPendientes, clientesPendientes,
    ultimaSync, stats, sincronizar, actualizarPendientes,
  } = useSyncStore()
  const isOnline = useNetworkStatus()

  // Actualizar contadores al montar
  useEffect(() => { actualizarPendientes() }, [actualizarPendientes])

  const nombreCompleto = vendedor ? `${vendedor.nombre} ${vendedor.apellido}` : 'Vendedor'

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-primary-700 px-4 pt-6 pb-10">
        <div className="flex items-center justify-between mb-1">
          <p className="text-primary-200 text-sm">Bienvenido,</p>
          <button onClick={signOut} className="text-primary-300 text-sm underline">
            Cerrar sesión
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white">{nombreCompleto}</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <span className="text-primary-200 text-sm">
            {isOnline ? 'Conectado' : 'Sin conexión'}
          </span>
          {isOnline && ultimaSync && (
            <span className="text-primary-400 text-xs ml-1">
              · sync {formatRelativo(ultimaSync)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 -mt-6 pb-6">

        {/* Card de sincronización */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Sincronización</h2>
            {pendientes > 0 && (
              <span className="bg-accent-100 text-accent-700 text-sm font-bold px-2.5 py-0.5 rounded-full">
                {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Desglose de pendientes */}
          {pendientes > 0 && (
            <div className="px-4 py-2 bg-accent-50 border-b border-accent-100 flex gap-4 text-sm">
              {pedidosPendientes > 0 && (
                <span className="text-accent-700">
                  📋 {pedidosPendientes} pedido{pedidosPendientes !== 1 ? 's' : ''}
                </span>
              )}
              {clientesPendientes > 0 && (
                <span className="text-accent-700">
                  👤 {clientesPendientes} cliente{clientesPendientes !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          {/* Resultado del último sync */}
          {stats && stats.errores.length > 0 && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-100">
              <p className="text-xs font-semibold text-red-700 mb-1">Errores en última sincronización:</p>
              {stats.errores.map((e, i) => (
                <p key={i} className="text-xs text-red-600 truncate">· {e}</p>
              ))}
            </div>
          )}
          {stats && stats.pedidosConConflicto > 0 && (
            <div className="px-4 py-2 bg-orange-50 border-b border-orange-100">
              <p className="text-xs text-orange-700">
                ⚠️ {stats.pedidosConConflicto} pedido{stats.pedidosConConflicto !== 1 ? 's' : ''} con precios desactualizados — la oficina fue notificada.
              </p>
            </div>
          )}

          <div className="px-4 py-3">
            <Button
              variant="secondary"
              fullWidth
              loading={status === 'syncing'}
              disabled={!isOnline || status === 'syncing'}
              onClick={sincronizar}
            >
              {status === 'syncing' ? 'Sincronizando...' : '🔄 Sincronizar ahora'}
            </Button>
            {!isOnline && (
              <p className="text-xs text-center text-gray-400 mt-2">
                Disponible cuando haya conexión
              </p>
            )}
          </div>
        </div>

        {/* Accesos rápidos */}
        <h2 className="font-semibold text-gray-700">Acceso rápido</h2>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/pedidos/nuevo"
            className="bg-primary-600 text-white rounded-2xl p-4 flex flex-col gap-2 active:bg-primary-700 touch-manipulation"
          >
            <span className="text-3xl">📋</span>
            <span className="font-semibold text-lg leading-tight">Nuevo pedido</span>
          </Link>

          <Link
            to="/clientes"
            className="bg-white text-gray-900 rounded-2xl p-4 flex flex-col gap-2 shadow-sm border border-gray-100 active:bg-gray-50 touch-manipulation"
          >
            <span className="text-3xl">👥</span>
            <span className="font-semibold text-lg">Clientes</span>
          </Link>

          <Link
            to="/catalogo"
            className="bg-white text-gray-900 rounded-2xl p-4 flex flex-col gap-2 shadow-sm border border-gray-100 active:bg-gray-50 touch-manipulation"
          >
            <span className="text-3xl">📦</span>
            <span className="font-semibold text-lg">Catálogo</span>
          </Link>

          <Link
            to="/pedidos"
            className="relative bg-white text-gray-900 rounded-2xl p-4 flex flex-col gap-2 shadow-sm border border-gray-100 active:bg-gray-50 touch-manipulation"
          >
            <span className="text-3xl">📄</span>
            <span className="font-semibold text-lg">Mis pedidos</span>
            {pedidosPendientes > 0 && (
              <span className="absolute top-3 right-3 bg-accent-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {pedidosPendientes > 9 ? '9+' : pedidosPendientes}
              </span>
            )}
          </Link>
        </div>

        {/* Info del vendedor */}
        {vendedor && (
          <div className="bg-gray-100 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1">Descuento máximo habilitado</p>
            <p className="text-2xl font-bold text-gray-900">{vendedor.limite_descuento}%</p>
          </div>
        )}
      </div>
    </div>
  )
}
