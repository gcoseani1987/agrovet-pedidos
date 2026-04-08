import { NavLink } from 'react-router-dom'
import { useSyncStore } from '@/store/syncStore'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

function HomeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}
function CatalogIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
}
function ClientsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function OrdersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}

export function BottomNav() {
  const pendientes = useSyncStore(s => s.pendientes)

  const items: NavItem[] = [
    { to: '/dashboard', label: 'Inicio',    icon: <HomeIcon /> },
    { to: '/catalogo',  label: 'Catálogo',  icon: <CatalogIcon /> },
    { to: '/clientes',  label: 'Clientes',  icon: <ClientsIcon /> },
    { to: '/pedidos',   label: 'Pedidos',   icon: <OrdersIcon /> },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="grid grid-cols-4 h-16">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => [
              'flex flex-col items-center justify-center gap-0.5',
              'text-xs font-medium transition-colors',
              'touch-manipulation select-none',
              isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            <div className="relative">
              {item.icon}
              {/* Badge de pendientes en Pedidos */}
              {item.to === '/pedidos' && pendientes > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] text-white font-bold">
                  {pendientes > 9 ? '9+' : pendientes}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
