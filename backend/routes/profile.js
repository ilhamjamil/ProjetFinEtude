const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Document = require('../models/Document');
const Progress = require('../models/Progress');
const Chapter = require('../models/Chapter');

router.use(authMiddleware);

// GET /api/profile — profil complet
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    // Statistiques en temps réel
    const totalDocs = await Document.countDocuments({ user: req.user._id });
    const allProgress = await Progress.find({ user: req.user._id });
    const chaptersValidated = allProgress.filter(p => p.isValidated).length;
    const totalQuiz = allProgress.reduce((sum, p) => sum + p.attempts.length, 0);
    const totalCorrect = allProgress.reduce((sum, p) =>
      sum + p.attempts.reduce((s, a) => s + a.score, 0), 0);
    const totalQuestions = allProgress.reduce((sum, p) =>
      sum + p.attempts.reduce((s, a) => s + a.total, 0), 0);
    const avgScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const successRate = totalQuiz > 0
      ? Math.round((allProgress.filter(p => p.isValidated).length / Math.max(allProgress.length, 1)) * 100)
      : 0;

    // Stats par document (niveau par matière)
    const docs = await Document.find({ user: req.user._id }).select('_id originalName');
    const subjectStats = await Promise.all(docs.map(async (doc) => {
      const chapters = await Chapter.find({ document: doc._id, user: req.user._id });
      const progList = await Progress.find({ document: doc._id, user: req.user._id });
      const validated = progList.filter(p => p.isValidated).length;
      const total = chapters.length;
      const attempts = progList.reduce((s, p) => s + p.attempts.length, 0);
      const bestScores = progList.map(p => p.bestScore);
      const avgSubject = bestScores.length > 0
        ? Math.round(bestScores.reduce((a, b) => a + b, 0) / bestScores.length)
        : 0;
      return {
        name: doc.originalName.replace('.pdf', ''),
        docId: doc._id,
        progress: total > 0 ? Math.round((validated / total) * 100) : 0,
        avgScore: avgSubject,
        chaptersTotal: total,
        chaptersValidated: validated,
        quizDone: attempts
      };
    }));

    // Historique hebdomadaire
    const weeklyData = buildWeeklyStats(allProgress);

    // XP total recalculé
    const xp = (chaptersValidated * 50) + (totalQuiz * 10) + (totalDocs * 20) +
      (avgScore >= 80 ? 100 : avgScore >= 70 ? 50 : 0);

    // Mettre à jour user
    user.stats = { totalDocs, totalQuiz, totalCorrect, totalQuestions, chaptersValidated };
    user.xp = xp;
    user.updateLevel();
    await user.addXP(0); // juste pour vérifier les badges
    await user.save();

    // XP pour passer au niveau suivant
    const xpThresholds = { 'Débutant': 200, 'Intermédiaire': 500, 'Avancé': 1000, 'Expert': 9999 };
    const xpForNext = xpThresholds[user.level] || 9999;
    const xpProgress = Math.min(Math.round((xp / xpForNext) * 100), 100);

    res.json({
      user: {
        name: user.name,
        email: user.email,
        xp,
        level: user.level,
        xpProgress,
        xpForNext,
        badges: user.badges,
        createdAt: user.createdAt
      },
      stats: {
        totalDocs,
        totalQuiz,
        avgScore,
        successRate,
        chaptersValidated,
        totalQuestions,
        totalCorrect
      },
      subjectStats,
      weeklyData
    });
  } catch (error) {
    console.error('Erreur profil:', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

function buildWeeklyStats(allProgress) {
  const weeks = {};
  allProgress.forEach(p => {
    p.attempts.forEach(attempt => {
      const date = new Date(attempt.date);
      const weekKey = getWeekKey(date);
      if (!weeks[weekKey]) weeks[weekKey] = { week: weekKey, scores: [], date: date };
      weeks[weekKey].scores.push(attempt.percentage);
    });
  });

  return Object.values(weeks)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-8) // 8 dernières semaines
    .map(w => ({
      week: formatWeekLabel(new Date(w.date)),
      avgScore: Math.round(w.scores.reduce((a, b) => a + b, 0) / w.scores.length),
      quizCount: w.scores.length
    }));
}

function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

function formatWeekLabel(date) {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

module.exports = router;
