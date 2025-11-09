/**
 * Vercel Serverless Function - Leaderboard API
 * Provides various leaderboard views and statistics
 */

import dbConnect from '../server/lib/dbConnect.js';
import PlayerSession from '../server/models/PlayerSession.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
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

    if (method === 'GET') {
      const type = query.type || 'score';
      const limit = parseInt(query.limit) || 20;
      const environment = query.environment;
      const today = query.today === 'true';

      let filter = {};
      
      // Filter by environment if specified
      if (environment) {
        filter.environment = environment;
      }
      
      // Filter by today if specified
      if (today) {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        filter.createdAt = { $gte: todayDate };
      }

      // Determine sort field
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

      const sessions = await PlayerSession.find(filter)
        .sort(sortField)
        .limit(limit)
        .select('playerId playerName score victimsSaved resilienceIndex environment duration createdAt');

      return res.status(200).json({
        success: true,
        type,
        count: sessions.length,
        leaderboard: sessions
      });
    } else if (method === 'POST') {
      // Friends leaderboard
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

      return res.status(200).json({
        success: true,
        count: sessions.length,
        leaderboard: sessions
      });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: `Method ${method} Not Allowed`
      });
    }
  } catch (error) {
    console.error('❌ Leaderboard API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

