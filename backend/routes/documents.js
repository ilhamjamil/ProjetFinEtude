const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const authMiddleware = require('../middleware/auth');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Seuls les fichiers PDF sont acceptés'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// All routes protected
router.use(authMiddleware);

// POST /api/documents/upload
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier PDF fourni' });

    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const extractedText = pdfData.text.trim();

    if (!extractedText) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Impossible d\'extraire le texte du PDF' });
    }

    const document = new Document({
      user: req.user._id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      extractedText: extractedText.substring(0, 50000),
    });

    await document.save();
    res.status(201).json({
      message: 'PDF uploadé avec succès',
      document: {
        _id: document._id,
        originalName: document.originalName,
        uploadedAt: document.uploadedAt,
        textLength: extractedText.length
      }
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du PDF' });
  }
});

// GET /api/documents — only user's docs
router.get('/', async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user._id })
      .select('_id originalName uploadedAt summary')
      .sort({ uploadedAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Document non trouvé' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Document non trouvé' });

    const filePath = path.join(__dirname, '../uploads', doc.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'Document supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
