import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { getProfile } from '../utils/api';

const ALL_BADGES = [
  { id:'first_quiz',    icon:'🧠', name:'Premier Quiz',   desc:'1er quiz complété' },
  { id:'quiz_10',       icon:'🔥', name:'Quiz Addict',    desc:'10 quiz complétés' },
  { id:'first_chapter', icon:'✅', name:'1er Chapitre',   desc:'1er chapitre validé' },
  { id:'chapters_5',    icon:'📚', name:'Studieux',       desc:'5 chapitres validés' },
  { id:'docs_3',        icon:'📂', name:'Collectionneur', desc:'3 cours uploadés' },
  { id:'first_100xp',   icon:'🌟', name:'Premier Pas',    desc:'100 XP accumulés' },
  { id:'high_score',    icon:'🏆', name:'Excellence',     desc:'Moyenne >= 80%' },
];

const LVL = {
  'Débutant':      { color:'#94a3b8', icon:'🌱', max:200,  next:'Intermédiaire' },
  'Intermédiaire': { color:'#6366f1', icon:'📚', max:500,  next:'Avancé' },
  'Avancé':        { color:'#06b6d4', icon:'🚀', max:1000, next:'Expert' },
  'Expert':        { color:'#f59e0b', icon:'🏆', max:1000, next:'Expert' },
};

export default function ProfilePage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  /*const T = isDark
    ? { card:'#1e2535', card2:'#161b27', border:'#2d3650', text:'#e8eaf6', muted:'#8892b0' }
    : { card:'#ffffff', card2:'#f8f9ff', border:'#e2e8f0', text:'#1e293b', muted:'#64748b' };*/

    const T = isDark
  ? {
      bg: '#080B1F',
      card: 'rgba(18, 23, 46, 0.75)',
      card2: 'rgba(26, 32, 64, 0.6)',
      border: 'rgba(120,130,255,0.15)',
      text: '#F8FAFC',
      muted: '#A5B4D6',

      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#06B6D4',

      gradient:
        'linear-gradient(135deg,#EC4899,#8B5CF6,#6366F1)',

      glow: '0 10px 40px rgba(99,102,241,0.25)',
    }
  : /*{
      bg: '#F5F7FB',
      card: '#FFFFFF',
      card2: '#F8FAFF',
      border: '#E7ECF5',
      text: '#1E293B',
      muted: '#64748B',

      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#06B6D4',

      gradient:
        'linear-gradient(135deg,#6366F1,#8B5CF6,#06B6D4)',

      glow: '0 10px 30px rgba(99,102,241,0.12)',
    };*/{
  bg: '#EEF2FF',
  card: '#FFFFFF',
  card2: '#F3F6FF',
  border: '#DCE4FF',

  text: '#1E293B',
  muted: '#64748B',

  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#06B6D4',

  gradient:
    'linear-gradient(135deg,#6366F1,#8B5CF6,#06B6D4)',

  glow: '0 15px 40px rgba(99,102,241,.12)',
};

  useEffect(() => {
    getProfile().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 64px)' }}><div className="spinner" style={{ width:36,height:36,borderWidth:3 }}/></div>;
  if (!data) return null;

  const { user, stats, subjectStats, weeklyData } = data;
  const lvl = LVL[user.level] || LVL['Débutant'];
  const earnedIds = (user.badges||[]).map(b=>b.id);
  

  // SVG chart
  const cW=400, cH=110;
  const pts = weeklyData.map((w,i) => ({
    x: weeklyData.length<2 ? cW/2 : (i/(weeklyData.length-1))*cW,
    y: cH - (w.avgScore/100)*cH
  }));
  const polyline = pts.map(p=>`${p.x},${p.y}`).join(' ');
  const area = pts.length>1 ? `M${pts[0].x},${cH} `+pts.map(p=>`L${p.x},${p.y}`).join(' ')+` L${pts[pts.length-1].x},${cH} Z` : '';

  return (
    <div s/*tyle={{ minHeight:'calc(100vh - 64px)', display:'flex' }}*/style={{
      minHeight:'calc(100vh - 64px)',
      display:'flex',
      background: isDark
        ? '#080B1F'
        : `
          radial-gradient(circle at top left, rgba(99,102,241,0.08), transparent 40%),
          radial-gradient(circle at top right, rgba(236,72,153,0.08), transparent 40%),
          #F5F7FB
        `,
    }}>

      {/* Sidebar */}
      <aside style={{ width:240, flexShrink:0, /*background: T.card*/background: isDark
              ? 'rgba(18, 23, 46, 0.7)'
              : 'rgba(255,255,255,0.9)',

            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)', borderRight:`1px solid ${T.border}`, padding:'22px 14px', display:'flex', flexDirection:'column', gap:4 }}>
        {/* Avatar */}
        <div style={{ textAlign:'center', padding:'16px 0 20px', borderBottom:`1px solid ${T.border}`, marginBottom:10 }}>
          <div style={{ position:'relative', display:'inline-block', marginBottom:10 }}>
            <div style={{ width:68, height:68, borderRadius:'50%', background:`linear-gradient(135deg,#6366f1,#06b6d4)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:800, color:'white', border:`3px solid ${lvl.color}`, margin:'0 auto', fontFamily:"'Outfit',sans-serif" }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ position:'absolute', bottom:-2, right:-2, fontSize:16, background: T.card, borderRadius:'50%', padding:2 }}>{lvl.icon}</span>
          </div>
          <p style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, color: T.text, marginBottom:4 }}>{user.name}</p>
          <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:`${lvl.color}18`, color:lvl.color, fontWeight:600, fontFamily:"'Inter',sans-serif" }}>{user.level}</span>
          <div style={{ marginTop:10, padding:'0 4px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color: T.muted, marginBottom:4, fontFamily:"'Inter',sans-serif" }}>
              <span>⚡ {user.xp} XP</span><span>{lvl.max} XP</span>
            </div>
            <div style={{ height:5, background: T.card2, borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${user.xpProgress}%`, background:`linear-gradient(90deg,${lvl.color},#818cf8)`, borderRadius:3, transition:'width 0.8s' }}/>
            </div>
            <p style={{ fontSize:10, color: T.muted, marginTop:3, textAlign:'center', fontFamily:"'Inter',sans-serif" }}>
              {lvl.max-user.xp>0 ? `${lvl.max-user.xp} XP pour ${lvl.next}` : '🏆 Max !'}
            </p>
          </div>
        </div>

        {/* Nav */}
        {[,{icon:'📄',label:'Mes Cours',path:'/'},{icon:'📅',label:'Planning',path:'/schedule'},{icon:'📊',label:'Statistiques',path:'/profile'}].map((item,i)=>(
          <div key={i} onClick={()=>navigate(item.path)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:9, cursor:'pointer', background:item.path==='/profile'&&i===3?'rgba(99,102,241,0.1)':'transparent', border:`1px solid ${item.path==='/profile'&&i===3?'rgba(99,102,241,0.25)':'transparent'}`, color: item.path==='/profile'&&i===3?'#6366f1':T.muted, transition:'all 0.2s', fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600 }}>
            <span style={{ fontSize:16 }}>{item.icon}</span>{item.label}
          </div>
        ))}

        <div style={{ flex:1 }}/>
        <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:12 }}>
          <div onClick={toggleTheme} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:9, cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:13, color: T.muted }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <span style={{ fontSize:16 }}>{isDark?'☀️':'🌙'}</span>
              <span>{isDark?'Mode clair':'Mode sombre'}</span>
            </div>
            <div style={{ width:34, height:18, borderRadius:9, background: isDark?'#6366f1':T.border, position:'relative', transition:'background 0.3s' }}>
              <div style={{ width:14,height:14,borderRadius:'50%',background:'white',position:'absolute',top:2,left:isDark?18:2,transition:'left 0.3s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, overflowY:'auto', padding:'28px 28px' }}>

        {/* Greeting */}
        <div style={{ borderRadius:18, padding:'22px 26px', marginBottom:22, position:'relative', overflow:'hidden', background: isDark?'linear-gradient(135deg,#1e2535,#252d50)':'linear-gradient(135deg,#eef2ff,#e0e7ff)', border:`1px solid ${T.border}` }}>
          <div style={{ position:'absolute', right:20, top:'50%', transform:'translateY(-50%)', fontSize:64, opacity:0.1, pointerEvents:'none' }}>🎓</div>
          <h2 style={{ fontFamily:"'Outfit',sans-serif", fontSize:20, fontWeight:800, color: T.text, marginBottom:5 }}>Bonjour {user.name} ! 👋</h2>
          <p style={{ color: T.muted, fontSize:14, marginBottom:12, fontFamily:"'Inter',sans-serif" }}>Prêt à continuer ton apprentissage aujourd'hui ?</p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <span style={{ padding:'4px 12px', borderRadius:20, background:`${lvl.color}18`, color:lvl.color, fontSize:12, fontWeight:600, border:`1px solid ${lvl.color}30`, fontFamily:"'Inter',sans-serif" }}>Niveau {user.level}</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:22 }}>
  {[
    {icon:'📄',label:'Documents',value:stats.totalDocs, bg:'linear-gradient(135deg,#6366f1,#818cf8)'},
    {icon:'🧠',label:'Quiz complétés',value:stats.totalQuiz,bg:'linear-gradient(135deg,#8b5cf6,#6366f1)'},
    {icon:'📊',label:'Score moyen',value:`${stats.avgScore}%`,bg:'linear-gradient(135deg,#6366f1,#06b6d4)'},
    {icon:'✅',label:'Ch. validés',value:stats.chaptersValidated,bg:'linear-gradient(135deg,#6366f1,#8b5cf6)'},
  ].map((s,i)=>(
    <div
      key={i}
      style={{
        background:s.bg,
        borderRadius:18,
        padding:'20px 14px',
        textAlign:'center',
        color:'white',
        boxShadow:'0 15px 35px rgba(99,102,241,0.22)',
        animation:`fadeUp 0.4s ease ${i*0.08}s both`,
        position:'relative',
        overflow:'hidden'
      }}
    >
      <div style={{
        position:'absolute',
        top:'-25px',
        right:'-25px',
        width:'80px',
        height:'80px',
        borderRadius:'50%',
        background:'rgba(255,255,255,0.12)'
      }}/>

      <span style={{
        fontSize:24,
        display:'block',
        marginBottom:8
      }}>
        {s.icon}
      </span>

      <p style={{
        fontFamily:"'Outfit',sans-serif",
        fontSize:28,
        fontWeight:800,
        color:'white',
        marginBottom:4
      }}>
        {s.value}
      </p>

      <p style={{
        fontSize:11,
        color:'rgba(255,255,255,0.85)',
        fontWeight:600,
        letterSpacing:'0.3px'
      }}>
        {s.label}
      </p>
    </div>
  ))}
</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>

          {/* Chart */}
          <div style={{ background: T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:20 }}>
            <h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:14, fontWeight:700, color: T.text, marginBottom:16 }}>📈 Évolution hebdomadaire</h3>
            {weeklyData.length < 2 ? (
              <div style={{ textAlign:'center', padding:'30px 0', color: T.muted, fontSize:13, fontFamily:"'Inter',sans-serif" }}>
                <p style={{ fontSize:28, marginBottom:6 }}>📊</p>Complète des quiz pour voir ton évolution !
              </div>
            ) : (
              <div>
                <svg viewBox={`0 0 ${cW} ${cH}`} style={{ width:'100%', height:120, overflow:'visible' }}>
                  <defs>
                    <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {[0,25,50,75,100].map(v=><line key={v} x1="0" y1={cH-(v/100)*cH} x2={cW} y2={cH-(v/100)*cH} stroke={T.border} strokeWidth="1" strokeDasharray="4,4"/>)}
                  {area && <path d={area} fill="url(#ag)"/>}
                  <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {pts.map((p,i)=>(
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="5" fill="#6366f1" stroke={T.card} strokeWidth="2"/>
                      <text x={p.x} y={p.y-9} textAnchor="middle" fontSize="9" fill={T.muted}>{weeklyData[i].avgScore}%</text>
                    </g>
                  ))}
                </svg>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                  {weeklyData.map((w,i)=><span key={i} style={{ fontSize:9, color: T.muted, flex:1, textAlign:'center', fontFamily:"'Inter',sans-serif" }}>{w.week}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* AI recommendation */}
          <div style={{ borderRadius:16, padding:20, /*background:'linear-gradient(135deg,#312e81,#1e3a5f)'*/background: T.gradient,
boxShadow: '0 20px 60px rgba(99,102,241,0.25)',
borderRadius: 18, border:'none', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:14 }}>
                <span style={{ fontSize:20 }}>🤖</span>
                <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.75)', background:'rgba(255,255,255,0.12)', padding:'2px 9px', borderRadius:20, fontFamily:"'Inter',sans-serif" }}>Recommandation IA</span>
              </div>
              {stats.avgScore < 70 && stats.totalQuiz > 0 ? (
                <><h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:800, color:'white', marginBottom:8, lineHeight:1.4 }}>Concentrons-nous sur les points faibles !</h3>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.65, fontFamily:"'Inter',sans-serif" }}>Score moyen {stats.avgScore}%. Revois les chapitres non validés et refais des QCM ciblés.</p></>
              ) : stats.totalQuiz === 0 ? (
                <><h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:800, color:'white', marginBottom:8, lineHeight:1.4 }}>Lance-toi dans ton premier quiz !</h3>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.65, fontFamily:"'Inter',sans-serif" }}>Upload un cours, détecte les chapitres et commence à t'évaluer.</p></>
              ) : (
                <><h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:800, color:'white', marginBottom:8, lineHeight:1.4 }}>Excellent travail ! 🎉</h3>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.65, fontFamily:"'Inter',sans-serif" }}>Tu maintiens un bon score de {stats.avgScore}%. Continue !</p></>
              )}
            </div>
            <button onClick={()=>navigate('/')} style={{ marginTop:16, padding:'11px', borderRadius:10, background:'white', border:'none', color:'#6366f1', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
              Commencer maintenant →
            </button>
          </div>
        </div>

        {/* Subjects */}
        {subjectStats.length > 0 && (
          <div style={{ background: T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:20, marginBottom:20 }}>
            <h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:14, fontWeight:700, color: T.text, marginBottom:16 }}>📚 Progression par matière</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {subjectStats.map((sub,i)=>{
                const colors=['#6366f1','#06b6d4','#10b981','#f59e0b','#f43f5e'];
                const col=colors[i%colors.length];
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', background: T.card2, borderRadius:11, border:`1px solid ${T.border}` }}>
                    <div style={{ width:38,height:38,borderRadius:9,background:`${col}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>📄</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <p style={{ fontWeight:700, fontSize:13, color: T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200, fontFamily:"'Outfit',sans-serif" }}>{sub.name}</p>
                        <span style={{ fontWeight:800, fontSize:14, color:col, flexShrink:0, marginLeft:8, fontFamily:"'Outfit',sans-serif" }}>{sub.progress}%</span>
                      </div>
                      <div style={{ height:6, background: T.border, borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${sub.progress}%`, background:`linear-gradient(90deg,${col},${col}99)`, borderRadius:3, transition:'width 0.8s' }}/>
                      </div>
                      <p style={{ fontSize:11, color: T.muted, marginTop:3, fontFamily:"'Inter',sans-serif" }}>{sub.chaptersValidated}/{sub.chaptersTotal} chapitres · {sub.quizDone} quiz · moy. {sub.avgScore}%</p>
                    </div>
                    <button onClick={()=>navigate(`/chapters/${sub.docId}`)} style={{ padding:'6px 12px', borderRadius:8, background:`${col}15`, border:`1px solid ${col}30`, color:col, fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0, fontFamily:"'Inter',sans-serif" }}>→</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        
      </main>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

