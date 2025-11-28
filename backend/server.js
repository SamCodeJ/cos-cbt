const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const os = require('os');
require('dotenv').config();

const db = require('./database/db');
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');
const questionBankRoutes = require('./routes/questionBank');
const resultsRoutes = require('./routes/results');
const teacherRoutes = require('./routes/teachers');
const auditRoutes = require('./routes/audit');
const candidateRoutes = require('./routes/candidate');

const app = express();
const PORT = process.env.PORT || 3001;

// Function to get local IP address
const getLocalIPAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Configure allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8081',
  'http://localhost:19006'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting (more permissive in development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 in dev, 100 in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter);

console.log(`🛡️  Rate limiting: ${process.env.NODE_ENV === 'production' ? '100' : '1000'} requests per 15 minutes`);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/question-bank', questionBankRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/candidate', candidateRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  const localIP = getLocalIPAddress();
  
  console.log(`🚀 UI-GES Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📱 Mobile Device URL: http://${localIP}:${PORT}/api`);
  console.log(`💡 Configure mobile app with IP: ${localIP}`);
  
  // Test database connection
  try {
    await db.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Run migrations: Add shuffled answer columns if they don't exist
    await db.query(`
      ALTER TABLE exam_questions 
      ADD COLUMN IF NOT EXISTS shuffled_correct_answer VARCHAR(1),
      ADD COLUMN IF NOT EXISTS shuffled_option_a TEXT,
      ADD COLUMN IF NOT EXISTS shuffled_option_b TEXT,
      ADD COLUMN IF NOT EXISTS shuffled_option_c TEXT,
      ADD COLUMN IF NOT EXISTS shuffled_option_d TEXT;
    `);
    console.log('✅ Database schema up to date (shuffled answer columns verified)');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
});

module.exports = app;
