import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { db } from '@/lib/db'
import type { Producto, Categoria, Precio } from '@/types/database'
import { Input } from '@/components/ui/Input'
import { ProductCardSkeleton, SkeletonList } from '@/components/ui/Skeleton'
import { useCartStore } from '@/store/cartStore'
import { formatARS } from '@/utils/formatters'

export function Catalog() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [precios, setPrecios] = useState<Precio[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // Cliente activo en el carrito (para mostrar su precio en cada card)
  const { cliente, lista_precio_id } = useCartStore()

  useEffect(() => {
    async function cargar() {
      const [prods, cats, precios] = await Promise.all([
        db.productos.filter(p => p.activo).toArray(),
        db.categorias.filter(c => c.activo).sortBy('orden'),
        db.precios.toArray(),
      ])
      setProductos(prods)
      setCategorias(cats)
      setPrecios(precios)
      setLoading(false)
    }
    cargar()
  }, [])

  // Mapa rápido: productoId → precio para la lista del cliente activo
  const precioMap = useMemo(() => {
    if (!lista_precio_id) return new Map<string, number>()
    return new Map(
      precios
        .filter(p => p.lista_precio_id === lista_precio_id)
        .map(p => [p.producto_id, p.precio])
    )
  }, [precios, lista_precio_id])

  const productosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    return productos.filter(p => {
      const matchCategoria = categoriaId === null || p.categoria_id === categoriaId
      const matchBusqueda = !q
        || p.nombre.toLowerCase().includes(q)
        || p.codigo.toLowerCase().includes(q)
      return matchCategoria && matchBusqueda
    })
  }, [productos, busqueda, categoriaId])

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-200">
          <div className="h-7 w-24 bg-gray-200 rounded-lg animate-pulse mb-3" />
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        <div className="flex-1 px-4 py-3">
          <SkeletonList count={6}><ProductCardSkeleton /></SkeletonList>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-xl font-bold text-gray-900 mb-3">Catálogo</h1>
          <Input
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            leftIcon={<span>🔍</span>}
          />

          {/* Filtros de categoría */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            <button
              onClick={() => setCategoriaId(null)}
              className={`flex-none px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors
                ${categoriaId === null
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-300'}`}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoriaId(cat.id === categoriaId ? null : cat.id)}
                className={`flex-none px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors flex items-center gap-1
                  ${categoriaId === cat.id
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-300'}`}
              >
                {cat.emoji && <span>{cat.emoji}</span>}
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Banner de cliente activo */}
        {cliente && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 border-t border-primary-100">
            <span className="text-primary-600 text-sm">💰</span>
            <p className="text-sm text-primary-700 flex-1 truncate">
              Precios para <span className="font-semibold">{cliente.razon_social}</span>
            </p>
            <Link
              to="/clientes"
              className="text-xs text-primary-600 underline flex-none"
            >
              Cambiar
            </Link>
          </div>
        )}
      </div>

      {/* Lista de productos */}
      <div className="flex-1 px-4 py-3">
        <p className="text-sm text-gray-500 mb-3">
          {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
          {!cliente && (
            <span className="ml-2 text-primary-600">
              · <Link to="/clientes" className="underline">Seleccioná un cliente</Link> para ver precios
            </span>
          )}
        </p>

        {productosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p>Sin resultados para "{busqueda}"</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {productosFiltrados.map(producto => {
              const precio = precioMap.get(producto.id)
              const sinStock = producto.stock_disponible !== null && producto.stock_disponible === 0

              return (
                <Link
                  key={producto.id}
                  to={`/catalogo/${producto.id}`}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 touch-manipulation"
                >
                  <div className="flex items-center gap-3">
                    {/* Imagen o placeholder */}
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-none overflow-hidden">
                      {producto.imagen_path ? (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/productos/${producto.imagen_path}`}
                          alt={producto.nombre}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-400 font-mono">{producto.codigo}</p>
                      <p className="font-semibold text-gray-900 truncate leading-snug">
                        {producto.nombre}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{producto.presentacion}</p>
                    </div>

                    {/* Precio + chevron */}
                    <div className="flex flex-col items-end gap-1 flex-none">
                      {precio !== undefined ? (
                        <p className={`font-bold text-base ${sinStock ? 'text-gray-400' : 'text-primary-700'}`}>
                          {formatARS(precio)}
                        </p>
                      ) : cliente ? (
                        <p className="text-xs text-gray-400">Sin precio</p>
                      ) : null}

                      {sinStock && (
                        <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                          Sin stock
                        </span>
                      )}

                      <svg className="w-4 h-4 text-gray-300 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
