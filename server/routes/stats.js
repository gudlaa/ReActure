/**
 * Stats API endpoint for public landing page
 * Returns aggregate statistics for display
 */

import express from 'express';
import PlayerSession from '../models/PlayerSession.js';

const router = express.Router();

// Get aggregate stats for landing page
router.get('/', async (req, res) => {
    try {
        // Get total sessions
        const totalSessions = await PlayerSession.countDocuments();
        
        // Get unique players
        const uniquePlayers = (await PlayerSession.distinct('playerId')).length;
        
        // Get total victims rescued
        const victimsResult = await PlayerSession.aggregate([
            { $group: { _id: null, total: { $sum: '$victimsSaved' } } }
        ]);
        const totalVictimsRescued = victimsResult[0]?.total || 0;
        
        // Calculate total data points (each session = ~1800 sensor readings)
        const totalDataPoints = totalSessions * 1800;
        
        res.json({
            success: true,
            totalSessions,
            uniquePlayers,
            totalVictimsRescued,
            totalDataPoints,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Stats API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;

