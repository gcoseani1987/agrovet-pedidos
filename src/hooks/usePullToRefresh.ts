import { useEffect, useRef, useState } from 'react'

const THRESHOLD = 70    // px de arrastre para activar
const MAX_PULL  = 120   // px máximo de desplazamiento visual

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  disabled?: boolean
}

export function usePullToRefresh({ onRefresh, disabled = false }: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)

  const isReady = pullDistance >= THRESHOLD

  useEffect(() => {
    if (disabled || refreshing) return

    const onTouchStart = (e: TouchEvent) => {
      // Solo activar si el scroll del documento está en el top
      if (window.scrollY > 0) return
      startY.current = e.touches[0].clientY
      pulling.current = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) { setPullDistance(0); return }
      // Resistencia progresiva: más difícil cuanto más se arrastra
      const clamped = Math.min(dy * 0.5, MAX_PULL)
      setPullDistance(clamped)
    }

    const onTouchEnd = async () => {
      if (!pulling.current) return
      pulling.current = false
      if (pullDistance >= THRESHOLD) {
        setRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setRefreshing(false)
        }
      }
      setPullDistance(0)
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [disabled, refreshing, pullDistance, onRefresh])

  return { pullDistance, refreshing, isReady }
}
