const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  day: String,        // "Lundi"
  date: String,       // "2024-01-15"
  time: String,       // "18:00 - 20:00"
  subject: String,    // "Algorithmique"
  duration: Number,   // en minutes
  type: String,       // "revision" | "quiz" | "lecture"
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', default: null },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
  completed: { type: Boolean, default: false },
});

const scheduleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalFile: { type: String },        // nom du fichier uploadé
  fileType: { type: String },            // 'pdf' | 'image'
  extractedText: { type: String },       // texte extrait (PDF) ou description (image)
  availableSlots: [{ day: String, from: String, to: String }], // créneaux libres détectés
  plan: [sessionSchema],                 // planning généré
  weekStart: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Schedule', scheduleSchema);
