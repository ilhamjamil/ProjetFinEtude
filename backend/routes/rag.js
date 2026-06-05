const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const authMiddleware = require('../middleware/auth');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { indexDocument, searchChunks } = require('../utils/tfidf');

router.use(authMiddleware);

async function askGroq(messages, maxTokens = 1024) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Clé API Groq manquante');
  const groq = new Groq({ apiKey });
  const res = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages,
    max_tokens: maxTokens,
    temperature: 0.5,
  });
  return res.choices[0].message.content;
}

// POST /api/rag/index/:docId
// Indexe un document : découpe en chunks + calcule TF-IDF + stocke en MongoDB
router.post('/index/:docId', async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.docId, user: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Document non trouvé' });

    // Supprimer les anciens chunks de ce document
    await Chunk.deleteMany({ document: doc._id, user: req.user._id });

    // Indexer le document
    const chunks = indexDocument(doc.extractedText);

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'Impossible d\'indexer ce document' });
    }

    // Sauvegarder les chunks en MongoDB
    const chunkDocs = chunks.map(c => ({
      document: doc._id,
      user: req.user._id,
      index: c.index,
      text: c.text,
      tfidf: c.tfidf,
      wordCount: c.wordCount,
    }));

    await Chunk.insertMany(chunkDocs);

    res.json({
      message: `Document indexé avec succès`,
      chunksCount: chunks.length,
      docId: doc._id,
    });

  } catch (error) {
    console.error('Erreur indexation RAG:', error.message);
    res.status(500).json({ error: error.message || 'Erreur indexation' });
  }
});

// GET /api/rag/status/:docId
// Vérifie si un document est indexé
router.get('/status/:docId', async (req, res) => {
  try {
    const count = await Chunk.countDocuments({ document: req.params.docId, user: req.user._id });
    res.json({ indexed: count > 0, chunksCount: count });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/rag/chat/:docId
// Chat avec RAG : cherche les chunks pertinents puis répond
router.post('/chat/:docId', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message requis' });

    const doc = await Document.findOne({ _id: req.params.docId, user: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Document non trouvé' });

    // Récupérer tous les chunks du document
    const allChunks = await Chunk.find({ document: doc._id, user: req.user._id }).lean();

    let contextText = '';
    let retrievedChunks = [];
    let ragUsed = false;

    if (allChunks.length > 0) {
      // RAG : recherche par similarité TF-IDF
      retrievedChunks = searchChunks(message, allChunks, 3);
      ragUsed = true;

      if (retrievedChunks.length > 0) {
        contextText = retrievedChunks
          .map((c, i) => `[Passage ${i + 1} — pertinence: ${(c.score * 100).toFixed(0)}%]\n${c.text}`)
          .join('\n\n---\n\n');
      } else {
        // Fallback si aucun chunk pertinent trouvé
        contextText = doc.extractedText.substring(0, 3000);
        ragUsed = false;
      }
    } else {
      // Pas encore indexé → utilise le texte complet
      contextText = doc.extractedText.substring(0, 6000);
    }

    // Construire l'historique pour Groq
    const systemPrompt = `Tu es un tuteur pédagogique expert pour étudiants marocains en informatique.
Niveau : Licence (Bac+1 à Bac+3), système universitaire marocain.
Réponds TOUJOURS en français, de façon claire et pédagogique.
Réponds UNIQUEMENT en te basant sur les passages du cours fournis.
Si la réponse n'est pas dans les passages, dis-le honnêtement.

${ragUsed ? `PASSAGES PERTINENTS EXTRAITS DU COURS (sélectionnés par RAG) :` : `CONTENU DU COURS :`}
${contextText}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      // Historique récent
      ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const reply = await askGroq(messages, 1024);

    // Sauvegarder dans l'historique du document
    doc.chatHistory.push({ role: 'user', content: message });
    doc.chatHistory.push({ role: 'assistant', content: reply });
    await doc.save();

    res.json({
      reply,
      ragUsed,
      chunksUsed: retrievedChunks.length,
      passages: retrievedChunks.map(c => ({
        text: c.text.substring(0, 150) + '...',
        score: (c.score * 100).toFixed(1) + '%'
      }))
    });

  } catch (error) {
    console.error('Erreur RAG chat:', error.message);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// DELETE /api/rag/index/:docId
// Supprimer l'index d'un document
router.delete('/index/:docId', async (req, res) => {
  try {
    await Chunk.deleteMany({ document: req.params.docId, user: req.user._id });
    res.json({ message: 'Index supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
