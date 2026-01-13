require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const gigRoutes = require('./routes/gigs');
const bidRoutes = require('./routes/bids');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalRateLimit } = require('./middleware/rateLimiter');

const app = express();

// Connect to database
connectDB();

// Apply general rate limiting to all routes
app.use(generalRateLimit);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'GigFlow API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/bids', bidRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`GigFlow server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Rate limiting enabled for security`);
});