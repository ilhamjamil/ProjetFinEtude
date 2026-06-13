const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
      return res.status(401).json({ error: 'Token manquant.' });

    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) return res.status(401).json({ error: 'Utilisateur introuvable.' });
    if (!user.isAdmin) return res.status(403).json({ error: 'Accès refusé. Admin uniquement.' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
};