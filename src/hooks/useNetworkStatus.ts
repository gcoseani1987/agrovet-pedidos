import { useState, useEffect, useRef } from 'react'
import { useSyncStore } from '@/store/syncStore'

const SYNC_INTERVAL_MS = 5 * 60 * 1000  // sincronizar cada 5 min si está online

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const sincronizar = useSyncStore(s => s.sincronizar)
  const setOnline = useSyncStore(s => s.setOnline)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setOnline(true)
      sincronizar()
      // Iniciar sync periódico mientras esté online
      intervalRef.current = setInterval(sincronizar, SYNC_INTERVAL_MS)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setOnline(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Si arranca online, iniciar sync periódico
    if (navigator.onLine) {
      intervalRef.current = setInterval(sincronizar, SYNC_INTERVAL_MS)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [sincronizar])

  return isOnline
}
