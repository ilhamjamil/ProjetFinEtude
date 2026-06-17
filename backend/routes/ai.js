const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const Document = require('../models/Document');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

async function askGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('Clé API Groq manquante. Vérifie le fichier .env');
  }
  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
    temperature: 0.7,
  });
  return completion.choices[0].message.content;
}

// POST /api/ai/summarize/:id
router.post('/summarize/:id', async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Document non trouvé' });

    // ✅ Few-shot learning : exemples de bons résumés pédagogiques
    const prompt = `Tu es un assistant pédagogique expert pour étudiants marocains en informatique.
Niveau ciblé : Licence (Bac+1 à Bac+3), système universitaire marocain semestriel (S1 à S6).
Réponds TOUJOURS en français clair, simple et bien structuré.

Voici un exemple de bon résumé pédagogique :

Cours : "Les algorithmes de tri"
Résumé :
## 📌 Points clés
- **Tri à bulles** : compare les éléments adjacents et les échange si nécessaire. Simple mais lent O(n²).
- **Tri rapide (QuickSort)** : divise le tableau en deux parties. Très efficace O(n log n).
- **Tri fusion (MergeSort)** : divise puis fusionne les sous-tableaux triés. Stable et efficace.

## 🧠 Concepts importants
- La **complexité temporelle** mesure le temps d'exécution selon la taille des données
- Un algorithme **stable** conserve l'ordre relatif des éléments égaux
- Le choix du tri dépend de la taille des données et du contexte

## ✅ Conclusion
Les algorithmes de tri sont fondamentaux en informatique. Le tri rapide est le plus utilisé en pratique grâce à ses performances, mais le tri fusion est préféré quand la stabilité est requise.

---

Maintenant, génère un résumé structuré du cours suivant en respectant exactement ce format :

Cours :
${doc.extractedText.substring(0, 8000)}`;

    const summary = await askGroq(prompt);
    doc.summary = summary;
    await doc.save();

    res.json({ summary });
  } catch (error) {
    console.error('Erreur résumé:', error.message);
    res.status(500).json({ error: error.message || 'Erreur lors de la génération du résumé' });
  }
});

// POST /api/ai/chat/:id
router.post('/chat/:id', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message requis' });

    const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Document non trouvé' });

    const recentHistory = doc.chatHistory.slice(-8);
    let historyText = '';
    recentHistory.forEach(m => {
      historyText += m.role === 'user' ? `Étudiant: ${m.content}\n` : `Tuteur: ${m.content}\n`;
    });

    // ✅ Few-shot learning : exemples de bonnes réponses pédagogiques
    const prompt = `Tu es un tuteur pédagogique expert pour étudiants marocains en informatique.
Système universitaire marocain : semestres S1 à S6, niveau Licence (Bac+1 à Bac+3).
Réponds TOUJOURS en français, de façon claire, simple et structurée.
Adapte ton niveau au Bac+2 marocain en informatique.
Réponds UNIQUEMENT en te basant sur le contenu du cours fourni.

Voici des exemples de bonnes réponses pédagogiques :

Exemple 1 :
Question : "C'est quoi une variable ?"
Réponse : "Une variable est un espace mémoire nommé qui stocke une valeur.
Exemple en Python : age = 20
Ici 'age' est le nom de la variable et 20 est sa valeur.
On peut changer cette valeur à tout moment dans le programme."

Exemple 2 :
Question : "Explique les boucles"
Réponse : "Une boucle répète des instructions plusieurs fois. Il existe deux types principaux :
- **for** : utilisé quand on connait le nombre de répétitions à l'avance
- **while** : utilisé tant qu'une condition reste vraie
Exemple : for i in range(5) répète 5 fois le bloc de code."

Exemple 3 :
Question : "C'est quoi une fonction ?"
Réponse : "Une fonction est un bloc de code réutilisable qui effectue une tâche précise.
Elle évite de répéter le même code plusieurs fois.
Exemple :
def bonjour():
    print('Bonjour !')
bonjour() — appelle la fonction"

Exemple 4 :
Question : "Je ne comprends pas la récursivité"
Réponse : "La récursivité c'est quand une fonction s'appelle elle-même.
Imagine des poupées russes : chaque poupée contient une plus petite.
Exemple : calculer factorielle(3) = 3 x factorielle(2) = 3 x 2 x factorielle(1) = 6
Il faut toujours une condition d'arrêt sinon c'est une boucle infinie !"

---

CONTENU DU COURS :
${doc.extractedText.substring(0, 6000)}

HISTORIQUE DE LA CONVERSATION :
${historyText}

Question de l'étudiant : ${message}
Réponse du tuteur :`;

    const reply = await askGroq(prompt);

    doc.chatHistory.push({ role: 'user', content: message });
    doc.chatHistory.push({ role: 'assistant', content: reply });
    await doc.save();

    res.json({ reply });
  } catch (error) {
    console.error('Erreur chat:', error.message);
    res.status(500).json({ error: error.message || 'Erreur lors de la réponse IA' });
  }
});

// POST /api/ai/quiz/:id
router.post('/quiz/:id', async (req, res) => {
  try {
    const { count = 5 } = req.body;
    const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Document non trouvé' });

    // ✅ Few-shot learning : exemple de bonne question QCM
    const prompt = `Tu es un professeur marocain en informatique niveau Licence.
Génère exactement ${count} questions QCM en français adaptées au niveau Bac+2.
Les questions doivent être claires, précises et basées UNIQUEMENT sur le cours fourni.
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, sans balises markdown.

Voici un exemple de bonnes questions QCM :
{"questions":[
  {
    "id": 1,
    "question": "Quelle est la complexité temporelle du tri rapide dans le meilleur cas ?",
    "options": ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
    "correctIndex": 0,
    "explanation": "Dans le meilleur cas, le tri rapide divise le tableau en deux parties égales à chaque étape, ce qui donne une complexité de O(n log n)."
  },
  {
    "id": 2,
    "question": "Qu'est-ce qu'un algorithme stable ?",
    "options": [
      "Un algorithme qui conserve l'ordre relatif des éléments égaux",
      "Un algorithme qui ne plante jamais",
      "Un algorithme avec complexité O(1)",
      "Un algorithme récursif"
    ],
    "correctIndex": 0,
    "explanation": "Un algorithme de tri est dit stable s'il conserve l'ordre relatif des éléments ayant des valeurs égales."
  }
]}

Génère maintenant ${count} questions QCM basées sur ce cours.
Format : {"questions":[...]}

Cours :
${doc.extractedText.substring(0, 6000)}`;

    const raw = await askGroq(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Impossible de générer le quiz. Réessaie.' });

    let quiz;
    try {
      quiz = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      return res.status(500).json({ error: 'Erreur de format JSON. Réessaie.' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Erreur quiz:', error.message);
    res.status(500).json({ error: error.message || 'Erreur lors de la génération du QCM' });
  }
});

// DELETE /api/ai/chat/:id
router.delete('/chat/:id', async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Document non trouvé' });
    doc.chatHistory = [];
    await doc.save();
    res.json({ message: 'Historique effacé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
