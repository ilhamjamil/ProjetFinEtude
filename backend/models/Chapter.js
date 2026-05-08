const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  order: { type: Number, required: true }, // 0, 1, 2, ...
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chapter', chapterSchema);
