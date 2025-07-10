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

// Better PORT handling for Railway
let PORT: number;
try {
  const portStr = process.env.PORT || '5000';
  PORT = parseInt(portStr, 10);
  
  // Validate PORT is a valid number
  if (isNaN(PORT) || PORT < 0 || PORT > 65535) {
    console.warn(`Invalid PORT value: ${portStr}, using default: 5000`);
    PORT = 5000;
  }
} catch (error) {
  console.warn('Error parsing PORT, using default: 5000', error);
  PORT = 5000;
}

console.log(`🔧 Environment check:`);
console.log(`   PORT: ${PORT} (from ${process.env.PORT || 'default'})`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

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
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from the React app build
const buildPath = path.join(__dirname, '../build');
console.log('Build path:', buildPath);

// Check if build directory exists
if (require('fs').existsSync(buildPath)) {
  console.log('✅ React build directory found');
  app.use(express.static(buildPath));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  console.log('❌ React build directory not found at:', buildPath);
  // Fallback for when build doesn't exist
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Server is running but React build not found',
      buildPath: buildPath,
      dirname: __dirname,
      availablePaths: require('fs').readdirSync(__dirname + '/..')
    });
  });
}

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