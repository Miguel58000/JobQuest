# JobQuest - Job Application Tracker

[🇺🇸 English](#english) | [🇪🇸 Español](#español)

---

<a name="english"></a>
## 🇺🇸 English

> **Visual dashboard to track your job search journey. Monitor applications, interviews, offers, and rejections in one place.**

### Features
- 📊 **Interactive Dashboard** - Visualize your job search progress with charts
- 📋 **Kanban Board** - Drag & drop applications through stages
- 🔐 **Serverless Authentication** - Firebase Auth secure user accounts
- 🌓 **Dark/Light Mode** - Adaptive theme based on preference
- 🌍 **Multi-language** - English and Spanish support
- 📤 **Export Data** - CSV export localized by language

### Tech Stack
| Layer | Technology |
|-------|------------|
| **Frontend** | Angular 21, TypeScript, RxJS, Lucide Icons |
| **Backend & DB** | Firebase Auth + Cloud Firestore (NoSQL) |
| **Deployment** | Vercel (static frontend) |

### Deployment (Vercel)
Your app is a fully static SPA that connects directly to Firebase.
1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) → New Project → Import your repository
3. **No environment variables needed**
4. Check that Output Directory is `dist/job-quest/browser`
5. Deploy!

### Version History
- **[1.4.0] (2026-05-10)** - Added Smart Loading Screen for Firebase Auth state transitions, improved UX and fixed route race conditions.
- **[1.3.0] (2026-05-10)** - Complete Serverless migration. Replaced Node.js backend with Firebase Auth + Firestore.
- **[1.2.0]** - Multi-language CSV Export & Date Field.
- **[1.0.0]** - Initial Release.

---

<a name="español"></a>
## 🇪🇸 Español

> **Panel visual para gestionar tu búsqueda de empleo. Monitorea postulaciones, entrevistas, ofertas y rechazos en un solo lugar.**

### Funcionalidades
- 📊 **Panel Interactivo** - Visualiza el progreso de tu búsqueda de trabajo con gráficos
- 📋 **Tablero Kanban** - Arrastra y suelta postulaciones por distintas etapas
- 🔐 **Autenticación Serverless** - Cuentas de usuario seguras con Firebase Auth
- 🌓 **Modo Oscuro/Claro** - Tema adaptable según tu preferencia
- 🌍 **Multi-idioma** - Soporte nativo para Inglés y Español
- 📤 **Exportar Datos** - Exportación a CSV traducida según el idioma seleccionado

### Tecnologías
| Capa | Tecnología |
|-------|------------|
| **Frontend** | Angular 21, TypeScript, RxJS, Lucide Icons |
| **Backend y BD** | Firebase Auth + Cloud Firestore (NoSQL) |
| **Despliegue** | Vercel (frontend estático) |

### Despliegue (Vercel)
Tu aplicación es una SPA estática que se conecta directamente a Firebase.
1. Sube tu código a GitHub
2. Ve a [Vercel](https://vercel.com) → New Project → Importa tu repositorio
3. **No se necesitan variables de entorno** en el panel de Vercel.
4. Verifica que el Output Directory sea `dist/job-quest/browser`
5. ¡Desplegar!

### Historial de Versiones
- **[1.4.0] (2026-05-10)** - Pantalla de carga inteligente para transiciones de Firebase Auth, UX mejorada y corrección de bloqueos de rutas.
- **[1.3.0] (2026-05-10)** - Migración completa a Serverless. Se reemplazó el backend en Node.js por Firebase Auth + Firestore.
- **[1.2.0]** - Exportación CSV Multi-idioma y campo de Fecha.
- **[1.0.0]** - Lanzamiento Inicial.
