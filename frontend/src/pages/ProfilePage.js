import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../utils/api';

const LEVEL_CONFIG = {
  'Débutant':      { color: '#94a3b8', bg: '#94a3b820', next: 'Intermédiaire', icon: '🌱', min: 0,   max: 200  },
  'Intermédiaire': { color: '#6366f1', bg: '#6366f120', next: 'Avancé',        icon: '📚', min: 200,  max: 500  },
  'Avancé':        { color: '#06b6d4', bg: '#06b6d420', next: 'Expert',        icon: '🚀', min: 500,  max: 1000 },
  'Expert':        { color: '#f59e0b', bg: '#f59e0b20', next: 'Expert',        icon: '🏆', min: 1000, max: 1000 },
};

const ALL_BADGES = [
  { id: 'first_quiz',    icon: '🧠', name: 'Premier Quiz',    desc: 'Complète ton 1er quiz' },
  { id: 'quiz_10',       icon: '🔥', name: 'Quiz Addict',     desc: '10 quiz complétés' },
  { id: 'first_chapter', icon: '✅', name: '1er Chapitre',    desc: 'Valide ton 1er chapitre' },
  { id: 'chapters_5',    icon: '📚', name: 'Studieux',        desc: '5 chapitres validés' },
  { id: 'docs_3',        icon: '📂', name: 'Collectionneur',  desc: '3 cours uploadés' },
  { id: 'first_100xp',   icon: '🌟', name: 'Premier Pas',     desc: '100 XP accumulés' },
  { id: 'high_score',    icon: '🏆', name: 'Excellence',      desc: 'Moyenne >= 80%' },
];

export default function ProfilePage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme]     = useState(() => localStorage.getItem('studyai_theme') || 'dark');
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('studyai_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await getProfile();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // ── CSS vars selon theme ──
  const T = isDark ? {
    bg:        '#0f1117',
    sidebar:   '#161b27',
    card:      '#1e2535',
    card2:     '#252d40',
    border:    '#2d3650',
    text:      '#e8eaf6',
    textMuted: '#8892b0',
    accent:    '#6366f1',
    accent2:   '#06b6d4',
  } : {
    bg:        '#f0f4ff',
    sidebar:   '#ffffff',
    card:      '#ffffff',
    card2:     '#f8f9ff',
    border:    '#e2e8f0',
    text:      '#1e293b',
    textMuted: '#64748b',
    accent:    '#6366f1',
    accent2:   '#0891b2',
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', background: T.bg }}>
      <div className="spinner" style={{ width:40, height:40, borderWidth:3, borderTopColor: T.accent }} />
    </div>
  );

  if (!data) return null;

  const { user, stats, subjectStats, weeklyData } = data;
  const lvl = LEVEL_CONFIG[user.level] || LEVEL_CONFIG['Débutant'];
  const earnedIds = (user.badges || []).map(b => b.id);
  const maxWeek = Math.max(...weeklyData.map(w => w.avgScore), 1);

  // Points pour SVG line chart
  const chartW = 400, chartH = 120;
  const pts = weeklyData.map((w, i) => ({
    x: weeklyData.length < 2 ? chartW/2 : (i / (weeklyData.length - 1)) * chartW,
    y: chartH - (w.avgScore / 100) * chartH
  }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = pts.length > 1
    ? `M${pts[0].x},${chartH} ` + pts.map(p => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length-1].x},${chartH} Z`
    : '';

  const C = { // component styles
    page:    { display:'flex', minHeight:'calc(100vh - 64px)', background: T.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" },
    sidebar: { width:240, flexShrink:0, background: T.sidebar, borderRight:`1px solid ${T.border}`, padding:'24px 16px', display:'flex', flexDirection:'column', gap:4 },
    main:    { flex:1, padding:'28px 32px', overflowY:'auto' },
    navItem: (active) => ({
      display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
      borderRadius:10, cursor:'pointer', fontSize:14, fontWeight: active ? 600 : 400,
      color: active ? T.accent : T.textMuted,
      background: active ? `${T.accent}15` : 'transparent',
      border: active ? `1px solid ${T.accent}30` : '1px solid transparent',
      transition:'all 0.2s', marginBottom:2
    }),
    card: (extra={}) => ({
      background: T.card, border:`1px solid ${T.border}`,
      borderRadius:16, padding:20, ...extra
    }),
  };

  return (
    <div style={C.page}>
      {/* ── SIDEBAR ── */}
      <aside style={C.sidebar}>
        {/* Avatar + info */}
        <div style={{ textAlign:'center', padding:'20px 0 24px', borderBottom:`1px solid ${T.border}`, marginBottom:12 }}>
          <div style={{ position:'relative', display:'inline-block', marginBottom:12 }}>
            <div style={{
              width:72, height:72, borderRadius:'50%',
              background:`linear-gradient(135deg, ${T.accent}, ${T.accent2})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:28, fontWeight:800, color:'white',
              border:`3px solid ${lvl.color}`, margin:'0 auto'
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ position:'absolute', bottom:-2, right:-2, fontSize:18, background: T.sidebar, borderRadius:'50%', padding:2 }}>
              {lvl.icon}
            </span>
          </div>
          <p style={{ fontWeight:700, fontSize:15, color: T.text, marginBottom:2 }}>{user.name}</p>
          <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background: lvl.bg, color: lvl.color, fontWeight:600 }}>
            {user.level}
          </span>
          {/* XP bar */}
          <div style={{ marginTop:12, padding:'0 8px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color: T.textMuted, marginBottom:5 }}>
              <span>⚡ {user.xp} XP</span>
              <span>{lvl.max} XP</span>
            </div>
            <div style={{ height:6, background: T.card2, borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${user.xpProgress}%`, background:`linear-gradient(90deg, ${T.accent}, ${T.accent2})`, borderRadius:3, transition:'width 0.8s ease' }} />
            </div>
            <p style={{ fontSize:10, color: T.textMuted, marginTop:4, textAlign:'center' }}>
              {lvl.max - user.xp > 0 ? `${lvl.max - user.xp} XP pour ${lvl.next}` : '🏆 Niveau max !'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        {[
          { icon:'🏠', label:'Accueil', path:'/' },
          { icon:'📄', label:'Mes Cours', path:'/' },
          { icon:'🧠', label:'Quiz', path:'/' },
          { icon:'📊', label:'Statistiques', path:'/profile' },
        ].map((item, i) => (
          <div key={i} style={C.navItem(item.path === '/profile' && i === 3)} onClick={() => navigate(item.path)}>
            <span style={{ fontSize:18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}

        <div style={{ flex:1 }} />

        {/* Theme toggle */}
        <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:16, marginTop:8 }}>
          <div style={{ ...C.navItem(false), justifyContent:'space-between' }} onClick={toggleTheme}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>{isDark ? '☀️' : '🌙'}</span>
              <span style={{ fontSize:14, color: T.textMuted }}>{isDark ? 'Mode clair' : 'Mode sombre'}</span>
            </div>
            {/* Toggle switch */}
            <div style={{ width:38, height:20, borderRadius:10, background: isDark ? T.accent : T.border, position:'relative', transition:'background 0.3s', cursor:'pointer' }}>
              <div style={{ width:16, height:16, borderRadius:'50%', background:'white', position:'absolute', top:2, left: isDark ? 20 : 2, transition:'left 0.3s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={C.main}>

        {/* Greeting banner */}
        <div style={{
          ...C.card({ padding:'24px 28px', marginBottom:24, position:'relative', overflow:'hidden',
            background: isDark
              ? `linear-gradient(135deg, #1e2535 0%, #252d50 100%)`
              : `linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)`,
          }),
        }}>
          <div style={{ position:'absolute', right:24, top:'50%', transform:'translateY(-50%)', fontSize:72, opacity:0.12 }}>🎓</div>
          <h2 style={{ fontFamily:"'Syne', sans-serif", fontSize:22, fontWeight:800, color: T.text, marginBottom:6 }}>
            Bonjour {user.name} ! 👋
          </h2>
          <p style={{ color: T.textMuted, fontSize:14, marginBottom:14 }}>Prêt à continuer ton apprentissage aujourd'hui ?</p>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <span style={{ padding:'5px 14px', borderRadius:20, background: lvl.bg, color: lvl.color, fontSize:13, fontWeight:600, border:`1px solid ${lvl.color}40` }}>
              {lvl.icon} Niveau : {user.level}
            </span>
            <span style={{ fontSize:13, color: T.textMuted }}>⚡ {user.xp} XP accumulés</span>
            <span style={{ fontSize:13, color: T.textMuted }}>🏅 {user.badges?.length || 0} badges</span>
          </div>
        </div>

        {/* Stats cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:16, marginBottom:24 }}>
          {[
            { icon:'📄', label:'Documents étudiés', value: stats.totalDocs,          color:'#6366f1', suffix:'' },
            { icon:'🧠', label:'Quiz complétés',     value: stats.totalQuiz,          color:'#06b6d4', suffix:'' },
            { icon:'📊', label:'Score moyen',        value: stats.avgScore,           color: stats.avgScore >= 70 ? '#10b981' : '#f59e0b', suffix:'%' },
            { icon:'✅', label:'Chapitres validés',  value: stats.chaptersValidated,  color:'#f59e0b', suffix:'' },
          ].map((s, i) => (
            <div key={i} style={{ ...C.card(), display:'flex', flexDirection:'column', gap:8, animation:`fadeUp 0.4s ease ${i*0.08}s both` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:22 }}>{s.icon}</span>
                <div style={{ width:36, height:36, borderRadius:10, background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background: s.color }} />
                </div>
              </div>
              <p style={{ fontSize:30, fontWeight:800, fontFamily:"'Syne',sans-serif", color: s.color, lineHeight:1 }}>
                {s.value}{s.suffix}
              </p>
              <p style={{ fontSize:12, color: T.textMuted }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Chart + Recommandation IA */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>

          {/* Graphique évolution */}
          <div style={C.card()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color: T.text }}>📈 Évolution des performances</h3>
            </div>
            {weeklyData.length < 2 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color: T.textMuted, fontSize:13 }}>
                <p style={{ fontSize:32, marginBottom:8 }}>📊</p>
                Complète des quiz pour voir ton évolution !
              </div>
            ) : (
              <div>
                {/* Axes */}
                <div style={{ display:'flex', gap:8, alignItems:'flex-end', marginBottom:8 }}>
                  {[100,70,50].map(v => (
                    <div key={v} style={{ position:'relative' }}>
                      <span style={{ fontSize:10, color: T.textMuted }}>{v}%</span>
                    </div>
                  ))}
                </div>
                <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width:'100%', height:130, overflow:'visible' }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.accent} stopOpacity="0.3"/>
                      <stop offset="100%" stopColor={T.accent} stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[0,25,50,75,100].map(v => (
                    <line key={v} x1="0" y1={chartH - (v/100)*chartH} x2={chartW} y2={chartH - (v/100)*chartH}
                      stroke={T.border} strokeWidth="1" strokeDasharray="4,4"/>
                  ))}
                  {/* Area fill */}
                  {area && <path d={area} fill="url(#areaGrad)" />}
                  {/* Line */}
                  <polyline points={polyline} fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Dots */}
                  {pts.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="5" fill={T.accent} stroke={T.card} strokeWidth="2"/>
                      <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fill={T.textMuted}>
                        {weeklyData[i].avgScore}%
                      </text>
                    </g>
                  ))}
                </svg>
                {/* Labels semaines */}
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                  {weeklyData.map((w, i) => (
                    <span key={i} style={{ fontSize:10, color: T.textMuted, flex:1, textAlign:'center' }}>{w.week}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommandation IA */}
          <div style={{
            ...C.card(),
            background: isDark
              ? 'linear-gradient(135deg, #312e81 0%, #1e3a5f 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #0891b2 100%)',
            border:'none', display:'flex', flexDirection:'column', justifyContent:'space-between'
          }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <span style={{ fontSize:22 }}>🤖</span>
                <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.8)', background:'rgba(255,255,255,0.15)', padding:'3px 10px', borderRadius:20 }}>
                  Recommandation IA
                </span>
              </div>
              {stats.avgScore < 70 && stats.totalQuiz > 0 ? (
                <>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:'white', marginBottom:10, lineHeight:1.4 }}>
                    Concentrons-nous sur les points faibles !
                  </h3>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.6 }}>
                    Ton score moyen est de {stats.avgScore}%. Revois les chapitres non validés et refais des quiz ciblés pour progresser.
                  </p>
                </>
              ) : stats.totalQuiz === 0 ? (
                <>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:'white', marginBottom:10, lineHeight:1.4 }}>
                    Lance-toi dans ton premier quiz !
                  </h3>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.6 }}>
                    Upload un cours, détecte les chapitres et commence à t'évaluer pour suivre ta progression.
                  </p>
                </>
              ) : (
                <>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:'white', marginBottom:10, lineHeight:1.4 }}>
                    Excellent travail, continue ! 🎉
                  </h3>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.6 }}>
                    Tu maintiens un bon score de {stats.avgScore}%. Explore de nouveaux cours pour élargir tes connaissances.
                  </p>
                </>
              )}
            </div>
            <button
              onClick={() => navigate('/')}
              style={{ marginTop:20, padding:'12px', borderRadius:10, background:'white', border:'none', color:'#6366f1', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:"'Syne',sans-serif" }}>
              Commencer maintenant →
            </button>
          </div>
        </div>

        {/* Progression par matière */}
        {subjectStats.length > 0 && (
          <div style={{ ...C.card(), marginBottom:24 }}>
            <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color: T.text, marginBottom:20 }}>
              📚 Progression par matière
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {subjectStats.map((sub, i) => {
                const colors = ['#6366f1','#06b6d4','#10b981','#f59e0b','#f43f5e'];
                const col = colors[i % colors.length];
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', background: T.card2, borderRadius:12, border:`1px solid ${T.border}` }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:`${col}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                      📄
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <p style={{ fontWeight:600, fontSize:14, color: T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{sub.name}</p>
                        <span style={{ fontWeight:800, fontSize:15, color: col, flexShrink:0, marginLeft:8 }}>{sub.progress}%</span>
                      </div>
                      <div style={{ height:7, background: T.border, borderRadius:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${sub.progress}%`, background:`linear-gradient(90deg, ${col}, ${col}99)`, borderRadius:4, transition:'width 0.8s ease' }} />
                      </div>
                      <p style={{ fontSize:11, color: T.textMuted, marginTop:4 }}>
                        {sub.chaptersValidated}/{sub.chaptersTotal} chapitres · {sub.quizDone} quiz · moy. {sub.avgScore}%
                      </p>
                    </div>
                    <button onClick={() => navigate(`/chapters/${sub.docId}`)}
                      style={{ padding:'6px 14px', borderRadius:8, background:`${col}15`, border:`1px solid ${col}40`, color: col, fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0 }}>
                      Continuer →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Badges */}
        <div style={C.card()}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color: T.text, marginBottom:20 }}>
            🏆 Mes badges
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:12 }}>
            {ALL_BADGES.map((badge, i) => {
              const earned = earnedIds.includes(badge.id);
              return (
                <div key={i} style={{
                  padding:'16px 10px', borderRadius:14, textAlign:'center',
                  background: earned ? (isDark ? '#1e2535' : '#f0f4ff') : T.card2,
                  border: earned ? `1px solid ${T.accent}40` : `1px solid ${T.border}`,
                  opacity: earned ? 1 : 0.45,
                  transition:'all 0.2s',
                  boxShadow: earned ? `0 4px 20px ${T.accent}20` : 'none',
                }}>
                  <span style={{ fontSize:28, display:'block', marginBottom:8, filter: earned ? 'none' : 'grayscale(1)' }}>
                    {badge.icon}
                  </span>
                  <p style={{ fontSize:12, fontWeight:700, color: earned ? T.text : T.textMuted, marginBottom:3, lineHeight:1.3 }}>
                    {badge.name}
                  </p>
                  <p style={{ fontSize:10, color: T.textMuted, lineHeight:1.4 }}>{badge.desc}</p>
                  {earned && (
                    <span style={{ display:'inline-block', marginTop:6, fontSize:9, padding:'2px 8px', borderRadius:10, background:`${T.accent}20`, color: T.accent, fontWeight:600 }}>
                      Obtenu ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
