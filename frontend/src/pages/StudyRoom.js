import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getDocument, summarize, chat, generateQuiz, clearChat } from '../utils/api';

const TABS = [
  { id: 'chat', label: '💬 Chat', desc: 'Pose tes questions' },
  { id: 'summary', label: '📝 Résumé', desc: 'Résumé du cours' },
  { id: 'quiz', label: '🧠 QCM', desc: 'Teste tes connaissances' },
];

export default function StudyRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chat
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Summary
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Quiz
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [answers, setAnswers] = useState({});  // { questionIndex: optionIndex }
  const [revealed, setRevealed] = useState({}); // { questionIndex: true } — révélée une par une
  const [quizDone, setQuizDone] = useState(false);
  const [quizCount, setQuizCount] = useState(5);

  useEffect(() => { loadDoc(); }, [id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadDoc = async () => {
    try {
      setLoading(true);
      const res = await getDocument(id);
      setDoc(res.data);
      setMessages(res.data.chatHistory || []);
      setSummary(res.data.summary || '');
    } catch {
      setError('Document introuvable');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!input.trim() || chatLoading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setChatLoading(true);
    try {
      const res = await chat(id, userMsg.content);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erreur de connexion. Réessaie.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSummarize = async () => {
    setSummaryLoading(true);
    try {
      const res = await summarize(id);
      setSummary(res.data.summary);
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur résumé');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleQuiz = async () => {
    setQuizLoading(true);
    setQuiz(null);
    setAnswers({});
    setRevealed({});
    setQuizDone(false);
    try {
      const res = await generateQuiz(id, quizCount);
      setQuiz(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur QCM');
    } finally {
      setQuizLoading(false);
    }
  };

  // L'utilisateur choisit une réponse → révèle immédiatement le résultat
  const handleAnswer = (qIndex, optIndex) => {
    if (revealed[qIndex]) return; // déjà répondu
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
    setRevealed(prev => ({ ...prev, [qIndex]: true }));
  };

  const handleClearChat = async () => {
    if (!window.confirm('Effacer l\'historique ?')) return;
    await clearChat(id);
    setMessages([]);
  };

  const allAnswered = quiz && Object.keys(revealed).length === quiz.questions.length;
  const score = quiz ? quiz.questions.filter((q, i) => answers[i] === q.correctIndex).length : 0;

  if (loading) return (
    <div style={S.center}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Chargement...</p>
    </div>
  );

  if (error) return (
    <div style={S.center}>
      <p style={{ color: 'var(--error)', marginBottom: 16 }}>❌ {error}</p>
      <button className="btn btn-secondary" onClick={() => navigate('/')}>← Retour</button>
    </div>
  );

  return (
    <div style={S.wrapper}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.docMeta}>
          <span style={{ fontSize: 28 }}>📚</span>
          <div style={{ minWidth: 0 }}>
            <p style={S.docTitle}>{doc?.originalName?.replace('.pdf', '')}</p>
            <p style={S.docChars}>{doc?.extractedText?.length?.toLocaleString()} caractères</p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ width: '100%', justifyContent: 'center' }}>
          ← Retour
        </button>
        <nav style={S.tabNav}>
          {TABS.map(tab => (
            <button key={tab.id}
              style={{ ...S.tabBtn, ...(activeTab === tab.id ? S.tabBtnActive : {}) }}
              onClick={() => setActiveTab(tab.id)}>
              <span style={{ fontSize: 15 }}>{tab.label}</span>
              <span style={S.tabDesc}>{tab.desc}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main style={S.main}>

        {/* ═══════════════ CHAT ═══════════════ */}
        {activeTab === 'chat' && (
          <div style={S.chatWrap}>
            <div style={S.panelHeader}>
              <h2 style={S.tabTitle}>💬 Chat avec ton cours</h2>
              {messages.length > 0 && (
                <button className="btn btn-danger" style={{ fontSize: 12, padding: '6px 12px' }} onClick={handleClearChat}>Effacer</button>
              )}
            </div>
            <div style={S.messages}>
              {messages.length === 0 && (
                <div style={S.emptyCenter}>
                  <span style={{ fontSize: 48 }}>🤖</span>
                  <p style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 600, marginTop: 12 }}>Pose-moi une question sur ton cours !</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>Je suis basé sur le contenu de ton PDF</p>
                  <div style={S.suggestions}>
                    {['Explique-moi les concepts clés', 'Fais un plan du cours', 'Quels sont les points importants ?'].map(s => (
                      <button key={s} style={S.suggestion} onClick={() => setInput(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
                  <div style={msg.role === 'user' ? S.bubbleUser : S.bubbleAssistant}>
                    <div className="markdown"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
                  <div style={S.bubbleAssistant}>
                    <div style={{ display: 'flex', gap: 6, padding: '4px 0' }}>
                      {[0,1,2].map(i => <span key={i} style={{ ...S.dot, animationDelay: `${i*0.2}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div style={S.chatInput}>
              <textarea style={S.textarea} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                placeholder="Pose ta question... (Entrée pour envoyer)" rows={2} disabled={chatLoading} />
              <button className="btn btn-primary" onClick={handleChat} disabled={!input.trim() || chatLoading} style={{ alignSelf: 'flex-end' }}>
                {chatLoading ? <span className="spinner" /> : 'Envoyer →'}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ RÉSUMÉ ═══════════════ */}
        {activeTab === 'summary' && (
          <div style={S.padded}>
            <div style={S.panelHeader}>
              <h2 style={S.tabTitle}>📝 Résumé du cours</h2>
              <button className="btn btn-primary" onClick={handleSummarize} disabled={summaryLoading}>
                {summaryLoading ? <><span className="spinner" /> Génération...</> : summary ? '🔄 Régénérer' : '✨ Générer le résumé'}
              </button>
            </div>
            {summaryLoading && <div style={S.loadingBox}><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /><p>Analyse en cours...</p></div>}
            {summary && !summaryLoading && (
              <div style={S.summaryBox} className="animate-fade-up">
                <div className="markdown"><ReactMarkdown>{summary}</ReactMarkdown></div>
              </div>
            )}
            {!summary && !summaryLoading && (
              <div style={S.emptyCenter}>
                <span style={{ fontSize: 48 }}>📝</span>
                <p style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 600, marginTop: 12 }}>Génère un résumé de ton cours</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>L'IA va analyser et structurer les points clés</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ QCM INTERACTIF ═══════════════ */}
        {activeTab === 'quiz' && (
          <div style={S.padded}>
            <div style={S.panelHeader}>
              <h2 style={S.tabTitle}>🧠 QCM Interactif</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <select value={quizCount} onChange={e => setQuizCount(Number(e.target.value))} style={S.select}>
                  {[3,5,8,10].map(n => <option key={n} value={n}>{n} questions</option>)}
                </select>
                <button className="btn btn-primary" onClick={handleQuiz} disabled={quizLoading}>
                  {quizLoading ? <><span className="spinner" /> Génération...</> : quiz ? '🔄 Nouveau QCM' : '🎯 Générer le QCM'}
                </button>
              </div>
            </div>

            {quizLoading && <div style={S.loadingBox}><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /><p>Génération des questions...</p></div>}

            {!quiz && !quizLoading && (
              <div style={S.emptyCenter}>
                <span style={{ fontSize: 48 }}>🧠</span>
                <p style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 600, marginTop: 12 }}>Teste tes connaissances</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>L'IA génère des questions basées sur ton cours</p>
              </div>
            )}

            {quiz && !quizLoading && (
              <div className="animate-fade-up">

                {/* Barre de progression */}
                <div style={S.progressWrap}>
                  <span style={S.progressText}>{Object.keys(revealed).length} / {quiz.questions.length} répondues</span>
                  <div style={S.progressBar}>
                    <div style={{ ...S.progressFill, width: `${(Object.keys(revealed).length / quiz.questions.length) * 100}%` }} />
                  </div>
                </div>

                {/* Questions */}
                {quiz.questions.map((q, qi) => {
                  const isRevealed = revealed[qi];
                  const selectedOpt = answers[qi];

                  return (
                    <div key={qi} style={S.questionCard}>
                      {/* En-tête question */}
                      <div style={S.questionHeader}>
                        <span style={S.questionNum}>{qi + 1}</span>
                        <p style={S.questionText}>{q.question}</p>
                      </div>

                      {/* Options */}
                      <div style={S.options}>
                        {q.options.map((opt, oi) => {
                          const isSelected = selectedOpt === oi;
                          const isCorrect = oi === q.correctIndex;

                          // Couleurs selon état
                          let bg = 'var(--surface2)';
                          let border = 'var(--border)';
                          let color = 'var(--text)';
                          let icon = null;

                          if (isRevealed) {
                            if (isCorrect) {
                              bg = 'rgba(0,217,160,0.12)';
                              border = '#00d9a0';
                              color = '#00d9a0';
                              icon = '✅';
                            } else if (isSelected && !isCorrect) {
                              bg = 'rgba(255,79,110,0.12)';
                              border = '#ff4f6e';
                              color = '#ff4f6e';
                              icon = '❌';
                            }
                          } else if (isSelected) {
                            bg = 'rgba(108,99,255,0.15)';
                            border = 'var(--accent)';
                          }

                          return (
                            <button key={oi}
                              onClick={() => handleAnswer(qi, oi)}
                              disabled={isRevealed}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '14px 16px', borderRadius: 'var(--radius)',
                                border: `1px solid ${border}`, background: bg, color,
                                cursor: isRevealed ? 'default' : 'pointer',
                                fontFamily: 'Inter, sans-serif', fontSize: 14,
                                textAlign: 'left', width: '100%',
                                transition: 'all 0.25s ease',
                                transform: isRevealed && isCorrect ? 'scale(1.01)' : 'scale(1)',
                              }}>
                              <span style={{
                                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                background: isRevealed && isCorrect ? '#00d9a0' : isRevealed && isSelected ? '#ff4f6e' : 'var(--border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 700,
                                color: isRevealed && (isCorrect || isSelected) ? 'white' : 'var(--text-muted)'
                              }}>
                                {icon || String.fromCharCode(65 + oi)}
                              </span>
                              <span style={{ flex: 1 }}>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explication — visible après réponse */}
                      {isRevealed && (
                        <div style={{
                          marginTop: 14, padding: '14px 16px',
                          background: answers[qi] === q.correctIndex ? 'rgba(0,217,160,0.08)' : 'rgba(255,79,110,0.08)',
                          border: `1px solid ${answers[qi] === q.correctIndex ? 'rgba(0,217,160,0.25)' : 'rgba(255,79,110,0.25)'}`,
                          borderRadius: 'var(--radius)', fontSize: 14, lineHeight: 1.6,
                          animation: 'fadeUp 0.3s ease forwards'
                        }}>
                          <strong style={{ color: answers[qi] === q.correctIndex ? '#00d9a0' : '#ff4f6e' }}>
                            {answers[qi] === q.correctIndex ? '✅ Bonne réponse !' : `❌ Mauvaise réponse — La bonne réponse était : ${q.options[q.correctIndex]}`}
                          </strong>
                          {q.explanation && (
                            <p style={{ marginTop: 6, color: 'var(--text-muted)' }}>💡 {q.explanation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Score final */}
                {allAnswered && (
                  <div style={S.scoreCard} className="animate-fade-up">
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'Syne,sans-serif' }}>🎯 Résultat final</p>
                    <p style={S.scoreValue}>{score} / {quiz.questions.length}</p>
                    <div style={S.scoreBar}>
                      <div style={{ ...S.scoreFill, width: `${(score / quiz.questions.length) * 100}%`, background: score >= quiz.questions.length * 0.7 ? 'linear-gradient(90deg,#00d9a0,#00b8d4)' : 'linear-gradient(90deg,#ff4f6e,#ff6b9d)' }} />
                    </div>
                    <p style={{ fontSize: 20, marginTop: 12, fontFamily: 'Syne,sans-serif' }}>
                      {score === quiz.questions.length ? '🎉 Parfait ! Bravo !' : score >= quiz.questions.length * 0.7 ? '💪 Bien joué !' : '📚 Continue à réviser !'}
                    </p>
                    <button className="btn btn-primary" onClick={handleQuiz} style={{ marginTop: 20 }}>
                      🔄 Nouveau QCM
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes dotPulse {
          0%,80%,100% { transform:scale(0.6); opacity:0.4; }
          40% { transform:scale(1); opacity:1; }
        }
      `}</style>
    </div>
  );
}

const S = {
  wrapper: { display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' },
  sidebar: { width: 270, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' },
  docMeta: { display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 6 },
  docTitle: { fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 },
  docChars: { fontSize: 11, color: 'var(--text-muted)' },
  tabNav: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 },
  tabBtn: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '12px 14px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid transparent', cursor: 'pointer', width: '100%', color: 'var(--text-muted)', transition: 'all 0.2s', fontFamily: 'Inter,sans-serif' },
  tabBtnActive: { background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', color: 'var(--text)' },
  tabDesc: { fontSize: 11, color: 'var(--text-muted)' },
  main: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' },
  panelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  tabTitle: { fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700 },
  padded: { padding: 28, overflowY: 'auto', height: '100%' },

  // Chat
  chatWrap: { display: 'flex', flexDirection: 'column', height: '100%' },
  messages: { flex: 1, overflowY: 'auto', padding: 24 },
  bubbleUser: { maxWidth: '75%', background: 'var(--accent)', borderRadius: '18px 18px 4px 18px', padding: '12px 16px' },
  bubbleAssistant: { maxWidth: '75%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px' },
  dot: { width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: 'dotPulse 1.2s infinite ease-in-out' },
  chatInput: { padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, background: 'var(--surface)' },
  textarea: { flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', color: 'var(--text)', fontFamily: 'Inter,sans-serif', fontSize: 14, resize: 'none', outline: 'none' },
  emptyCenter: { textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' },
  suggestions: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20, maxWidth: 340, margin: '20px auto 0' },
  suggestion: { padding: '10px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontFamily: 'Inter,sans-serif', textAlign: 'left' },

  // Summary
  summaryBox: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28 },
  loadingBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 60, color: 'var(--text-muted)' },

  // Quiz
  progressWrap: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  progressText: { fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 },
  progressBar: { flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: 3, transition: 'width 0.4s ease' },
  questionCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16 },
  questionHeader: { display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  questionNum: { width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, color: 'white' },
  questionText: { fontSize: 16, fontWeight: 600, fontFamily: 'Syne,sans-serif', lineHeight: 1.5, paddingTop: 4 },
  options: { display: 'flex', flexDirection: 'column', gap: 10 },

  // Score
  scoreCard: { textAlign: 'center', padding: 40, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginTop: 8 },
  scoreValue: { fontSize: 56, fontWeight: 800, fontFamily: 'Syne,sans-serif', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  scoreBar: { width: '60%', margin: '16px auto 0', height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 4, transition: 'width 0.6s ease' },

  select: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 12px', color: 'var(--text)', fontFamily: 'Inter,sans-serif', fontSize: 14, cursor: 'pointer', outline: 'none' },
};
