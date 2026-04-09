import { useSyncStore } from '@/store/syncStore'

function formatRelativo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'hace un momento'
  if (mins === 1) return 'hace 1 min'
  if (mins < 60) return `hace ${mins} min`
  const hs = Math.floor(mins / 60)
  return hs === 1 ? 'hace 1 hora' : `hace ${hs} horas`
}

export function SyncStatusBar() {
  const { isOnline, status, pendientes, pedidosPendientes, clientesPendientes, progreso, ultimaSync, stats, sincronizar } = useSyncStore()

  // ---- Offline ----
  if (!isOnline) {
    return (
      <div className="bg-yellow-500 text-yellow-950 px-4 py-2 text-sm font-semibold flex items-center gap-2">
        <span className="text-base">📡</span>
        <span className="flex-1">Sin conexión — los cambios se guardan localmente</span>
        {pendientes > 0 && (
          <span className="bg-yellow-900/20 rounded-full px-2 py-0.5 text-xs font-bold">
            {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    )
  }

  // ---- Sincronizando ----
  if (status === 'syncing') {
    return (
      <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold flex items-center gap-2">
        <svg className="animate-spin h-4 w-4 flex-none" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="flex-1 truncate">{progreso ?? 'Sincronizando...'}</span>
      </div>
    )
  }

  // ---- Error ----
  if (status === 'error' && stats) {
    return (
      <div className="bg-red-600 text-white px-4 py-2 text-sm font-semibold flex items-center gap-2">
        <span className="text-base flex-none">⚠️</span>
        <span className="flex-1 truncate">
          {stats.errores.length === 1
            ? stats.errores[0]
            : `${stats.errores.length} errores al sincronizar`}
        </span>
        <button
          onClick={sincronizar}
          className="flex-none text-xs underline opacity-90"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // ---- Éxito con conflictos ----
  if (status === 'success' && stats && stats.pedidosConConflicto > 0) {
    return (
      <div className="bg-orange-500 text-white px-4 py-2 text-sm font-semibold flex items-center gap-2">
        <span className="text-base">⚠️</span>
        <span className="flex-1">
          {stats.pedidosConConflicto} pedido{stats.pedidosConConflicto !== 1 ? 's' : ''} con precios desactualizados
        </span>
      </div>
    )
  }

  // ---- Online con pendientes (idle) ----
  if (pendientes > 0) {
    const detalle = [
      pedidosPendientes > 0 && `${pedidosPendientes} pedido${pedidosPendientes !== 1 ? 's' : ''}`,
      clientesPendientes > 0 && `${clientesPendientes} cliente${clientesPendientes !== 1 ? 's' : ''}`,
    ].filter(Boolean).join(' y ')

    return (
      <button
        onClick={sincronizar}
        className="w-full bg-accent-500 text-white px-4 py-2 text-sm font-semibold flex items-center gap-2 active:bg-accent-600"
      >
        <span className="text-base">🔄</span>
        <span className="flex-1 text-left">{detalle} por sincronizar</span>
        <span className="text-xs underline opacity-90">Sincronizar</span>
      </button>
    )
  }

  // ---- Éxito breve ----
  if (status === 'success') {
    return (
      <div className="bg-primary-600 text-white px-4 py-2 text-sm font-semibold flex items-center gap-2">
        <span>✓</span>
        <span className="flex-1">Sincronizado</span>
        {ultimaSync && (
          <span className="text-xs opacity-75">{formatRelativo(ultimaSync)}</span>
        )}
      </div>
    )
  }

  // ---- Todo OK, nada que mostrar ----
  return null
}
