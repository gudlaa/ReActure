/**
 * MongoDB Atlas Integration Service
 * Frontend service for communicating with MongoDB Atlas backend
 */

const MONGODB_API_URL = 'http://localhost:3001/api';

class MongoDBService {
    constructor() {
        this.currentSessionId = null;
        this.enabled = true; // Toggle for Data Mode
        this.batchBuffer = []; // Buffer for batching requests
        this.batchInterval = null;
    }

    /**
     * Initialize a new player session
     */
    async createSession(sessionData) {
        if (!this.enabled) return null;

        try {
            const response = await fetch(`${MONGODB_API_URL}/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerId: sessionData.playerId,
                    playerName: sessionData.playerName,
                    sessionId: sessionData.sessionId,
                    environment: sessionData.environment,
                    victimsTotal: sessionData.victimsTotal,
                    movementPath: [],
                    decisions: [],
                    sensorData: [],
                    createdAt: new Date()
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentSessionId = sessionData.sessionId;
                console.log('✅ MongoDB session created:', this.currentSessionId);
                return data.session;
            } else {
                console.error('❌ Failed to create session:', data.error);
                return null;
            }
        } catch (error) {
            console.error('❌ MongoDB createSession error:', error);
            return null;
        }
    }

    /**
     * Update session with final results
     */
    async finalizeSession(finalData) {
        if (!this.enabled || !this.currentSessionId) return null;

        try {
            const response = await fetch(`${MONGODB_API_URL}/session/${this.currentSessionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    score: finalData.score,
                    victimsSaved: finalData.victimsSaved,
                    victimsDied: finalData.victimsDied,
                    rubbleDestroyed: finalData.rubbleDestroyed,
                    finalHealth: finalData.finalHealth,
                    finalFuel: finalData.finalFuel,
                    duration: finalData.duration,
                    completionTime: new Date(),
                    completedChallenge: finalData.completedChallenge || false,
                    challengeType: finalData.challengeType || null,
                    damageEvents: finalData.damageEvents || []
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ MongoDB session finalized:', this.currentSessionId);
                return data.session;
            } else {
                console.error('❌ Failed to finalize session:', data.error);
                return null;
            }
        } catch (error) {
            console.error('❌ MongoDB finalizeSession error:', error);
            return null;
        }
    }

    /**
     * Log a movement point (batched for efficiency)
     */
    logMovement(movementData) {
        if (!this.enabled || !this.currentSessionId) return;

        this.batchBuffer.push({
            type: 'movement',
            data: movementData
        });

        // Send batch every 5 seconds or 50 items
        if (this.batchBuffer.length >= 50) {
            this.flushBatch();
        }
    }

    /**
     * Log a player decision
     */
    async logDecision(decisionData) {
        if (!this.enabled || !this.currentSessionId) return;

        try {
            await fetch(`${MONGODB_API_URL}/session/${this.currentSessionId}/decision`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(decisionData)
            });
        } catch (error) {
            console.error('❌ MongoDB logDecision error:', error);
        }
    }

    /**
     * Log a voice event
     */
    async logVoiceEvent(voiceData) {
        if (!this.enabled || !this.currentSessionId) return;

        try {
            await fetch(`${MONGODB_API_URL}/session/${this.currentSessionId}/voice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(voiceData)
            });
        } catch (error) {
            console.error('❌ MongoDB logVoiceEvent error:', error);
        }
    }

    /**
     * Flush batched movement data
     */
    async flushBatch() {
        if (this.batchBuffer.length === 0) return;

        const movements = this.batchBuffer.filter(item => item.type === 'movement');

        if (movements.length > 0) {
            try {
                for (const movement of movements) {
                    await fetch(`${MONGODB_API_URL}/session/${this.currentSessionId}/movement`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(movement.data)
                    });
                }
            } catch (error) {
                console.error('❌ MongoDB flushBatch error:', error);
            }
        }

        this.batchBuffer = [];
    }

    /**
     * Fetch leaderboard data
     */
    async getLeaderboard(type = 'score', limit = 20) {
        try {
            const response = await fetch(`${MONGODB_API_URL}/leaderboard?type=${type}&limit=${limit}`);
            const data = await response.json();

            if (data.success) {
                return data.leaderboard;
            }
            return [];
        } catch (error) {
            console.error('❌ MongoDB getLeaderboard error:', error);
            return [];
        }
    }

    /**
     * Fetch today's leaderboard
     */
    async getTodayLeaderboard() {
        try {
            const response = await fetch(`${MONGODB_API_URL}/leaderboard/today`);
            const data = await response.json();

            if (data.success) {
                return data.leaderboard;
            }
            return [];
        } catch (error) {
            console.error('❌ MongoDB getTodayLeaderboard error:', error);
            return [];
        }
    }

    /**
     * Fetch friends leaderboard
     */
    async getFriendsLeaderboard(friendIds) {
        try {
            const response = await fetch(`${MONGODB_API_URL}/leaderboard/friends`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ playerIds: friendIds })
            });
            const data = await response.json();

            if (data.success) {
                return data.leaderboard;
            }
            return [];
        } catch (error) {
            console.error('❌ MongoDB getFriendsLeaderboard error:', error);
            return [];
        }
    }

    /**
     * Get dataset statistics
     */
    async getDatasetStats() {
        try {
            const response = await fetch(`${MONGODB_API_URL}/dataset/stats`);
            const data = await response.json();

            if (data.success) {
                return data.stats;
            }
            return null;
        } catch (error) {
            console.error('❌ MongoDB getDatasetStats error:', error);
            return null;
        }
    }

    /**
     * Export ML-ready dataset
     */
    async exportMLDataset() {
        try {
            const response = await fetch(`${MONGODB_API_URL}/dataset/ml-ready`);
            const blob = await response.blob();
            
            // Download file
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `reacture_ml_dataset_${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            console.log('✅ ML dataset exported');
            return true;
        } catch (error) {
            console.error('❌ MongoDB exportMLDataset error:', error);
            return false;
        }
    }

    /**
     * Toggle Data Mode (enable/disable MongoDB logging)
     */
    toggleDataMode(enabled) {
        this.enabled = enabled;
        console.log(`📊 Data Mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
        
        if (enabled) {
            // Start batch interval
            this.batchInterval = setInterval(() => {
                this.flushBatch();
            }, 5000);
        } else {
            // Stop batch interval and flush remaining data
            if (this.batchInterval) {
                clearInterval(this.batchInterval);
                this.flushBatch();
            }
        }
    }

    /**
     * Check if MongoDB backend is available
     */
    async checkConnection() {
        try {
            const response = await fetch(`${MONGODB_API_URL.replace('/api', '')}/health`);
            const data = await response.json();
            return data.status === 'ok';
        } catch (error) {
            console.warn('⚠️  MongoDB backend not available');
            return false;
        }
    }
}

// Global instance - make it available globally (not as module)
window.mongoService = new MongoDBService();
const mongoService = window.mongoService;

// Check connection on load
mongoService.checkConnection().then(connected => {
    if (connected) {
        console.log('✅ MongoDB Atlas backend connected');
        mongoService.toggleDataMode(true);
    } else {
        console.warn('⚠️  MongoDB Atlas backend not available - running in local mode');
        mongoService.toggleDataMode(false);
    }
});

