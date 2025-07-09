const mongoose = require('mongoose');

const typingTestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  wpm: {
    type: Number,
    required: true,
    min: 0
  },
  accuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  duration: {
    type: Number,
    required: true,
    enum: [15, 30, 60, 120], // Test durations in seconds
    default: 30
  },
  mode: {
    type: String,
    enum: ['time', 'words', 'quote'],
    default: 'time'
  },
  language: {
    type: String,
    enum: ['english', 'french', 'spanish', 'german'],
    default: 'english'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  charactersTyped: {
    type: Number,
    required: true,
    min: 0
  },
  errorsCount: {
    type: Number,
    required: true,
    min: 0
  },
  correctCharacters: {
    type: Number,
    required: true,
    min: 0
  },
  totalCharacters: {
    type: Number,
    required: true,
    min: 0
  },
  testText: {
    type: String,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
typingTestSchema.index({ userId: 1, completedAt: -1 });
typingTestSchema.index({ duration: 1, wpm: -1 });
typingTestSchema.index({ mode: 1, language: 1, wpm: -1 });

// Virtual for calculating raw WPM
typingTestSchema.virtual('rawWpm').get(function() {
  return Math.round((this.charactersTyped / 5) / (this.duration / 60));
});

// Calculate score based on WPM and accuracy
typingTestSchema.virtual('score').get(function() {
  return Math.round(this.wpm * (this.accuracy / 100));
});

module.exports = mongoose.model('TypingTest', typingTestSchema);
