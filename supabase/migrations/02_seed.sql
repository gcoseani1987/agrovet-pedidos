-- ============================================================
-- AgroVet Pedidos — Datos semilla realistas
-- Correr DESPUÉS de 00_schema.sql y 01_rls.sql
-- ============================================================

-- ============================================================
-- CATEGORÍAS
-- ============================================================
INSERT INTO public.categorias (nombre, descripcion, emoji, orden) VALUES
  ('Sanidad Animal',    'Vacunas, antiparasitarios, antibióticos y productos veterinarios',    '💉', 1),
  ('Nutrición Animal',  'Suplementos, minerales, vitaminas y alimentos concentrados',          '🌾', 2),
  ('Fitosanitarios',    'Herbicidas, insecticidas, fungicidas para cultivos',                  '🌱', 3),
  ('Semillas',          'Semillas certificadas para pasturas y cultivos',                      '🌿', 4),
  ('Equipamiento',      'Jeringas, agujas, mangas, balanzas y accesorios veterinarios',       '🔧', 5),
  ('Higiene y Limpieza','Desinfectantes, detergentes y productos de higiene para instalaciones','🧴', 6)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- LISTAS DE PRECIOS
-- ============================================================
INSERT INTO public.listas_precios (nombre, descripcion) VALUES
  ('Minorista',    'Precio para productores chicos y consumidores finales'),
  ('Mayorista',    'Precio para compras de volumen (mínimo $500.000)'),
  ('Distribuidor', 'Precio especial para distribuidores y veterinarias revendedoras')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- PRODUCTOS
-- ============================================================
INSERT INTO public.productos (id, codigo, nombre, descripcion, categoria_id, presentacion, unidad_venta, stock_disponible) VALUES

-- SANIDAD ANIMAL
('a1000000-0000-0000-0000-000000000001', 'SA-001', 'Ivermectina 1%',
  'Antiparasitario de amplio espectro. Controla parásitos internos y externos en bovinos, ovinos y porcinos.',
  1, 'Frasco 500ml', 'unidad', 150),

('a1000000-0000-0000-0000-000000000002', 'SA-002', 'Ivermectina 3.15%',
  'Formulación de alta concentración con efecto prolongado de 70 días. Pour-on.',
  1, 'Frasco 1 litro', 'unidad', 80),

('a1000000-0000-0000-0000-000000000003', 'SA-003', 'Closantel 10%',
  'Antiparasitario fasciolicida. Eficaz contra fasciola hepática y parásitos gastrointestinales.',
  1, 'Frasco 500ml', 'unidad', 95),

('a1000000-0000-0000-0000-000000000004', 'SA-004', 'Vacuna Triple Bovina (IBR-BVD-PI3)',
  'Vacuna contra los principales virus respiratorios bovinos. Dosis: 5ml SC.',
  1, 'Frasco x 25 dosis', 'unidad', 60),

('a1000000-0000-0000-0000-000000000005', 'SA-005', 'Vacuna Mancha y Gangrena',
  'Bacteriana contra Clostridium chauvoei y septicum. Protección por 12 meses.',
  1, 'Frasco x 50 dosis', 'unidad', 45),

('a1000000-0000-0000-0000-000000000006', 'SA-006', 'Oxitetraciclina LA 200',
  'Antibiótico de acción prolongada (48-72hs). Para neumonías, podredumbre y otras infecciones bacterianas.',
  1, 'Frasco 100ml', 'unidad', 120),

('a1000000-0000-0000-0000-000000000007', 'SA-007', 'Levamisol 15%',
  'Antiparasitario oral/inyectable. Activo frente a nemátodos resistentes a ivermectina.',
  1, 'Frasco 500ml', 'unidad', 70),

('a1000000-0000-0000-0000-000000000008', 'SA-008', 'Albendazol 25%',
  'Antiparasitario oral de amplio espectro. Control de fasciola, nematodes y tenias.',
  1, 'Frasco 1 litro', 'unidad', 55),

('a1000000-0000-0000-0000-000000000009', 'SA-009', 'Vacuna Aftosa',
  'Vacuna bivalente contra fiebre aftosa tipo O y A. Obligatoria por ley. Dosis: 2ml SC.',
  1, 'Frasco x 50 dosis', 'unidad', 200),

('a1000000-0000-0000-0000-000000000010', 'SA-010', 'Cypermectrina 6% Pour-On',
  'Ectoparasitida para control de garrapatas, piojos y tábanos. Aplicación dorsal.',
  1, 'Frasco 1 litro', 'unidad', 90),

-- NUTRICIÓN ANIMAL
('a1000000-0000-0000-0000-000000000011', 'NU-001', 'Sal Mineral Bovinos (12:12)',
  'Suplemento mineral con fósforo 12%, sodio 12%. Mejora la reproducción y la ganancia de peso.',
  2, 'Bolsa 25kg', 'unidad', 300),

('a1000000-0000-0000-0000-000000000012', 'NU-002', 'Sal Mineral Premium (Ca-P-Mg)',
  'Fórmula avanzada con calcio, fósforo, magnesio y oligoelementos quelados.',
  2, 'Bolsa 25kg', 'unidad', 180),

('a1000000-0000-0000-0000-000000000013', 'NU-003', 'Vitamina ADE Injectable',
  'Suplemento vitamínico inyectable. Previene deficiencias vitamínicas en bovinos y ovinos.',
  2, 'Frasco 100ml', 'unidad', 140),

('a1000000-0000-0000-0000-000000000014', 'NU-004', 'Urea Granulada Feed Grade',
  'Fuente de nitrógeno no proteico para suplementación de bovinos. No apto para ovinos.',
  2, 'Bolsa 25kg', 'unidad', 250),

('a1000000-0000-0000-0000-000000000015', 'NU-005', 'Núcleo Vitamínico-Mineral Ovinos',
  'Premix completo para ovinos. Incluye selenio, cobre, zinc, cobalto y vitaminas liposolubles.',
  2, 'Bolsa 5kg', 'unidad', 110),

('a1000000-0000-0000-0000-000000000016', 'NU-006', 'Propilenglicol 99.5%',
  'Precursor gluconeogénico para vacas en transición. Previene cetosis y lipidosis hepática.',
  2, 'Bidon 20 litros', 'unidad', 65),

-- FITOSANITARIOS
('a1000000-0000-0000-0000-000000000017', 'FI-001', 'Glifosato 48%',
  'Herbicida sistémico de amplio espectro. Control de malezas anuales y perennes.',
  3, 'Bidón 20 litros', 'unidad', 400),

('a1000000-0000-0000-0000-000000000018', 'FI-002', 'Dicamba 58%',
  'Herbicida sistémico postemergente. Control de malezas de hoja ancha resistentes a glifosato.',
  3, 'Frasco 1 litro', 'unidad', 160),

('a1000000-0000-0000-0000-000000000019', 'FI-003', 'Clorpirifos 48% EC',
  'Insecticida organofosforado de contacto e ingestión. Pulgones, chinches y trips.',
  3, 'Frasco 1 litro', 'unidad', 130),

('a1000000-0000-0000-0000-000000000020', 'FI-004', 'Tebuconazol 25% EC',
  'Fungicida triazol sistémico. Control de roya, mancha foliar y oídio en soja, trigo y maíz.',
  3, 'Frasco 1 litro', 'unidad', 95),

('a1000000-0000-0000-0000-000000000021', 'FI-005', '2,4-D Amina 72%',
  'Herbicida hormonal postemergente. Control de malezas de hoja ancha en gramíneas.',
  3, 'Bidón 20 litros', 'unidad', 220),

-- SEMILLAS
('a1000000-0000-0000-0000-000000000022', 'SE-001', 'Alfalfa Estándar (Sin reposo)',
  'Semilla certificada INTA. Alta producción de forraje, tolerante a sequías. Rendimiento 12-15 tn MS/ha.',
  4, 'Bolsa 25kg', 'unidad', 80),

('a1000000-0000-0000-0000-000000000023', 'SE-002', 'Lotus Tenuis',
  'Leguminosa perenne para suelos inundables. Excelente para la región pampeana.',
  4, 'Bolsa 5kg', 'unidad', 50),

('a1000000-0000-0000-0000-000000000024', 'SE-003', 'Festuca Alta Tipo Continental',
  'Gramínea perenne de alta persistencia. Ideal para praderas permanentes en zonas templadas.',
  4, 'Bolsa 25kg', 'unidad', 70),

-- EQUIPAMIENTO
('a1000000-0000-0000-0000-000000000025', 'EQ-001', 'Jeringa Automática 10ml',
  'Jeringa de dosis repetible, escala 1-10ml. Apta para autoclave. Aguja 40x1.2.',
  5, 'Unidad', 'unidad', 200),

('a1000000-0000-0000-0000-000000000026', 'EQ-002', 'Termómetro Digital Veterinario',
  'Medición rectal. Rango 32-43°C. Alarma fiebre. Memoria último registro.',
  5, 'Unidad', 'unidad', 85),

('a1000000-0000-0000-0000-000000000027', 'EQ-003', 'Mameluco Descartable Tyvek',
  'Protección para trabajos con químicos y en partos. Talle L. Pack x10.',
  5, 'Pack x10', 'unidad', 120),

-- HIGIENE Y LIMPIEZA
('a1000000-0000-0000-0000-000000000028', 'HI-001', 'Formaldehído 37% (Formol)',
  'Desinfectante para instalaciones y pediluvios. Diluir al 2-4% para uso general.',
  6, 'Bidón 20 litros', 'unidad', 75),

('a1000000-0000-0000-0000-000000000029', 'HI-002', 'Creolina al 50%',
  'Desinfectante fenólico para higiene de instalaciones, pediluvios y vehículos.',
  6, 'Bidón 5 litros', 'unidad', 90),

('a1000000-0000-0000-0000-000000000030', 'HI-003', 'Amonio Cuaternario 5ª generación',
  'Desinfectante de amplio espectro, activo frente a virus, bacterias y hongos. Sin olor.',
  6, 'Frasco 1 litro', 'unidad', 110)

ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- PRECIOS (para las 3 listas)
-- Lista 1: Minorista, Lista 2: Mayorista, Lista 3: Distribuidor
-- Precios en ARS con IVA incluido (valores ficticios para demo)
-- ============================================================
INSERT INTO public.precios (producto_id, lista_precio_id, precio) VALUES
-- SA-001 Ivermectina 1% 500ml
('a1000000-0000-0000-0000-000000000001', 1, 12500.00),
('a1000000-0000-0000-0000-000000000001', 2, 10200.00),
('a1000000-0000-0000-0000-000000000001', 3,  8900.00),
-- SA-002 Ivermectina 3.15% 1lt
('a1000000-0000-0000-0000-000000000002', 1, 28000.00),
('a1000000-0000-0000-0000-000000000002', 2, 23500.00),
('a1000000-0000-0000-0000-000000000002', 3, 20000.00),
-- SA-003 Closantel 500ml
('a1000000-0000-0000-0000-000000000003', 1, 15800.00),
('a1000000-0000-0000-0000-000000000003', 2, 13200.00),
('a1000000-0000-0000-0000-000000000003', 3, 11500.00),
-- SA-004 Vacuna Triple Bovina x25
('a1000000-0000-0000-0000-000000000004', 1, 45000.00),
('a1000000-0000-0000-0000-000000000004', 2, 38000.00),
('a1000000-0000-0000-0000-000000000004', 3, 33000.00),
-- SA-005 Vacuna Mancha x50
('a1000000-0000-0000-0000-000000000005', 1, 38000.00),
('a1000000-0000-0000-0000-000000000005', 2, 32000.00),
('a1000000-0000-0000-0000-000000000005', 3, 28000.00),
-- SA-006 Oxitetraciclina LA 100ml
('a1000000-0000-0000-0000-000000000006', 1, 18500.00),
('a1000000-0000-0000-0000-000000000006', 2, 15500.00),
('a1000000-0000-0000-0000-000000000006', 3, 13500.00),
-- SA-007 Levamisol 500ml
('a1000000-0000-0000-0000-000000000007', 1, 11200.00),
('a1000000-0000-0000-0000-000000000007', 2,  9400.00),
('a1000000-0000-0000-0000-000000000007', 3,  8200.00),
-- SA-008 Albendazol 1lt
('a1000000-0000-0000-0000-000000000008', 1, 14800.00),
('a1000000-0000-0000-0000-000000000008', 2, 12400.00),
('a1000000-0000-0000-0000-000000000008', 3, 10800.00),
-- SA-009 Vacuna Aftosa x50
('a1000000-0000-0000-0000-000000000009', 1, 52000.00),
('a1000000-0000-0000-0000-000000000009', 2, 44000.00),
('a1000000-0000-0000-0000-000000000009', 3, 38000.00),
-- SA-010 Cypermectrina 1lt
('a1000000-0000-0000-0000-000000000010', 1, 16500.00),
('a1000000-0000-0000-0000-000000000010', 2, 13800.00),
('a1000000-0000-0000-0000-000000000010', 3, 12000.00),
-- NU-001 Sal Mineral 25kg
('a1000000-0000-0000-0000-000000000011', 1, 8500.00),
('a1000000-0000-0000-0000-000000000011', 2, 7100.00),
('a1000000-0000-0000-0000-000000000011', 3, 6200.00),
-- NU-002 Sal Mineral Premium 25kg
('a1000000-0000-0000-0000-000000000012', 1, 12000.00),
('a1000000-0000-0000-0000-000000000012', 2, 10000.00),
('a1000000-0000-0000-0000-000000000012', 3,  8800.00),
-- NU-003 Vitamina ADE 100ml
('a1000000-0000-0000-0000-000000000013', 1,  9800.00),
('a1000000-0000-0000-0000-000000000013', 2,  8200.00),
('a1000000-0000-0000-0000-000000000013', 3,  7100.00),
-- NU-004 Urea 25kg
('a1000000-0000-0000-0000-000000000014', 1,  6500.00),
('a1000000-0000-0000-0000-000000000014', 2,  5500.00),
('a1000000-0000-0000-0000-000000000014', 3,  4800.00),
-- NU-005 Núcleo Ovinos 5kg
('a1000000-0000-0000-0000-000000000015', 1, 15000.00),
('a1000000-0000-0000-0000-000000000015', 2, 12500.00),
('a1000000-0000-0000-0000-000000000015', 3, 10800.00),
-- NU-006 Propilenglicol 20lt
('a1000000-0000-0000-0000-000000000016', 1, 32000.00),
('a1000000-0000-0000-0000-000000000016', 2, 27000.00),
('a1000000-0000-0000-0000-000000000016', 3, 23500.00),
-- FI-001 Glifosato 20lt
('a1000000-0000-0000-0000-000000000017', 1, 48000.00),
('a1000000-0000-0000-0000-000000000017', 2, 40000.00),
('a1000000-0000-0000-0000-000000000017', 3, 35000.00),
-- FI-002 Dicamba 1lt
('a1000000-0000-0000-0000-000000000018', 1, 28500.00),
('a1000000-0000-0000-0000-000000000018', 2, 24000.00),
('a1000000-0000-0000-0000-000000000018', 3, 20500.00),
-- FI-003 Clorpirifos 1lt
('a1000000-0000-0000-0000-000000000019', 1, 18000.00),
('a1000000-0000-0000-0000-000000000019', 2, 15200.00),
('a1000000-0000-0000-0000-000000000019', 3, 13200.00),
-- FI-004 Tebuconazol 1lt
('a1000000-0000-0000-0000-000000000020', 1, 35000.00),
('a1000000-0000-0000-0000-000000000020', 2, 29500.00),
('a1000000-0000-0000-0000-000000000020', 3, 25500.00),
-- FI-005 2,4-D Amina 20lt
('a1000000-0000-0000-0000-000000000021', 1, 42000.00),
('a1000000-0000-0000-0000-000000000021', 2, 35500.00),
('a1000000-0000-0000-0000-000000000021', 3, 31000.00),
-- SE-001 Alfalfa 25kg
('a1000000-0000-0000-0000-000000000022', 1, 85000.00),
('a1000000-0000-0000-0000-000000000022', 2, 72000.00),
('a1000000-0000-0000-0000-000000000022', 3, 63000.00),
-- SE-002 Lotus 5kg
('a1000000-0000-0000-0000-000000000023', 1, 45000.00),
('a1000000-0000-0000-0000-000000000023', 2, 38000.00),
('a1000000-0000-0000-0000-000000000023', 3, 33000.00),
-- SE-003 Festuca 25kg
('a1000000-0000-0000-0000-000000000024', 1, 68000.00),
('a1000000-0000-0000-0000-000000000024', 2, 57000.00),
('a1000000-0000-0000-0000-000000000024', 3, 50000.00),
-- EQ-001 Jeringa 10ml
('a1000000-0000-0000-0000-000000000025', 1,  4800.00),
('a1000000-0000-0000-0000-000000000025', 2,  4000.00),
('a1000000-0000-0000-0000-000000000025', 3,  3500.00),
-- EQ-002 Termómetro
('a1000000-0000-0000-0000-000000000026', 1,  8500.00),
('a1000000-0000-0000-0000-000000000026', 2,  7200.00),
('a1000000-0000-0000-0000-000000000026', 3,  6200.00),
-- EQ-003 Mameluco pack x10
('a1000000-0000-0000-0000-000000000027', 1, 15000.00),
('a1000000-0000-0000-0000-000000000027', 2, 12500.00),
('a1000000-0000-0000-0000-000000000027', 3, 10800.00),
-- HI-001 Formol 20lt
('a1000000-0000-0000-0000-000000000028', 1, 25000.00),
('a1000000-0000-0000-0000-000000000028', 2, 21000.00),
('a1000000-0000-0000-0000-000000000028', 3, 18500.00),
-- HI-002 Creolina 5lt
('a1000000-0000-0000-0000-000000000029', 1, 12800.00),
('a1000000-0000-0000-0000-000000000029', 2, 10700.00),
('a1000000-0000-0000-0000-000000000029', 3,  9300.00),
-- HI-003 Amonio Cuaternario 1lt
('a1000000-0000-0000-0000-000000000030', 1,  9500.00),
('a1000000-0000-0000-0000-000000000030', 2,  8000.00),
('a1000000-0000-0000-0000-000000000030', 3,  6900.00)
ON CONFLICT (producto_id, lista_precio_id) DO NOTHING;

-- ============================================================
-- VENDEDORES Y CLIENTES DE PRUEBA
-- IMPORTANTE: Primero crear los usuarios en Supabase Auth,
-- luego insertar los vendedores con el UUID que genera Supabase.
--
-- Pasos:
-- 1. Ir a Authentication → Users → Add user
-- 2. Crear: vendedor1@agrovet.demo / AgroVet2025!
-- 3. Copiar el UUID generado
-- 4. Reemplazar 'REEMPLAZAR-CON-UUID-DEL-AUTH' con ese UUID
-- 5. Ejecutar los inserts de vendedores y clientes
-- ============================================================

-- Ejemplo (descomenta y reemplaza el UUID después de crear el usuario en Auth):
/*
INSERT INTO public.vendedores (id, nombre, apellido, telefono, limite_descuento) VALUES
  ('REEMPLAZAR-CON-UUID-DEL-AUTH', 'Juan', 'Pérez', '2264123456', 15.00);

INSERT INTO public.clientes (id, vendedor_id, razon_social, nombre_fantasia, cuit, condicion_iva, lista_precio_id, telefono, localidad, provincia, estado) VALUES
  (uuid_generate_v4(), 'REEMPLAZAR-CON-UUID-DEL-AUTH', 'El Rancho SA', 'El Rancho', '30123456789', 'ri', 2, '2266987654', 'Tandil', 'Buenos Aires', 'activo'),
  (uuid_generate_v4(), 'REEMPLAZAR-CON-UUID-DEL-AUTH', 'Veterinaria Don Quijote', NULL, '20298765432', 'ri', 3, '2264111222', 'Azul', 'Buenos Aires', 'activo'),
  (uuid_generate_v4(), 'REEMPLAZAR-CON-UUID-DEL-AUTH', 'García Juan Alberto', 'Juanchi García', '20154321876', 'mono', 1, '2265333444', 'Rauch', 'Buenos Aires', 'activo'),
  (uuid_generate_v4(), 'REEMPLAZAR-CON-UUID-DEL-AUTH', 'Establecimiento Los Álamos', NULL, '30987654321', 'ri', 2, '2266555666', 'Olavarría', 'Buenos Aires', 'activo'),
  (uuid_generate_v4(), 'REEMPLAZAR-CON-UUID-DEL-AUTH', 'Distribuidora Agro Sur SRL', NULL, '30456789012', 'ri', 3, '2267777888', 'Bahía Blanca', 'Buenos Aires', 'activo');
*/
