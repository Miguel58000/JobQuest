# JobQuest - Job Application Tracker

> **Visual dashboard to track your job search journey. Monitor applications, interviews, offers, and rejections in one place.**

---

## Features

- 📊 **Interactive Dashboard** - Visualize your job search progress with charts
- 📋 **Kanban Board** - Drag & drop applications through stages
- 📈 **Statistics** - Track application metrics and salary insights
- 🔐 **Authentication** - Firebase Auth secure user accounts
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
| **Backend** | Firebase Auth + Firestore (NoSQL) |
| **Database** | Cloud Firestore |
| **Deployment** | Vercel (static frontend) |

---

## Firebase Configuration

### Setup Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Firestore Database → Rules
3. Replace the rules with the content of `firestore.rules` in this repo
4. Publish

The rules ensure:
- Users can only read/write their own `/users/{userId}` document
- Users can only read/write their own `/applications/{appId}` documents
- All other reads/writes are denied

### Environment Variables

Firebase credentials are stored in:
- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

⚠️ **Security Note**: For production, consider using [Firebase App Check](https://firebase.google.com/docs/app-check) to protect your Firestore from abuse. You can also move credentials to environment variables in Vercel if needed.

---

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start frontend
npm start
```

The frontend will run on http://localhost:4200 and connect directly to Firebase.

---

## Project Structure

```
job-quest/
├── src/                    # Angular frontend
│   ├── app/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── services/       # Business logic (Firebase)
│   │   └── models/         # TypeScript interfaces
│   └── environments/       # Config files (Firebase credentials)
├── firestore.rules         # Firestore security rules
├── vercel.json           # Vercel deployment config
├── angular.json          # Angular build config
└── package.json          # Root dependencies
```

---

## Deployment

### Vercel (Recommended)

One-command deploy:

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) → New Project
3. Import your GitHub repository
4. **No environment variables needed** (Firebase config in code)
5. Click Deploy

**Build Settings** (auto-detected from `vercel.json`):
- **Build Command**: `npm run build:prod`
- **Output Directory**: `dist/job-quest`
- **Node.js Version**: `>=18.x` (from package.json engines)

Your app is a static SPA that connects directly to Firebase.

### Manual Deployment

```bash
# Build frontend
npm run build:prod

# Deploy dist/job-quest/ to any static host (Netlify, GitHub Pages, etc.)
```

---

## Firebase Collections Structure

The app uses two main collections:

| Collection | Document ID | Fields |
|------------|-------------|--------|
| `users` | Firebase UID | `email` (string), `name` (string, optional), `createdAt` (timestamp) |
| `applications` | Auto-generated | `userId` (string), `company` (string), `position` (string), `status` (enum), `areas` (array), `dateApplied` (date), `salary` (string, optional), `notes` (string, optional), `link` (string, optional), `createdAt` (timestamp) |

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

## Version History

### [1.3.0] - Firebase Migration (2026-05-10)

#### Changed
- 🔄 **Migrated from custom Node.js backend to Firebase Auth + Firestore**
- 🔄 **Removed Express API** (`api/` folder, `backend/` folder, proxy config)
- 🔄 **Authentication**: JWT → Firebase Authentication
- 🔄 **Database**: SQLite/PostgreSQL → Cloud Firestore
- 🔄 **Deployment**: Backend + Frontend → Static frontend only (Vercel)

#### Added
- 📄 **Firestore Security Rules** (`firestore.rules`) for data isolation
- 🔄 **Updated dependencies** to Firebase v11
- 📝 **Firebase configuration** moved to environment files

#### Removed
- ❌ Node.js backend (`api/index.js`)
- ❌ SQLite database files
- ❌ Proxy configuration (`proxy.conf.json`)
- ❌ HTTP client and auth interceptor (no longer needed)

---

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

## Development Notes

### Firebase Architecture
- All data operations go directly from frontend to Firestore
- Security rules enforce user isolation (each user sees only their data)
- No backend server needed - reduces deployment complexity
- Firebase Auth handles session management automatically

### Angular Signals
This project uses the new **signals** API from Angular for state management:
- `signal()` for reactive state
- `computed()` for derived values
- `effect()` for side effects (sync with localStorage)

---

## License

MIT License - Desarrollado por Miguel Rodríguez © 2026

---

## Support

For issues or feature requests, please open an issue on GitHub.
