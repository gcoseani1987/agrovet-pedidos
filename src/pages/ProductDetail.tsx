import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useProduct } from '@/hooks/useProduct'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/Button'
import { Stepper } from '@/components/ui/Stepper'
import { Badge } from '@/components/ui/Badge'
import { formatARS } from '@/utils/formatters'
import { getImageUrl } from '@/lib/supabase'

export function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { producto, categoria, precios, loading, notFound } = useProduct(id ?? '')

  const { cliente, lista_precio_id, agregarItem } = useCartStore()
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  // Precio que aplica al cliente seleccionado en el carrito
  const precioActivo = lista_precio_id
    ? precios.find(p => p.lista_precio_id === lista_precio_id)
    : null

  const handleAgregar = () => {
    if (!producto || !precioActivo) return
    agregarItem(producto, cantidad, precioActivo.precio)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  // ---- Estados de carga ----

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar onBack={() => navigate(-1)} title="" />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-2 animate-pulse">📦</div>
            <p>Cargando...</p>
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !producto) {
    return (
      <div className="flex flex-col h-full">
        <TopBar onBack={() => navigate(-1)} title="" />
        <div className="flex items-center justify-center flex-1 px-6">
          <div className="text-center text-gray-400">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-semibold text-gray-700">Producto no encontrado</p>
            <p className="text-sm mt-1">Puede que el catálogo esté desactualizado.</p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate('/catalogo')}>
              Volver al catálogo
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const imageUrl = getImageUrl(producto.imagen_path)
  const stockLabel = producto.stock_disponible !== null
    ? producto.stock_disponible > 0
      ? `${producto.stock_disponible} disponibles`
      : 'Sin stock'
    : null

  const stockVariant = producto.stock_disponible !== null
    ? producto.stock_disponible > 10 ? 'green' : producto.stock_disponible > 0 ? 'yellow' : 'red'
    : 'gray'

  return (
    <div className="flex flex-col min-h-full pb-4">
      <TopBar onBack={() => navigate(-1)} title={producto.codigo} />

      {/* Imagen */}
      <div className="bg-white border-b border-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={producto.nombre}
            className="w-full h-56 object-contain bg-gray-50"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-44 flex items-center justify-center bg-gray-50">
            <span className="text-7xl opacity-30">📦</span>
          </div>
        )}
      </div>

      {/* Info principal */}
      <div className="px-4 py-4 bg-white border-b border-gray-100">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{producto.nombre}</h1>
          {stockLabel && <Badge variant={stockVariant}>{stockLabel}</Badge>}
        </div>

        <div className="flex items-center gap-2 mb-3">
          {categoria && (
            <span className="text-sm text-gray-500">
              {categoria.emoji} {categoria.nombre}
            </span>
          )}
          <span className="text-gray-300">•</span>
          <span className="text-sm font-mono text-gray-400">{producto.codigo}</span>
        </div>

        <div className="flex gap-4 text-sm">
          <div>
            <p className="text-gray-500">Presentación</p>
            <p className="font-semibold text-gray-900">{producto.presentacion}</p>
          </div>
          <div>
            <p className="text-gray-500">Unidad de venta</p>
            <p className="font-semibold text-gray-900">{producto.unidad_venta}</p>
          </div>
        </div>

        {producto.descripcion && (
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            {producto.descripcion}
          </p>
        )}
      </div>

      {/* Precios */}
      <div className="px-4 py-4">
        <h2 className="font-bold text-gray-900 mb-3">Precios (c/IVA)</h2>

        {precios.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
            ⚠️ No hay precios cargados. Sincronizá el catálogo.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {precios.map(precio => {
              const esActivo = precio.lista_precio_id === lista_precio_id
              return (
                <div
                  key={precio.id}
                  className={[
                    'flex items-center justify-between rounded-xl px-4 py-3 border-2',
                    esActivo
                      ? 'bg-primary-50 border-primary-400'
                      : 'bg-white border-gray-100',
                  ].join(' ')}
                >
                  <div>
                    <p className={`text-sm font-semibold ${esActivo ? 'text-primary-700' : 'text-gray-600'}`}>
                      {precio.lista.nombre}
                      {esActivo && cliente && (
                        <span className="ml-2 text-xs font-normal">
                          ← {cliente.razon_social}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className={`text-xl font-bold ${esActivo ? 'text-primary-700' : 'text-gray-700'}`}>
                    {formatARS(precio.precio)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Acción: agregar al pedido */}
      <div className="mx-4 mt-2">
        {!cliente ? (
          // Sin cliente seleccionado
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-gray-600 text-sm mb-3">
              Para agregar al pedido, primero seleccioná un cliente.
            </p>
            <Link to="/clientes">
              <Button variant="secondary" fullWidth>
                Seleccionar cliente
              </Button>
            </Link>
          </div>
        ) : !precioActivo ? (
          // Cliente sin precio para este producto
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
            <p className="text-sm text-yellow-800">
              ⚠️ Este producto no tiene precio para la lista de {cliente.razon_social}.
            </p>
          </div>
        ) : (
          // Todo listo para agregar
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">
              Cliente: <span className="font-semibold text-gray-900">{cliente.razon_social}</span>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Precio unitario:{' '}
              <span className="font-bold text-primary-700 text-lg">{formatARS(precioActivo.precio)}</span>
            </p>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">Cantidad</span>
              <Stepper
                value={cantidad}
                onChange={setCantidad}
                min={1}
                max={producto.stock_disponible ?? 9999}
                step={producto.unidad_venta === 'kg' || producto.unidad_venta === 'litro' ? 0.5 : 1}
                decimals={producto.unidad_venta === 'kg' || producto.unidad_venta === 'litro' ? 1 : 0}
              />
            </div>

            {/* Subtotal preview */}
            <div className="flex items-center justify-between mb-4 py-3 border-t border-gray-100">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-xl font-bold text-gray-900">
                {formatARS(cantidad * precioActivo.precio)}
              </span>
            </div>

            <Button
              fullWidth
              size="lg"
              onClick={handleAgregar}
              disabled={agregado}
              className={agregado ? 'bg-green-600 hover:bg-green-600' : ''}
            >
              {agregado ? '✓ Agregado al pedido' : `Agregar ${cantidad} al pedido`}
            </Button>

            {/* Link al carrito si ya tiene items */}
            <Link
              to="/pedidos/nuevo"
              className="block text-center mt-3 text-sm text-primary-600 underline"
            >
              Ver pedido actual →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function TopBar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
      <button
        onClick={onBack}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200 touch-manipulation"
        aria-label="Volver"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <p className="text-sm font-mono text-gray-500">{title}</p>
    </div>
  )
}
