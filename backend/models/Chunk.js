const mongoose = require('mongoose');

/**
 * Chunk — stocke les fragments de document pour le RAG TF-IDF
 * 
 * ⚠️  PROTECTION BASE DE DONNÉES :
 * - Index TTL : les chunks sont auto-supprimés après 30 jours d'inactivité
 * - Index composé : recherche rapide par document+user
 * - Taille estimée : ~0.15 KB par chunk → 50 cours × 50 chunks = ~375 KB total
 */
const chunkSchema = new mongoose.Schema({
  document:  { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  index:     { type: Number, required: true },
  text:      { type: String, required: true },
  tfidf:     { type: Map, of: Number },
  wordCount: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

// Index composé pour recherche rapide
chunkSchema.index({ document: 1, user: 1 });

// TTL index : suppression automatique après 30 jours (protection espace disque)
chunkSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Chunk', chunkSchema);
