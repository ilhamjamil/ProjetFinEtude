const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const documentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  extractedText: { type: String, required: true },
  summary: { type: String, default: '' },
  chatHistory: [messageSchema],
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
