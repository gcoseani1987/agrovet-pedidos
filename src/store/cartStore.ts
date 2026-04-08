import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Producto, Cliente, PedidoItem } from '@/types/database'

export interface CartItem {
  id: string            // id del PedidoItem
  producto: Producto
  cantidad: number
  precio_unitario: number
  descuento_item: number
  subtotal: number
  observaciones: string | null
}

interface CartState {
  pedidoId: string
  cliente: Cliente | null
  lista_precio_id: number | null
  items: CartItem[]
  descuento_general: number
  observaciones: string | null
  // Computed
  subtotalBruto: number
  totalFinal: number
  // Actions
  setCliente: (cliente: Cliente) => void
  agregarItem: (producto: Producto, cantidad: number, precioUnitario: number) => void
  actualizarCantidad: (itemId: string, cantidad: number) => void
  actualizarDescuentoItem: (itemId: string, descuento: number) => void
  removerItem: (itemId: string) => void
  setDescuentoGeneral: (descuento: number) => void
  setObservaciones: (obs: string) => void
  limpiarCarrito: () => void
}

function calcularSubtotal(cantidad: number, precio: number, descuento: number): number {
  return +(cantidad * precio * (1 - descuento / 100)).toFixed(2)
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      pedidoId: uuidv4(),
      cliente: null,
      lista_precio_id: null,
      items: [],
      descuento_general: 0,
      observaciones: null,
      subtotalBruto: 0,
      totalFinal: 0,

      setCliente: (cliente) => {
        set({
          cliente,
          lista_precio_id: cliente.lista_precio_id,
          items: [],  // limpiar items al cambiar cliente (los precios pueden diferir)
          subtotalBruto: 0,
          totalFinal: 0,
        })
      },

      agregarItem: (producto, cantidad, precioUnitario) => {
        const { items } = get()
        const existente = items.find(i => i.producto.id === producto.id)

        let nuevosItems: CartItem[]
        if (existente) {
          // Sumar cantidad al existente
          nuevosItems = items.map(i =>
            i.producto.id === producto.id
              ? {
                  ...i,
                  cantidad: i.cantidad + cantidad,
                  subtotal: calcularSubtotal(i.cantidad + cantidad, i.precio_unitario, i.descuento_item),
                }
              : i
          )
        } else {
          const newItem: CartItem = {
            id: uuidv4(),
            producto,
            cantidad,
            precio_unitario: precioUnitario,
            descuento_item: 0,
            subtotal: calcularSubtotal(cantidad, precioUnitario, 0),
            observaciones: null,
          }
          nuevosItems = [...items, newItem]
        }

        const subtotalBruto = nuevosItems.reduce((sum, i) => sum + i.subtotal, 0)
        const { descuento_general } = get()
        const totalFinal = +(subtotalBruto * (1 - descuento_general / 100)).toFixed(2)

        set({ items: nuevosItems, subtotalBruto: +subtotalBruto.toFixed(2), totalFinal })
      },

      actualizarCantidad: (itemId, cantidad) => {
        if (cantidad <= 0) {
          get().removerItem(itemId)
          return
        }
        const nuevosItems = get().items.map(i =>
          i.id === itemId
            ? { ...i, cantidad, subtotal: calcularSubtotal(cantidad, i.precio_unitario, i.descuento_item) }
            : i
        )
        const subtotalBruto = nuevosItems.reduce((sum, i) => sum + i.subtotal, 0)
        const totalFinal = +(subtotalBruto * (1 - get().descuento_general / 100)).toFixed(2)
        set({ items: nuevosItems, subtotalBruto: +subtotalBruto.toFixed(2), totalFinal })
      },

      actualizarDescuentoItem: (itemId, descuento) => {
        const nuevosItems = get().items.map(i =>
          i.id === itemId
            ? { ...i, descuento_item: descuento, subtotal: calcularSubtotal(i.cantidad, i.precio_unitario, descuento) }
            : i
        )
        const subtotalBruto = nuevosItems.reduce((sum, i) => sum + i.subtotal, 0)
        const totalFinal = +(subtotalBruto * (1 - get().descuento_general / 100)).toFixed(2)
        set({ items: nuevosItems, subtotalBruto: +subtotalBruto.toFixed(2), totalFinal })
      },

      removerItem: (itemId) => {
        const nuevosItems = get().items.filter(i => i.id !== itemId)
        const subtotalBruto = nuevosItems.reduce((sum, i) => sum + i.subtotal, 0)
        const totalFinal = +(subtotalBruto * (1 - get().descuento_general / 100)).toFixed(2)
        set({ items: nuevosItems, subtotalBruto: +subtotalBruto.toFixed(2), totalFinal })
      },

      setDescuentoGeneral: (descuento) => {
        const { subtotalBruto } = get()
        const totalFinal = +(subtotalBruto * (1 - descuento / 100)).toFixed(2)
        set({ descuento_general: descuento, totalFinal })
      },

      setObservaciones: (obs) => set({ observaciones: obs }),

      limpiarCarrito: () => set({
        pedidoId: uuidv4(),
        cliente: null,
        lista_precio_id: null,
        items: [],
        descuento_general: 0,
        observaciones: null,
        subtotalBruto: 0,
        totalFinal: 0,
      }),
    }),
    {
      name: 'agrovet-cart',
    }
  )
)

// Selector para transformar CartItems a PedidoItems para persistir
export function cartItemsToPedidoItems(items: CartItem[], pedidoId: string): PedidoItem[] {
  return items.map(item => ({
    id: item.id,
    pedido_id: pedidoId,
    producto_id: item.producto.id,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    descuento_item: item.descuento_item,
    subtotal: item.subtotal,
    observaciones: item.observaciones,
  }))
}
