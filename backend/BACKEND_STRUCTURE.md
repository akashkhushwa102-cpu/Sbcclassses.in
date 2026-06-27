# ✅ BACKEND FILE STRUCTURE

## Complete Backend Architecture

```
backend/
├── server.js                    # Main Express server (entry point)
├── package.json                 # Dependencies & npm scripts
├── .env.local                   # Local environment variables
├── .env.production              # Production environment variables
│
├── config/
│   └── supabase.js             # Supabase database configuration
│
├── middleware/
│   ├── auth.js                 # JWT authentication & role verification
│   └── validation.js           # Request data validation
│
├── controllers/
│   ├── authController.js       # Login, register, authentication logic
│   ├── studentController.js    # Student CRUD operations
│   ├── teacherController.js    # Teacher CRUD operations
│   └── batchController.js      # Batch CRUD operations
│
├── models/
│   ├── student.js              # Student database queries
│   ├── teacher.js              # Teacher database queries
│   └── batch.js                # Batch database queries
│
├── routes/
│   ├── auth.js                 # Authentication endpoints
│   ├── students.js             # Student API endpoints
│   ├── teachers.js             # Teacher API endpoints
│   └── batches.js              # Batch API endpoints
│
└── utils/
    ├── response.js             # Standard response formatter
    └── email.js                # Email sending utilities
```

---

## API Endpoints

### Authentication Routes
```
POST   /api/auth/student-login       - Student login
POST   /api/auth/teacher-login       - Teacher login
POST   /api/auth/student-register    - Student registration
```

### Student Routes
```
GET    /api/students                  - Get all students (protected)
GET    /api/students/:id              - Get student by ID
PUT    /api/students/:id              - Update student
DELETE /api/students/:id              - Delete student (admin only)
GET    /api/students/batch/:batchId   - Get students by batch
```

### Teacher Routes
```
GET    /api/teachers                  - Get all teachers
GET    /api/teachers/:id              - Get teacher by ID
PUT    /api/teachers/:id              - Update teacher
DELETE /api/teachers/:id              - Delete teacher (admin only)
```

### Batch Routes
```
GET    /api/batches                   - Get all batches
GET    /api/batches/:id               - Get batch by ID
POST   /api/batches                   - Create batch (teacher/admin)
PUT    /api/batches/:id               - Update batch
DELETE /api/batches/:id               - Delete batch (admin only)
GET    /api/batches/teacher/:teacherId - Get batches by teacher
```

### Health Check
```
GET    /api/health                    - Server health status
```

---

## Features Implemented

✅ **Authentication**
- Student & teacher login
- JWT token generation & verification
- Role-based access control
- Password hashing with bcrypt

✅ **Data Management**
- Complete CRUD for students, teachers, batches
- Supabase database integration
- Input validation & error handling

✅ **Email Integration**
- Welcome emails
- Password reset emails
- OTP support

✅ **Security**
- CORS enabled
- Input validation
- Role-based route protection
- Error handling middleware

---

## How to Start the Backend

```bash
# Install dependencies
npm install

# Create .env.local with Supabase credentials
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Run development server
npm run dev

# Run production server
npm start
```

---

## Environment Variables Required

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_KEY=optional-service-key

# JWT
JWT_SECRET=your-secret-key

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Server
PORT=5000
NODE_ENV=development
```

---

## Database Tables Required in Supabase

1. **students** - Student information
2. **teachers** - Teacher information
3. **batches** - Batch/class information
4. **attendance** - Attendance records
5. **fees** - Fee tracking
6. **payments** - Payment records

---

✅ **Backend is production-ready!**
