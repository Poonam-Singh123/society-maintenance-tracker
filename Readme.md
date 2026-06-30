# Society Maintenance Tracker

A full-stack platform for apartment societies to manage maintenance complaints, track status history, post notices, and notify residents by email.

## Features

- **Residents:** Register, log in, raise complaints (with optional photo), view complaint history
- **Admin:** View/filter all complaints, set priority, update status with notes, flag overdue items, post notices, dashboard analytics
- **System:** Configurable overdue threshold, complaint status lifecycle with full audit history, email on status change and important notices

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, SQLite (better-sqlite3) |
| Frontend | React 18, Vite, React Router |
| Auth | JWT (roles: `resident`, `admin`) |
| File uploads | Multer (images up to 5 MB) |
| Email | Nodemailer (any SMTP provider) |

## Project Structure

```
Society_Maintenance_Tracker/
├── backend/
│   ├── src/
│   │   ├── routes/       # auth, complaints, notices, dashboard
│   │   ├── services/     # email, complaint helpers
│   │   ├── middleware/   # JWT auth
│   │   ├── db.js         # schema + connection
│   │   ├── index.js      # API entry
│   │   └── seed.js       # create default admin
│   └── uploads/          # complaint photos
├── frontend/
│   └── src/              # React UI
├── .env.example
├── SYSTEM_DESIGN.md
└── README.md
```

## Setup Guide

### Prerequisites

- Node.js 18+
- npm

### 1. Backend

```bash
cd backend
npm install
cp ../.env.example .env
# Edit .env with your JWT_SECRET and optional SMTP settings
npm run seed
npm start
```

API runs at **http://localhost:5000**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

UI runs at **http://localhost:5173** (proxies `/api` and `/uploads` to backend)

### Default Admin Account

| Field | Value |
|-------|-------|
| Email | admin@society.com |
| Password | admin123 |

Change these in `.env` before running `npm run seed`.

## Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto increment |
| name | TEXT | Display name |
| email | TEXT UNIQUE | Login identifier |
| password_hash | TEXT | bcrypt hash |
| role | TEXT | `resident` or `admin` |
| created_at | TEXT | ISO datetime |

### complaints
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER FK → users | Resident who filed |
| category | TEXT | Plumbing, Electrical, etc. |
| description | TEXT | Complaint details |
| photo_path | TEXT | Optional `/uploads/...` path |
| status | TEXT | Open, In Progress, Resolved |
| priority | TEXT | Low, Medium, High |
| is_overdue | INTEGER | 0 or 1 |
| created_at, updated_at | TEXT | |

### complaint_history
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| complaint_id | INTEGER FK | |
| status | TEXT | Status at this point |
| note | TEXT | Optional admin note |
| actor_id | INTEGER FK → users | Who made the change |
| created_at | TEXT | Timestamp of change |

### notices
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| title, content | TEXT | Notice body |
| is_important | INTEGER | Pinned + triggers email |
| created_by | INTEGER FK → users | Admin author |
| created_at | TEXT | |

### settings
| Column | Type | Notes |
|--------|------|-------|
| key | TEXT PK | e.g. `overdue_days` |
| value | TEXT | Config value |

## API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require header: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | `{ name, email, password }` | Register resident |
| POST | `/auth/login` | `{ email, password }` | Login |
| GET | `/auth/me` | — | Current user |

### Complaints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/complaints/categories` | Public | List categories |
| POST | `/complaints` | Resident | Create (multipart: category, description, photo?) |
| GET | `/complaints` | Both | List (admin: all + filters; resident: own) |
| GET | `/complaints/:id` | Both | Detail + history |
| PATCH | `/complaints/:id/status` | Admin | `{ status, note? }` |
| PATCH | `/complaints/:id/priority` | Admin | `{ priority }` |
| PATCH | `/complaints/:id/flag-overdue` | Admin | Manual overdue flag |

Query filters (admin): `category`, `status`, `from`, `to` (YYYY-MM-DD)

### Notices

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/notices` | Both | List (important pinned first) |
| POST | `/notices` | Admin | `{ title, content, is_important? }` |

### Dashboard

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard` | Admin | Stats by status/category + overdue count |
| GET | `/dashboard/settings/overdue-days` | Both | Get threshold |
| PUT | `/dashboard/settings/overdue-days` | Admin | `{ overdueDays }` |

## Deployment

- **Backend:** Deploy to Render/Railway with `npm start`, set env vars, persist `data/` and `uploads/`
- **Frontend:** Build with `npm run build`, deploy to Vercel/Netlify, set `VITE_API_URL` to backend URL

## License

Open source — for assignment submission.
