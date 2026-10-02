# SriAstro

Birth-details management for a single astrologer.

- **Public (`/`)** – four fields (name, date, time, place) → submit → success.
- **Admin (`/admin`)** – login from the top-right *Admin Login* button; dashboard, requests, clients, payments, transaction cards, readings, settings.

**Stack:** React + Vite + TypeScript + Tailwind v4 · Express + TypeScript · Prisma · Neon PostgreSQL · JWT in an HTTP-only cookie.

```
sriastro-pro/
├── server/   Express API + Prisma (schema, migration, seed)
└── client/   React app
```

---

## 1. Run locally

Requires **Node 20+** and a free [Neon](https://neon.tech) project.

### Database
1. In Neon, create a project and copy the **direct (non-pooled)** connection string.
2. Server env:
   ```bash
   cd server
   cp .env.example .env
   # edit .env: set DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, and ADMIN_PASSWORD
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # use this for JWT_SECRET
   ```
3. Install, apply the migration, seed:
   ```bash
   npm install
   npm run prisma:migrate:dev     # creates the tables
   npm run seed:admin             # creates only the admin account; no sample clients are inserted
   npm run dev                    # API on http://localhost:4000
   ```

### Frontend
```bash
cd client
npm install
npm run dev                      # http://localhost:5173  (proxies /api to :4000)
```

Open http://localhost:5173 → **Admin Login** (top right) → use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values configured for the seed command.

---

## 2. Deploy

Order: **Neon → Render (API) → Vercel (web)**.

### Neon
Use the same direct connection string (`...?sslmode=require`) as `DATABASE_URL`.

### Backend on Render (or Railway)
| Setting | Value |
|---|---|
| Root directory | `server` |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm run prisma:migrate:deploy && npm start` |

Environment variables:

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | random string, **32+ chars** |
| `CLIENT_URL` | your Vercel URL, e.g. `https://sriastro.vercel.app` (comma-separate extra domains) |
| `NODE_ENV` | `production` |
| `APP_TIMEZONE` | optional, default `Asia/Kolkata` (for "Today's Collection") |
| `ADMIN_EMAIL` | email address for the initial admin seed |
| `ADMIN_PASSWORD` | unique initial password (12+ characters); needed only when running `seed:admin` |

`PORT` is provided by the host.

**Create the admin account (once)** – from your computer, with `server/.env` pointing at the Neon database and containing the chosen `ADMIN_EMAIL` and `ADMIN_PASSWORD`:
```bash
cd server
npm run seed:admin
```
It is safe to re-run; it never overwrites an existing admin password. The seeding command creates no client or transaction records.

### Frontend on Vercel
1. Import the repo, **Root directory = `client`** (Vite is auto-detected).
2. The Vercel rewrite in `client/vercel.json` forwards `/api/*` to `https://sriastro.onrender.com` and serves other paths through the React SPA. API calls remain same-origin in the browser so authentication cookies work without relying on third-party-cookie support. No Vite environment variable is needed for the API URL.

Finally, set `CLIENT_URL` on the backend to the exact Vercel URL. This must match the deployed frontend origin for credentialed API requests and authentication cookies.

### First thing after going live
Sign in → **Settings → Change password** if you want to rotate the unique bootstrap password you configured.

---

## 3. Commands

| Where | Command | Purpose |
|---|---|---|
| server | `npm run dev` | API with reload |
| server | `npm run build` / `npm start` | production build / run |
| server | `npm run prisma:migrate:dev` | create/apply migrations locally |
| server | `npm run prisma:migrate:deploy` | apply migrations in production |
| server | `npm run seed:admin` | create admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (does not insert sample clients) |
| client | `npm run dev` / `npm run build` | dev server / production build |

## 4. API

Public: `POST /api/public/clients`
Auth: `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` · `POST /api/auth/change-password`
Admin (all require login):
`GET /api/admin/dashboard` · `GET /api/admin/clients` · `GET|DELETE /api/admin/clients/:id` ·
`PATCH /api/admin/clients/:id/amount|prediction|pay|complete` · `GET /api/admin/transactions|payments|readings`

## 5. Behaviour notes

- **Mark as Paid** runs in one database transaction with a guarded update, so a double-click or two tabs can never create two transactions. It requires an amount greater than ₹0, and the amount is locked once paid.
- **Deleting a customer** removes their transactions via `ON DELETE CASCADE`; all totals are recomputed from the database.
- **New Requests** = clients submitted in the last 7 days (`newRequestDays` in `server/src/config.ts`).
- Prediction/research notes are stored with each client record, are limited to 10,000 characters, and are accessible only through authenticated admin routes.
- Pending readings are listed oldest-first (first come, first served); completed ones newest-first.
- Security: bcrypt hashing, JWT in an HTTP-only cookie (`Secure` + `SameSite=None` in production), Helmet, CORS allow-list, an Origin check on all write requests (CSRF), rate limits on login and public submissions, zod validation, generic error messages (no stack traces/SQL to clients).
- Date of birth is stored at UTC midnight and displayed in UTC so it never shifts by a day.
