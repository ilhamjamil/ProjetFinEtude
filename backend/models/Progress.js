const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  score: { type: Number, required: true },       // ex: 3
  total: { type: Number, required: true },       // ex: 5
  percentage: { type: Number, required: true },  // ex: 60
  date: { type: Date, default: Date.now }
});

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  attempts: [attemptSchema],
  bestScore: { type: Number, default: 0 },       // meilleur pourcentage
  isValidated: { type: Boolean, default: false }, // score >= 70%
  isUnlocked: { type: Boolean, default: false },  // chapitre accessible
  revisionSuggested: { type: Boolean, default: false }, // après 2 échecs
  updatedAt: { type: Date, default: Date.now }
});

// Un seul enregistrement par user + chapitre
progressSchema.index({ user: 1, chapter: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
