/**
 * Vercel Serverless Function - Stats API
 * Get overall statistics and analytics
 */

import dbConnect from '../server/lib/dbConnect.js';
import PlayerSession from '../server/models/PlayerSession.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
  }

  try {
    await dbConnect();

    // Overall statistics
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

    // Statistics by environment
    const envStats = await PlayerSession.aggregate([
      {
        $group: {
          _id: '$environment',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      overall: stats[0] || {},
      byEnvironment: envStats
    });
  } catch (error) {
    console.error('❌ Stats API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

