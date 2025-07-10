import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { taskRoutes } from './routes/tasks';
import { projectRoutes } from './routes/projects';
import { uploadRoutes } from './routes/upload';
import commentRoutes from './routes/comments';
import likeRoutes from './routes/likes';
import aiRoutes from './routes/ai';
import { initializeDatabase } from './database/init';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http://*:5000", "http://*:3000"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "http://*:5000", "http://*:3000"]
    }
  }
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and any IP address on port 3000
    if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+):3000$/)) {
      return callback(null, true);
    }
    
    // In development, also allow any origin for easier testing
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Reject other origins in production
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Serve uploaded files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'BackVault API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      projects: '/api/projects',
      tasks: '/api/tasks',
      upload: '/api/upload',
      comments: '/api/comments',
      likes: '/api/likes',
      ai: '/api/ai'
    }
  });
});

// Catch-all for undefined routes
app.get('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'API endpoint not found',
    availableEndpoints: [
      '/api/health',
      '/api/auth',
      '/api/users',
      '/api/projects',
      '/api/tasks',
      '/api/upload',
      '/api/comments',
      '/api/likes',
      '/api/ai'
    ]
  });
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Network access: http://0.0.0.0:${PORT}/api/health`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }); 