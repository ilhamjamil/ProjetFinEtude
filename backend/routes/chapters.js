const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const Document = require('../models/Document');
const Chapter = require('../models/Chapter');
const Progress = require('../models/Progress');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

async function askGroq(prompt, maxTokens = 2048) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Clé API Groq manquante dans le fichier .env');
  const groq = new Groq({ apiKey });
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
  });
  return response.choices[0].message.content;
}

// POST /api/chapters/detect/:docId
// Détecte les chapitres d'un document et initialise la progression
router.post('/detect/:docId', async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.docId, user: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Document non trouvé' });

    // Supprimer les anciens chapitres si re-détection
    await Chapter.deleteMany({ document: doc._id, user: req.user._id });
    await Progress.deleteMany({ document: doc._id, user: req.user._id });

    // Demander à l'IA de détecter les chapitres
    const prompt = `Analyse ce cours universitaire et détecte tous les chapitres ou sections principales.
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, sans balises markdown.

Format exact :
{"chapters":[{"title":"Titre du chapitre","content":"Contenu complet de ce chapitre en quelques phrases résumées"}]}

Important :
- Détecte entre 2 et 8 chapitres maximum
- Si le cours n'a pas de chapitres clairs, divise-le en sections logiques
- Le contenu de chaque chapitre doit contenir les notions clés de cette partie
- Réponds en français

Cours :
${doc.extractedText.substring(0, 10000)}`;

    const raw = await askGroq(prompt, 3000);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Impossible de détecter les chapitres. Réessaie.' });

    const parsed = JSON.parse(jsonMatch[0]);
    const chaptersData = parsed.chapters;

    if (!chaptersData || chaptersData.length === 0) {
      return res.status(500).json({ error: 'Aucun chapitre détecté dans ce document.' });
    }

    // Sauvegarder les chapitres
    const savedChapters = [];
    for (let i = 0; i < chaptersData.length; i++) {
      const chapter = new Chapter({
        document: doc._id,
        user: req.user._id,
        title: chaptersData[i].title,
        content: chaptersData[i].content,
        order: i
      });
      await chapter.save();
      savedChapters.push(chapter);
    }

    // Initialiser la progression : seul le premier chapitre est débloqué
    for (let i = 0; i < savedChapters.length; i++) {
      const progress = new Progress({
        user: req.user._id,
        chapter: savedChapters[i]._id,
        document: doc._id,
        isUnlocked: i === 0, // seul le 1er est débloqué
        isValidated: false,
        attempts: [],
        bestScore: 0
      });
      await progress.save();
    }

    res.json({
      message: `${savedChapters.length} chapitres détectés`,
      chapters: savedChapters.map((c, i) => ({
        _id: c._id,
        title: c.title,
        order: c.order,
        isUnlocked: i === 0,
        isValidated: false,
        attempts: 0,
        bestScore: 0
      }))
    });

  } catch (error) {
    console.error('Erreur détection chapitres:', error.message);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// GET /api/chapters/:docId
// Récupère tous les chapitres + progression de l'utilisateur
router.get('/:docId', async (req, res) => {
  try {
    const chapters = await Chapter.find({
      document: req.params.docId,
      user: req.user._id
    }).sort({ order: 1 });

    if (chapters.length === 0) {
      return res.json({ chapters: [], detected: false });
    }

    // Récupérer la progression pour chaque chapitre
    const result = await Promise.all(chapters.map(async (ch) => {
      const progress = await Progress.findOne({ user: req.user._id, chapter: ch._id });
      return {
        _id: ch._id,
        title: ch.title,
        content: ch.content,
        order: ch.order,
        isUnlocked: progress?.isUnlocked || false,
        isValidated: progress?.isValidated || false,
        attempts: progress?.attempts?.length || 0,
        bestScore: progress?.bestScore || 0,
        revisionSuggested: progress?.revisionSuggested || false,
      };
    }));

    res.json({ chapters: result, detected: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/chapters/:chapterId/quiz
// Génère un QCM pour un chapitre spécifique
router.post('/:chapterId/quiz', async (req, res) => {
  try {
    const { count = 5 } = req.body;
    const chapter = await Chapter.findOne({ _id: req.params.chapterId, user: req.user._id });
    if (!chapter) return res.status(404).json({ error: 'Chapitre non trouvé' });

    // Vérifier que le chapitre est débloqué
    const progress = await Progress.findOne({ user: req.user._id, chapter: chapter._id });
    if (!progress?.isUnlocked) {
      return res.status(403).json({ error: 'Ce chapitre est verrouillé. Valide le chapitre précédent d\'abord.' });
    }

    // Récupérer le contenu complet du document pour ce chapitre
    const doc = await Document.findById(chapter.document);

    const prompt = `Tu es un professeur universitaire marocain. Génère exactement ${count} questions QCM en français sur le chapitre "${chapter.title}".
Les questions doivent porter UNIQUEMENT sur ce chapitre et son contenu.
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, sans balises markdown.

Format exact :
{"questions":[{"id":1,"question":"La question?","options":["Option A","Option B","Option C","Option D"],"correctIndex":0,"explanation":"Explication courte et claire"}]}

Contenu du chapitre :
${chapter.content}

Contenu complet du cours pour contexte :
${doc.extractedText.substring(0, 4000)}`;

    const raw = await askGroq(prompt, 2000);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Impossible de générer le QCM. Réessaie.' });

    const quiz = JSON.parse(jsonMatch[0]);
    res.json({ ...quiz, chapterTitle: chapter.title, chapterId: chapter._id });

  } catch (error) {
    console.error('Erreur QCM chapitre:', error.message);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// POST /api/chapters/:chapterId/submit
// Soumettre le score d'un QCM et mettre à jour la progression
router.post('/:chapterId/submit', async (req, res) => {
  try {
    const { score, total } = req.body;
    if (score === undefined || !total) return res.status(400).json({ error: 'Score et total requis' });

    const chapter = await Chapter.findOne({ _id: req.params.chapterId, user: req.user._id });
    if (!chapter) return res.status(404).json({ error: 'Chapitre non trouvé' });

    let progress = await Progress.findOne({ user: req.user._id, chapter: chapter._id });
    if (!progress) return res.status(404).json({ error: 'Progression non trouvée' });

    const percentage = Math.round((score / total) * 100);
    const PASS_SCORE = 70;

    // Ajouter la tentative
    progress.attempts.push({ score, total, percentage });

    // Mettre à jour le meilleur score
    if (percentage > progress.bestScore) {
      progress.bestScore = percentage;
    }

    const attemptCount = progress.attempts.length;
    let message = '';
    let nextChapterUnlocked = false;
    let revisionRequired = false;

    if (percentage >= PASS_SCORE) {
      // ✅ Chapitre validé !
      progress.isValidated = true;
      message = `Bravo ! Tu as validé le chapitre avec ${percentage}% ! Le chapitre suivant est débloqué.`;

      // Débloquer le chapitre suivant
      const nextChapter = await Chapter.findOne({
        document: chapter.document,
        user: req.user._id,
        order: chapter.order + 1
      });

      if (nextChapter) {
        await Progress.findOneAndUpdate(
          { user: req.user._id, chapter: nextChapter._id },
          { isUnlocked: true },
          { new: true }
        );
        nextChapterUnlocked = true;
      }
    } else {
      // ❌ Score insuffisant
      if (attemptCount >= 2 && !progress.revisionSuggested) {
        // Après 2 échecs → suggérer la révision
        progress.revisionSuggested = true;
        revisionRequired = true;
        message = `Score insuffisant (${percentage}%). Tu as déjà essayé ${attemptCount} fois. Nous te recommandons de revoir ce chapitre via le Chat avant de réessayer.`;
      } else if (progress.revisionSuggested) {
        message = `Score insuffisant (${percentage}%). Utilise le Chat pour réviser ce chapitre, puis réessaie !`;
        revisionRequired = true;
      } else {
        message = `Score insuffisant (${percentage}%). Il te faut au moins 70% pour passer au chapitre suivant. Réessaie !`;
      }
    }

    progress.updatedAt = Date.now();
    await progress.save();

    // Générer une recommandation IA personnalisée
    let recommendation = '';
    if (percentage < PASS_SCORE) {
      try {
        const recPrompt = `Un étudiant marocain a obtenu ${percentage}% au QCM sur le chapitre "${chapter.title}".
Il a répondu correctement à ${score} questions sur ${total}.
Donne-lui en 2-3 phrases courtes une recommandation personnalisée et encourageante pour améliorer sa compréhension de ce chapitre. Réponds en français.`;
        recommendation = await askGroq(recPrompt, 300);
      } catch (e) {
        recommendation = 'Revois les notions clés de ce chapitre et utilise le chat pour poser des questions.';
      }
    }

    res.json({
      percentage,
      score,
      total,
      isValidated: progress.isValidated,
      attemptCount,
      bestScore: progress.bestScore,
      nextChapterUnlocked,
      revisionRequired,
      message,
      recommendation
    });

  } catch (error) {
    console.error('Erreur submit:', error.message);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// GET /api/chapters/progress/:docId
// Résumé de la progression globale sur un document
router.get('/progress/:docId', async (req, res) => {
  try {
    const chapters = await Chapter.find({ document: req.params.docId, user: req.user._id }).sort({ order: 1 });
    const progressList = await Progress.find({ document: req.params.docId, user: req.user._id });

    const total = chapters.length;
    const validated = progressList.filter(p => p.isValidated).length;
    const globalPercentage = total > 0 ? Math.round((validated / total) * 100) : 0;

    res.json({
      total,
      validated,
      globalPercentage,
      isCompleted: validated === total && total > 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
