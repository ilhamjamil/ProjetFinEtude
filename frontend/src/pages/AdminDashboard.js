import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import api from '../utils/api';

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [selUser, setSelUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('dashboard');
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const T = isDark ? {
    bg:     '#080B1F',
    card:   'rgba(20,25,55,0.85)',
    card2:  'rgba(28,34,72,0.6)',
    border: 'rgba(120,130,255,0.15)',
    text:   '#ffffff',
    muted:  '#9CA9D6',
    grad:   'linear-gradient(135deg,#EC4899 0%,#8B5CF6 50%,#3B82F6 100%)',
    glow:   '0 0 30px rgba(139,92,246,0.2)',
    blur:   'blur(12px)',
  } : {
    bg:     '#F6F8FF',
    card:   '#ffffff',
    card2:  '#F0F4FF',
    border: '#E6EAF8',
    text:   '#1E1B4B',
    muted:  '#64748B',
    grad:   'linear-gradient(135deg,#A855F7 0%,#6366F1 50%,#3B82F6 100%)',
    glow:   '0 4px 24px rgba(99,102,241,0.10)',
    blur:   'none',
  };

  const pageBg = isDark
    ? `radial-gradient(circle at 10% 10%, rgba(139,92,246,0.18), transparent 35%),
       radial-gradient(circle at 90% 5%,  rgba(236,72,153,0.12), transparent 30%),
       ${T.bg}`
    : `radial-gradient(circle at 10% 10%, rgba(168,85,247,0.09), transparent 35%),
       radial-gradient(circle at 90% 5%,  rgba(59,130,246,0.08), transparent 30%),
       ${T.bg}`;

  const lvlColor = { 'Débutant':'#94a3b8','Intermédiaire':'#8B5CF6','Avancé':'#3B82F6','Expert':'#f59e0b' };
  const lvlIcon  = { 'Débutant':'🌱','Intermédiaire':'📚','Avancé':'🚀','Expert':'🏆' };

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [sRes, uRes] = await Promise.all([api.get('/admin/stats'), api.get('/admin/users')]);
      setStats(sRes.data);
      setUsers(uRes.data);
    } catch (e) {
      if (e.response?.status === 403) navigate('/');
    } finally { setLoading(false); }
  };

  const loadUser = async (id) => {
    try {
      const res = await api.get(`/admin/users/${id}`);
      setSelUser(res.data);
      setTab('user');
    } catch {}
  };

  const fmtDate = d => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', background: pageBg }}>
      <div className="spinner" style={{ width:40, height:40, borderWidth:3 }} />
    </div>
  );

  const NavItem = ({ id, icon, label }) => (
    <button onClick={() => { setTab(id); setSelUser(null); }} style={{
      display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
      borderRadius:11, border:`1px solid ${tab===id ? 'rgba(139,92,246,0.35)' : 'transparent'}`,
      background: tab===id
        ? isDark ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.10)'
        : 'transparent',
      color: tab===id ? '#8B5CF6' : T.muted,
      cursor:'pointer', fontSize:13, fontWeight:600, width:'100%', textAlign:'left',
      transition:'all 0.2s',
    }}>
      <span style={{ fontSize:17 }}>{icon}</span>{label}
    </button>
  );

  return (
    <div style={{ minHeight:'calc(100vh - 62px)', display:'flex', background: pageBg }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width:230, flexShrink:0,
        background: isDark ? 'rgba(13,18,45,0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        borderRight:`1px solid ${T.border}`,
        padding:'24px 14px', display:'flex', flexDirection:'column', gap:4,
        boxShadow: isDark ? '2px 0 20px rgba(0,0,0,0.3)' : '2px 0 20px rgba(99,102,241,0.06)',
      }}>
        {/* Logo admin */}
        <div style={{ marginBottom:28, padding:'0 8px' }}>
          <div style={{ width:44, height:44, background:T.grad, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:12, boxShadow:'0 4px 16px rgba(139,92,246,0.35)' }}>🛡️</div>
          <p style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:16, color:T.text, marginBottom:2 }}>Admin Panel</p>
          <p style={{ fontSize:11, color:T.muted }}>StudyAI · Gestion</p>
        </div>

        <NavItem id="dashboard" icon="📊" label="Dashboard" />
        <NavItem id="users"     icon="👥" label="Étudiants" />

        <div style={{ flex:1 }} />

        {/* Stats rapides */}
        <div style={{ padding:'12px', borderRadius:12, background: isDark?'rgba(139,92,246,0.1)':'rgba(139,92,246,0.06)', border:`1px solid rgba(139,92,246,0.2)`, marginBottom:10 }}>
          <p style={{ fontSize:11, color:'#8B5CF6', fontWeight:600, marginBottom:6 }}>📊 Résumé</p>
          <p style={{ fontSize:13, color:T.text, fontWeight:700 }}>{stats?.totalUsers || 0} étudiants</p>
          <p style={{ fontSize:11, color:T.muted }}>{stats?.totalDocs || 0} cours · {stats?.totalQuiz || 0} quiz</p>
        </div>

        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:11, border:`1px solid ${T.border}`, background:'transparent', color:T.muted, cursor:'pointer', fontSize:13, fontWeight:600, width:'100%', textAlign:'left', transition:'all 0.2s' }}>
          <span style={{ fontSize:17 }}>🏠</span>Retour app
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex:1, overflowY:'auto', padding:'32px 32px' }}>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && stats && (
          <div>
            <div style={{ marginBottom:28 }}>
              <h1 style={{ fontFamily:"'Outfit',sans-serif", fontSize:24, fontWeight:800, color:T.text, marginBottom:4 }}>
                Bienvenue, Admin 👋
              </h1>
              <p style={{ color:T.muted, fontSize:14 }}>Vue globale de la plateforme StudyAI</p>
            </div>

            {/* Stats cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
              {[
                { icon:'👥', label:'Étudiants inscrits',  value:stats.totalUsers,      color:'#8B5CF6', bg:'rgba(139,92,246,0.12)'  },
                { icon:'📄', label:'Cours uploadés',      value:stats.totalDocs,       color:'#3B82F6', bg:'rgba(59,130,246,0.12)'  },
                { icon:'🧠', label:'Quiz complétés',      value:stats.totalQuiz,       color:'#EC4899', bg:'rgba(236,72,153,0.12)'  },
                { icon:'✅', label:'Chapitres validés',   value:stats.totalValidated,  color:'#10b981', bg:'rgba(16,185,129,0.12)'  },
                { icon:'📊', label:'Score moyen global',  value:`${stats.avgScore}%`,  color:stats.avgScore>=70?'#10b981':'#f59e0b', bg: stats.avgScore>=70?'rgba(16,185,129,0.12)':'rgba(245,158,11,0.12)' },
                { icon:'📅', label:'Plannings créés',     value:stats.totalSchedules,  color:'#f59e0b', bg:'rgba(245,158,11,0.12)'  },
              ].map((s,i) => (
                <div key={i} style={{
                  background: isDark ? 'rgba(20,25,55,0.85)' : '#fff',
                  backdropFilter: isDark ? T.blur : 'none',
                  border:`1px solid ${T.border}`,
                  borderRadius:16, padding:'20px 18px',
                  boxShadow: T.glow, transition:'all 0.25s',
                  display:'flex', alignItems:'center', gap:14,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.borderColor=s.color+'50'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor=T.border; }}>
                  <div style={{ width:46, height:46, borderRadius:13, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                    {s.icon}
                  </div>
                  <div>
                    <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:26, fontWeight:800, color:s.color, lineHeight:1, marginBottom:3 }}>{s.value}</p>
                    <p style={{ fontSize:12, color:T.muted }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Graphique + Top étudiants */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>

              {/* Graphique inscriptions */}
              <div style={{ background: isDark?'rgba(20,25,55,0.85)':'#fff', backdropFilter: isDark?T.blur:'none', border:`1px solid ${T.border}`, borderRadius:16, padding:22, boxShadow:T.glow }}>
                <h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:15, fontWeight:700, color:T.text, marginBottom:18 }}>📈 Inscriptions par semaine</h3>
                {stats.weeklySignups.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'30px 0', color:T.muted, fontSize:13 }}>
                    <p style={{ fontSize:28, marginBottom:6 }}>📊</p>Aucune donnée
                  </div>
                ) : (
                  <div>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:130, paddingBottom:0, position:'relative' }}>
                      {stats.weeklySignups.map((w,i) => {
                        const maxVal = Math.max(...stats.weeklySignups.map(x => x.count), 1);
                        const h = Math.max((w.count / maxVal) * 100, 4);
                        return (
                          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, justifyContent:'flex-end', height:'100%' }}>
                            <span style={{ fontSize:10, fontWeight:700, color:'#8B5CF6' }}>{w.count}</span>
                            <div style={{ width:'100%', height:`${h}%`, background:T.grad, borderRadius:'6px 6px 0 0', boxShadow:'0 4px 12px rgba(139,92,246,0.25)', transition:'height 0.6s ease', minHeight:4 }} />
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display:'flex', gap:6, marginTop:8 }}>
                      {stats.weeklySignups.map((w,i) => (
                        <div key={i} style={{ flex:1, textAlign:'center' }}>
                          <span style={{ fontSize:8, color:T.muted }}>{w.week}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top 5 étudiants */}
              <div style={{ background: isDark?'rgba(20,25,55,0.85)':'#fff', backdropFilter: isDark?T.blur:'none', border:`1px solid ${T.border}`, borderRadius:16, padding:22, boxShadow:T.glow }}>
                <h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:15, fontWeight:700, color:T.text, marginBottom:14 }}>🏆 Top 5 actifs</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[...users].sort((a,b) => b.xp - a.xp).slice(0,5).map((u,i) => (
                    <div key={u._id} onClick={() => loadUser(u._id)} style={{
                      display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                      background: isDark?'rgba(255,255,255,0.04)':T.card2,
                      borderRadius:11, border:`1px solid ${T.border}`,
                      cursor:'pointer', transition:'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(139,92,246,0.4)'; e.currentTarget.style.transform='translateX(3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.transform='translateX(0)'; }}>
                      <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:14, color:i===0?'#f59e0b':i===1?'#94a3b8':i===2?'#cd7f32':T.muted, width:22, textAlign:'center' }}>#{i+1}</span>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:T.grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'white', flexShrink:0 }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontWeight:700, fontSize:12, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</p>
                        <p style={{ fontSize:10, color:T.muted }}>⚡ {u.xp} XP · {lvlIcon[u.level]} {u.level}</p>
                      </div>
                      <span style={{ color:T.muted, fontSize:14 }}>→</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LISTE ÉTUDIANTS ── */}
        {tab === 'users' && (
          <div>
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontFamily:"'Outfit',sans-serif", fontSize:24, fontWeight:800, color:T.text, marginBottom:4 }}>👥 Étudiants inscrits</h1>
              <p style={{ color:T.muted, fontSize:14 }}>{users.length} étudiant{users.length>1?'s':''} au total</p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {users.map((u,i) => (
                <div key={u._id} onClick={() => loadUser(u._id)} style={{
                  background: isDark?'rgba(20,25,55,0.85)':'#fff',
                  backdropFilter: isDark?T.blur:'none',
                  border:`1px solid ${T.border}`, borderRadius:14,
                  padding:'14px 18px', cursor:'pointer',
                  display:'flex', alignItems:'center', gap:14,
                  boxShadow:T.glow, transition:'all 0.2s',
                  animation:`fadeUp 0.4s ease ${i*0.04}s both`,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(139,92,246,0.4)'; e.currentTarget.style.transform='translateX(4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.transform='translateX(0)'; }}>

                  <div style={{ width:42, height:42, borderRadius:'50%', background:T.grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'white', flexShrink:0, boxShadow:'0 3px 10px rgba(139,92,246,0.3)' }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <p style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, color:T.text }}>{u.name}</p>
                      <span style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:`${lvlColor[u.level]||'#8B5CF6'}18`, color:lvlColor[u.level]||'#8B5CF6', fontWeight:600 }}>
                        {lvlIcon[u.level]} {u.level}
                      </span>
                    </div>
                    <p style={{ fontSize:12, color:T.muted }}>{u.email} · {fmtDate(u.createdAt)}</p>
                  </div>

                  <div style={{ display:'flex', gap:20, flexShrink:0 }}>
                    {[
                      { icon:'📄', val:u.stats.docs,          label:'cours'    },
                      { icon:'🧠', val:u.stats.quizDone,      label:'quiz'     },
                      { icon:'📊', val:`${u.stats.avgScore}%`, label:'moy.'    },
                      { icon:'⚡', val:u.xp,                  label:'XP'       },
                    ].map((s,j) => (
                      <div key={j} style={{ textAlign:'center' }}>
                        <p style={{ fontSize:14, fontWeight:700, color: j===3?'#8B5CF6':T.text, lineHeight:1 }}>{s.val}</p>
                        <p style={{ fontSize:10, color:T.muted }}>{s.icon} {s.label}</p>
                      </div>
                    ))}
                  </div>

                  <span style={{ color:T.muted, fontSize:16, marginLeft:8 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DÉTAIL ÉTUDIANT ── */}
        {tab === 'user' && selUser && (
          <div>
            <button onClick={() => { setTab('users'); setSelUser(null); }} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:`1px solid ${T.border}`, borderRadius:9, padding:'7px 14px', color:T.muted, cursor:'pointer', fontSize:13, fontWeight:600, marginBottom:22, transition:'all 0.2s' }}>
              ← Retour à la liste
            </button>

            {/* Header */}
            <div style={{ background: isDark?'rgba(20,25,55,0.85)':'#fff', backdropFilter: isDark?T.blur:'none', border:`1px solid ${T.border}`, borderRadius:18, padding:'24px 28px', marginBottom:20, display:'flex', alignItems:'center', gap:20, boxShadow:T.glow }}>
              <div style={{ width:68, height:68, borderRadius:'50%', background:T.grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:'white', boxShadow:'0 6px 24px rgba(139,92,246,0.4)', flexShrink:0 }}>
                {selUser.user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <h2 style={{ fontFamily:"'Outfit',sans-serif", fontSize:20, fontWeight:800, color:T.text, marginBottom:4 }}>{selUser.user.name}</h2>
                <p style={{ fontSize:13, color:T.muted, marginBottom:10 }}>{selUser.user.email} · Inscrit le {fmtDate(selUser.user.createdAt)}</p>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:`${lvlColor[selUser.user.level]||'#8B5CF6'}18`, color:lvlColor[selUser.user.level]||'#8B5CF6', fontWeight:600, border:`1px solid ${lvlColor[selUser.user.level]||'#8B5CF6'}30` }}>
                    {lvlIcon[selUser.user.level]} {selUser.user.level}
                  </span>
                  <span style={{ fontSize:12, color:T.muted }}>⚡ {selUser.user.xp} XP</span>
                  <span style={{ fontSize:12, color:T.muted }}>🏅 {selUser.user.badges?.length||0} badges</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
              {[
                { icon:'📄', label:'Cours uploadés',    value:selUser.stats.docs,      color:'#8B5CF6' },
                { icon:'🧠', label:'Quiz complétés',    value:selUser.stats.quizDone,  color:'#3B82F6' },
                { icon:'✅', label:'Chapitres validés', value:selUser.stats.validated, color:'#10b981' },
                { icon:'📊', label:'Score moyen',       value:`${selUser.stats.avgScore}%`, color:selUser.stats.avgScore>=70?'#10b981':'#f59e0b' },
              ].map((s,i) => (
                <div key={i} style={{ background: isDark?'rgba(20,25,55,0.85)':'#fff', backdropFilter: isDark?T.blur:'none', border:`1px solid ${T.border}`, borderRadius:14, padding:'16px 14px', textAlign:'center', boxShadow:T.glow }}>
                  <span style={{ fontSize:22, display:'block', marginBottom:6 }}>{s.icon}</span>
                  <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:24, fontWeight:800, color:s.color, lineHeight:1, marginBottom:3 }}>{s.value}</p>
                  <p style={{ fontSize:11, color:T.muted }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Cours */}
            {selUser.documents.length > 0 && (
              <div style={{ background: isDark?'rgba(20,25,55,0.85)':'#fff', backdropFilter: isDark?T.blur:'none', border:`1px solid ${T.border}`, borderRadius:16, padding:22, boxShadow:T.glow }}>
                <h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:15, fontWeight:700, color:T.text, marginBottom:14 }}>📚 Cours de l'étudiant</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {selUser.documents.map((doc,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', background: isDark?'rgba(255,255,255,0.04)':T.card2, borderRadius:11, border:`1px solid ${T.border}` }}>
                      <div style={{ width:36, height:36, borderRadius:9, background:'rgba(139,92,246,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📄</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontWeight:700, fontSize:13, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.originalName.replace('.pdf','')}</p>
                        <p style={{ fontSize:11, color:T.muted }}>Uploadé le {fmtDate(doc.uploadedAt)}</p>
                      </div>
                      {doc.summary && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:'rgba(16,185,129,0.1)', color:'#10b981', border:'1px solid rgba(16,185,129,0.2)', fontWeight:600, flexShrink:0 }}>✓ Résumé</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
