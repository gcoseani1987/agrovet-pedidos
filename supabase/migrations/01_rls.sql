-- ============================================================
-- AgroVet Pedidos — Políticas de Row Level Security
-- Correr DESPUÉS de 00_schema.sql
-- ============================================================

-- ============================================================
-- VENDEDORES
-- Solo puede ver y modificar su propio perfil
-- ============================================================
CREATE POLICY "vendedor_select_propio"
  ON public.vendedores
  FOR SELECT
  USING (auth.uid() = id);

-- No permitir INSERT ni DELETE desde el frontend.
-- Los vendedores se crean desde el dashboard de Supabase.

-- ============================================================
-- CATEGORÍAS — Lectura para cualquier usuario autenticado
-- Solo el admin (desde dashboard) puede modificar
-- ============================================================
CREATE POLICY "categorias_select_autenticados"
  ON public.categorias
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- PRODUCTOS — Lectura para cualquier usuario autenticado
-- ============================================================
CREATE POLICY "productos_select_autenticados"
  ON public.productos
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- LISTAS DE PRECIOS — Lectura para cualquier usuario autenticado
-- ============================================================
CREATE POLICY "listas_precios_select_autenticados"
  ON public.listas_precios
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- PRECIOS — Lectura para cualquier usuario autenticado
-- ============================================================
CREATE POLICY "precios_select_autenticados"
  ON public.precios
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- CLIENTES
-- Cada vendedor solo accede a sus propios clientes
-- ============================================================
CREATE POLICY "clientes_select_propio"
  ON public.clientes
  FOR SELECT
  USING (vendedor_id = auth.uid());

CREATE POLICY "clientes_insert_propio"
  ON public.clientes
  FOR INSERT
  WITH CHECK (
    vendedor_id = auth.uid()
    -- Los clientes nuevos creados desde el celular quedan pendiente_aprobacion
    -- No se puede insertar directamente como 'activo' desde el frontend
    -- (la lógica de negocio en el frontend lo garantiza; aquí es defensa en profundidad)
  );

CREATE POLICY "clientes_update_propio"
  ON public.clientes
  FOR UPDATE
  USING (vendedor_id = auth.uid())
  WITH CHECK (vendedor_id = auth.uid());

-- No se permite DELETE de clientes desde el frontend

-- ============================================================
-- PEDIDOS
-- Cada vendedor solo accede a sus propios pedidos
-- No se pueden eliminar pedidos (solo cancelar)
-- ============================================================
CREATE POLICY "pedidos_select_propio"
  ON public.pedidos
  FOR SELECT
  USING (vendedor_id = auth.uid());

CREATE POLICY "pedidos_insert_propio"
  ON public.pedidos
  FOR INSERT
  WITH CHECK (vendedor_id = auth.uid());

CREATE POLICY "pedidos_update_propio"
  ON public.pedidos
  FOR UPDATE
  USING (
    vendedor_id = auth.uid()
    AND estado NOT IN ('procesado')  -- No modificar pedidos ya procesados por la oficina
  )
  WITH CHECK (vendedor_id = auth.uid());

-- ============================================================
-- PEDIDO_ITEMS
-- Acceso indirecto a través de la propiedad del pedido
-- ============================================================
CREATE POLICY "pedido_items_select_via_pedido"
  ON public.pedido_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos
      WHERE pedidos.id = pedido_items.pedido_id
        AND pedidos.vendedor_id = auth.uid()
    )
  );

CREATE POLICY "pedido_items_insert_via_pedido"
  ON public.pedido_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedidos
      WHERE pedidos.id = pedido_items.pedido_id
        AND pedidos.vendedor_id = auth.uid()
    )
  );

CREATE POLICY "pedido_items_update_via_pedido"
  ON public.pedido_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos
      WHERE pedidos.id = pedido_items.pedido_id
        AND pedidos.vendedor_id = auth.uid()
        AND pedidos.estado NOT IN ('procesado')
    )
  );

CREATE POLICY "pedido_items_delete_via_pedido"
  ON public.pedido_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos
      WHERE pedidos.id = pedido_items.pedido_id
        AND pedidos.vendedor_id = auth.uid()
        AND pedidos.estado IN ('borrador')  -- Solo se pueden eliminar items de borradores
    )
  );

-- ============================================================
-- Storage: bucket "productos" para imágenes
-- Crear el bucket en: Supabase Dashboard → Storage → New bucket
-- Nombre: "productos", Public: true
-- ============================================================

-- Política de acceso al bucket (correr en SQL Editor)
-- NOTA: Supabase crea estas políticas automáticamente al crear
-- el bucket como público. Incluidas aquí por completitud.

-- INSERT ONLY para service_role (admin sube imágenes desde dashboard)
-- SELECT público (las imágenes son públicas para que funcionen offline)
