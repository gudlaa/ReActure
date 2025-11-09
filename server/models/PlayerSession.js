/**
 * PlayerSession Schema
 * Stores complete player session data including movement, decisions, and performance
 */

import mongoose from 'mongoose';

const PlayerSessionSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
    index: true
  },
  playerName: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  environment: {
    type: String,
    required: true,
    enum: ['earthquake', 'tsunami', 'wildfire']
  },
  
  // Movement and spatial data
  movementPath: [{
    position: {
      x: Number,
      y: Number,
      z: Number
    },
    rotation: {
      yaw: Number,
      pitch: Number
    },
    timestamp: Number
  }],
  
  // Decision data
  decisions: [{
    type: {
      type: String,
      enum: ['inspect', 'rescue', 'destroy_rubble', 'refuel']
    },
    position: {
      x: Number,
      y: Number,
      z: Number
    },
    timestamp: Number,
    success: Boolean,
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Performance metrics
  score: {
    type: Number,
    default: 0
  },
  victimsSaved: {
    type: Number,
    default: 0
  },
  victimsTotal: {
    type: Number,
    default: 0
  },
  victimsDied: {
    type: Number,
    default: 0
  },
  rubbleDestroyed: {
    type: Number,
    default: 0
  },
  
  // Robot stats
  finalHealth: Number,
  finalFuel: Number,
  damageEvents: [{
    amount: Number,
    source: String,
    timestamp: Number
  }],
  
  // Time metrics
  duration: Number, // in seconds
  completionTime: Date,
  
  // Resilience and adaptation metrics
  resilienceIndex: {
    type: Number,
    default: 0
  },
  adaptationScore: {
    type: Number,
    default: 0
  },
  
  // ML Dataset fields (10Hz data)
  sensorData: [{
    timestamp: Number,
    accelerometer: {
      x: Number,
      y: Number,
      z: Number
    },
    battery: Number,
    damage: Number,
    proximity: Number,
    keyPresses: mongoose.Schema.Types.Mixed
  }],
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedChallenge: {
    type: Boolean,
    default: false
  },
  challengeType: String
}, {
  timestamps: true
});

// Indexes for efficient queries
PlayerSessionSchema.index({ score: -1 });
PlayerSessionSchema.index({ createdAt: -1 });
PlayerSessionSchema.index({ playerId: 1, createdAt: -1 });

// Calculate resilience index before saving
PlayerSessionSchema.pre('save', function(next) {
  if (this.isModified('victimsSaved') || this.isModified('finalHealth')) {
    // Resilience = (victims saved / total) * (final health / 100) * (1 - damage taken)
    const saveRate = this.victimsTotal > 0 ? this.victimsSaved / this.victimsTotal : 0;
    const healthRate = this.finalHealth / 100;
    const damageRate = 1 - (this.damageEvents.length / 100); // Normalize damage events
    
    this.resilienceIndex = (saveRate * 0.5 + healthRate * 0.3 + damageRate * 0.2) * 100;
  }
  next();
});

export default mongoose.models.PlayerSession || 
  mongoose.model('PlayerSession', PlayerSessionSchema);

