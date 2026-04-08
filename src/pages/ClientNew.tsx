import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useSyncStore } from '@/store/syncStore'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { validarCUIT, normalizarCUIT } from '@/utils/validators'
import type { CondicionIva, ListaPrecio } from '@/types/database'
import type { LocalCliente } from '@/lib/db'
import { useEffect } from 'react'

const CONDICIONES_IVA: { value: CondicionIva; label: string }[] = [
  { value: 'ri',     label: 'Responsable Inscripto' },
  { value: 'mono',   label: 'Monotributista' },
  { value: 'cf',     label: 'Consumidor Final' },
  { value: 'exento', label: 'Exento' },
]

export function ClientNew() {
  const navigate = useNavigate()
  const { vendedor } = useAuthStore()
  const { incrementarPendientes } = useSyncStore()
  const isOnline = useNetworkStatus()

  const [listas, setListas] = useState<ListaPrecio[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    razon_social: '',
    nombre_fantasia: '',
    cuit: '',
    condicion_iva: 'ri' as CondicionIva,
    lista_precio_id: '',
    telefono: '',
    email: '',
    direccion: '',
    localidad: '',
    provincia: '',
    observaciones: '',
  })

  useEffect(() => {
    db.listas_precios.filter(l => l.activo).toArray().then(setListas)
  }, [])

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const validar = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.razon_social.trim()) errs.razon_social = 'Requerido'
    const cuitClean = normalizarCUIT(form.cuit)
    if (!cuitClean) {
      errs.cuit = 'Requerido'
    } else if (!validarCUIT(cuitClean)) {
      errs.cuit = 'CUIT inválido'
    }
    if (!form.lista_precio_id) errs.lista_precio_id = 'Seleccioná una lista'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validar() || !vendedor) return
    setSaving(true)

    const ahora = new Date().toISOString()
    const nuevoCliente: LocalCliente = {
      id: uuidv4(),
      vendedor_id: vendedor.id,
      razon_social: form.razon_social.trim(),
      nombre_fantasia: form.nombre_fantasia.trim() || null,
      cuit: normalizarCUIT(form.cuit),
      condicion_iva: form.condicion_iva,
      lista_precio_id: parseInt(form.lista_precio_id),
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
      localidad: form.localidad.trim() || null,
      provincia: form.provincia.trim() || null,
      observaciones: form.observaciones.trim() || null,
      estado: 'pendiente_aprobacion',
      created_at: ahora,
      updated_at: ahora,
      _synced: 0,
      _sync_error: null,
    }

    // Guardar en Dexie siempre (primero local)
    await db.clientes.add(nuevoCliente)

    // Si hay conexión, intentar subir directamente
    if (isOnline) {
      const { error } = await supabase.from('clientes').insert({
        id: nuevoCliente.id,
        vendedor_id: nuevoCliente.vendedor_id,
        razon_social: nuevoCliente.razon_social,
        nombre_fantasia: nuevoCliente.nombre_fantasia,
        cuit: nuevoCliente.cuit,
        condicion_iva: nuevoCliente.condicion_iva,
        lista_precio_id: nuevoCliente.lista_precio_id,
        telefono: nuevoCliente.telefono,
        email: nuevoCliente.email,
        direccion: nuevoCliente.direccion,
        localidad: nuevoCliente.localidad,
        provincia: nuevoCliente.provincia,
        observaciones: nuevoCliente.observaciones,
        estado: 'pendiente_aprobacion',
        created_at: nuevoCliente.created_at,
        updated_at: nuevoCliente.updated_at,
      } as never)
      if (!error) {
        await db.clientes.update(nuevoCliente.id, { _synced: 1 })
      }
    } else {
      incrementarPendientes()
    }

    setSaving(false)
    navigate('/clientes')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200 touch-manipulation"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Nuevo cliente</h1>
      </div>

      {/* Aviso offline */}
      {!isOnline && (
        <div className="mx-4 mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
          📡 Sin conexión — el cliente se guardará localmente y se sincronizará después.
        </div>
      )}

      {/* Formulario */}
      <div className="flex flex-col gap-4 px-4 py-4">

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-700">Datos principales</h2>

          <Input
            label="Razón social *"
            placeholder="Nombre legal del cliente"
            value={form.razon_social}
            onChange={e => set('razon_social', e.target.value)}
            error={errors.razon_social}
          />
          <Input
            label="Nombre de fantasía"
            placeholder="Cómo lo conocen (opcional)"
            value={form.nombre_fantasia}
            onChange={e => set('nombre_fantasia', e.target.value)}
          />
          <Input
            label="CUIT *"
            placeholder="20-12345678-9"
            inputMode="numeric"
            value={form.cuit}
            onChange={e => set('cuit', e.target.value)}
            error={errors.cuit}
            hint="11 dígitos, con o sin guiones"
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Condición IVA *</label>
            <div className="grid grid-cols-2 gap-2">
              {CONDICIONES_IVA.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set('condicion_iva', c.value)}
                  className={[
                    'py-3 px-3 rounded-xl border-2 text-sm font-semibold transition-colors text-left',
                    form.condicion_iva === c.value
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-200 text-gray-700',
                  ].join(' ')}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Lista de precios *</label>
            {errors.lista_precio_id && <p className="text-sm text-red-600">{errors.lista_precio_id}</p>}
            <div className="flex flex-col gap-2">
              {listas.map(lista => (
                <button
                  key={lista.id}
                  type="button"
                  onClick={() => set('lista_precio_id', lista.id.toString())}
                  className={[
                    'py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-colors text-left',
                    form.lista_precio_id === lista.id.toString()
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-200 text-gray-700',
                  ].join(' ')}
                >
                  {lista.nombre}
                  {lista.descripcion && (
                    <span className="block text-xs font-normal text-gray-400 mt-0.5">{lista.descripcion}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-700">Contacto</h2>
          <Input
            label="Teléfono"
            placeholder="2264 123456"
            inputMode="tel"
            value={form.telefono}
            onChange={e => set('telefono', e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="cliente@email.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
          />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-700">Ubicación</h2>
          <Input
            label="Dirección"
            placeholder="Ruta 3 km 215"
            value={form.direccion}
            onChange={e => set('direccion', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Localidad"
              placeholder="Tandil"
              value={form.localidad}
              onChange={e => set('localidad', e.target.value)}
            />
            <Input
              label="Provincia"
              placeholder="Buenos Aires"
              value={form.provincia}
              onChange={e => set('provincia', e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Observaciones</label>
          <textarea
            placeholder="Horarios, indicaciones de entrega, etc."
            value={form.observaciones}
            onChange={e => set('observaciones', e.target.value)}
            rows={3}
            className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 resize-none"
          />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
          ℹ️ El cliente quedará en estado <strong>Pendiente de aprobación</strong> hasta ser revisado en oficina.
        </div>

        <Button type="submit" size="lg" fullWidth loading={saving}>
          Guardar cliente
        </Button>
      </div>
    </form>
  )
}
