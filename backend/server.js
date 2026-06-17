
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studyai')
  .then(() => {
    console.log('✅ MongoDB connecté');
    const { startEmailScheduler } = require('./utils/emailScheduler');
    startEmailScheduler();
  })
  .catch(err => console.error('❌ Erreur MongoDB:', err));

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/ai',        require('./routes/ai'));
app.use('/api/chapters',  require('./routes/chapters'));
app.use('/api/rag',       require('./routes/rag'));
app.use('/api/schedule',  require('./routes/schedule'));
app.use('/api/profile',   require('./routes/profile'));
app.use('/api/admin',     require('./routes/admin'));

app.get('/', (req, res) => res.json({ message: '🎓 StudyAI API v2.0' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));

