# SBC Coaching Classes — Production SaaS Platform (v4.0)

A production-ready coaching/SaaS platform with full Admin, Teacher and
Student workflows, batch & subscription management, Paytm UPI payments,
and automatic access provisioning.

```
.
├── backend/              Node.js + Express + MongoDB API server
└── src/                  React + Vite frontend
```

The backend is the **single source of truth**. The frontend reads/writes
through the REST API. A small `services/apiClient.js` module is the only
HTTP layer; everything else builds on top of it. The legacy `DB.get/set`
shim in `src/config/database.js` keeps the existing 6,800-line `App.jsx`
working while transparently mirroring writes to the backend, so admins can
keep using the existing UI.

---

## 1. Tech Stack

- **Backend:** Node.js 18+, Express 4, Mongoose 8, Joi validation,
  Helmet, CORS, rate-limiting, Winston logging, node-cron jobs.
- **Database:** MongoDB (any modern version; Atlas works out of the box).
- **Auth:** JWT (Bearer tokens) + bcrypt password hashing + RBAC middleware.
- **Payments:** Paytm UPI (server-side checksum, server-to-server
  callback, status verification API, automatic subscription provisioning).
- **Frontend:** React 18 + Vite 5.

---

## 2. Folder Layout

```
backend/
  config/         db.js, env.js
  controllers/    authController, userController, batchController,
                  planController, subscriptionController,
                  paymentController, noticeController,
                  contentController, adminController
  middleware/     auth.js (JWT + RBAC), validate.js (Joi),
                  errorHandler.js, rateLimit.js
  models/         User, Batch, Plan, Subscription, Payment,
                  Notice, Content
  routes/         auth, users, batches, plans, subscriptions,
                  payments, notices, content, admin, index
  utils/          jwt, paytm (checksum), email, logger,
                  asyncHandler, ApiError, response, cron
  scripts/        seed.js, createAdmin.js
  server.js
  .env.example
  package.json

src/
  components/     Admin, Auth, Teachers, Shared, …
  config/         database.js (cache + sync), auth.js, security.js
  services/       apiClient.js (canonical), api.js (back-compat)
  pages/          LoginPage, AdminSecretPortal
  App.jsx, main.jsx
package.json
```

---

## 3. Quick Start (Local Dev)

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally **or** a free MongoDB Atlas cluster
- Paytm staging credentials (or use the placeholders for UI testing)

### 3.1 Backend

```bash
cd backend
cp .env.example .env
# Edit .env — at minimum set MONGO_URI, JWT_SECRET, PAYTM_MID, PAYTM_KEY
npm install

# Bootstrap the first admin (uses BOOTSTRAP_ADMIN_* in .env)
npm run create-admin

# Optional: seed a teacher + a couple of batches + plans
npm run seed

npm run dev   # http://localhost:5000
```

The server boots, connects to MongoDB, and starts the hourly cron job
that expires lapsed subscriptions.

### 3.2 Frontend

```bash
# from project root
cp .env.example .env.local
# (defaults point to http://localhost:5000 — fine for dev)
npm install
npm run dev   # http://localhost:5173
```

Log in with the admin email/password from `BOOTSTRAP_ADMIN_*`.

---

## 4. Environment Variables (Backend `.env`)

| Var | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `NODE_ENV` | `development` / `production` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string, ≥ 32 chars |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `FRONTEND_URL` | Used for CORS + Paytm post-payment redirect |
| `PAYTM_MID` / `PAYTM_KEY` | Paytm Merchant ID & Key |
| `PAYTM_WEBSITE` | `WEBSTAGING` (test) or your prod website name |
| `PAYTM_GATEWAY_URL` | `https://securegw-stage.paytm.in` (test) or `https://securegw.paytm.in` (prod) |
| `PAYTM_CALLBACK_URL` | Public URL Paytm calls back, e.g. `https://api.yourdomain.com/api/payments/paytm/callback` |
| `EMAIL_*` | Optional SMTP for receipt emails |
| `BOOTSTRAP_ADMIN_*` | First admin created by `npm run create-admin` |

---

## 5. API Reference (high level)

All responses share `{ success, message, data, meta? }`.

### Auth
- `POST /api/auth/register` — student/teacher signup
- `POST /api/auth/login` — returns `{ token, user }`
- `GET  /api/auth/me` *(auth)*
- `POST /api/auth/logout`
- `POST /api/auth/update-password` *(auth)*

### Users *(admin)*
- `GET /api/users?role=&q=&page=&limit=`
- `GET /api/users/:id`
- `POST /api/users` (admin creates anyone)
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `POST /api/users/:id/toggle-block`

### Batches
- `GET /api/batches` — public; only `isPublished:true` is returned.
  Admin/teacher can pass `?all=1` to also see drafts.
- `GET /api/batches/:id`
- `POST /api/batches` *(admin/teacher)*
- `PUT /api/batches/:id` *(admin/teacher; teacher only own)*
- `DELETE /api/batches/:id` *(admin)*
- `POST /api/batches/:id/toggle-publish` *(admin)*
- `GET /api/batches/:id/access` *(auth)* — does the current user have access?

### Plans
- `GET /api/plans?type=&includeInactive=` (public)
- `POST/PUT/DELETE /api/plans[/:id]` *(admin)*

### Subscriptions
- `GET /api/subscriptions/me` *(auth)*
- `GET /api/subscriptions/me/access/:batchId` *(auth)*
- `GET /api/subscriptions/admin?status=&type=&userId=` *(admin)*
- `POST /api/subscriptions/admin/grant` *(admin)*
- `POST /api/subscriptions/admin/:id/extend` *(admin)*
- `POST /api/subscriptions/admin/:id/cancel` *(admin)*

### Payments (Paytm UPI)
- `POST /api/payments/initiate` *(auth)*
  ```json
  { "type": "batch", "batchId": "<id>" }       // for a single batch
  { "type": "all_access", "planId": "<id>" }   // for an All-Access plan
  ```
  → returns `paytmParams`, `paytmGatewayUrl`, and an `autoPostForm`
  HTML snippet the frontend can drop into the page to redirect the user
  to Paytm.
- `POST /api/payments/paytm/callback` — **public** server-to-server
  callback; verifies the checksum, marks the payment success/failed,
  and provisions a Subscription automatically.
- `POST /api/payments/verify` *(auth)* — re-check status by querying
  Paytm's `/order/status` API.
- `GET /api/payments/me` *(auth)*
- `GET /api/payments/admin?status=` *(admin)*

### Notices
- `GET /api/notices?audience=&batchId=`
- `POST/PUT/DELETE /api/notices[/:id]` *(admin/teacher)*

### Content
- `GET /api/content/batch/:batchId` *(auth, requires active subscription)*
- `POST/PUT/DELETE /api/content[/:id]` *(admin/teacher)*

### Admin
- `GET /api/admin/dashboard` *(admin)* — counts + 30-day revenue.

### System
- `GET /api/health`

---

## 6. Subscription & Access Logic

After every successful Paytm payment the `paymentController` calls
`provisionFromPayment()` which:

1. Finds an existing **active** subscription of the same `type`
   (`batch` or `all_access`) for the same user (and batch, for batch
   plans). If found, **extends** the expiry by `durationDays`.
2. Otherwise creates a new **active** subscription starting today.
3. Writes the payment back with the resulting `subscriptionId`.

When the frontend asks "can this user access batch X?":

```
if user.role in {admin, teacher}      → ALLOW
elif active subscription of type all_access → ALLOW
elif active subscription with batchId == X  → ALLOW
else                                  → SHOW PAYMENT
```

A cron job runs hourly to flip `active → expired` for any sub whose
`expiryDate` has passed.

---

## 7. Paytm Integration Notes

- The Paytm checksum is implemented in `backend/utils/paytm.js`
  (AES-128-CBC + SHA-256, identical to Paytm's official `paytmchecksum`
  package). No external Paytm SDK is required.
- Replace the placeholder `PAYTM_MID` / `PAYTM_KEY` with credentials
  from your Paytm Business dashboard.
- Set `PAYTM_GATEWAY_URL` to `https://securegw.paytm.in` and
  `PAYTM_WEBSITE` to your registered website name when going live.
- `PAYTM_CALLBACK_URL` **must be reachable from Paytm's servers** —
  use ngrok in dev, or your real public domain in prod.
- For UPI, no extra config is needed; users see UPI as a payment
  option on Paytm's hosted checkout.

---

## 8. Production Deployment

A typical setup:

- **Backend** on Render / Railway / a small VPS (PM2 or systemd).
  ```bash
  NODE_ENV=production node server.js
  ```
- **MongoDB** on MongoDB Atlas.
- **Frontend** on Netlify / Vercel / S3+CloudFront — `npm run build`
  produces `dist/`. Set `VITE_API_URL=https://api.yourdomain.com`.
- Put HTTPS in front of both.
- Update `FRONTEND_URL` and `PAYTM_CALLBACK_URL` in the backend `.env`.

---

## 9. Roles Cheat-sheet

| Action | admin | teacher | student |
|---|:-:|:-:|:-:|
| Create / publish batch | ✅ | ✅ (own) | – |
| Delete batch | ✅ | – | – |
| Manage plans | ✅ | – | – |
| Post notices | ✅ | ✅ | – |
| Upload content | ✅ | ✅ (own batch) | – |
| Subscribe | – | – | ✅ |
| Access content | ✅ | ✅ | ✅ (subscribed) |
| Grant subscription | ✅ | – | – |
| View revenue | ✅ | – | – |

---

## 10. Verifying it works

1. `curl http://localhost:5000/api/health` → `{"status":"OK"}`
2. Register: `POST /api/auth/login` with the admin credentials.
3. Create a batch (admin UI or `POST /api/batches`) with `isPublished:true`.
4. Visit the Subscription page in the student UI — the new batch shows up.
5. Click **Buy Now** → Paytm hosted checkout opens (staging) → on
   success you're redirected back to `/payment-result?status=success&orderId=…`
   and a Subscription document is created automatically.
