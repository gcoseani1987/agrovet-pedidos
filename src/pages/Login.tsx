import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function Login() {
  const { session, signIn } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await signIn(email.trim(), password)
    if (result.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-primary-700 flex flex-col items-center justify-center px-6 py-12">
      {/* Logo / Header */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-3">🌿</div>
        <h1 className="text-3xl font-bold text-white">AgroVet Pedidos</h1>
        <p className="text-primary-200 mt-1">Gestión de ventas en campo</p>
      </div>

      {/* Formulario */}
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Iniciar sesión
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="vendedor@empresa.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={loading}
            className="mt-2"
          >
            Ingresar
          </Button>
        </form>
      </div>

      <p className="text-primary-300 text-sm mt-8">
        ¿Problemas para ingresar? Contactá a tu supervisor.
      </p>
    </div>
  )
}
