/**
 * ReActure MongoDB Atlas Backend Server
 * Express server for handling player data, leaderboards, and ML dataset exports
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sessionRoutes from './routes/session.js';
import leaderboardRoutes from './routes/leaderboard.js';
import datasetRoutes from './routes/dataset.js';
import dbConnect from './lib/dbConnect.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Connect to MongoDB on startup
dbConnect().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    service: 'ReActure MongoDB API'
  });
});

// API Routes
app.use('/api/session', sessionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/dataset', datasetRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ReActure MongoDB Atlas API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      session: '/api/session',
      leaderboard: '/api/leaderboard',
      dataset: '/api/dataset'
    },
    documentation: 'https://github.com/yourrepo/reacture'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 ReActure MongoDB Atlas Backend');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API endpoints: http://localhost:${PORT}/api`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST   /api/session           - Create session');
  console.log('  PUT    /api/session/:id       - Update session');
  console.log('  GET    /api/session/:id       - Get session');
  console.log('  GET    /api/leaderboard       - Get leaderboard');
  console.log('  GET    /api/leaderboard/today - Today\'s leaderboard');
  console.log('  GET    /api/dataset/export    - Export ML dataset');
  console.log('  GET    /api/dataset/ml-ready  - Export ML-ready format');
});

export default app;

