/**
 * Leaderboard API Routes
 * Provides various leaderboard views and statistics
 */

import express from 'express';
import dbConnect from '../lib/dbConnect.js';
import PlayerSession from '../models/PlayerSession.js';

const router = express.Router();

/**
 * GET /api/leaderboard
 * Get global leaderboard (top scores)
 */
router.get('/', async (req, res) => {
  try {
    await dbConnect();
    
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type || 'score'; // score, resilience, saves
    
    let sortField = {};
    switch (type) {
      case 'resilience':
        sortField = { resilienceIndex: -1 };
        break;
      case 'saves':
        sortField = { victimsSaved: -1 };
        break;
      case 'score':
      default:
        sortField = { score: -1 };
        break;
    }
    
    const sessions = await PlayerSession.find()
      .sort(sortField)
      .limit(limit)
      .select('playerId playerName score victimsSaved resilienceIndex environment duration createdAt');
    
    res.status(200).json({
      success: true,
      type: type,
      count: sessions.length,
      leaderboard: sessions
    });
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/leaderboard/today
 * Get today's leaderboard
 */
router.get('/today', async (req, res) => {
  try {
    await dbConnect();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sessions = await PlayerSession.find({
      createdAt: { $gte: today }
    })
      .sort({ score: -1 })
      .limit(20)
      .select('playerId playerName score victimsSaved environment duration createdAt');
    
    res.status(200).json({
      success: true,
      date: today,
      count: sessions.length,
      leaderboard: sessions
    });
  } catch (error) {
    console.error('❌ Error fetching today\'s leaderboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/leaderboard/environment/:env
 * Get leaderboard for specific environment
 */
router.get('/environment/:env', async (req, res) => {
  try {
    await dbConnect();
    
    const sessions = await PlayerSession.find({
      environment: req.params.env
    })
      .sort({ score: -1 })
      .limit(20)
      .select('playerId playerName score victimsSaved environment duration createdAt');
    
    res.status(200).json({
      success: true,
      environment: req.params.env,
      count: sessions.length,
      leaderboard: sessions
    });
  } catch (error) {
    console.error('❌ Error fetching environment leaderboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/leaderboard/stats
 * Get overall statistics
 */
router.get('/stats', async (req, res) => {
  try {
    await dbConnect();
    
    const stats = await PlayerSession.aggregate([
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalVictimsSaved: { $sum: '$victimsSaved' },
          totalScore: { $sum: '$score' },
          avgScore: { $avg: '$score' },
          avgDuration: { $avg: '$duration' },
          avgResilienceIndex: { $avg: '$resilienceIndex' },
          topScore: { $max: '$score' }
        }
      }
    ]);
    
    const envStats = await PlayerSession.aggregate([
      {
        $group: {
          _id: '$environment',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      overall: stats[0] || {},
      byEnvironment: envStats
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/leaderboard/friends
 * Get leaderboard for specific friend list
 */
router.post('/friends', async (req, res) => {
  try {
    await dbConnect();
    
    const { playerIds } = req.body;
    
    if (!playerIds || !Array.isArray(playerIds)) {
      return res.status(400).json({
        success: false,
        error: 'playerIds array required'
      });
    }
    
    const sessions = await PlayerSession.find({
      playerId: { $in: playerIds }
    })
      .sort({ score: -1 })
      .limit(20)
      .select('playerId playerName score victimsSaved environment duration createdAt');
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      leaderboard: sessions
    });
  } catch (error) {
    console.error('❌ Error fetching friends leaderboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

