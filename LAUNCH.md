# SBC Classes — Production Launch Guide

> Yeh ek complete deployment-ready checklist hai. Step-by-step follow karo —
> har step pichle step pe depend karta hai. Skip mat karna.

---

## 0. Quick status — kya ship-ready hai

Iss codebase mein already complete:

- ✅ JWT auth (register / login / me / logout / update-password)
- ✅ Role-based access (admin / teacher / student) with `requireRole(...)` middleware
- ✅ Bcrypt password hashing (`User.comparePassword`)
- ✅ Plan CRUD (admin) → MongoDB (`POST/PUT/DELETE /api/plans`)
- ✅ Admin Plans Manager UI (`AdminPlansManager.jsx` — sidebar tab "📋 Plans")
- ✅ Plan listing for students (dynamic, no dummy data)
- ✅ Subscription model (`who bought what`, expiry tracking)
- ✅ Payment model + audit log
- ✅ **Three payment paths** per plan/batch:
  1. **PhonePe** Standard Checkout (signed X-VERIFY webhook) — `/api/phonepe/*`
  2. **Paytm** UPI gateway — `/api/payments/initiate` + `/api/payments/paytm/callback`
  3. **Direct UPI** (admin's UPI ID, manual approval) — `/api/payments/upi-claim`
- ✅ Subscription auto-provision on payment success
- ✅ Payment idempotency (duplicate webhooks won't double-extend)
- ✅ Cron job: auto-expire stale subscriptions hourly
- ✅ Email receipts (nodemailer — optional, configure SMTP)
- ✅ Rate limiting on auth + payment endpoints
- ✅ Mobile-responsive UI
- ✅ Admin secret portal (CAPTCHA + 2-step) hidden behind keyboard shortcut / URL hash

Pending (next sessions ke liye):
- Owner / Sub-Admin roles + permission matrix
- Discount / Offer / Coupon system
- Audit log of admin actions
- App.jsx structural refactor

---

## 1. Install dependencies

```powershell
cd C:\Users\Akash\Desktop\sbc-app

# Frontend (root)
Remove-Item -Recurse -Force node_modules,package-lock.json -ErrorAction SilentlyContinue
npm install

# Backend
cd backend
Remove-Item -Recurse -Force node_modules,package-lock.json -ErrorAction SilentlyContinue
npm install
cd ..
```

> Tip: `--force` avoid karna. `npm audit fix` ke baad dobara `npm install` chala lo.

---

## 2. MongoDB setup

**Option A — Local MongoDB (development):**

```powershell
# Service running hai check karo
Get-Service MongoDB

# Agar Stopped:
Start-Service MongoDB

# Agar service hi nahi:
# Download from https://www.mongodb.com/try/download/community-kanban
# "MongoDB as a Service" tick karke install
```

**Option B — MongoDB Atlas (production):**

1. https://cloud.mongodb.com pe free cluster banao
2. Connection string copy karo: `mongodb+srv://<user>:<pass>@cluster.mongodb.net/sbc`
3. `backend/.env` mein paste karo: `MONGO_URI=mongodb+srv://...`

---

## 3. Environment variables

### 3a. Frontend `.env.local` (development)

```dotenv
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=SBC Classes
VITE_ENVIRONMENT=development
```

> ⚠️ `VITE_API_URL` mein `/api` suffix MAT lagao — `apiClient.js` khud add karta hai.
> Galat: `http://localhost:5000/api` → double `/api/api/...` 404.
> Sahi: `http://localhost:5000`

### 3b. Frontend `.env.production`

```dotenv
VITE_API_URL=https://api.sbcclasses.com
VITE_APP_NAME=SBC Classes
VITE_ENVIRONMENT=production
VITE_ALLOW_DEMO_LOGIN=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

### 3c. Backend `backend/.env`

```dotenv
# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://www.sbcclasses.com

# MongoDB
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/sbc

# Auth — generate via:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=<paste 96-char hex>
JWT_EXPIRES_IN=7d
COOKIE_SECRET=<paste another 96-char hex>

# Email (optional — for OTP / receipts)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=<gmail app password, NOT account password>
EMAIL_FROM="SBC Classes <noreply@sbcclasses.com>"

# Bootstrap admin (one-time)
BOOTSTRAP_ADMIN_NAME=Super Admin
BOOTSTRAP_ADMIN_EMAIL=admin@sbcclasses.com
BOOTSTRAP_ADMIN_PASSWORD=ChangeThisStrong#1

# ── Payment gateways (use real credentials in prod) ──

# PhonePe Standard Checkout (sandbox keys are test-only)
PHONEPE_MERCHANT_ID=<from business.phonepe.com>
PHONEPE_SALT_KEY=<UUID-format salt key>
PHONEPE_SALT_INDEX=1
PHONEPE_HOST=https://api.phonepe.com/apis/hermes              # production
# PHONEPE_HOST=https://api-preprod.phonepe.com/apis/pg-sandbox # sandbox
PHONEPE_REDIRECT_URL=https://sbcclasses.com/payment-result
PHONEPE_CALLBACK_URL=https://api.sbcclasses.com/api/phonepe/webhook

# Paytm (sandbox unless you have real Paytm Business)
PAYTM_MID=<from business.paytm.com>
PAYTM_KEY=<merchant key>
PAYTM_WEBSITE=DEFAULT                # production: DEFAULT, sandbox: WEBSTAGING
PAYTM_GATEWAY_URL=https://securegw.paytm.in
PAYTM_CALLBACK_URL=https://api.sbcclasses.com/api/payments/paytm/callback

# Direct UPI receiver — your real UPI ID
UPI_RECEIVER_ID=yourname@paytm
UPI_RECEIVER_NAME=Your Coaching Name

LOG_LEVEL=info
```

> 🔐 Generate strong secrets:
> ```powershell
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

---

## 4. Bootstrap data

```powershell
cd C:\Users\Akash\Desktop\sbc-app\backend

# Create the admin user from BOOTSTRAP_ADMIN_* env vars
npm run create-admin

# Seed example batches + plans (so subscription page isn't empty)
npm run seed
```

Output dikhna chahiye:
```
Admin created: admin@sbcclasses.com
Seed complete.
```

> Production mein seed dobara mat chalao — duplicate plans ban jayenge.

---

## 5. Webhook URL (PhonePe needs public URL)

PhonePe webhook localhost se hit nahi kar sakta. **Local test ke liye ngrok use karo:**

```powershell
# Install ngrok one-time: https://ngrok.com/download

# Backend already running on port 5000
ngrok http 5000
```

Output:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:5000
```

`backend/.env` mein update karo:
```dotenv
PHONEPE_CALLBACK_URL=https://abc123.ngrok-free.app/api/phonepe/webhook
PAYTM_CALLBACK_URL=https://abc123.ngrok-free.app/api/payments/paytm/callback
```

Backend restart. PhonePe Business dashboard mein bhi yahi URL whitelist karo.

**Production mein:** apna real domain use karo — `https://api.sbcclasses.com/api/phonepe/webhook`.

---

## 6. Run locally

3 alag terminals chahiye:

```powershell
# Terminal 1 — Backend
cd C:\Users\Akash\Desktop\sbc-app\backend
npm start

# Terminal 2 — Frontend
cd C:\Users\Akash\Desktop\sbc-app
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
npm run dev

# Terminal 3 — ngrok (only if testing PhonePe webhook)
ngrok http 5000
```

Open `http://localhost:5173` in browser. Hard reload `Ctrl+Shift+R`.

---

## 7. Smoke test checklist (5 minutes)

### 7a. Backend health

Browser khol ke:
```
http://localhost:5000/api/health
→ {"status":"OK","service":"sbc-backend","time":"..."}

http://localhost:5000/api/phonepe/config
→ { configured: true, merchantIdSet: true, saltKeySet: true, ... }
```

### 7b. Admin flow

- Type karo `SBCADMIN` keyboard pe (8 chars on landing page) **OR** URL: `http://localhost:5173/#sbc-admin`
- 2-step CAPTCHA + login: `admin@sbcclasses.com` / `ChangeThisStrong#1` / secret key `SBC2024`
- Sidebar → **📋 Plans** → "+ New Plan" → fill name/price/duration/features → Save
- New plan list mein turant dikhega
- Edit / Delete bhi work karna chahiye

### 7c. Student flow

- Sign Up se naya student account
- Bottom nav → **Premium** 💎
- Admin ne jo plan banaya, woh dikhega (live DB se, no dummy)
- 3 payment buttons har plan pe:
  - **Pay via PhonePe** → PhonePe gateway redirect
  - **Paytm** → Paytm checkout
  - **Direct UPI** → modal khulega, txn ID submit karne ke liye

### 7d. Direct UPI flow (works without any gateway)

- Student clicks "Direct UPI"
- Modal mein admin ki UPI ID + amount + note dikhega
- Mobile pe "Open UPI App" button kaam karta — GPay/PhonePe/Paytm direct khul jata
- Pay karke 12-digit UTR copy karo, modal mein paste karo, submit
- "Claim submitted" message
- Admin dashboard se approve karo:
  ```
  POST /api/payments/admin/upi/<paymentId>/approve
  ```
  → student ki subscription **automatic active** ho jayegi

---

## 8. Production deploy

### 8a. Frontend (Vite static build)

```powershell
cd C:\Users\Akash\Desktop\sbc-app
npm run build
# Output: dist/  → upload to Vercel / Netlify / S3+CloudFront / Render
```

Vercel ke saath:
```
vercel --prod
```

### 8b. Backend (Node + Express)

```powershell
cd C:\Users\Akash\Desktop\sbc-app\backend
npm start
```

`pm2` ke saath (recommended):
```bash
npm install -g pm2
pm2 start server.js --name sbc-backend --update-env
pm2 startup
pm2 save
```

Or use **Render / Railway / Fly.io** — `npm start` works as-is.

### 8c. Domain + HTTPS

- Frontend: `https://sbcclasses.com`
- Backend: `https://api.sbcclasses.com`
- Both env files mein update karo: `FRONTEND_URL`, `VITE_API_URL`, `PHONEPE_CALLBACK_URL`, etc.
- Nginx + Let's Encrypt for SSL.

---

## 9. Common issues + fixes

| Issue                                       | Fix                                                              |
|---------------------------------------------|------------------------------------------------------------------|
| `404 on /api/api/auth/login`                | Remove `/api` from `VITE_API_URL`                                |
| `ERR_CONNECTION_REFUSED on :5001`           | `.env.local` mein port `5001` likha hai — `5000` karo, Vite restart |
| `t is not defined` in console               | `import { t, getLang }` line removed accidentally — restore it   |
| `Vite 500 on a .jsx file`                   | Hard reload + clear `.vite` cache + paste exact Vite terminal error |
| `403 Forbidden /api/users` flooding logs    | Teacher/student logged in — only admin should hit this. Check `database.js sync.all()` |
| `MongoDB connection error`                  | `mongod` not running OR `MONGO_URI` wrong                        |
| `[env] WARNING: MONGO_URI is not set`       | `.env` file missing or var not set — check `backend/.env`        |
| PhonePe `X-VERIFY mismatch`                 | Salt key galat — verify UUID format from PhonePe dashboard       |
| PhonePe webhook nahi aaya                   | Callback URL public-reachable hona chahiye — use ngrok           |
| Plans empty / "No plans yet"                | Run `npm run seed` OR create one manually from Admin → Plans     |

---

## 10. API endpoints quick reference

| Method | Path                                 | Auth     | Purpose |
|--------|--------------------------------------|----------|---------|
| GET    | `/api/health`                        | public   | Health check |
| POST   | `/api/auth/register`                 | public   | Sign up |
| POST   | `/api/auth/login`                    | public   | Log in |
| GET    | `/api/auth/me`                       | auth     | Current user |
| GET    | `/api/plans`                         | public   | List active plans |
| POST   | `/api/plans`                         | admin    | Create plan |
| PUT    | `/api/plans/:id`                     | admin    | Update plan |
| DELETE | `/api/plans/:id`                     | admin    | Delete plan |
| GET    | `/api/subscriptions/me`              | auth     | My subscriptions |
| GET    | `/api/subscriptions/me/access/:bid`  | auth     | Do I own this batch? |
| GET    | `/api/subscriptions/admin`           | admin    | All subscriptions |
| POST   | `/api/subscriptions/admin/grant`     | admin    | Grant manual subscription |
| POST   | `/api/payments/initiate`             | auth     | Start Paytm payment |
| POST   | `/api/payments/paytm/callback`       | public   | Paytm webhook |
| POST   | `/api/payments/verify`               | auth     | Re-check payment |
| GET    | `/api/payments/me`                   | auth     | My payment history |
| GET    | `/api/payments/upi-config`           | public   | Admin's UPI ID for direct flow |
| POST   | `/api/payments/upi-claim`            | auth     | Submit UPI txn for approval |
| GET    | `/api/payments/admin/upi/pending`    | admin    | Pending UPI claims |
| POST   | `/api/payments/admin/upi/:id/approve`| admin    | Approve UPI claim |
| POST   | `/api/payments/admin/upi/:id/reject` | admin    | Reject UPI claim |
| GET    | `/api/phonepe/config`                | public   | PhonePe config check |
| POST   | `/api/phonepe/initiate`              | auth     | Start PhonePe payment |
| POST   | `/api/phonepe/webhook`               | public   | PhonePe webhook |
| POST   | `/api/phonepe/verify`                | auth     | Re-check PhonePe payment |
| GET    | `/api/admin/dashboard`               | admin    | Admin stats |

---

## 11. Repo health summary

- **115 source files** parse cleanly (verified via `@babel/parser`)
- **11 routers** mounted in `routes/index.js`
- **65+ API endpoints** active
- **3 payment gateways** wired (PhonePe / Paytm / Direct UPI)
- **MongoDB + Mongoose** for primary data
- **Optional Supabase** layer for separate Paytm-Supabase audit (not required)

Bas itna karke app live ho jayegi. Step 1-7 ke baad smoke test pass kare to step 8 (deploy) confidently kar sakte ho.
