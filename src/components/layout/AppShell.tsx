import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { SyncStatusBar } from '@/components/sync/SyncStatusBar'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { UpdateNotification } from '@/components/pwa/UpdateNotification'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useSyncStore } from '@/store/syncStore'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

function PullIndicator({ distance, ready, refreshing }: {
  distance: number
  ready: boolean
  refreshing: boolean
}) {
  if (distance <= 5 && !refreshing) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-30 flex items-center justify-center pointer-events-none"
      style={{ height: refreshing ? 44 : distance, transition: refreshing ? 'height 0.2s' : 'none' }}
    >
      <div className={[
        'flex items-center gap-2 text-sm font-semibold transition-all',
        ready || refreshing ? 'text-primary-700' : 'text-gray-400',
      ].join(' ')}>
        {refreshing ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span>Actualizando...</span>
          </>
        ) : (
          <>
            <span style={{ transform: ready ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>
              ↓
            </span>
            <span>{ready ? 'Soltar para actualizar' : 'Arrastrar para actualizar'}</span>
          </>
        )}
      </div>
    </div>
  )
}

export function AppShell() {
  const isOnline = useNetworkStatus()
  const sincronizar = useSyncStore(s => s.sincronizar)

  const { pullDistance, refreshing, isReady } = usePullToRefresh({
    onRefresh: sincronizar,
    disabled: !isOnline,
  })

  return (
    <div className="flex flex-col h-dvh bg-gray-50">
      {/* Notificación de nueva versión (posición absoluta, tapa todo) */}
      <UpdateNotification />

      {/* Indicador de pull-to-refresh */}
      <PullIndicator distance={pullDistance} ready={isReady} refreshing={refreshing} />

      {/* Contenido desplazado levemente si se está arrastrando */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
          transition: pullDistance === 0 && !refreshing ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {/* Barra de estado de sincronización */}
        <SyncStatusBar />

        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto pb-20">
          <Outlet />
        </main>

        {/* Nav inferior */}
        <BottomNav />
      </div>

      {/* Prompt de instalación (flotante sobre el nav) */}
      <InstallPrompt />
    </div>
  )
}
