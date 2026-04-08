-- ============================================================
-- AgroVet Pedidos — Schema completo
-- Correr en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. VENDEDORES (perfil extendido de auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vendedores (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre            text NOT NULL,
  apellido          text NOT NULL,
  telefono          text,
  limite_descuento  numeric(5,2) NOT NULL DEFAULT 10.00,  -- % máximo de descuento
  activo            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.vendedores IS 'Perfil extendido de cada vendedor, vinculado a auth.users';

-- ============================================================
-- 2. CATEGORÍAS DE PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categorias (
  id          serial PRIMARY KEY,
  nombre      text NOT NULL UNIQUE,
  descripcion text,
  emoji       text,
  orden       integer NOT NULL DEFAULT 0,
  activo      boolean NOT NULL DEFAULT true
);

COMMENT ON TABLE public.categorias IS 'Categorías del catálogo: Sanidad Animal, Nutrición, etc.';

-- ============================================================
-- 3. PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.productos (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo            text NOT NULL UNIQUE,
  nombre            text NOT NULL,
  descripcion       text,
  categoria_id      integer NOT NULL REFERENCES public.categorias(id),
  presentacion      text NOT NULL,          -- "Frasco 500ml", "Bolsa 25kg"
  unidad_venta      text NOT NULL DEFAULT 'unidad',
  stock_disponible  integer,                -- informativo
  imagen_path       text,                   -- path en Supabase Storage bucket "productos"
  activo            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.productos IS 'Catálogo de productos agroveterinarios';
COMMENT ON COLUMN public.productos.imagen_path IS 'Path relativo dentro del bucket "productos" en Supabase Storage';

-- Índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_productos_codigo    ON public.productos(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_nombre    ON public.productos USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo    ON public.productos(activo);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER productos_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. LISTAS DE PRECIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listas_precios (
  id          serial PRIMARY KEY,
  nombre      text NOT NULL UNIQUE,
  descripcion text,
  activo      boolean NOT NULL DEFAULT true
);

COMMENT ON TABLE public.listas_precios IS 'Listas de precios diferenciadas por tipo de cliente';

-- ============================================================
-- 5. PRECIOS (producto × lista)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.precios (
  id               serial PRIMARY KEY,
  producto_id      uuid NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  lista_precio_id  integer NOT NULL REFERENCES public.listas_precios(id),
  precio           numeric(12,2) NOT NULL CHECK (precio >= 0),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (producto_id, lista_precio_id)
);

COMMENT ON TABLE public.precios IS 'Precios por producto y lista. Precio incluye IVA.';

CREATE INDEX IF NOT EXISTS idx_precios_producto ON public.precios(producto_id);
CREATE INDEX IF NOT EXISTS idx_precios_lista    ON public.precios(lista_precio_id);

CREATE TRIGGER precios_updated_at
  BEFORE UPDATE ON public.precios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. CLIENTES
-- ============================================================
CREATE TYPE condicion_iva_enum AS ENUM ('ri', 'mono', 'cf', 'exento');
CREATE TYPE estado_cliente_enum AS ENUM ('activo', 'pendiente_aprobacion', 'inactivo');

CREATE TABLE IF NOT EXISTS public.clientes (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendedor_id      uuid NOT NULL REFERENCES public.vendedores(id),
  razon_social     text NOT NULL,
  nombre_fantasia  text,
  cuit             text NOT NULL,
  condicion_iva    condicion_iva_enum NOT NULL DEFAULT 'ri',
  lista_precio_id  integer NOT NULL REFERENCES public.listas_precios(id),
  telefono         text,
  email            text,
  direccion        text,
  localidad        text,
  provincia        text,
  observaciones    text,
  estado           estado_cliente_enum NOT NULL DEFAULT 'activo',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clientes IS 'Clientes asignados a cada vendedor';
COMMENT ON COLUMN public.clientes.estado IS 'pendiente_aprobacion: cargado offline, espera revisión del admin';

CREATE INDEX IF NOT EXISTS idx_clientes_vendedor    ON public.clientes(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_clientes_cuit        ON public.clientes(cuit);
CREATE INDEX IF NOT EXISTS idx_clientes_localidad   ON public.clientes(localidad);

CREATE TRIGGER clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 7. PEDIDOS
-- ============================================================
CREATE TYPE estado_pedido_enum AS ENUM (
  'borrador',
  'pendiente_sync',
  'enviado',
  'procesado',
  'cancelado'
);

CREATE TABLE IF NOT EXISTS public.pedidos (
  id                uuid PRIMARY KEY,  -- generado client-side para soporte offline
  vendedor_id       uuid NOT NULL REFERENCES public.vendedores(id),
  cliente_id        uuid NOT NULL REFERENCES public.clientes(id),
  numero            text UNIQUE,       -- generado por trigger: "2025-00042"
  estado            estado_pedido_enum NOT NULL DEFAULT 'enviado',
  total             numeric(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  descuento_general numeric(5,2) NOT NULL DEFAULT 0 CHECK (descuento_general BETWEEN 0 AND 100),
  observaciones     text,
  lista_precio_id   integer NOT NULL REFERENCES public.listas_precios(id),
  tiene_conflicto   boolean NOT NULL DEFAULT false,
  conflicto_detalle text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  synced_at         timestamptz,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pedidos IS 'Pedidos de venta. El id se genera en el cliente para soportar modo offline.';
COMMENT ON COLUMN public.pedidos.numero IS 'Número legible, generado automáticamente por trigger al hacer INSERT';
COMMENT ON COLUMN public.pedidos.tiene_conflicto IS 'true si al sincronizar hubo un precio desactualizado o stock agotado';

CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor    ON public.pedidos(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente     ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado      ON public.pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at  ON public.pedidos(created_at DESC);

CREATE TRIGGER pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger para generar número de pedido automático: "2025-00001"
CREATE SEQUENCE IF NOT EXISTS pedidos_numero_seq;

CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL THEN
    NEW.numero := to_char(now(), 'YYYY') || '-' || lpad(nextval('pedidos_numero_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pedidos_generar_numero
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION generar_numero_pedido();

-- Trigger para registrar cuándo llegó el pedido a Supabase
CREATE OR REPLACE FUNCTION set_synced_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.synced_at IS NULL THEN
    NEW.synced_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pedidos_set_synced_at
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION set_synced_at();

-- ============================================================
-- 8. ITEMS DE PEDIDO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pedido_items (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id        uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  producto_id      uuid NOT NULL REFERENCES public.productos(id),
  cantidad         numeric(10,3) NOT NULL CHECK (cantidad > 0),
  precio_unitario  numeric(12,2) NOT NULL CHECK (precio_unitario >= 0),
  descuento_item   numeric(5,2) NOT NULL DEFAULT 0 CHECK (descuento_item BETWEEN 0 AND 100),
  subtotal         numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  observaciones    text
);

COMMENT ON TABLE public.pedido_items IS 'Líneas de cada pedido. precio_unitario es snapshot al momento de crear el pedido.';
COMMENT ON COLUMN public.pedido_items.precio_unitario IS 'Precio congelado al momento del pedido, no cambia si la lista se actualiza';

CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido   ON public.pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_producto ON public.pedido_items(producto_id);

-- ============================================================
-- Habilitar RLS en todas las tablas
-- ============================================================
ALTER TABLE public.vendedores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listas_precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items   ENABLE ROW LEVEL SECURITY;
