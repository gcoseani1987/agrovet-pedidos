/**
 * Valida CUIT/CUIL argentino con verificación de dígito de control.
 * Acepta formatos: "20123456789", "20-12345678-9"
 */
export function validarCUIT(cuit: string): boolean {
  const digits = cuit.replace(/\D/g, '')
  if (digits.length !== 11) return false

  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let suma = 0
  for (let i = 0; i < 10; i++) {
    suma += parseInt(digits[i]) * multiplicadores[i]
  }
  const resto = suma % 11
  const digitoVerificador = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto
  return digitoVerificador === parseInt(digits[10])
}

/** Limpia y normaliza un CUIT a 11 dígitos */
export function normalizarCUIT(cuit: string): string {
  return cuit.replace(/\D/g, '')
}
