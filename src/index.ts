import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please set these environment variables in Railway dashboard');
  console.error('Continuing with default values...');
}

// Set defaults for missing environment variables
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'default-jwt-secret-change-in-production';
  console.warn('⚠️ Using default JWT_SECRET - please set this in production');
}

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

console.log('🔧 Environment check:');
console.log(`   PORT: ${PORT}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Missing'}`);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Basic security
app.use(helmet({
  contentSecurityPolicy: false
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check - this MUST work for Railway
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'OK', 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'BackVault API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      test: '/api/test'
    }
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Serve uploaded files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Load routes with error handling
try {
  const { authRoutes } = require('./routes/auth');
  const { userRoutes } = require('./routes/users');
  const { taskRoutes } = require('./routes/tasks');
  const { projectRoutes } = require('./routes/projects');
  const { uploadRoutes } = require('./routes/upload');
  const commentRoutes = require('./routes/comments');
  const likeRoutes = require('./routes/likes');
  const aiRoutes = require('./routes/ai');

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/likes', likeRoutes);
  app.use('/api/ai', aiRoutes);
  
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  console.log('⚠️ Server running with basic endpoints only');
}

// Additional health check at root
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Catch-all for undefined routes
app.get('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'API endpoint not found',
    availableEndpoints: [
      '/api/health',
      '/api/test'
    ]
  });
});

// Start server immediately
console.log('🚀 Starting server...');
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Network access: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  
  // Initialize database in background
  try {
    const { initializeDatabase } = require('./database/init');
    initializeDatabase()
      .then(() => {
        console.log('✅ Database initialized successfully');
      })
      .catch((error: any) => {
        console.error('❌ Failed to initialize database:', error);
        console.log('⚠️ Server running without database');
      });
  } catch (error) {
    console.error('❌ Error loading database module:', error);
    console.log('⚠️ Server running without database');
  }
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}); 