/**
 * Vercel Serverless Function - Dataset API
 * Export all game sessions as ML-ready dataset
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

    const { query } = req;
    const limit = parseInt(query.limit) || 100;
    const minScore = parseInt(query.minScore) || 0;
    const environment = query.environment;

    let filter = { score: { $gte: minScore } };
    
    if (environment) {
      filter.environment = environment;
    }

    const sessions = await PlayerSession.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      totalSessions: sessions.length,
      dataset: sessions,
      metadata: {
        exportedAt: new Date().toISOString(),
        minScore,
        environment: environment || 'all',
        format: 'json'
      }
    });
  } catch (error) {
    console.error('❌ Dataset API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

