# MainBooks 📚
**Platform Buku Digital Anak Indonesia**

Fullstack web app berdasarkan spesifikasi produk MainBooks v1.2 — hybrid subscription + one-time-purchase (OTP) model.

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Tailwind CSS, Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL via Knex.js |
| Auth | JWT + bcrypt |
| Tests | Jest — 23 unit tests, 3 suites |

---

## Quick Start

### 1. Database
```bash
createdb mainbooks_db
```

### 2. Backend
```bash
cd backend
cp .env .env.local          # edit DB credentials jika perlu
npm install
npm run migrate
npm run seed
npm start                   # → http://localhost:3001
```

### 3. Frontend
```bash
cd frontend
npm install
npm start                   # → http://localhost:3000
```

---

## Demo Accounts (seeded)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mainbooks.id | admin123 |
| Premium | premium@mainbooks.id | password123 |
| Free | user@mainbooks.id | password123 |

Quick-fill buttons tersedia di halaman login.

---

## Frontend Pages

| Route | Deskripsi |
|-------|-----------|
| `/` | Homepage + pricing |
| `/login` | Login dengan demo accounts |
| `/register` | Daftar akun baru |
| `/books` | Katalog + search + genre filter |
| `/books/:id` | Detail + subscribe/purchase CTA |
| `/my-library` | Buku yang sudah dibeli |
| `/admin` | CRUD buku (admin only) |

---

## Access Badge System

`AccessBadge` component menampilkan status akses dengan 4 state:

- 🟢 **Milikku** — dibeli OTP, permanen
- 🟡 **Langganan** — via subscription aktif
- ⚫ **Beli RpX** — tersedia untuk dibeli
- ⚫ **Perlu Langganan** — perlu upgrade

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/books              (optional auth — attaches access info)
GET    /api/books/:id          (optional auth)
POST   /api/books              (admin only)
PUT    /api/books/:id          (admin only)
DELETE /api/books/:id          (admin only — soft delete)

POST   /api/entitlements/subscribe
POST   /api/entitlements/purchase
GET    /api/entitlements/my
```

---

## Unit Tests
```bash
cd backend && npm test
```
**23 tests — 3 suites: auth, books, entitlements**

---

## Access Control Logic (dari spec Section 4)
```
Akses = (sub aktif AND buku di katalog) OR (user punya entitlement OTP)
```

Edge cases:
- Sub kadaluarsa → katalog terkunci, OTP tetap bisa dibuka
- Buku di-delist → soft delete, grandfathered access untuk existing buyers
