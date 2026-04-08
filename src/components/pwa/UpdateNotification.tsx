import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdateNotification() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Chequear actualizaciones cada hora
      r && setInterval(() => r.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary-700 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
      <span className="text-xl flex-none">🔄</span>
      <div className="flex-1">
        <p className="font-semibold text-sm">Nueva versión disponible</p>
        <p className="text-xs text-primary-200">Actualizá para tener las últimas mejoras.</p>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        className="flex-none bg-white text-primary-700 text-sm font-bold px-3 py-1.5 rounded-lg active:bg-primary-50 touch-manipulation"
      >
        Actualizar
      </button>
    </div>
  )
}
