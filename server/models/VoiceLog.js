/**
 * VoiceLog Schema
 * Stores voice narration events and player interactions
 */

import mongoose from 'mongoose';

const VoiceLogSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  playerId: {
    type: String,
    required: true
  },
  
  event: {
    type: String,
    required: true,
    enum: [
      'game_start',
      'victim_found',
      'victim_rescued',
      'victim_died',
      'rubble_cleared',
      'low_fuel',
      'low_health',
      'refuel',
      'game_complete',
      'challenge_start',
      'custom'
    ]
  },
  
  text: {
    type: String,
    required: true
  },
  
  voiceId: {
    type: String,
    default: 'default'
  },
  
  context: {
    position: {
      x: Number,
      y: Number,
      z: Number
    },
    robotHealth: Number,
    robotFuel: Number,
    victimsRemaining: Number
  },
  
  timestamp: {
    type: Number,
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
VoiceLogSchema.index({ sessionId: 1, timestamp: 1 });
VoiceLogSchema.index({ event: 1 });

export default mongoose.models.VoiceLog || 
  mongoose.model('VoiceLog', VoiceLogSchema);

