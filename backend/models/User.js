const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const badgeSchema = new mongoose.Schema({
  id: String,
  name: String,
  icon: String,
  description: String,
  earnedAt: { type: Date, default: Date.now }
});

const weeklyStatSchema = new mongoose.Schema({
  week: String, // "2024-W01"
  score: Number,
  quizCount: Number,
  date: Date
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },

  // Gamification
  xp: { type: Number, default: 0 },
  level: { type: String, default: 'Débutant' }, // Débutant / Intermédiaire / Avancé / Expert
  badges: [badgeSchema],

  // Statistiques globales
  stats: {
    totalDocs: { type: Number, default: 0 },
    totalQuiz: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    totalMinutes: { type: Number, default: 0 },
    chaptersValidated: { type: Number, default: 0 },
  },

  // Historique hebdomadaire
  weeklyStats: [weeklyStatSchema],

  createdAt: { type: Date, default: Date.now }
});

// Hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculer le niveau selon XP
userSchema.methods.updateLevel = function () {
  if (this.xp >= 1000) this.level = 'Expert';
  else if (this.xp >= 500) this.level = 'Avancé';
  else if (this.xp >= 200) this.level = 'Intermédiaire';
  else this.level = 'Débutant';
};

// Ajouter XP et vérifier badges
userSchema.methods.addXP = async function (points) {
  this.xp += points;
  this.updateLevel();

  // Vérifier badges
  const badges = this.badges.map(b => b.id);

  if (this.xp >= 100 && !badges.includes('first_100xp')) {
    this.badges.push({ id: 'first_100xp', name: '🌟 Premier pas', icon: '🌟', description: '100 XP accumulés' });
  }
  if (this.stats.totalQuiz >= 1 && !badges.includes('first_quiz')) {
    this.badges.push({ id: 'first_quiz', name: '🧠 Premier Quiz', icon: '🧠', description: 'Premier quiz complété' });
  }
  if (this.stats.totalQuiz >= 10 && !badges.includes('quiz_10')) {
    this.badges.push({ id: 'quiz_10', name: '🔥 Quiz Addict', icon: '🔥', description: '10 quiz complétés' });
  }
  if (this.stats.chaptersValidated >= 1 && !badges.includes('first_chapter')) {
    this.badges.push({ id: 'first_chapter', name: '✅ Premier Chapitre', icon: '✅', description: 'Premier chapitre validé' });
  }
  if (this.stats.chaptersValidated >= 5 && !badges.includes('chapters_5')) {
    this.badges.push({ id: 'chapters_5', name: '📚 Studieux', icon: '📚', description: '5 chapitres validés' });
  }
  if (this.stats.totalDocs >= 3 && !badges.includes('docs_3')) {
    this.badges.push({ id: 'docs_3', name: '📂 Collectionneur', icon: '📂', description: '3 cours uploadés' });
  }
  const avg = this.stats.totalQuestions > 0 ? (this.stats.totalCorrect / this.stats.totalQuestions) * 100 : 0;
  if (avg >= 80 && this.stats.totalQuiz >= 3 && !badges.includes('high_score')) {
    this.badges.push({ id: 'high_score', name: '🏆 Excellence', icon: '🏆', description: 'Moyenne >= 80%' });
  }
};

module.exports = mongoose.model('User', userSchema);
