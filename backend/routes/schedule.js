const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Groq = require('groq-sdk');
const authMiddleware = require('../middleware/auth');
const Schedule = require('../models/Schedule');
const Document = require('../models/Document');

router.use(authMiddleware);

// Multer config — accepte PDF + images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `schedule-${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Seuls les PDF et images sont acceptés'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function askGroq(prompt, maxTokens = 3000) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Clé API Groq manquante');
  const groq = new Groq({ apiKey });
  const res = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.4,
  });
  return res.choices[0].message.content;
}

// POST /api/schedule/upload
// Upload emploi du temps (PDF ou image) et analyse
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });

    const filePath = req.file.path;
    const mime = req.file.mimetype;
    let extractedText = '';
    let fileType = '';

    if (mime === 'application/pdf') {
      // Extraire texte du PDF
      fileType = 'pdf';
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      extractedText = data.text.trim().substring(0, 8000);
    } else {
      // Image → décrire avec Groq (on envoie la description du fichier)
      fileType = 'image';
      // Pour les images, on demande à Groq de générer un planning basé sur une description générique
      // car Groq text-only ne peut pas lire les images directement
      extractedText = `Emploi du temps universitaire marocain uploadé sous forme d'image (${req.file.originalname}). 
      L'étudiant souhaite un planning de révision pour la semaine.
      Suppose un emploi du temps universitaire classique avec des cours le matin et après-midi, 
      et des créneaux libres en soirée (18h-22h) et le weekend.`;
    }

    if (!extractedText) {
      return res.status(400).json({ error: 'Impossible d\'extraire le contenu du fichier' });
    }

    // Récupérer les cours de l'étudiant
    const docs = await Document.find({ user: req.user._id }).select('originalName');
    const docsList = docs.map(d => d.originalName.replace('.pdf', '')).join(', ');

    // Demander à l'IA d'analyser et générer le planning
    const today = new Date();
    const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    const prompt = `Tu es un coach académique expert pour étudiants marocains en informatique.
Analyse cet emploi du temps et génère un planning de révision personnalisé pour la semaine.

EMPLOI DU TEMPS :
${extractedText}

COURS DISPONIBLES DE L'ÉTUDIANT :
${docsList || 'Algorithmique, Bases de données, Mathématiques, Programmation'}

DATE ACTUELLE : ${today.toLocaleDateString('fr-FR')}

RÈGLES DU PLANNING :
- Utilise UNIQUEMENT les créneaux libres (pas de cours prévus)
- Sessions de révision de 1h à 2h maximum
- Alterner les matières pour éviter la fatigue
- Priorité aux créneaux du soir (18h-22h) et weekend
- Inclure des pauses et des sessions de quiz
- Adapter selon le niveau universitaire marocain (Licence S1-S6)

Réponds UNIQUEMENT avec un JSON valide sans texte avant ou après :
{
  "availableSlots": [
    {"day": "Lundi", "from": "18:00", "to": "20:00"},
    {"day": "Mercredi", "from": "18:00", "to": "21:00"}
  ],
  "plan": [
    {
      "day": "Lundi",
      "date": "2025-01-13",
      "time": "18:00 - 19:30",
      "subject": "Algorithmique",
      "duration": 90,
      "type": "revision",
      "tip": "Conseil IA court et motivant"
    },
    {
      "day": "Lundi",
      "date": "2025-01-13",
      "time": "20:00 - 20:30",
      "subject": "Algorithmique",
      "duration": 30,
      "type": "quiz",
      "tip": "Teste tes connaissances avec un QCM"
    }
  ],
  "globalAdvice": "Conseil général personnalisé en 2-3 phrases pour cet étudiant"
}`;

    const raw = await askGroq(prompt, 3000);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Impossible de générer le planning. Réessaie.' });

    let parsed;
    try { parsed = JSON.parse(jsonMatch[0]); }
    catch (e) { return res.status(500).json({ error: 'Erreur format JSON. Réessaie.' }); }

    // Supprimer l'ancien schedule de l'utilisateur
    await Schedule.deleteMany({ user: req.user._id });

    // Sauvegarder le nouveau
    const schedule = new Schedule({
      user: req.user._id,
      originalFile: req.file.originalname,
      fileType,
      extractedText,
      availableSlots: parsed.availableSlots || [],
      plan: parsed.plan || [],
      weekStart: today,
    });
    await schedule.save();

    res.json({
      message: 'Planning généré avec succès',
      schedule: {
        _id: schedule._id,
        plan: schedule.plan,
        availableSlots: schedule.availableSlots,
        globalAdvice: parsed.globalAdvice || '',
        originalFile: schedule.originalFile,
        fileType: schedule.fileType,
        createdAt: schedule.createdAt,
      }
    });

  } catch (error) {
    console.error('Erreur schedule upload:', error.message);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// GET /api/schedule
// Récupérer le planning actuel
router.get('/', async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!schedule) return res.json({ schedule: null });
    res.json({ schedule });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/schedule/session/:scheduleId/:sessionIndex/complete
// Marquer une session comme complétée
router.patch('/complete/:scheduleId/:sessionIndex', async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.scheduleId, user: req.user._id });
    if (!schedule) return res.status(404).json({ error: 'Planning non trouvé' });

    const idx = parseInt(req.params.sessionIndex);
    if (schedule.plan[idx]) {
      schedule.plan[idx].completed = !schedule.plan[idx].completed;
      schedule.updatedAt = Date.now();
      await schedule.save();
    }
    res.json({ completed: schedule.plan[idx]?.completed });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/schedule
// Supprimer le planning
router.delete('/', async (req, res) => {
  try {
    await Schedule.deleteMany({ user: req.user._id });
    res.json({ message: 'Planning supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
