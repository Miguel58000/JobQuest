# JobQuest Backend API

Backend API for JobQuest application built with Node.js, Express, and SQLite.

## Features

- User authentication with JWT
- Password hashing with bcrypt
- SQLite database
- RESTful API endpoints
- CORS enabled

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example` if exists):
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt-token"
}
```

#### POST /api/auth/login
Login user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt-token"
}
```

#### GET /api/auth/me
Get current user info (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

### Applications

#### GET /api/applications
Get all applications for authenticated user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

#### POST /api/applications
Create new application.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "company": "Google",
  "position": "Software Engineer",
  "status": "applied",
  "areas": ["Frontend", "JavaScript"],
  "salary": "$120k",
  "link": "https://careers.google.com/job/123",
  "notes": "Excited about this opportunity",
  "dateApplied": "2024-01-15"
}
```

#### PUT /api/applications/:id
Update application.

#### DELETE /api/applications/:id
Delete application.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Applications Table
```sql
CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  status TEXT NOT NULL,
  areas TEXT, -- JSON array
  salary TEXT,
  link TEXT,
  notes TEXT,
  date_applied DATE DEFAULT CURRENT_DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## Security

- Passwords are hashed using bcrypt
- JWT tokens expire in 7 days
- All application endpoints require authentication
- SQLite database is used for development (consider PostgreSQL for production)

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Database

The SQLite database file `jobquest.db` will be created automatically when the server starts. For production, consider migrating to a more robust database like PostgreSQL.

## Deployment

### Vercel/Netlify

For deploying the frontend, update the API URL in `src/environments/environment.prod.ts` to point to your deployed backend.

### Backend Deployment

Consider deploying to:
- Railway
- Render
- DigitalOcean App Platform
- AWS/Heroku

Make sure to:
1. Set `NODE_ENV=production`
2. Use a strong JWT secret
3. Configure proper CORS origins
4. Set up database backups

## License

This project is licensed under the MIT License.