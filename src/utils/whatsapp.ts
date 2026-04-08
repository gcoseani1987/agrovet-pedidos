import type { Pedido, PedidoItem, Cliente, Producto } from '@/types/database'
import { formatARS, formatFechaCorta } from './formatters'

interface ItemConProducto extends PedidoItem {
  producto: Producto
}

/**
 * Genera el link wa.me con el resumen del pedido pre-armado.
 * Ejemplo de mensaje:
 *
 * AgroVet Pedidos | Pedido #2025-0042
 * Cliente: Don Pedro SA
 * Fecha: 15/05/2025
 *
 * DETALLE:
 * • Ivermectina 1% 500ml x2 — $12.500,00
 * • Vacuna Triple Bovina x10 — $45.000,00
 *
 * Subtotal: $57.500,00
 * Descuento: 5%
 * TOTAL: $54.625,00
 *
 * Observaciones: Entregar en galpón norte
 */
export function generarLinkWhatsApp(
  pedido: Pedido,
  cliente: Cliente,
  items: ItemConProducto[]
): string {
  const lineas: string[] = []

  lineas.push(`🌿 *AgroVet Pedidos* | Pedido ${pedido.numero ?? '(borrador)'}`)
  lineas.push(`👤 *Cliente:* ${cliente.razon_social}`)
  lineas.push(`📅 *Fecha:* ${formatFechaCorta(pedido.created_at)}`)
  lineas.push('')
  lineas.push('*DETALLE:*')

  for (const item of items) {
    const nombre = item.producto.nombre
    const presentacion = item.producto.presentacion
    const cant = item.cantidad % 1 === 0 ? item.cantidad.toString() : item.cantidad.toFixed(2)
    const subtotal = formatARS(item.subtotal)
    const descLine = item.descuento_item > 0 ? ` (dto ${item.descuento_item}%)` : ''
    lineas.push(`• ${nombre} ${presentacion} ×${cant}${descLine} — ${subtotal}`)
  }

  lineas.push('')
  lineas.push(`Subtotal: ${formatARS(pedido.total / (1 - pedido.descuento_general / 100) || pedido.total)}`)

  if (pedido.descuento_general > 0) {
    lineas.push(`Descuento general: ${pedido.descuento_general}%`)
  }

  lineas.push(`*TOTAL: ${formatARS(pedido.total)}*`)

  if (pedido.observaciones) {
    lineas.push('')
    lineas.push(`📝 _${pedido.observaciones}_`)
  }

  const texto = lineas.join('\n')
  const telefono = cliente.telefono?.replace(/\D/g, '') ?? ''

  // Si el cliente tiene teléfono, abrir chat directo; si no, abrir wa.me genérico
  const base = telefono ? `https://wa.me/549${telefono}` : 'https://wa.me'
  return `${base}?text=${encodeURIComponent(texto)}`
}
