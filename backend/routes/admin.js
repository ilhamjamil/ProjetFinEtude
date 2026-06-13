    const express = require('express');
    const router = express.Router();
    const adminAuth = require('../middleware/adminAuth');
    const User = require('../models/User');
    const Document = require('../models/Document');
    const Progress = require('../models/Progress');
    const Chapter = require('../models/Chapter');
    const Schedule = require('../models/Schedule');

    router.use(adminAuth);

    // GET /api/admin/stats
    router.get('/stats', async (req, res) => {
    try {
        const totalUsers     = await User.countDocuments({ isAdmin: { $ne: true } });
        const totalDocs      = await Document.countDocuments();
        const totalChapters  = await Chapter.countDocuments();
        const allProgress    = await Progress.find();
        const totalQuiz      = allProgress.reduce((s, p) => s + p.attempts.length, 0);
        const totalValidated = allProgress.filter(p => p.isValidated).length;
        const totalSchedules = await Schedule.countDocuments();

        const allAttempts = allProgress.flatMap(p => p.attempts);
        const avgScore = allAttempts.length > 0
        ? Math.round(allAttempts.reduce((s, a) => s + a.percentage, 0) / allAttempts.length)
        : 0;

        // Inscriptions par semaine
        const weeks = {};
        const users = await User.find({ isAdmin: { $ne: true } }).select('createdAt');
        users.forEach(u => {
        const d = new Date(u.createdAt);
        d.setDate(d.getDate() - d.getDay());
        const k = d.toISOString().split('T')[0];
        weeks[k] = (weeks[k] || 0) + 1;
        });
        const weeklySignups = Object.entries(weeks)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .slice(-8)
        .map(([date, count]) => ({
            week: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            count
        }));

        res.json({ totalUsers, totalDocs, totalChapters, totalQuiz, totalValidated, totalSchedules, avgScore, weeklySignups });
    } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // GET /api/admin/users
    router.get('/users', async (req, res) => {
    try {
        const users = await User.find({ isAdmin: { $ne: true } })
        .select('-password').sort({ createdAt: -1 });

        const result = await Promise.all(users.map(async (u) => {
        const docs      = await Document.countDocuments({ user: u._id });
        const progress  = await Progress.find({ user: u._id });
        const quizDone  = progress.reduce((s, p) => s + p.attempts.length, 0);
        const validated = progress.filter(p => p.isValidated).length;
        const attempts  = progress.flatMap(p => p.attempts);
        const avg       = attempts.length > 0
            ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) : 0;

        return {
            _id: u._id, name: u.name, email: u.email,
            level: u.level, xp: u.xp, badges: u.badges?.length || 0,
            createdAt: u.createdAt,
            stats: { docs, quizDone, validated, avgScore: avg }
        };
        }));

        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // GET /api/admin/users/:id
    router.get('/users/:id', async (req, res) => {
    try {
        const u = await User.findById(req.params.id).select('-password');
        if (!u) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        const docs     = await Document.find({ user: u._id }).select('originalName uploadedAt summary');
        const progress = await Progress.find({ user: u._id });
        const quizDone = progress.reduce((s, p) => s + p.attempts.length, 0);
        const validated= progress.filter(p => p.isValidated).length;
        const attempts = progress.flatMap(p => p.attempts);
        const avg      = attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) : 0;

        res.json({
        user: { _id: u._id, name: u.name, email: u.email, level: u.level, xp: u.xp, badges: u.badges, createdAt: u.createdAt },
        stats: { docs: docs.length, quizDone, validated, avgScore: avg },
        documents: docs,
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
    });

    module.exports = router;