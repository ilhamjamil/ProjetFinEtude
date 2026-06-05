/**
 * TF-IDF (Term Frequency - Inverse Document Frequency)
 * Implémentation pure JavaScript — zéro dépendance externe
 * 
 * Utilisé pour le RAG : trouver les chunks les plus pertinents
 * pour une question donnée par similarité cosinus.
 */

// Mots vides français + anglais à ignorer
const STOP_WORDS = new Set([
    'le','la','les','un','une','des','du','de','d','l','en','et','ou','à','au','aux',
    'ce','cet','cette','ces','mon','ton','son','ma','ta','sa','mes','tes','ses',
    'nous','vous','ils','elles','je','tu','il','elle','on','se','si','ne','pas',
    'plus','très','bien','aussi','mais','donc','car','que','qui','quoi','où',
    'par','sur','sous','dans','avec','pour','sans','entre','vers','chez',
    'est','sont','était','ont','avoir','être','faire','pouvoir','vouloir',
    'the','a','an','of','in','is','it','to','and','or','for','on','at','by',
    'this','that','are','was','be','as','with','from','they','we','you',
  ]);
  
  /**
   * Tokenize un texte : lowercase, retire ponctuation, filtre stop words
   */
  function tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  }
  
  /**
   * Calcule le TF (Term Frequency) pour un document
   * TF(t,d) = count(t in d) / total_words(d)
   */
  function computeTF(tokens) {
    const tf = {};
    const total = tokens.length || 1;
    tokens.forEach(token => { tf[token] = (tf[token] || 0) + 1; });
    Object.keys(tf).forEach(t => { tf[t] = tf[t] / total; });
    return tf;
  }
  
  /**
   * Calcule l'IDF (Inverse Document Frequency) sur tous les chunks
   * IDF(t) = log(N / df(t))  — récompense les mots rares
   */
  function computeIDF(allTokensArrays) {
    const N = allTokensArrays.length || 1;
    const df = {};  // document frequency
  
    allTokensArrays.forEach(tokens => {
      const unique = new Set(tokens);
      unique.forEach(t => { df[t] = (df[t] || 0) + 1; });
    });
  
    const idf = {};
    Object.keys(df).forEach(t => {
      idf[t] = Math.log((N + 1) / (df[t] + 1)) + 1; // lissage
    });
    return idf;
  }
  
  /**
   * Calcule le vecteur TF-IDF pour un chunk
   */
  function computeTFIDF(tokens, idf) {
    const tf = computeTF(tokens);
    const tfidf = {};
    Object.keys(tf).forEach(t => {
      tfidf[t] = tf[t] * (idf[t] || 1);
    });
    return tfidf;
  }
  
  /**
   * Similarité cosinus entre deux vecteurs TF-IDF
   * cos(A,B) = (A·B) / (|A| × |B|)
   */
  function cosineSimilarity(vecA, vecB) {
    let dot = 0, normA = 0, normB = 0;
  
    // Produit scalaire
    Object.keys(vecA).forEach(t => {
      if (vecB[t]) dot += vecA[t] * vecB[t];
      normA += vecA[t] * vecA[t];
    });
  
    Object.keys(vecB).forEach(t => {
      normB += vecB[t] * vecB[t];
    });
  
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
  
    if (normA === 0 || normB === 0) return 0;
    return dot / (normA * normB);
  }
  
  /**
   * Découpe un texte en chunks de ~500 mots avec chevauchement de 50 mots
   */
  function splitIntoChunks(text, chunkSize = 500, overlap = 50) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const chunks = [];
    let i = 0;
  
    while (i < words.length) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 50) { // ignorer les chunks trop courts
        chunks.push(chunk);
      }
      i += chunkSize - overlap;
    }
  
    return chunks;
  }
  
  /**
   * Indexe un document : découpe en chunks + calcule TF-IDF
   * Retourne les chunks avec leurs vecteurs
   */
  function indexDocument(text) {
    const rawChunks = splitIntoChunks(text, 500, 50);
  
    // Tokenize tous les chunks
    const allTokens = rawChunks.map(c => tokenize(c));
  
    // Calcule IDF global
    const idf = computeIDF(allTokens);
  
    // Calcule TF-IDF pour chaque chunk
    return rawChunks.map((text, i) => ({
      index: i,
      text,
      tfidf: computeTFIDF(allTokens[i], idf),
      wordCount: allTokens[i].length,
    }));
  }
  
  /**
   * Recherche les K chunks les plus pertinents pour une question
   */
  function searchChunks(questionText, chunks, topK = 3) {
    if (!chunks || chunks.length === 0) return [];
  
    // Vecteur TF-IDF de la question
    const qTokens = tokenize(questionText);
  
    // Utilise l'IDF des chunks existants pour le même espace vectoriel
    const allTokens = chunks.map(c => {
      // Reconstitue les tokens depuis le texte du chunk
      return tokenize(c.text);
    });
    const idf = computeIDF([...allTokens, qTokens]);
    const qVector = computeTFIDF(qTokens, idf);
  
    // Calcule la similarité avec chaque chunk
    const scored = chunks.map(chunk => {
      // Convertir Map MongoDB en objet JS si nécessaire
      const vec = chunk.tfidf instanceof Map
        ? Object.fromEntries(chunk.tfidf)
        : (typeof chunk.tfidf === 'object' ? chunk.tfidf : {});
  
      return {
        chunk,
        score: cosineSimilarity(qVector, vec),
      };
    });
  
    // Trier par score décroissant et retourner les top K
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(s => s.score > 0)
      .map(s => ({ ...s.chunk, score: s.score }));
  }
  
  module.exports = { indexDocument, searchChunks, tokenize, splitIntoChunks };
  