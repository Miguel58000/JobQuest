# JobQuest - Job Application Tracker

> **Visual dashboard to track your job search journey. Monitor applications, interviews, offers, and rejections in one place.**

## Features | Características

- 📊 **Interactive Dashboard** - Visualize your job search progress
- 📋 **Kanban Board** - Drag & drop applications through stages
- 📈 **Statistics** - Track application metrics and salary insights
- 🔐 **Authentication** - Secure JWT-based user accounts
- 🌓 **Dark/Light Mode** - Adaptive theme based on preference
- 🌍 **Multi-language** - English and Spanish support
- 📤 **Export Data** - CSV export for your records

---

## Tech Stack | Tecnologías

| Frontend | Backend |
|----------|---------|
| Angular 21 | Node.js |
| TypeScript | Express |
| RxJS | SQLite (dev) / PostgreSQL (prod) |
| Lucide Icons | JWT Auth |

---

## Quick Start | Inicio Rápido

### Development | Desarrollo

```bash
# Install dependencies
npm install

# Start frontend (Angular dev server on :4200)
npm start

# Start backend (Node.js on :3000)
cd backend && npm run dev
```

### Production Build | Build de Producción

```bash
# Frontend
npm run build:prod
```

---

## Project Structure | Estructura del Proyecto

```
job-quest/
├── src/                    # Angular frontend
│   ├── app/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── services/       # Business logic
│   │   └── models/         # TypeScript interfaces
│   └── environments/       # Config files
├── backend/                # Node.js API
│   ├── server.js          # Express server
│   └── package.json
└── vercel.json            # Deployment config
```

---

## Environment Variables | Variables de Entorno

### Backend (.env)
```bash
PORT=3000
JWT_SECRET=your-secure-key-min-32-chars
DATABASE_URL=postgresql://user:pass@host:5432/db  # Optional: PostgreSQL URL
```

---

## Deployment | Despliegue

### Vercel (Recommended) | Vercel (Recomendado)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variable `JWT_SECRET`
4. (Optional) Add `DATABASE_URL` for PostgreSQL persistence

### Manual Deployment | Despliegue Manual

```bash
npm run build:prod
# Upload dist/job-quest/ to your static host
```

---

## API Endpoints | Endpoints de la API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/applications` | List all applications |
| POST | `/api/applications` | Create application |
| PUT | `/api/applications/:id` | Update application |
| DELETE | `/api/applications/:id` | Delete application |

---

# Changelog | Historial de Versiones

## [1.0.0] - Initial Release | Versión Inicial

### Added | Agregado
- User authentication with JWT
- Dashboard with statistics and charts
- Kanban board for application tracking
- CRUD operations for job applications
- Dark/Light theme toggle
- English and Spanish translations
- CSV export functionality
- Responsive design for mobile and desktop
- PostgreSQL support for data persistence

---

## JobQuest - Seguimiento de Postulaciones Laborales

> **Tablero visual para seguir tu búsqueda laboral. Monitorea postulaciones, entrevistas, ofertas y rechazos en un solo lugar.**

## Características

- 📊 **Tablero Interactivo** - Visualiza tu progreso en la búsqueda
- 📋 **Tablero Kanban** - Arrastra y suelta postulaciones entre etapas
- 📈 **Estadísticas** - Métricas y análisis salariales
- 🔐 **Autenticación** - Cuentas seguras con JWT
- 🌓 **Modo Oscuro/Claro** - Tema adaptativo
- 🌍 **Multi-idioma** - Soporte en inglés y español
- 📤 **Exportar Datos** - Exporta a CSV

---

## Guía Rápida

### Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar frontend
npm start

# Iniciar backend
cd backend && npm run dev
```

### Build de Producción

```bash
npm run build:prod
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
├── backend/                # API en Node.js
│   ├── server.js           # Servidor Express
│   └── package.json
└── vercel.json             # Configuración de despliegue
```

---

## Despliegue

### Vercel (Recomendado)

1. Subir a GitHub
2. Importar en [Vercel](https://vercel.com)
3. Agregar variable `JWT_SECRET`
4. (Opcional) Agregar `DATABASE_URL` para PostgreSQL

---

## Historial de Versiones

## [1.0.0] - Versión Inicial

### Agregado
- Autenticación con JWT
- Tablero con estadísticas
- Tablero Kanban para seguimiento
- Operaciones CRUD para postulaciones
- Tema claro/oscuro
- Traducciones EN/ES
- Exportación CSV
- Diseño responsivo
- Soporte PostgreSQL para persistencia