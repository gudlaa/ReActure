/**
 * Session API Routes
 * Handles player session creation, updates, and retrieval
 */

import express from 'express';
import dbConnect from '../lib/dbConnect.js';
import PlayerSession from '../models/PlayerSession.js';
import VoiceLog from '../models/VoiceLog.js';

const router = express.Router();

/**
 * POST /api/session
 * Create a new player session
 */
router.post('/', async (req, res) => {
  try {
    await dbConnect();
    
    const session = new PlayerSession(req.body);
    await session.save();
    
    console.log('✅ Session created:', session.sessionId);
    
    res.status(201).json({
      success: true,
      session: session
    });
  } catch (error) {
    console.error('❌ Error creating session:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/session/:sessionId
 * Update an existing session with new data
 */
router.put('/:sessionId', async (req, res) => {
  try {
    await dbConnect();
    
    const session = await PlayerSession.findOneAndUpdate(
      { sessionId: req.params.sessionId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    console.log('✅ Session updated:', session.sessionId);
    
    res.status(200).json({
      success: true,
      session: session
    });
  } catch (error) {
    console.error('❌ Error updating session:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/session/:sessionId/movement
 * Append movement data to session (for real-time tracking)
 */
router.post('/:sessionId/movement', async (req, res) => {
  try {
    await dbConnect();
    
    const session = await PlayerSession.findOneAndUpdate(
      { sessionId: req.params.sessionId },
      { $push: { movementPath: req.body } },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.status(200).json({
      success: true,
      pathLength: session.movementPath.length
    });
  } catch (error) {
    console.error('❌ Error adding movement:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/session/:sessionId/decision
 * Log a player decision
 */
router.post('/:sessionId/decision', async (req, res) => {
  try {
    await dbConnect();
    
    const session = await PlayerSession.findOneAndUpdate(
      { sessionId: req.params.sessionId },
      { $push: { decisions: req.body } },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.status(200).json({
      success: true,
      decisionsCount: session.decisions.length
    });
  } catch (error) {
    console.error('❌ Error logging decision:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/session/:sessionId
 * Retrieve a specific session
 */
router.get('/:sessionId', async (req, res) => {
  try {
    await dbConnect();
    
    const session = await PlayerSession.findOne({ sessionId: req.params.sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.status(200).json({
      success: true,
      session: session
    });
  } catch (error) {
    console.error('❌ Error retrieving session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/session/player/:playerId
 * Get all sessions for a specific player
 */
router.get('/player/:playerId', async (req, res) => {
  try {
    await dbConnect();
    
    const sessions = await PlayerSession.find({ playerId: req.params.playerId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions: sessions
    });
  } catch (error) {
    console.error('❌ Error retrieving player sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/session/:sessionId/voice
 * Log a voice event
 */
router.post('/:sessionId/voice', async (req, res) => {
  try {
    await dbConnect();
    
    const voiceLog = new VoiceLog({
      ...req.body,
      sessionId: req.params.sessionId
    });
    
    await voiceLog.save();
    
    res.status(201).json({
      success: true,
      voiceLog: voiceLog
    });
  } catch (error) {
    console.error('❌ Error logging voice event:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

