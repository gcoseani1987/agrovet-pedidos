import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useSyncStore } from '@/store/syncStore'
import { AppShell } from '@/components/layout/AppShell'

// Lazy loading de páginas para reducir el bundle inicial
const Login        = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })))
const Dashboard    = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Catalog      = lazy(() => import('@/pages/Catalog').then(m => ({ default: m.Catalog })))
const ProductDetail= lazy(() => import('@/pages/ProductDetail').then(m => ({ default: m.ProductDetail })))
const Clients      = lazy(() => import('@/pages/Clients').then(m => ({ default: m.Clients })))
const ClientDetail = lazy(() => import('@/pages/ClientDetail').then(m => ({ default: m.ClientDetail })))
const ClientNew    = lazy(() => import('@/pages/ClientNew').then(m => ({ default: m.ClientNew })))
const Orders       = lazy(() => import('@/pages/Orders').then(m => ({ default: m.Orders })))
const OrderNew     = lazy(() => import('@/pages/OrderNew').then(m => ({ default: m.OrderNew })))
const OrderDetail  = lazy(() => import('@/pages/OrderDetail').then(m => ({ default: m.OrderDetail })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-2 animate-pulse">🌿</div>
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-primary-700">
        <div className="text-center text-white">
          <div className="text-5xl mb-3 animate-pulse">🌿</div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function App() {
  const { setSession } = useAuthStore()
  const { sincronizar, actualizarPendientes } = useSyncStore()

  useEffect(() => {
    // Leer sesión persistida en localStorage al arrancar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return
        setSession(session)
        if (session) {
          if (navigator.onLine) {
            sincronizar()
          } else {
            actualizarPendientes()
          }
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [setSession, sincronizar, actualizarPendientes])

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"       element={<Dashboard />} />
            <Route path="catalogo"        element={<Catalog />} />
            <Route path="catalogo/:id"    element={<ProductDetail />} />
            <Route path="clientes"        element={<Clients />} />
            <Route path="clientes/nuevo"  element={<ClientNew />} />
            <Route path="clientes/:id"    element={<ClientDetail />} />
            <Route path="pedidos"         element={<Orders />} />
            <Route path="pedidos/nuevo"   element={<OrderNew />} />
            <Route path="pedidos/:id"     element={<OrderDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
