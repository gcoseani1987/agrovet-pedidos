type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'gray'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  green:  'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red:    'bg-red-100 text-red-800',
  blue:   'bg-blue-100 text-blue-800',
  gray:   'bg-gray-100 text-gray-700',
}

export function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}

/** Badge de estado de pedido */
export function EstadoPedidoBadge({ estado }: { estado: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    borrador:       { label: 'Borrador',    variant: 'gray'   },
    pendiente_sync: { label: 'Sin sync',    variant: 'yellow' },
    enviado:        { label: 'Enviado',     variant: 'blue'   },
    procesado:      { label: 'Procesado',   variant: 'green'  },
    cancelado:      { label: 'Cancelado',   variant: 'red'    },
  }
  const c = config[estado] ?? { label: estado, variant: 'gray' as BadgeVariant }
  return <Badge variant={c.variant}>{c.label}</Badge>
}

/** Badge de estado de cliente */
export function EstadoClienteBadge({ estado }: { estado: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    activo:               { label: 'Activo',     variant: 'green'  },
    pendiente_aprobacion: { label: 'Pendiente',  variant: 'yellow' },
    inactivo:             { label: 'Inactivo',   variant: 'gray'   },
  }
  const c = config[estado] ?? { label: estado, variant: 'gray' as BadgeVariant }
  return <Badge variant={c.variant}>{c.label}</Badge>
}
