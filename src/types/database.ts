// ============================================================
// Tipos que mapean exactamente las tablas de Supabase
// Mantener sincronizados con el schema SQL
// ============================================================

export type CondicionIva = 'ri' | 'mono' | 'cf' | 'exento'
export type EstadoCliente = 'activo' | 'pendiente_aprobacion' | 'inactivo'
export type EstadoPedido = 'borrador' | 'pendiente_sync' | 'enviado' | 'procesado' | 'cancelado'

// ------ Tablas base ------

export interface Vendedor {
  id: string
  nombre: string
  apellido: string
  telefono: string | null
  limite_descuento: number
  activo: boolean
  created_at: string
}

export interface Categoria {
  id: number
  nombre: string
  descripcion: string | null
  emoji: string | null
  orden: number
  activo: boolean
}

export interface Producto {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  categoria_id: number
  presentacion: string
  unidad_venta: string
  stock_disponible: number | null
  imagen_path: string | null
  activo: boolean
  created_at: string
  updated_at: string
  // Join opcional
  categoria?: Categoria
}

export interface ListaPrecio {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
}

export interface Precio {
  id: number
  producto_id: string
  lista_precio_id: number
  precio: number
  updated_at: string
}

export interface Cliente {
  id: string
  vendedor_id: string
  razon_social: string
  nombre_fantasia: string | null
  cuit: string
  condicion_iva: CondicionIva
  lista_precio_id: number
  telefono: string | null
  email: string | null
  direccion: string | null
  localidad: string | null
  provincia: string | null
  observaciones: string | null
  estado: EstadoCliente
  created_at: string
  updated_at: string
  // Joins opcionales
  lista_precio?: ListaPrecio
}

export interface Pedido {
  id: string                    // UUID generado client-side
  vendedor_id: string
  cliente_id: string
  numero: string | null         // generado por trigger en Supabase
  estado: EstadoPedido
  total: number
  descuento_general: number
  observaciones: string | null
  lista_precio_id: number
  tiene_conflicto: boolean
  conflicto_detalle: string | null
  created_at: string
  synced_at: string | null
  updated_at: string
  // Joins opcionales
  cliente?: Cliente
  items?: PedidoItem[]
}

export interface PedidoItem {
  id: string
  pedido_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  descuento_item: number
  subtotal: number
  observaciones: string | null
  // Join opcional
  producto?: Producto
}

// ------ Tipos para inserts (sin campos generados por el servidor) ------

export type ClienteInsert = Omit<Cliente, 'created_at' | 'updated_at' | 'lista_precio'>
export type PedidoInsert = Omit<Pedido, 'numero' | 'synced_at' | 'cliente' | 'items'>
export type PedidoItemInsert = Omit<PedidoItem, 'producto'>

// ------ Tipos de Supabase Database (para el cliente tipado) ------

export interface Database {
  public: {
    Tables: {
      vendedores: {
        Row: Vendedor
        Insert: Omit<Vendedor, 'created_at'>
        Update: Partial<Omit<Vendedor, 'id' | 'created_at'>>
      }
      categorias: {
        Row: Categoria
        Insert: Omit<Categoria, 'id'>
        Update: Partial<Omit<Categoria, 'id'>>
      }
      productos: {
        Row: Producto
        Insert: Omit<Producto, 'created_at' | 'updated_at' | 'categoria'>
        Update: Partial<Omit<Producto, 'id' | 'created_at' | 'categoria'>>
      }
      listas_precios: {
        Row: ListaPrecio
        Insert: Omit<ListaPrecio, 'id'>
        Update: Partial<Omit<ListaPrecio, 'id'>>
      }
      precios: {
        Row: Precio
        Insert: Omit<Precio, 'id'>
        Update: Partial<Omit<Precio, 'id'>>
      }
      clientes: {
        Row: Cliente
        Insert: ClienteInsert
        Update: Partial<ClienteInsert>
      }
      pedidos: {
        Row: Pedido
        Insert: PedidoInsert
        Update: Partial<PedidoInsert>
      }
      pedido_items: {
        Row: PedidoItem
        Insert: PedidoItemInsert
        Update: Partial<PedidoItemInsert>
      }
    }
  }
}
