# JobQuest - Job Application Tracker

> **Visual dashboard to track your job search journey. Monitor applications, interviews, offers, and rejections in one place.**

---

## Features

- 📊 **Interactive Dashboard** - Visualize your job search progress with charts
- 📋 **Kanban Board** - Drag & drop applications through stages
- 📈 **Statistics** - Track application metrics and salary insights
- 🔐 **Authentication** - Secure JWT-based user accounts
- 🌓 **Dark/Light Mode** - Adaptive theme based on preference
- 🌍 **Multi-language** - English and Spanish support
- 📤 **Export Data** - CSV export localized by language with date field
- 📅 **Application Date** - Track when you applied to each job
- 📊 **Area Breakdown** - Normalized percentage distribution (always 100%)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Angular 21, TypeScript, RxJS, Lucide Icons |
| **Backend** | Node.js, Express, JWT Authentication |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **Deployment** | Vercel (frontend + serverless API) |
| **ORM/DB** | pg (PostgreSQL), sqlite3 (dev) |

---

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start both frontend and backend (concurrently)
npm start
```

The frontend will run on http://localhost:4200 and backend on http://localhost:3000. The Angular dev server proxies `/api` requests to the backend automatically.

### Manual Separate Start

```bash
# Terminal 1 - Backend
node api/index.js

# Terminal 2 - Frontend
npx ng serve
```

---

## Project Structure

```
job-quest/
├── src/                    # Angular frontend
│   ├── app/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── services/       # Business logic
│   │   └── models/         # TypeScript interfaces
│   └── environments/       # Config files
├── api/                    # Node.js API (serverless)
│   └── index.js           # Express server entry
├── backend/               # SQLite dev database
│   └── jobquest.db
├── vercel.json           # Vercel deployment config
├── angular.json          # Angular build config
├── proxy.conf.json       # Dev proxy config
└── package.json          # Root dependencies
```

---

## Environment Variables

### Development (.env)
```bash
NODE_ENV=development
JWT_SECRET=your-dev-secret-min-32-chars
CORS_ORIGIN=http://localhost:4200
# DATABASE_URL is optional - defaults to SQLite
```

### Production (Vercel)
Set these in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | **Required**. Strong random secret (min 32 chars) |
| `DATABASE_URL` | PostgreSQL connection string (Supabase, Neon, etc.) |
| `CORS_ORIGIN` | Your Vercel frontend URL (auto-set if using Vercel integration) |
| `NODE_ENV` | Set to `production` by Vercel automatically |

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Database Setup

### Option 1: Supabase (Recommended - Free)

1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → Connection String
3. Copy the "Pooled connection" URL
4. Add to Vercel as `DATABASE_URL`
5. The app will auto-create tables on first request

### Option 2: Local PostgreSQL

```bash
# Install PostgreSQL (https://www.postgresql.org/download/)
createdb jobquest
export DATABASE_URL=postgresql://postgres:password@localhost:5432/jobquest
```

### Option 3: SQLite (Development Only)

No setup needed - the app uses `backend/jobquest.db` by default when `DATABASE_URL` is not set.

---

## Deployment

### Vercel (Recommended)

One-command deploy with GitHub integration:

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) → New Project
3. Import your GitHub repository
4. Add environment variables (JWT_SECRET, DATABASE_URL)
5. Click Deploy

**Build Settings** (auto-detected from `vercel.json`):
- **Build Command**: `npm run build:prod`
- **Output Directory**: `dist/job-quest`
- **Node.js Version**: `>=18.x` (from package.json engines)

Your API routes (`/api/*`) are serverless functions automatically.

### Manual Deployment

```bash
# Build frontend
npm run build:prod

# Deploy dist/job-quest/ to any static host (Netlify, GitHub Pages, etc.)
# Deploy api/index.js as a Node.js server or serverless function
```

---

## API Endpoints

All endpoints under `/api/` are proxied in development and serverless in production.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| GET | `/api/applications` | List all user applications | Yes |
| POST | `/api/applications` | Create new application | Yes |
| PUT | `/api/applications/:id` | Update application | Yes |
| DELETE | `/api/applications/:id` | Delete application | Yes |

---

## Features in Detail

### Dashboard
- Total applications counter
- Status breakdown (applied, interview, offer, rejected, wishlist)
- Area breakdown with normalized percentages (sums to 100%)
- Salary distribution box plot
- Recent activity

### Kanban Board
- Drag and drop to change status
- Visual column layout
- Quick edit and delete actions

### Application Form
- Required fields: company, position, status, date applied
- Optional: salary, link, notes, areas (multi-select)
- Edit existing or create new
- Date picker for application date

### Export CSV
- Localized headers based on current language
- Areas translated to selected language
- Date formatted according to locale
- Filename includes export date

### Multi-language
- Switch between English / Spanish
- All UI text translated
- CSV export respects language selection
- Language preference saved to localStorage

---

## Changelog

### [1.2.0] - Multi-language CSV Export & Date Field

#### Added
- 📅 **Date field** for applications (track when you applied)
- 🌍 **Localized CSV export** (headers, areas, dates in selected language)
- 📊 **Normalized area breakdown** (percentages always sum to 100%)
- 🎨 **Mobile UI fixes** (theme/language buttons now work on mobile)
- 🔧 **Vercel deployment configuration** (vercel.json, PostgreSQL support)

#### Fixed
- ✅ SQLite promise wrappers for async operations
- ✅ Password storage validation in login flow
- ✅ Mobile overlay blocking header buttons
- ✅ Area percentage calculation (no more >100%)

---

### [1.1.0] - PostgreSQL & Vercel Ready

- ✅ PostgreSQL support for production (Supabase compatible)
- ✅ Serverless API configuration for Vercel
- ✅ Environment variable validation
- ✅ Database schema auto-creation
- ✅ Improved error logging

---

### [1.0.0] - Initial Release

#### Added
- User authentication with JWT
- Dashboard with statistics and charts
- Kanban board for application tracking
- CRUD operations for job applications
- Dark/Light theme toggle
- English and Spanish translations
- CSV export functionality
- Responsive design for mobile and desktop
- SQLite database for development

---

# JobQuest - Seguimiento de Postulaciones Laborales

> **Tablero visual para seguir tu búsqueda laboral. Monitorea postulaciones, entrevistas, ofertas y rechazos en un solo lugar.**

---

## Características

- 📊 **Tablero Interactivo** - Visualiza tu progreso en la búsqueda con gráficos
- 📋 **Tablero Kanban** - Arrastra y suelta postulaciones entre etapas
- 📈 **Estadísticas** - Métricas y análisis salariales
- 🔐 **Autenticación** - Cuentas seguras con JWT
- 🌓 **Modo Oscuro/Claro** - Tema adaptativo
- 🌍 **Multi-idioma** - Soporte en inglés y español
- 📤 **Exportar Datos** - CSV localizado con idioma y fecha
- 📅 **Fecha de Postulación** - Registra cuándo aplicaste a cada trabajo
- 📊 **Distribución por Área** - Porcentajes normalizados (siempre 100%)

---

## Pila Tecnológica

| Capa | Tecnología |
|------|------------|
| **Frontend** | Angular 21, TypeScript, RxJS, Lucide Icons |
| **Backend** | Node.js, Express, Autenticación JWT |
| **Base de Datos** | SQLite (dev) / PostgreSQL (prod) |
| **Despliegue** | Vercel (frontend + API serverless) |
| **Base de Datos** | pg (PostgreSQL), sqlite3 (dev) |

---

## Inicio Rápido

### Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar frontend y backend (simultáneo)
npm start
```

El frontend correrá en http://localhost:4200 y el backend en http://localhost:3000. El servidor de desarrollo de Angular proxea automáticamente las peticiones `/api` al backend.

### Inicio Manual Separado

```bash
# Terminal 1 - Backend
node api/index.js

# Terminal 2 - Frontend
npx ng serve
```

---

## Estructura del Proyecto

```
job-quest/
├── src/                    # Frontend en Angular
│   ├── app/
│   │   ├── components/     # Componentes de UI
│   │   ├── pages/          # Páginas de rutas
│   │   ├── services/       # Lógica de negocio
│   │   └── models/         # Interfaces de TypeScript
│   └── environments/       # Archivos de configuración
├── api/                    # API en Node.js (serverless)
│   └── index.js           # Entrada del servidor Express
├── backend/               # Base de datos SQLite para desarrollo
│   └── jobquest.db
├── vercel.json           # Configuración de despliegue
├── angular.json          # Configuración de Angular
├── proxy.conf.json       # Configuración de proxy para desarrollo
└── package.json          # Dependencias raíz
```

---

## Variables de Entorno

### Desarrollo (.env)
```bash
NODE_ENV=development
JWT_SECRET=tu-secreto-desarrollo-min-32-caracteres
CORS_ORIGIN=http://localhost:4200
# DATABASE_URL es opcional - por defecto usa SQLite
```

### Producción (Vercel)
Configura estas variables en la configuración de tu proyecto Vercel:

| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | **Requerido**. Secreto aleatorio fuerte (mín 32 caracteres) |
| `DATABASE_URL` | Cadena de conexión PostgreSQL (Supabase, Neon, etc.) |
| `CORS_ORIGIN` | URL de tu frontend en Vercel (se autoconfigura con integración Vercel) |
| `NODE_ENV` | Vercel lo establece automáticamente a `production` |

Genera un secreto JWT seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Configuración de Base de Datos

### Opción 1: Supabase (Recomendado - Gratis)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a Settings → Database → Connection String
3. Copia la URL "Pooled connection"
4. Agrega a Vercel como `DATABASE_URL`
5. La app creará las tablas automáticamente en la primera solicitud

### Opción 2: PostgreSQL Local

```bash
# Instala PostgreSQL (https://www.postgresql.org/download/)
createdb jobquest
export DATABASE_URL=postgresql://postgres:password@localhost:5432/jobquest
```

### Opción 3: SQLite (Solo Desarrollo)

No necesita configuración - la app usa `backend/jobquest.db` por defecto cuando `DATABASE_URL` no está configurado.

---

## Despliegue

### Vercel (Recomendado)

Despliegue con un clic usando integración de GitHub:

1. Sube tu código a GitHub
2. Ve a [Vercel](https://vercel.com) → New Project
3. Importa tu repositorio de GitHub
4. Agrega las variables de entorno (JWT_SECRET, DATABASE_URL)
5. Haz clic en Deploy

**Configuración de Build** (auto-detectada desde `vercel.json`):
- **Comando de Build**: `npm run build:prod`
- **Directorio de Salida**: `dist/job-quest`
- **Versión de Node.js**: `>=18.x` (desde package.json engines)

Tus rutas de API (`/api/*`) son funciones serverless automáticamente.

### Despliegue Manual

```bash
# Build del frontend
npm run build:prod

# Sube dist/job-quest/ a cualquier host estático (Netlify, GitHub Pages, etc.)
# Despliega api/index.js como servidor Node.js o función serverless
```

---

## Endpoints de la API

Todos los endpoints bajo `/api/` se proxean en desarrollo y son serverless en producción.

| Método | Endpoint | Descripción | Auth Requerida |
|--------|----------|-------------|----------------|
| POST | `/api/auth/register` | Registrar nuevo usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| GET | `/api/auth/me` | Obtener perfil del usuario actual | Sí |
| GET | `/api/applications` | Listar todas las postulaciones del usuario | Sí |
| POST | `/api/applications` | Crear nueva postulación | Sí |
| PUT | `/api/applications/:id` | Actualizar postulación | Sí |
| DELETE | `/api/applications/:id` | Eliminar postulación | Sí |

---

## Características Detalladas

### Dashboard
- Contador total de postulaciones
- Desglose por estado (applied, interview, offer, rejected, wishlist)
- Desglose por áreas con porcentajes normalizados (suma 100%)
- Gráfico de Distribución de Salarios (box plot)
- Actividad reciente

### Tablero Kanban
- Arrastrar y soltar para cambiar estado
- Diseño visual en columnas
- Acciones de edición y eliminación rápidas

### Formulario de Postulación
- Campos requeridos: empresa, puesto, estado, fecha de postulación
- Opcionales: salario, enlace, notas, áreas (multi-select)
- Editar existente o crear nuevo
- Selector de fecha para fecha de postulación

### Exportar CSV
- Headers localizados según idioma actual
- Áreas traducidas al idioma seleccionado
- Fecha formateada según locale
- Nombre de archivo incluye fecha de exportación

### Multi-idioma
- Cambiar entre Inglés / Español
- Todo el texto de la UI traducido
- Exportación CSV respeta el idioma seleccionado
- Preferencia de idioma guardada en localStorage

---

## Historial de Versiones

### [1.2.0] - CSV Localizado & Campo Fecha

#### Agregado
- 📅 **Campo fecha** para postulaciones (registra cuándo aplicaste)
- 🌍 **CSV localizado** (headers, áreas, fechas en idioma seleccionado)
- 📊 **Desglose de áreas normalizado** (porcentajes siempre suman 100%)
- 🎨 **Correcciones UI móvil** (botones de tema/idioma funcionan en móvil)
- 🔧 **Configuración de despliegue en Vercel** (vercel.json, soporte PostgreSQL)

#### Corregido
- ✅ Wrappers de promesas para SQLite en operaciones async
- ✅ Validación de almacenamiento de contraseña en flujo de login
- ✅ Overlay móvil bloqueaba botones del header
- ✅ Cálculo de porcentajes de área (no más >100%)

---

### [1.1.0] - PostgreSQL & Vercel Ready

- ✅ Soporte PostgreSQL para producción (compatible con Supabase)
- ✅ Configuración de API serverless para Vercel
- ✅ Validación de variables de entorno
- ✅ Auto-creación de schema de base de datos
- ✅ Mejora en logs de error

---

### [1.0.0] - Versión Inicial

#### Agregado
- Autenticación de usuarios con JWT
- Dashboard con estadísticas y gráficos
- Tablero Kanban para seguimiento de postulaciones
- Operaciones CRUD para postulaciones laborales
- Tema claro/oscuro
- Traducciones inglés/español
- Funcionalidad de exportación CSV
- Diseño responsivo para móvil y escritorio
- Base de datos SQLite para desarrollo

---

## Notas de Desarrollo

### Consideraciones Serverless
- La API está diseñada para funciones serverless de Vercel
- Las conexiones a base de datos están agrupadas (PostgreSQL)
- En desarrollo se usa base de datos SQLite basada en archivo
- Recuerda configurar `DATABASE_URL` en producción para persistencia

### Angular Signals
Este proyecto usa la nueva API **signals** de Angular para gestión de estado:
- `signal()` para estado reactivo
- `computed()` para valores derivados
- `effect()` para efectos secundarios (sincronización con localStorage)

### Configuración de Proxy
Durante el desarrollo, `proxy.conf.json` redirige peticiones `/api/*` a `localhost:3000`. Esto está configurado en las opciones de `serve` de `angular.json`.

---

## Licencia

MIT License - Desarrollado por Miguel Rodríguez © 2026

---

## Soporte

Para incidencias o solicitudes de funcionalidades, por favor abre un issue en GitHub.
