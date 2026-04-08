interface SkeletonProps {
  className?: string
}

/** Bloque genérico con animación pulse */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
  )
}

/** Skeleton de una card de producto en el listado */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
      <Skeleton className="w-14 h-14 rounded-lg flex-none" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-5 w-16 flex-none" />
    </div>
  )
}

/** Skeleton de una card de cliente */
export function ClientCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

/** Skeleton de una card de pedido */
export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  )
}

/** Lista de N skeletons */
export function SkeletonList({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{children}</div>
      ))}
    </div>
  )
}
