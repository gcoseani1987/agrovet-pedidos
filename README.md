# AgroVet Pedidos

PWA para vendedores viajantes de empresas agroveterinarias. Permite cargar pedidos y consultar el catálogo desde el campo, con soporte offline completo.

---

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Offline:** Dexie.js (IndexedDB)
- **Estado:** Zustand
- **PWA:** vite-plugin-pwa (Workbox)

---

## Estado: MVP completo ✅

- [x] Fase 0: Scaffold, SQL (schema + RLS + seed 30 productos)
- [x] Fase 1: Auth, catálogo con precios, ficha de producto
- [x] Fase 2: Clientes, nuevo cliente, carga de pedidos (3 pasos), detalle de pedido + WhatsApp
- [x] Fase 3: Sync offline robusto, detección de conflictos de precio, sync periódico
- [x] Fase 4: PWA instalable, SW update, skeletons, pull-to-refresh, filtros de pedidos

---

## Setup desde cero

### 1. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project
2. Elegir nombre (ej: `agrovet-pedidos`), contraseña de DB segura, región `South America (São Paulo)`
3. Esperar que el proyecto se inicialice (~2 minutos)

### 2. Configurar Storage

1. En el dashboard → **Storage** → **New bucket**
2. Nombre: `productos`
3. Marcar como **Public** (las imágenes necesitan ser accesibles sin auth para funcionar offline)
4. Crear el bucket

### 3. Correr los scripts SQL

En el dashboard → **SQL Editor** → **New query**, correr en orden:

**Script 1:** `supabase/migrations/00_schema.sql`
- Crea todas las tablas, índices y triggers
- Activa RLS en todas las tablas

**Script 2:** `supabase/migrations/01_rls.sql`
- Crea todas las políticas de Row Level Security

**Script 3:** `supabase/migrations/02_seed.sql`
- Carga 6 categorías, 30 productos y 3 listas de precios

### 4. Crear el primer vendedor

1. En el dashboard → **Authentication** → **Users** → **Add user**
2. Email: `vendedor1@agrovet.demo`
3. Password: `AgroVet2025!`
4. Copiar el UUID del usuario creado

5. En **SQL Editor**, correr (reemplazando el UUID):

```sql
INSERT INTO public.vendedores (id, nombre, apellido, telefono, limite_descuento)
VALUES ('EL-UUID-QUE-COPIASTE', 'Juan', 'Pérez', '2264123456', 15.00);

-- Después agregar algunos clientes de prueba (ver 02_seed.sql al final)
```

### 5. Variables de entorno

```bash
cp .env.example .env.local
```

Completar `.env.local` con los valores de **Settings → API** en el dashboard de Supabase:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. Generar los íconos de la PWA

1. Abrí `scripts/generate-icons.html` en tu navegador (doble clic)
2. Hacé clic en **"Generar y descargar íconos"**
3. Mové los 3 archivos descargados (`pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`) a la carpeta `/public`

### 7. Instalar dependencias y correr en local

```bash
npm install
npm run dev
```

Abrir http://localhost:5173

Para probar en el celular desde la misma red:
```bash
npm run dev -- --host
```
Escaneá el QR o entrá con la IP que muestra (ej: http://192.168.1.100:5173)

---

## Deploy a producción

### Vercel (recomendado)

```bash
npm install -g vercel
vercel
```

O conectar el repo de GitHub desde el dashboard de Vercel.

Variables de entorno a configurar en Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Netlify

```bash
npm run build
# Subir la carpeta dist/ a Netlify
# o conectar repo de GitHub
```

Configurar en Build Settings:
- Build command: `npm run build`
- Publish directory: `dist`

Agregar las mismas variables de entorno en el dashboard de Netlify.

### Instalar como PWA

En Chrome/Edge Android:
1. Abrir la URL de producción
2. Menú (⋮) → **Agregar a pantalla de inicio**

En Safari iOS:
1. Abrir la URL
2. Compartir (□↑) → **Agregar a pantalla de inicio**

---

## Estructura de carpetas

```
src/
├── components/
│   ├── ui/          # Button, Input, Badge (componentes base)
│   ├── layout/      # AppShell, BottomNav
│   └── sync/        # SyncStatusBar
├── hooks/           # useNetworkStatus
├── lib/
│   ├── supabase.ts  # Cliente Supabase
│   ├── db.ts        # Dexie (IndexedDB)
│   └── sync.ts      # Lógica de sincronización
├── pages/           # Login, Dashboard, Catalog, Clients, Orders
├── store/           # authStore, syncStore, cartStore
├── types/           # database.ts (tipos de todas las tablas)
└── utils/           # formatters, whatsapp, validators

supabase/
└── migrations/
    ├── 00_schema.sql  # Tablas, índices, triggers
    ├── 01_rls.sql     # Políticas de Row Level Security
    └── 02_seed.sql    # Datos de prueba
```

---

## Modelo de datos

```
auth.users ──── vendedores
                    │
                    ├── clientes ──────── listas_precios ── precios
                    │                                           │
                    └── pedidos ─── pedido_items ──── productos
                                                           │
                                                       categorias
```

**Decisiones de diseño:**
- `pedidos.id` es UUID generado en el cliente para soporte offline sin colisiones
- `pedido_items.precio_unitario` es un snapshot congelado al momento del pedido
- Los clientes nuevos creados desde el celular quedan en `estado = 'pendiente_aprobacion'`
- La sincronización offline usa `upsert` para ser idempotente (re-sincronizar no genera duplicados)

---

## Seguridad (RLS)

Cada vendedor solo puede ver y modificar **sus propios datos**:

| Recurso | Acceso |
|---|---|
| Catálogo (productos, categorías, precios) | Lectura para cualquier usuario autenticado |
| Clientes | Solo los asignados al vendedor autenticado |
| Pedidos | Solo los del vendedor autenticado |
| Pedidos procesados | Solo lectura (no modificables) |

Las modificaciones del catálogo y la aprobación de clientes se hacen desde el dashboard de Supabase.
