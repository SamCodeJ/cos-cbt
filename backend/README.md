# C-COS Backend API

Node.js + Express + PostgreSQL backend for the C-COS Computer-Based Testing System.

## 🎯 Features

- **JWT Authentication** - Secure token-based auth
- **Role-Based Access Control** - Admin, Teacher, Candidate roles
- **Question Randomization** - Each candidate gets different random questions
- **Auto-grading** - Automatic scoring and result calculation
- **Violation Tracking** - Logs screen lock violations
- **Audit Logging** - Tracks all system activities
- **Database Migrations** - Easy schema setup
- **Seed Data** - Demo data for testing

## 📋 Prerequisites

- **Node.js** 16+ and npm
- **PostgreSQL** 12+
- Basic knowledge of terminal/command line

## 🚀 Quick Setup

### 1. Install PostgreSQL

**Windows:**
```bash
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql

# Start PostgreSQL service
net start postgresql-x64-14
```

**macOS:**
```bash
# Using Homebrew:
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE uiges_db;

# Create user (optional)
CREATE USER uiges_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE uiges_db TO uiges_user;

# Exit
\q
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Configure Environment

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uiges_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 5. Run Migrations

```bash
# Create database tables
npm run db:migrate
```

### 6. Seed Demo Data

```bash
# Insert demo users, exams, and questions
npm run db:seed
```

### 7. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000/api`

## 📊 Demo Credentials

After seeding, you can use these credentials:

**Web Portal:**
- Admin: `admin@uiges.com` / `password`
- Teacher: `teacher@uiges.com` / `password`

**Mobile App:**
- Candidate: `candidate@uiges.com` / `password`

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/login              - Login (teachers/admins)
POST   /api/auth/logout             - Logout
GET    /api/auth/me                 - Get current user
```

### Exams (Teacher/Admin)

```
GET    /api/exams                   - List exams
GET    /api/exams/:id               - Get exam details
POST   /api/exams                   - Create exam
PUT    /api/exams/:id               - Update exam
DELETE /api/exams/:id               - Delete exam
POST   /api/exams/:id/duplicate     - Duplicate exam
GET    /api/exams/:id/candidates    - Get exam candidates
POST   /api/exams/:id/candidates    - Add candidates
GET    /api/exams/:id/questions     - Get exam questions
POST   /api/exams/:id/questions     - Add questions
```

### Question Bank (Teacher/Admin)

```
GET    /api/question-bank           - List questions
GET    /api/question-bank/:id       - Get question
POST   /api/question-bank           - Create question
PUT    /api/question-bank/:id       - Update question
DELETE /api/question-bank/:id       - Delete question
POST   /api/question-bank/bulk-import - Bulk import questions
```

### Results (Teacher/Admin)

```
GET    /api/results                 - List all results
GET    /api/results/:id             - Get detailed result
GET    /api/results/exam/:examId    - Get results by exam
GET    /api/results/:id/transcript  - Get transcript
```

### Teachers (Admin Only)

```
GET    /api/teachers                - List teachers
GET    /api/teachers/:id            - Get teacher
POST   /api/teachers                - Create teacher
PUT    /api/teachers/:id            - Update teacher
POST   /api/teachers/:id/deactivate - Deactivate teacher
```

### Audit Logs (Admin Only)

```
GET    /api/audit-logs              - List audit logs
```

### Candidate/Mobile API

```
POST   /api/candidate/auth/login    - Candidate login
GET    /api/candidate/exams         - Get assigned exams
GET    /api/candidate/exams/:id     - Get exam details
POST   /api/candidate/exams/:id/start - Start exam (randomizes questions)
POST   /api/candidate/exams/:id/save-answer - Save answer
POST   /api/candidate/exams/:id/submit - Submit exam
GET    /api/candidate/exams/:id/result - Get result
```

## 🗄️ Database Schema

### Tables

- **users** - All user types (admin, teacher, candidate)
- **exams** - Exam definitions with settings
- **questions** - Question bank
- **exam_candidates** - Links exams to candidates
- **exam_questions** - Randomized questions per candidate
- **exam_attempts** - Tracks exam attempts and results
- **exam_answers** - Individual answers
- **exam_violations** - Screen lock violations
- **audit_logs** - System activity log

### Key Features

- **Automatic timestamps** (created_at, updated_at)
- **Cascading deletes** - Cleanup related data
- **Indexes** - Optimized queries
- **Foreign keys** - Data integrity
- **Check constraints** - Data validation

## 🔒 Security Features

### Authentication
- JWT tokens with expiry
- Password hashing with bcrypt (10 rounds)
- Token refresh handling

### Authorization
- Role-based access control
- Route-level permissions
- Resource ownership checks

### Protection
- Helmet.js security headers
- CORS configuration
- Rate limiting (100 req/15min)
- SQL injection prevention (parameterized queries)
- Input validation (express-validator)

## 🛠️ Development

### Project Structure

```
backend/
├── database/
│   ├── db.js              # PostgreSQL connection
│   ├── schema.sql         # Database schema
│   ├── seed.sql           # Seed data (SQL)
│   ├── migrate.js         # Migration script
│   └── seed.js            # Seed script (JS)
├── middleware/
│   └── auth.js            # Authentication middleware
├── routes/
│   ├── auth.js            # Auth routes
│   ├── exams.js           # Exam routes
│   ├── questionBank.js    # Question bank routes
│   ├── results.js         # Results routes
│   ├── teachers.js        # Teacher management
│   ├── audit.js           # Audit logs
│   └── candidate.js       # Mobile API
├── server.js              # Express server
├── package.json
└── .env                   # Environment config
```

### Adding New Routes

1. Create route file in `routes/` directory
2. Import in `server.js`
3. Add to Express app with `app.use()`
4. Use authentication middleware
5. Add role-based authorization if needed

### Database Changes

```bash
# 1. Modify schema.sql
# 2. Drop and recreate tables
psql -U postgres -d uiges_db -f database/schema.sql

# 3. Re-seed data
npm run db:seed
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `uiges_db` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing key | - |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `CORS_ORIGIN` | Allowed origin | `http://localhost:5173` |

## 🐛 Troubleshooting

### Cannot connect to database

```bash
# Check PostgreSQL is running
# Windows:
net start postgresql-x64-14

# macOS:
brew services list

# Linux:
sudo systemctl status postgresql

# Test connection
psql -U postgres -d uiges_db -c "SELECT NOW();"
```

### Port already in use

```bash
# Change PORT in .env file
PORT=3001
```

### Migration fails

```bash
# Drop all tables and recreate
psql -U postgres -d uiges_db

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
\q

# Run migration again
npm run db:migrate
```

### Seed fails with duplicate key error

```bash
# Database already has data
# Either:
# 1. Skip seeding (use existing data)
# 2. Drop tables and re-migrate
npm run db:migrate
npm run db:seed
```

## 📈 Production Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure PostgreSQL with SSL
4. Set appropriate `CORS_ORIGIN`
5. Enable rate limiting
6. Set up logging

### Recommended Hosting

- **Backend**: Heroku, DigitalOcean, AWS, Railway
- **Database**: Heroku Postgres, AWS RDS, DigitalOcean Managed Databases

### Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create ui-ges-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your_secret_key
heroku config:set CORS_ORIGIN=https://your-frontend-url.com

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:migrate

# Seed data
heroku run npm run db:seed
```

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@uiges.com","password":"password"}'

# Test with token
curl http://localhost:3000/api/exams \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📄 License

MIT License - Free to use for educational and commercial purposes.

## 🤝 Support

For issues or questions:
1. Check this README
2. Review error logs
3. Check PostgreSQL logs
4. Open an issue on GitHub

---

**Built with ❤️ for modern education**

