/**
 * Dataset Export API Routes
 * Provides ML-ready dataset exports from MongoDB
 */

import express from 'express';
import dbConnect from '../lib/dbConnect.js';
import PlayerSession from '../models/PlayerSession.js';
import VoiceLog from '../models/VoiceLog.js';

const router = express.Router();

/**
 * GET /api/dataset/export
 * Export all sessions as ML-ready dataset
 */
router.get('/export', async (req, res) => {
  try {
    await dbConnect();
    
    const limit = parseInt(req.query.limit) || 1000;
    const format = req.query.format || 'json'; // json, csv
    
    const sessions = await PlayerSession.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=reacture_dataset.json');
      
      res.status(200).json({
        metadata: {
          exported_at: new Date(),
          total_sessions: sessions.length,
          version: '1.0'
        },
        sessions: sessions
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Unsupported format. Use format=json'
      });
    }
  } catch (error) {
    console.error('❌ Error exporting dataset:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/dataset/ml-ready
 * Export data in ML-ready format (movement paths + decisions)
 */
router.get('/ml-ready', async (req, res) => {
  try {
    await dbConnect();
    
    const sessions = await PlayerSession.find()
      .select('sessionId playerId environment movementPath decisions sensorData score victimsSaved')
      .limit(1000);
    
    // Transform to ML-friendly format
    const mlDataset = sessions.map(session => ({
      session_id: session.sessionId,
      player_id: session.playerId,
      environment: session.environment,
      
      // Spatial features
      trajectory: session.movementPath.map(p => ({
        x: p.position.x,
        y: p.position.y,
        z: p.position.z,
        yaw: p.rotation.yaw,
        pitch: p.rotation.pitch,
        t: p.timestamp
      })),
      
      // Decision features
      actions: session.decisions.map(d => ({
        type: d.type,
        x: d.position.x,
        y: d.position.y,
        z: d.position.z,
        t: d.timestamp,
        success: d.success
      })),
      
      // Sensor features (10Hz)
      sensors: session.sensorData.map(s => ({
        t: s.timestamp,
        accel_x: s.accelerometer.x,
        accel_y: s.accelerometer.y,
        accel_z: s.accelerometer.z,
        battery: s.battery,
        damage: s.damage,
        proximity: s.proximity
      })),
      
      // Labels
      score: session.score,
      victims_saved: session.victimsSaved
    }));
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=reacture_ml_dataset.json');
    
    res.status(200).json({
      metadata: {
        format: 'ml-ready',
        exported_at: new Date(),
        total_samples: mlDataset.length,
        features: ['trajectory', 'actions', 'sensors'],
        labels: ['score', 'victims_saved']
      },
      data: mlDataset
    });
  } catch (error) {
    console.error('❌ Error exporting ML dataset:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/dataset/voice
 * Export all voice logs
 */
router.get('/voice', async (req, res) => {
  try {
    await dbConnect();
    
    const voiceLogs = await VoiceLog.find()
      .sort({ createdAt: -1 })
      .limit(10000);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=reacture_voice_logs.json');
    
    res.status(200).json({
      metadata: {
        exported_at: new Date(),
        total_logs: voiceLogs.length
      },
      logs: voiceLogs
    });
  } catch (error) {
    console.error('❌ Error exporting voice logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/dataset/stats
 * Get dataset statistics
 */
router.get('/stats', async (req, res) => {
  try {
    await dbConnect();
    
    const stats = {
      sessions: await PlayerSession.countDocuments(),
      voiceLogs: await VoiceLog.countDocuments(),
      totalMovementPoints: await PlayerSession.aggregate([
        { $project: { pathLength: { $size: '$movementPath' } } },
        { $group: { _id: null, total: { $sum: '$pathLength' } } }
      ]),
      totalDecisions: await PlayerSession.aggregate([
        { $project: { decisionsCount: { $size: '$decisions' } } },
        { $group: { _id: null, total: { $sum: '$decisionsCount' } } }
      ]),
      byEnvironment: await PlayerSession.aggregate([
        { $group: { _id: '$environment', count: { $sum: 1 } } }
      ])
    };
    
    res.status(200).json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('❌ Error fetching dataset stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

