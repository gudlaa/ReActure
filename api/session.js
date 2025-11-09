/**
 * Vercel Serverless Function - Session API
 * Handles player session creation, updates, and retrieval
 */

import dbConnect from '../server/lib/dbConnect.js';
import PlayerSession from '../server/models/PlayerSession.js';
import VoiceLog from '../server/models/VoiceLog.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await dbConnect();

    const { method, query } = req;
    const { sessionId } = query;

    switch (method) {
      case 'POST':
        // Create new session or add data to existing session
        if (sessionId) {
          // POST /api/session?sessionId=xxx&type=movement
          const type = query.type;
          
          if (type === 'movement') {
            const session = await PlayerSession.findOneAndUpdate(
              { sessionId },
              { $push: { movementPath: req.body } },
              { new: true }
            );
            
            if (!session) {
              return res.status(404).json({
                success: false,
                error: 'Session not found'
              });
            }
            
            return res.status(200).json({
              success: true,
              pathLength: session.movementPath.length
            });
          } else if (type === 'decision') {
            const session = await PlayerSession.findOneAndUpdate(
              { sessionId },
              { $push: { decisions: req.body } },
              { new: true }
            );
            
            if (!session) {
              return res.status(404).json({
                success: false,
                error: 'Session not found'
              });
            }
            
            return res.status(200).json({
              success: true,
              decisionsCount: session.decisions.length
            });
          } else if (type === 'voice') {
            const voiceLog = new VoiceLog({
              ...req.body,
              sessionId
            });
            
            await voiceLog.save();
            
            return res.status(201).json({
              success: true,
              voiceLog
            });
          }
        } else {
          // Create new session
          const session = new PlayerSession(req.body);
          await session.save();
          
          console.log('✅ Session created:', session.sessionId);
          
          return res.status(201).json({
            success: true,
            session
          });
        }
        break;

      case 'PUT':
        // Update session
        if (!sessionId) {
          return res.status(400).json({
            success: false,
            error: 'sessionId required'
          });
        }

        const updatedSession = await PlayerSession.findOneAndUpdate(
          { sessionId },
          { $set: req.body },
          { new: true, runValidators: true }
        );
        
        if (!updatedSession) {
          return res.status(404).json({
            success: false,
            error: 'Session not found'
          });
        }
        
        console.log('✅ Session updated:', updatedSession.sessionId);
        
        return res.status(200).json({
          success: true,
          session: updatedSession
        });

      case 'GET':
        // Get session(s)
        if (sessionId) {
          // Get specific session
          const session = await PlayerSession.findOne({ sessionId });
          
          if (!session) {
            return res.status(404).json({
              success: false,
              error: 'Session not found'
            });
          }
          
          return res.status(200).json({
            success: true,
            session
          });
        } else if (query.playerId) {
          // Get all sessions for a player
          const sessions = await PlayerSession.find({ playerId: query.playerId })
            .sort({ createdAt: -1 })
            .limit(50);
          
          return res.status(200).json({
            success: true,
            count: sessions.length,
            sessions
          });
        } else {
          return res.status(400).json({
            success: false,
            error: 'sessionId or playerId required'
          });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({
          success: false,
          error: `Method ${method} Not Allowed`
        });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

