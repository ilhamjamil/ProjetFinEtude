import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  getDocument,
  detectChapters,
  getChapters,
  getChapterQuiz,
  submitChapterScore,
  chat,
  getGlobalProgress
} from '../utils/api';

const PASS_SCORE = 70;

export default function ChapterView() {
  const { id } = useParams(); // document id
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [detected, setDetected] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chapitre sélectionné
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'quiz'

  // Chat
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = React.useRef(null);

  // Quiz
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [quizCount, setQuizCount] = useState(5);

  useEffect(() => { loadAll(); }, [id]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [docRes, chapRes] = await Promise.all([getDocument(id), getChapters(id)]);
      setDoc(docRes.data);
      setChapters(chapRes.data.chapters || []);
      setDetected(chapRes.data.detected);
      if (chapRes.data.detected && chapRes.data.chapters.length > 0) {
        const first = chapRes.data.chapters[0];
        setSelectedChapter(first);
        await loadProgress();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const res = await getGlobalProgress(id);
      setGlobalProgress(res.data);
    } catch (e) {}
  };

  const handleDetect = async () => {
    setDetecting(true);
    try {
      const res = await detectChapters(id);
      setChapters(res.data.chapters);
      setDetected(true);
      if (res.data.chapters.length > 0) {
        setSelectedChapter(res.data.chapters[0]);
        await loadProgress();
      }
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur détection');
    } finally {
      setDetecting(false);
    }
  };

  const selectChapter = (ch) => {
    if (!ch.isUnlocked) return;
    setSelectedChapter(ch);
    setActiveTab('chat');
    setMessages([]);
    setQuiz(null);
    setAnswers({});
    setRevealed({});
    setSubmitted(false);
    setResult(null);
  };

  // ── CHAT ──
  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading || !selectedChapter) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await chat(id, `[Chapitre: ${selectedChapter.title}] ${userMsg.content}`);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erreur. Réessaie.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── QUIZ ──
  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    setQuiz(null);
    setAnswers({});
    setRevealed({});
    setSubmitted(false);
    setResult(null);
    try {
      const res = await getChapterQuiz(selectedChapter._id, quizCount);
      setQuiz(res.data);
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur génération QCM');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswer = (qi, oi) => {
    if (revealed[qi]) return;
    setAnswers(prev => ({ ...prev, [qi]: oi }));
    setRevealed(prev => ({ ...prev, [qi]: true }));
  };

  const handleSubmitQuiz = async () => {
    const score = quiz.questions.filter((q, i) => answers[i] === q.correctIndex).length;
    const total = quiz.questions.length;
    setSubmitted(true);
    try {
      const res = await submitChapterScore(selectedChapter._id, score, total);
      setResult(res.data);
      // Refresh chapters list
      const chapRes = await getChapters(id);
      setChapters(chapRes.data.chapters);
      await loadProgress();
      // Update selected chapter
      const updated = chapRes.data.chapters.find(c => c._id === selectedChapter._id);
      if (updated) setSelectedChapter(updated);
    } catch (e) {
      alert('Erreur soumission');
    }
  };

  const allAnswered = quiz && Object.keys(revealed).length === quiz.questions.length;
  const currentScore = quiz ? quiz.questions.filter((q, i) => answers[i] === q.correctIndex).length : 0;

  if (loading) return (
    <div style={S.center}><div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} /><p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Chargement...</p></div>
  );

  return (
    <div style={S.wrapper}>

      {/* ── SIDEBAR CHAPITRES ── */}
      <aside style={S.sidebar}>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
          ← Retour
        </button>

        <div style={S.docName}>
          <span style={{ fontSize: 20 }}>📚</span>
          <span style={{ fontSize: 13, fontFamily: 'Syne,sans-serif', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc?.originalName?.replace('.pdf', '')}
          </span>
        </div>

        {/* Progression globale */}
        {globalProgress && detected && (
          <div style={S.globalProgress}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Progression globale</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: globalProgress.isCompleted ? 'var(--success)' : 'var(--accent)' }}>
                {globalProgress.validated}/{globalProgress.total} chapitres
              </span>
            </div>
            <div style={S.progressBar}>
              <div style={{ ...S.progressFill, width: `${globalProgress.globalPercentage}%` }} />
            </div>
            {globalProgress.isCompleted && (
              <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 6, textAlign: 'center' }}>🎉 Cours terminé !</p>
            )}
          </div>
        )}

        {/* Bouton détecter */}
        {!detected ? (
          <button className="btn btn-primary" onClick={handleDetect} disabled={detecting} style={{ width: '100%', justifyContent: 'center' }}>
            {detecting ? <><span className="spinner" /> Détection...</> : '🔍 Détecter les chapitres'}
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={handleDetect} disabled={detecting} style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '6px 12px' }}>
            {detecting ? 'Détection...' : '🔄 Re-détecter'}
          </button>
        )}

        {/* Liste des chapitres */}
        <div style={S.chapterList}>
          {chapters.map((ch, i) => (
            <button
              key={ch._id}
              onClick={() => selectChapter(ch)}
              disabled={!ch.isUnlocked}
              style={{
                ...S.chapterBtn,
                ...(selectedChapter?._id === ch._id ? S.chapterBtnActive : {}),
                opacity: ch.isUnlocked ? 1 : 0.5,
                cursor: ch.isUnlocked ? 'pointer' : 'not-allowed',
              }}
            >
              <div style={S.chapterBtnLeft}>
                <span style={S.chapterIcon}>
                  {ch.isValidated ? '✅' : ch.isUnlocked ? '📖' : '🔒'}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={S.chapterTitle}>{ch.title}</p>
                  {ch.isUnlocked && !ch.isValidated && ch.attempts > 0 && (
                    <p style={S.chapterMeta}>{ch.attempts} tentative{ch.attempts > 1 ? 's' : ''} · Meilleur: {ch.bestScore}%</p>
                  )}
                  {ch.isValidated && (
                    <p style={{ ...S.chapterMeta, color: 'var(--success)' }}>✓ Validé — {ch.bestScore}%</p>
                  )}
                  {!ch.isUnlocked && (
                    <p style={S.chapterMeta}>Valide le chapitre précédent</p>
                  )}
                </div>
              </div>
              {/* Mini barre score */}
              {ch.isUnlocked && ch.bestScore > 0 && (
                <div style={S.miniBar}>
                  <div style={{ ...S.miniBarFill, width: `${ch.bestScore}%`, background: ch.isValidated ? 'var(--success)' : 'var(--accent)' }} />
                </div>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={S.main}>
        {!detected && (
          <div style={S.emptyMain}>
            <span style={{ fontSize: 56 }}>🔍</span>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, marginTop: 16 }}>Détecte les chapitres de ton cours</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 8, marginBottom: 24 }}>L'IA va analyser ton PDF et identifier automatiquement les chapitres</p>
            <button className="btn btn-primary" onClick={handleDetect} disabled={detecting} style={{ fontSize: 16, padding: '14px 28px' }}>
              {detecting ? <><span className="spinner" /> Analyse en cours...</> : '🔍 Détecter les chapitres'}
            </button>
          </div>
        )}

        {detected && !selectedChapter && (
          <div style={S.emptyMain}>
            <span style={{ fontSize: 56 }}>👆</span>
            <p style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, marginTop: 16 }}>Sélectionne un chapitre pour commencer</p>
          </div>
        )}

        {detected && selectedChapter && (
          <div style={S.contentWrap}>
            {/* Header chapitre */}
            <div style={S.chapterHeader}>
              <div>
                <p style={S.chapterLabel}>Chapitre {selectedChapter.order + 1}</p>
                <h2 style={S.chapterBigTitle}>{selectedChapter.title}</h2>
              </div>
              <div style={S.chapterStatus}>
                {selectedChapter.isValidated ? (
                  <span style={{ ...S.badge, background: 'rgba(0,217,160,0.15)', color: 'var(--success)', border: '1px solid rgba(0,217,160,0.3)' }}>✅ Validé</span>
                ) : selectedChapter.revisionSuggested ? (
                  <span style={{ ...S.badge, background: 'rgba(255,107,157,0.15)', color: 'var(--accent3)', border: '1px solid rgba(255,107,157,0.3)' }}>📚 Révision recommandée</span>
                ) : (
                  <span style={{ ...S.badge, background: 'rgba(108,99,255,0.15)', color: 'var(--accent)', border: '1px solid rgba(108,99,255,0.3)' }}>📖 En cours</span>
                )}
                {selectedChapter.attempts > 0 && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedChapter.attempts} tentative{selectedChapter.attempts > 1 ? 's' : ''} · Meilleur score: <strong style={{ color: selectedChapter.bestScore >= PASS_SCORE ? 'var(--success)' : 'var(--error)' }}>{selectedChapter.bestScore}%</strong></span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={S.tabs}>
              {[{ id: 'chat', label: '💬 Chat' }, { id: 'quiz', label: '🧠 QCM' }].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  style={{ ...S.tab, ...(activeTab === t.id ? S.tabActive : {}) }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── CHAT TAB ── */}
            {activeTab === 'chat' && (
              <div style={S.chatWrap}>
                {selectedChapter.revisionSuggested && !selectedChapter.isValidated && (
                  <div style={S.revisionAlert}>
                    📚 <strong>Révision recommandée !</strong> Tu as échoué 2 fois ou plus. Utilise ce chat pour bien comprendre ce chapitre avant de retenter le QCM.
                  </div>
                )}
                <div style={S.messages}>
                  {messages.length === 0 && (
                    <div style={S.chatEmpty}>
                      <span style={{ fontSize: 40 }}>💬</span>
                      <p style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 600, marginTop: 10 }}>
                        Pose des questions sur <em>{selectedChapter.title}</em>
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>Je t'expliquerai ce chapitre en détail</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
                      <div style={msg.role === 'user' ? S.bubbleUser : S.bubbleAssistant}>
                        <div className="markdown"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: 'flex', marginBottom: 14 }}>
                      <div style={S.bubbleAssistant}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {[0, 1, 2].map(i => <span key={i} style={{ ...S.dot, animationDelay: `${i * 0.2}s` }} />)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div style={S.chatInput}>
                  <textarea style={S.textarea} value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                    placeholder={`Question sur "${selectedChapter.title}"...`} rows={2} disabled={chatLoading} />
                  <button className="btn btn-primary" onClick={handleChat} disabled={!chatInput.trim() || chatLoading} style={{ alignSelf: 'flex-end' }}>
                    {chatLoading ? <span className="spinner" /> : '→'}
                  </button>
                </div>
              </div>
            )}

            {/* ── QUIZ TAB ── */}
            {activeTab === 'quiz' && (
              <div style={S.quizWrap}>
                {selectedChapter.isValidated && (
                  <div style={S.validatedBanner}>
                    ✅ Tu as déjà validé ce chapitre avec <strong>{selectedChapter.bestScore}%</strong> ! Tu peux refaire le QCM pour t'entraîner.
                  </div>
                )}

                {!quiz && !quizLoading && (
                  <div style={S.startQuiz}>
                    <span style={{ fontSize: 48 }}>🧠</span>
                    <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, marginTop: 12 }}>QCM — {selectedChapter.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8, marginBottom: 20 }}>
                      {quizCount} questions · Score minimum pour valider : <strong style={{ color: 'var(--accent)' }}>70%</strong>
                    </p>
                    {selectedChapter.revisionSuggested && !selectedChapter.isValidated && (
                      <p style={{ color: 'var(--accent3)', fontSize: 13, marginBottom: 16 }}>
                        💡 Tu as échoué plusieurs fois. Assure-toi d'avoir bien révisé via le Chat avant de continuer.
                      </p>
                    )}
                    <select
                  value={quizCount}
                  onChange={e => setQuizCount(Number(e.target.value))}
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 12px', color: 'var(--text)', fontFamily: 'Inter,sans-serif', fontSize: 14, marginBottom: 16, cursor: 'pointer' }}
                >
                  {[3, 5, 8, 10].map(n => (
                    <option key={n} value={n}>{n} questions</option>
                  ))}
            </select>
                    <button className="btn btn-primary" onClick={handleGenerateQuiz} style={{ fontSize: 15, padding: '12px 28px' }}>
                      🎯 Commencer le QCM
                    </button>
                  </div>
                )}

                {quizLoading && <div style={S.loadingBox}><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /><p>Génération des questions...</p></div>}

                {quiz && !quizLoading && (
                  <div>
                    {/* Barre progression quiz */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>{Object.keys(revealed).length}/{quiz.questions.length}</span>
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
                          <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                            <span style={S.qNum}>{qi + 1}</span>
                            <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne,sans-serif', lineHeight: 1.5 }}>{q.question}</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {q.options.map((opt, oi) => {
                              const isSelected = selectedOpt === oi;
                              const isCorrect = oi === q.correctIndex;
                              let bg = 'var(--surface2)', border = 'var(--border)', color = 'var(--text)', icon = String.fromCharCode(65 + oi);
                              if (isRevealed) {
                                if (isCorrect) { bg = 'rgba(0,217,160,0.12)'; border = '#00d9a0'; color = '#00d9a0'; icon = '✅'; }
                                else if (isSelected) { bg = 'rgba(255,79,110,0.12)'; border = '#ff4f6e'; color = '#ff4f6e'; icon = '❌'; }
                              } else if (isSelected) { bg = 'rgba(108,99,255,0.15)'; border = 'var(--accent)'; }
                              return (
                                <button key={oi} onClick={() => handleAnswer(qi, oi)} disabled={isRevealed}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 'var(--radius)', border: `1px solid ${border}`, background: bg, color, cursor: isRevealed ? 'default' : 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 14, textAlign: 'left', width: '100%', transition: 'all 0.2s' }}>
                                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: isRevealed && (isCorrect || isSelected) ? (isCorrect ? '#00d9a0' : '#ff4f6e') : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: isRevealed && (isCorrect || isSelected) ? 'white' : 'var(--text-muted)', flexShrink: 0 }}>{icon}</span>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {isRevealed && (
                            <div style={{ marginTop: 10, padding: '10px 14px', background: answers[qi] === q.correctIndex ? 'rgba(0,217,160,0.07)' : 'rgba(255,79,110,0.07)', border: `1px solid ${answers[qi] === q.correctIndex ? 'rgba(0,217,160,0.2)' : 'rgba(255,79,110,0.2)'}`, borderRadius: 'var(--radius)', fontSize: 13 }}>
                              <strong style={{ color: answers[qi] === q.correctIndex ? '#00d9a0' : '#ff4f6e' }}>
                                {answers[qi] === q.correctIndex ? '✅ Bonne réponse !' : `❌ Mauvaise — Bonne réponse : ${q.options[q.correctIndex]}`}
                              </strong>
                              {q.explanation && <p style={{ marginTop: 4, color: 'var(--text-muted)' }}>💡 {q.explanation}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Bouton soumettre */}
                    {allAnswered && !submitted && (
                      <button className="btn btn-primary" onClick={handleSubmitQuiz} style={{ width: '100%', justifyContent: 'center', padding: 16, fontSize: 15 }}>
                        ✅ Soumettre mes réponses ({currentScore}/{quiz.questions.length})
                      </button>
                    )}

                    {/* Résultat */}
                    {submitted && result && (
                      <div style={{ ...S.resultCard, borderColor: result.isValidated ? 'rgba(0,217,160,0.3)' : 'rgba(255,79,110,0.3)', background: result.isValidated ? 'rgba(0,217,160,0.06)' : 'rgba(255,79,110,0.06)' }} className="animate-fade-up">
                        <p style={{ fontSize: 48, fontWeight: 800, fontFamily: 'Syne,sans-serif', color: result.isValidated ? 'var(--success)' : 'var(--error)' }}>
                          {result.percentage}%
                        </p>
                        <p style={{ fontSize: 16, fontWeight: 600, marginTop: 4, fontFamily: 'Syne,sans-serif' }}>
                          {result.isValidated ? '🎉 Chapitre validé !' : '❌ Score insuffisant'}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>{result.message}</p>
                        {result.recommendation && (
                          <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-muted)', textAlign: 'left', lineHeight: 1.6 }}>
                            🤖 <em>{result.recommendation}</em>
                          </div>
                        )}
                        {result.nextChapterUnlocked && (
                          <div style={{ marginTop: 12, padding: '10px 16px', background: 'rgba(0,217,160,0.1)', borderRadius: 'var(--radius)', color: 'var(--success)', fontSize: 14 }}>
                            🔓 Le chapitre suivant est maintenant débloqué !
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                          {!result.isValidated && (
                            <button className="btn btn-secondary" onClick={() => setActiveTab('chat')}>
                              💬 Réviser via le Chat
                            </button>
                          )}
                          <button className="btn btn-primary" onClick={handleGenerateQuiz}>
                            🔄 Réessayer le QCM
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes dotPulse { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}

const S = {
  wrapper: { display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' },
  sidebar: { width: 280, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' },
  docName: { display: 'flex', gap: 8, alignItems: 'center', background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 4, minWidth: 0 },
  globalProgress: { background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '10px 12px' },
  progressBar: { width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: 3, transition: 'width 0.5s ease' },
  chapterList: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 },
  chapterBtn: { display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid transparent', width: '100%', textAlign: 'left', transition: 'all 0.2s', fontFamily: 'Inter,sans-serif' },
  chapterBtnActive: { background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)' },
  chapterBtnLeft: { display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: 0 },
  chapterIcon: { fontSize: 16, flexShrink: 0, marginTop: 1 },
  chapterTitle: { fontSize: 13, fontWeight: 600, fontFamily: 'Syne,sans-serif', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 },
  chapterMeta: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  miniBar: { width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  miniBarFill: { height: '100%', borderRadius: 2, transition: 'width 0.4s' },
  main: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' },
  emptyMain: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 40 },
  contentWrap: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
  chapterHeader: { padding: '20px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, flexShrink: 0 },
  chapterLabel: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 },
  chapterBigTitle: { fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, marginTop: 4 },
  chapterStatus: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  badge: { fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600 },
  tabs: { display: 'flex', gap: 4, padding: '16px 28px 0', flexShrink: 0 },
  tab: { padding: '8px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 14, transition: 'all 0.2s' },
  tabActive: { background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', color: 'var(--text)' },
  // Chat
  chatWrap: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '12px 0 0' },
  revisionAlert: { margin: '0 28px 12px', padding: '12px 16px', background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.3)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--accent3)', lineHeight: 1.6, flexShrink: 0 },
  messages: { flex: 1, overflowY: 'auto', padding: '0 28px 16px' },
  chatEmpty: { textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' },
  bubbleUser: { maxWidth: '72%', background: 'var(--accent)', borderRadius: '16px 16px 4px 16px', padding: '10px 14px', fontSize: 14 },
  bubbleAssistant: { maxWidth: '72%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px', padding: '10px 14px', fontSize: 14 },
  dot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: 'dotPulse 1.2s infinite ease-in-out' },
  chatInput: { padding: '12px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, background: 'var(--surface)', flexShrink: 0 },
  textarea: { flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--text)', fontFamily: 'Inter,sans-serif', fontSize: 14, resize: 'none', outline: 'none' },
  // Quiz
  quizWrap: { flex: 1, overflowY: 'auto', padding: '16px 28px 28px' },
  startQuiz: { textAlign: 'center', padding: '48px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' },
  validatedBanner: { padding: '12px 16px', background: 'rgba(0,217,160,0.08)', border: '1px solid rgba(0,217,160,0.25)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--success)', marginBottom: 16 },
  loadingBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 60, color: 'var(--text-muted)' },
  questionCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 14 },
  qNum: { width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, color: 'white' },
  resultCard: { textAlign: 'center', padding: '32px 24px', border: '1px solid', borderRadius: 'var(--radius-lg)', marginTop: 16 },
};
