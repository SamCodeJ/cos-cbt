const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const os = require('os');
const cluster = require('cluster');
require('dotenv').config();
// C-COS Backend Server

const numCPUs = os.cpus().length;

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
  'http://localhost:19006',
  'https://segiu.shop',
  'https://www.segiu.shop',
  'https://app.segiu.shop'
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

// Rate limiting - Optimized for 2000 concurrent candidates
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 15000 : 20000, // Increased significantly to prevent false blocks during exam
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});
app.use('/api/', limiter);

// Body parsing middleware with optimized limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add compression for better performance with many concurrent users
const compression = require('compression');
app.use(compression({
  level: 6, // Compression level (0-9, 6 is good balance)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Reduce logging in production to prevent blocking
  app.use(morgan('short', {
    skip: function (req, res) { return res.statusCode < 400 || req.url.includes('/save-answer') }
  }));
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (cluster.isPrimary || cluster.isMaster) {
  console.log(`🚀 Primary cluster ${process.pid} is running`);
  console.log(`🚀 Forking for ${numCPUs} CPUs`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`❌ Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const db = require('./database/db');
  const authRoutes = require('./routes/auth');
  const examRoutes = require('./routes/exams');
  const questionBankRoutes = require('./routes/questionBank');
  const resultsRoutes = require('./routes/results');
  const teacherRoutes = require('./routes/teachers');
  const auditRoutes = require('./routes/audit');
  const candidateRoutes = require('./routes/candidate');

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
}

// Start server
if (!cluster.isPrimary && !cluster.isMaster) {
  app.listen(PORT, '0.0.0.0', async () => {
    const localIP = getLocalIPAddress();
    
    console.log(`🚀 Worker ${process.pid} running on port ${PORT}`);
    
    // Test database connection
    try {
      // NOTE: db needs to be required globally or passed to the cluster
      const db = require('./database/db');
      await db.query('SELECT NOW()');
      console.log(`✅ Worker ${process.pid} Database connection successful`);
    } catch (error) {
      console.error(`❌ Worker ${process.pid} Database connection failed:`, error.message);
    }
  });
}

module.exports = app;
