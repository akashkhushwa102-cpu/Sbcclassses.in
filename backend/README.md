# 🚀 SBC Backend Server - Complete Guide

**Version:** 3.0.0  
**Status:** Production Ready  
**Framework:** Node.js + Express + Supabase  

---

## 📋 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment Variables
```bash
# Copy the example file
cp .env.example .env.local

# Edit with your Supabase credentials
nano .env.local
```

### 3. Run Development Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

### 4. Run Production Server
```bash
npm start
```

---

## 🔧 Environment Setup

### Get Supabase Credentials

1. Go to [https://supabase.com](https://supabase.com)
2. Create account and project
3. Go to **Settings → API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Key** → `VITE_SUPABASE_ANON_KEY`
   - **Service Key** → `VITE_SUPABASE_SERVICE_KEY`

### Get Gmail App Password (for OTP emails)

1. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select **Mail** and **Windows Computer**
3. Copy the 16-character password
4. Use as `EMAIL_PASSWORD`

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/login              Login with credentials
POST   /api/auth/send-otp           Send OTP to email
POST   /api/auth/verify-otp         Verify OTP
POST   /api/auth/register           Register new account
POST   /api/auth/reset-password     Reset password
```

### Students
```
GET    /api/students                Get all students
GET    /api/students/:id            Get student by ID
POST   /api/students                Create student
PUT    /api/students/:id            Update student
DELETE /api/students/:id            Delete student
GET    /api/students/:id/attendance Get attendance
GET    /api/students/:id/fees       Get fees
```

### Teachers
```
GET    /api/teachers                Get all teachers
POST   /api/teachers                Create teacher
GET    /api/teachers/:id/classes    Get teacher's classes
GET    /api/teachers/:id/students   Get teacher's students
```

### Batches
```
GET    /api/batches                 Get all batches
POST   /api/batches                 Create batch
GET    /api/batches/:id/students    Get batch students
GET    /api/batches/:id/schedule    Get batch schedule
```

### Attendance
```
POST   /api/attendance              Mark attendance
GET    /api/attendance/student/:id  Get student attendance
GET    /api/attendance/batch/:id    Get batch attendance
```

### Fees
```
GET    /api/fees/student/:id        Get student fees
POST   /api/fees/:id/pay            Mark fees as paid
GET    /api/fees/transactions/:id   Get payment history
```

### Admin
```
GET    /api/admin/dashboard         Get dashboard stats
POST   /api/admin/approve/student/:id   Approve student
POST   /api/admin/approve/teacher/:id   Approve teacher
```

---

## 🔐 Security

### JWT Authentication

All protected routes require `Authorization` header:
```
Authorization: Bearer <token>
```

### Password Security

- **Development:** Passwords stored plain (for demo)
- **Production:** Hash with bcrypt

To enable bcrypt hashing in production, uncomment in `server.js`:
```javascript
const hashedPassword = bcrypt.hashSync(password, 10);
```

### Environment Variables

- Never commit `.env.local` to git
- Use `.gitignore` to protect secrets
- Use production secret manager (AWS Secrets, Heroku Config, etc.)

---

## 🗄️ Database Schema

Required tables in Supabase:

```sql
-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  password TEXT,
  class TEXT,
  board TEXT,
  batch_id TEXT,
  status TEXT DEFAULT 'pending',
  attendance INT DEFAULT 0,
  created_at TIMESTAMP
);

-- Teachers
CREATE TABLE teachers (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  password TEXT,
  subject TEXT,
  qualification TEXT,
  experience TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP
);

-- Batches
CREATE TABLE batches (
  id UUID PRIMARY KEY,
  name TEXT,
  class TEXT,
  board TEXT,
  time TEXT,
  days TEXT,
  teacher_id TEXT,
  fees INT,
  created_at TIMESTAMP
);

-- And more... (see BACKEND_SCHEMA.sql)
```

---

## 🚀 Deployment

### Deploy to Heroku

```bash
# 1. Create Heroku app
heroku create sbc-backend

# 2. Set environment variables
heroku config:set VITE_SUPABASE_URL=...
heroku config:set VITE_SUPABASE_ANON_KEY=...
heroku config:set JWT_SECRET=...

# 3. Deploy
git push heroku main
```

### Deploy to Render

1. Go to [https://render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Set Build: `npm install`
5. Set Start: `npm start`
6. Add environment variables
7. Deploy!

### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

---

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
```bash
# View recent logs
tail -f logs/app.log

# Or use Heroku logs
heroku logs --tail
```

---

## 🐛 Troubleshooting

### Supabase Connection Error
```
❌ Missing Supabase credentials
```
**Solution:** Add credentials to `.env.local`

### Email Not Sending
```
❌ Email error: Invalid credentials
```
**Solution:** Check Gmail app password is correct

### Token Invalid
```
❌ Invalid token
```
**Solution:** Login again to get new token

---

## 📝 API Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "id": "SBC00001",
    "password": "demo123",
    "role": "student"
  }'

# Get Students (with token)
curl http://localhost:3000/api/students \
  -H "Authorization: Bearer <token>"
```

### Using Postman

1. Create collection: `SBC API`
2. Add new request: `POST /api/auth/login`
3. Body (JSON):
```json
{
  "id": "SBC00001",
  "password": "demo123",
  "role": "student"
}
```
4. Capture token from response
5. Use in Authorization header for other requests

---

## 🔗 Integration with Frontend

Frontend API calls go to:
```
http://localhost:3000/api (Development)
https://your-domain.com/api (Production)
```

Update in `src/services/api.js`:
```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

---

## 📚 Additional Resources

- [Express.js Docs](https://expressjs.com)
- [Supabase Docs](https://supabase.com/docs)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-performance/)

---

## ✅ Production Checklist

- [ ] Environment variables configured
- [ ] Database tables created
- [ ] Supabase RLS policies enabled
- [ ] Email service configured
- [ ] JWT secret set to strong random key
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Error logging setup
- [ ] Rate limiting enabled
- [ ] Database backups configured

---

**Happy deploying!** 🚀

*Last Updated: April 3, 2026*  
*Version: 3.0.0*
