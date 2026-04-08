import { useState, useEffect } from 'react'

// El evento beforeinstallprompt no está en los tipos estándar del DOM
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'agrovet-pwa-install-dismissed'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // No mostrar si el usuario ya lo descartó
    if (localStorage.getItem(DISMISSED_KEY)) return
    // No mostrar si ya está instalado como PWA (standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Esperar 3 segundos antes de mostrar (no interrumpir el primer uso)
      setTimeout(() => setVisible(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  if (!visible || !deferredPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="text-3xl flex-none">🌿</div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-base">Instalá AgroVet Pedidos</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Accedé sin internet y más rápido desde tu pantalla de inicio.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-primary-600 text-white rounded-xl py-2.5 text-sm font-semibold active:bg-primary-700 touch-manipulation"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2.5 text-sm font-semibold active:bg-gray-200 touch-manipulation"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
