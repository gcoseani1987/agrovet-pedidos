import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import type { Producto, Categoria, Precio, ListaPrecio } from '@/types/database'

export interface PrecioConLista extends Precio {
  lista: ListaPrecio
}

export interface ProductoCompleto {
  producto: Producto | null
  categoria: Categoria | null
  precios: PrecioConLista[]
  loading: boolean
  notFound: boolean
}

/** Carga un producto con su categoría y todos sus precios desde IndexedDB */
export function useProduct(id: string): ProductoCompleto {
  const [state, setState] = useState<ProductoCompleto>({
    producto: null,
    categoria: null,
    precios: [],
    loading: true,
    notFound: false,
  })

  useEffect(() => {
    if (!id) return

    async function cargar() {
      const producto = await db.productos.get(id)

      if (!producto) {
        setState({ producto: null, categoria: null, precios: [], loading: false, notFound: true })
        return
      }

      const [categoria, preciosRaw, listas] = await Promise.all([
        db.categorias.get(producto.categoria_id),
        db.precios.where('producto_id').equals(id).toArray(),
        db.listas_precios.toArray(),
      ])

      const listaMap = new Map(listas.map(l => [l.id, l]))
      const precios: PrecioConLista[] = preciosRaw
        .filter(p => listaMap.has(p.lista_precio_id))
        .map(p => ({ ...p, lista: listaMap.get(p.lista_precio_id)! }))
        .sort((a, b) => a.lista.id - b.lista.id)

      setState({
        producto,
        categoria: categoria ?? null,
        precios,
        loading: false,
        notFound: false,
      })
    }

    cargar()
  }, [id])

  return state
}
