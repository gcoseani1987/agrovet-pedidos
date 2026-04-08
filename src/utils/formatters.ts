/** Formatea un número como moneda argentina */
export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Formatea un CUIT con guiones: 20-12345678-9 */
export function formatCUIT(cuit: string): string {
  const digits = cuit.replace(/\D/g, '')
  if (digits.length !== 11) return cuit
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}

/** Formatea fecha en español: "Lun 12 May 2025, 14:30" */
export function formatFecha(isoString: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString))
}

/** Formatea solo la fecha: "12/05/2025" */
export function formatFechaCorta(isoString: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(isoString))
}

/** Etiqueta de condición de IVA */
export function labelCondicionIva(condicion: string): string {
  const labels: Record<string, string> = {
    ri: 'Resp. Inscripto',
    mono: 'Monotributista',
    cf: 'Cons. Final',
    exento: 'Exento',
  }
  return labels[condicion] ?? condicion
}
