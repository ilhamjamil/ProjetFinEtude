import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTheme } from '../hooks/useTheme';
import { uploadSchedule, getSchedule, completeSession, deleteSchedule, toggleNotifications, getNotificationsStatus } from '../utils/api';

const TYPE = {
  revision: { label:'Révision', color:'#6366f1', bg:'rgba(99,102,241,0.1)', icon:'📖' },
  quiz:     { label:'Quiz',     color:'#06b6d4', bg:'rgba(6,182,212,0.1)',   icon:'🧠' },
  lecture:  { label:'Lecture',  color:'#10b981', bg:'rgba(16,185,129,0.1)',  icon:'📚' },
};

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

export default function SchedulePage() {
  const [schedule, setSchedule]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState('');
  const [view, setView]           = useState('week');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [toggling, setToggling]         = useState(false);
  const [notifMsg, setNotifMsg]         = useState('');
  const { isDark } = useTheme();

  const T = isDark
    ? {
        bg: '#080B1F',
        card: 'rgba(20, 25, 55, 0.85)',
        card2: 'rgba(28, 34, 72, 0.95)',
        border: 'rgba(120,130,255,0.15)',
        text: '#ffffff',
        muted: '#9CA9D6',
  
        primary: '#8B5CF6',
        secondary: '#EC4899',
        accent: '#3B82F6',
  
        gradient:
          'linear-gradient(135deg,#EC4899 0%,#8B5CF6 50%,#3B82F6 100%)',
  
        glow: '0 0 35px rgba(139,92,246,.25)',
      }
    : {
        bg: '#EEF2FF',
        card: '#FFFFFF',
        card2: '#F8FAFF',
        border: '#DCE4FF',
        text: '#1E1B4B',
        muted: '#64748B',
  
        primary: '#8B5CF6',
        secondary: '#EC4899',
        accent: '#3B82F6',
  
        gradient:
          'linear-gradient(135deg,#A855F7 0%,#6366F1 50%,#3B82F6 100%)',
  
        glow: '0 12px 35px rgba(99,102,241,.12)',
      };
  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [schRes, notifRes] = await Promise.all([getSchedule(), getNotificationsStatus()]);
      setSchedule(schRes.data.schedule);
      setNotifEnabled(notifRes.data.enabled);
    } catch {} finally { setLoading(false); }
  };

  const onDrop = useCallback(async (files) => {
    const file = files[0]; if (!file) return;
    setError(''); setUploading(true); setProgress(0);
    try { const r = await uploadSchedule(file, setProgress); setSchedule(r.data.schedule); }
    catch (e) { setError(e.response?.data?.error || 'Erreur analyse'); }
    finally { setUploading(false); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept:{'application/pdf':['.pdf'],'image/*':['.jpg','.jpeg','.png','.webp']},
    maxFiles:1, disabled:uploading,
  });

  const handleComplete = async (idx) => {
    if (!schedule) return;
    try {
      await completeSession(schedule._id, idx);
      setSchedule(p => ({ ...p, plan: p.plan.map((s,i) => i===idx ? {...s,completed:!s.completed} : s) }));
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce planning ?')) return;
    await deleteSchedule(); setSchedule(null);
  };

  const handleToggleNotif = async () => {
    setToggling(true); setNotifMsg('');
    try {
      const r = await toggleNotifications();
      setNotifEnabled(r.data.enabled);
      setNotifMsg(r.data.message);
    } catch (e) {
      setNotifMsg('❌ ' + (e.response?.data?.error || 'Erreur. Vérifie EMAIL_USER et EMAIL_PASS dans .env'));
    } finally { setToggling(false); }
  };

  const total     = schedule?.plan?.length || 0;
  const completed = schedule?.plan?.filter(s=>s.completed).length || 0;
  const minutes   = schedule?.plan?.reduce((s,p)=>s+(p.duration||0),0) || 0;
  const pct       = total>0 ? Math.round((completed/total)*100) : 0;

  const byDay = DAYS.reduce((acc,day) => {
    const sessions = schedule?.plan?.filter(s=>s.day===day)||[];
    if (sessions.length>0) acc[day]=sessions;
    return acc;
  }, {});

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 64px)' }}><div className="spinner" style={{ width:36,height:36,borderWidth:3 }}/></div>;

  return (
    <main  style={{
      maxWidth: 1100,
      margin: '0 auto',
      padding: '40px 24px',
      minHeight: '100vh',
  
      /*background: isDark
        ? `
        radial-gradient(circle at top left,
        rgba(139,92,246,.20),
        transparent 30%),
        radial-gradient(circle at top right,
        rgba(236,72,153,.15),
        transparent 30%),
        ${T.bg}
        `
        : `
        radial-gradient(circle at top left,
        rgba(168,85,247,.10),
        transparent 30%),
        radial-gradient(circle at top right,
        rgba(59,130,246,.10),
        transparent 30%),
        ${T.bg}
        `,*/
    }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Outfit',sans-serif", fontSize:25, fontWeight:800, color: T.text, marginBottom:5 }}>📅 Planning de Révision</h1>
          <p style={{ color: T.muted, fontSize:14, fontFamily:"'Inter',sans-serif" }}>Upload ton emploi du temps et l'IA génère un planning personnalisé</p>
        </div>
        {schedule && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button className="btn btn-secondary" onClick={()=>setView(v=>v==='week'?'list':'week')} style={{ fontSize:12 }}>
              {view==='week'?'📋 Vue liste':'📅 Vue semaine'}
            </button>
            <button onClick={handleToggleNotif} disabled={toggling} style={{
              display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10,
              background: notifEnabled
                ? 'linear-gradient(135deg,#10b981,#059669)'
                : 'linear-gradient(135deg,#64748b,#475569)',
              color:'white', border:'none',
              cursor: toggling?'not-allowed':'pointer', fontSize:12, fontWeight:600,
              fontFamily:"'Inter',sans-serif",
              boxShadow: notifEnabled ? '0 3px 12px rgba(16,185,129,0.28)' : '0 3px 12px rgba(0,0,0,0.1)',
              opacity: toggling?0.7:1, transition:'all 0.3s',
            }}>
              {toggling
                ? <span className="spinner" style={{ width:13,height:13,borderWidth:2,borderTopColor:'white' }}/>
                : notifEnabled ? '🔔' : '🔕'
              }
              {toggling ? 'Chargement...' : notifEnabled ? 'Notifs ON' : 'Notifs OFF'}
            </button>
            <button className="btn btn-danger" onClick={handleDelete} style={{ fontSize:12, padding:'8px 13px' }}>🗑️</button>
          </div>
        )}
      </div>

      {/* Email message */}
      {notifMsg && (
        <div style={{ marginBottom:16, padding:'11px 14px', background: notifMsg.startsWith('🔔') ? 'rgba(16,185,129,0.08)' : notifMsg.startsWith('🔕') ? 'rgba(100,116,139,0.08)' : 'rgba(244,63,94,0.08)', border:`1px solid ${notifMsg.startsWith('🔔')?'rgba(16,185,129,0.25)':notifMsg.startsWith('🔕')?'rgba(100,116,139,0.25)':'rgba(244,63,94,0.25)'}`, borderRadius:11, fontSize:13, color: notifMsg.startsWith('🔔')?'#10b981':notifMsg.startsWith('🔕')?'#64748b':'#f43f5e', fontFamily:"'Inter',sans-serif" }}>
          {notifMsg}
        </div>
      )}

      {/* Upload zone */}
      <div {...getRootProps()} style={{
        border:`2px dashed ${isDragActive?'#6366f1':T.border}`, borderRadius:18, padding:'30px 24px', textAlign:'center',
        cursor:uploading?'not-allowed':'pointer', background: isDragActive?'rgba(99,102,241,0.06)':T.card,
        transition:'all 0.3s', marginBottom:28,
        boxShadow: isDragActive?'0 0 26px rgba(99,102,241,0.18)':'0 4px 18px rgba(99,102,241,0.05)',
        opacity: uploading?0.8:1,
        background: isDark
          ? 'linear-gradient(145deg, rgba(25,32,75,.95), rgba(13,18,40,.95))'
          : '#ffffff',

        boxShadow: T.glow,

        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <input {...getInputProps()}/>
        {uploading ? (
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:12 }}>
            <div className="spinner" style={{ width:30,height:30,borderWidth:3 }}/>
            <div style={{ width:200,height:7,background:T.border,borderRadius:4,overflow:'hidden' }}>
              <div style={{ height:'100%',width:`${progress}%`,background:'linear-gradient(90deg,#6366f1,#06b6d4)',borderRadius:4,transition:'width 0.3s' }}/>
            </div>
            <p style={{ color:T.muted,fontSize:13,fontFamily:"'Inter',sans-serif" }}>🤖 Analyse en cours... {progress}%</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize:44, marginBottom:9 }}>{isDragActive?'📂':'📅'}</div>
            <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:15, fontWeight:700, color: T.text, marginBottom:5 }}>
              {schedule ? '🔄 Mettre à jour l\'emploi du temps' : 'Upload ton emploi du temps'}
            </p>
            <p style={{ fontSize:13, color: T.muted, marginBottom:13, fontFamily:"'Inter',sans-serif" }}>PDF ou Image (JPG, PNG) </p>
            <span style={{ padding:'9px 20px', borderRadius:11, background:T.gradient,
border:'none',
color:'#fff',
fontWeight:700,
boxShadow:'0 10px 30px rgba(139,92,246,.35)', color:'white', fontSize:13, fontWeight:700, boxShadow:'0 4px 12px rgba(99,102,241,0.28)', fontFamily:"'Outfit',sans-serif" }}>📤 Choisir un fichier</span>
          </>
        )}
      </div>

      {error && <div style={{ marginBottom:16, padding:'11px 14px', background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', borderRadius:11, color:'#f43f5e', fontSize:13, fontFamily:"'Inter',sans-serif" }}>⚠️ {error}</div>}

      {schedule && (
        <div className="animate-fade-up">
          {/* Info + conseil */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
            <div style={{ background:T.card,
              backdropFilter:'blur(18px)',
              WebkitBackdropFilter:'blur(18px)',
              boxShadow:T.glow, border:`1px solid ${T.border}`, borderRadius:15, padding:18 }}>
              <p style={{ fontSize:11, fontWeight:600, color: T.muted, marginBottom:9, textTransform:'uppercase', letterSpacing:1, fontFamily:"'Inter',sans-serif" }}>Fichier analysé</p>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:26 }}>{schedule.fileType==='pdf'?'📄':'🖼️'}</span>
                <div>
                  <p style={{ fontWeight:700, fontSize:13, color: T.text, fontFamily:"'Outfit',sans-serif" }}>{schedule.originalFile}</p>
                  <p style={{ fontSize:12, color: T.muted, fontFamily:"'Inter',sans-serif" }}>{new Date(schedule.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>
            <div style={{ borderRadius:15, padding:18, background:T.gradient,
                  boxShadow:'0 15px 40px rgba(139,92,246,.25)', color:'white' }}>
              <p style={{ fontSize:11, fontWeight:600, marginBottom:6, opacity:0.8, fontFamily:"'Inter',sans-serif" }}>🤖 Conseil IA</p>
              <p style={{ fontSize:13, lineHeight:1.65, fontFamily:"'Inter',sans-serif" }}>{schedule.globalAdvice || 'Suis ce planning régulièrement. Fais des pauses de 10 min toutes les heures !'}</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:11, marginBottom:20 }}>
            {[
              {icon:'📅',label:'Sessions',   value:total,                                       color:'#6366f1'},
              {icon:'✅',label:'Complétées', value:completed,                                   color:'#10b981'},
              {icon:'⏱️',label:'Total',      value:`${Math.round(minutes/60)}h${minutes%60>0?` ${minutes%60}m`:''}`, color:'#06b6d4'},
              {icon:'📊',label:'Progression',value:`${pct}%`,                                   color:pct>=70?'#10b981':'#f59e0b'},
            ].map((s,i)=>(
              <div key={i} style={{ background: T.card,
                border:`1px solid ${T.border}`,
                backdropFilter:'blur(18px)',
                WebkitBackdropFilter:'blur(18px)',
                boxShadow:T.glow, borderRadius:13, padding:'14px', textAlign:'center' }}>
                <span style={{ fontSize:20 }}>{s.icon}</span>
                <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:22, fontWeight:800, color:s.color, margin:'5px 0 2px' }}>{s.value}</p>
                <p style={{ fontSize:11, color: T.muted, fontFamily:"'Inter',sans-serif" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ background:T.card,
              backdropFilter:'blur(18px)',
              WebkitBackdropFilter:'blur(18px)',
              boxShadow:T.glow, border:`1px solid ${T.border}`, borderRadius:13, padding:'14px 18px', marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
              <span style={{ fontSize:13, fontWeight:600, color: T.text, fontFamily:"'Inter',sans-serif" }}>Progression de la semaine</span>
              <span style={{ fontSize:13, fontWeight:700, color: pct>=70?'#10b981':'#6366f1', fontFamily:"'Outfit',sans-serif" }}>{pct}%</span>
            </div>
            <div style={{ height:9, background: T.border, borderRadius:5, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:T.gradient, borderRadius:5, transition:'width 0.6s' }}/>
            </div>
          </div>

          <div style={{ marginBottom:20, padding:'12px 16px', background: notifEnabled ? 'rgba(16,185,129,0.06)' : 'rgba(99,102,241,0.06)', border:`1px solid ${notifEnabled ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.15)'}`, borderRadius:12, fontSize:13, color: notifEnabled ? '#10b981' : '#6366f1', fontFamily:"'Inter',sans-serif" }}>
            {notifEnabled
              ? '🔔 Notifications activées — Tu recevras un email automatique à l\'heure exacte de chaque session de révision.'
              : '🔕 Notifications désactivées — Clique sur "Notifs OFF" pour recevoir des rappels automatiques par email à l\'heure de chaque session.'
            }
          </div>

          {/* Vue semaine */}
          {view === 'week' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {Object.entries(byDay).map(([day, sessions]) => (
                <div key={day}>
                  <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:10 }}>
                    <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, color: T.text }}>{day}</span>
                    <div style={{ flex:1, height:1, background: T.border }}/>
                    <span style={{ fontSize:11, color: T.muted, fontFamily:"'Inter',sans-serif" }}>{sessions.length} session{sessions.length>1?'s':''}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:11 }}>
                    {sessions.map((s) => {
                      const realIdx = schedule.plan.findIndex(x => x.day===s.day&&x.time===s.time&&x.subject===s.subject);
                      const cfg = TYPE[s.type]||TYPE.revision;
                      return (
                        <div key={realIdx} style={{ background: s.completed?(isDark?'#1a2820':'#f0fdf4'):T.card, border:`1px solid ${s.completed?'rgba(16,185,129,0.25)':T.border}`, borderRadius:14, padding:16, opacity:s.completed?0.75:1, transition:'all 0.2s',background: s.completed
                        ? (isDark
                            ? 'rgba(16,185,129,.12)'
                            : 'rgba(16,185,129,.08)')
                        : T.card,
                      
                      border:`1px solid ${
                        s.completed
                          ? 'rgba(16,185,129,.25)'
                          : T.border
                      }`,
                      
                      backdropFilter:'blur(18px)',
                      WebkitBackdropFilter:'blur(18px)',
                      
                      boxShadow:T.glow, }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ width:34,height:34,borderRadius:9,background:cfg.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17 }}>{cfg.icon}</div>
                              <div>
                                <p style={{ fontWeight:700, fontSize:13, color: T.text, textDecoration:s.completed?'line-through':'none', fontFamily:"'Outfit',sans-serif" }}>{s.subject}</p>
                                <span style={{ fontSize:11, padding:'2px 7px', borderRadius:20, background:cfg.bg, color:cfg.color, fontWeight:600, fontFamily:"'Inter',sans-serif" }}>{cfg.label}</span>
                              </div>
                            </div>
                            <input type="checkbox" checked={s.completed} onChange={()=>handleComplete(realIdx)} style={{ width:16,height:16,cursor:'pointer',accentColor:'#6366f1',marginTop:2 }}/>
                          </div>
                          <div style={{ display:'flex', gap:10, marginBottom:8 }}>
                            <span style={{ fontSize:11, color: T.muted, fontFamily:"'Inter',sans-serif" }}>🕐 {s.time}</span>
                            <span style={{ fontSize:11, color: T.muted, fontFamily:"'Inter',sans-serif" }}>⏱️ {s.duration} min</span>
                          </div>
                          {s.tip && <p style={{ fontSize:11, color: T.muted, lineHeight:1.55, padding:'7px 9px', background:isDark?'rgba(255,255,255,0.04)':'rgba(99,102,241,0.04)', borderRadius:7, fontFamily:"'Inter',sans-serif" }}>💡 {s.tip}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vue liste */}
          {view === 'list' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {schedule.plan.map((s, idx) => {
                const cfg = TYPE[s.type]||TYPE.revision;
                return (
                  <div key={idx} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', background: s.completed?(isDark?'#1a2820':'#f0fdf4'):T.card, border:`1px solid ${s.completed?'rgba(16,185,129,0.25)':T.border}`, borderRadius:13, opacity:s.completed?0.75:1 }}>
                    <input type="checkbox" checked={s.completed} onChange={()=>handleComplete(idx)} style={{ width:16,height:16,cursor:'pointer',accentColor:'#6366f1',flexShrink:0 }}/>
                    <div style={{ width:36,height:36,borderRadius:9,background:cfg.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>{cfg.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:2 }}>
                        <p style={{ fontWeight:700, fontSize:13, color: T.text, textDecoration:s.completed?'line-through':'none', fontFamily:"'Outfit',sans-serif" }}>{s.subject}</p>
                        <span style={{ fontSize:11, padding:'2px 7px', borderRadius:20, background:cfg.bg, color:cfg.color, fontWeight:600, fontFamily:"'Inter',sans-serif" }}>{cfg.label}</span>
                      </div>
                      <p style={{ fontSize:11, color: T.muted, fontFamily:"'Inter',sans-serif" }}>{s.day} · {s.time} · {s.duration} min</p>
                    </div>
                    {s.tip && <p style={{ fontSize:11, color: T.muted, maxWidth:190, textAlign:'right', lineHeight:1.45, fontFamily:"'Inter',sans-serif" }}>💡 {s.tip}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!schedule && !uploading && (
        <div style={{ textAlign:'center', padding:'44px 24px', background: T.card, border:`1px solid ${T.border}`, borderRadius:18 }}>
          <p style={{ fontSize:44, marginBottom:10 }}>📅</p>
          <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:17, fontWeight:700, color: T.text, marginBottom:6 }}>Aucun planning généré</p>
          <p style={{ fontSize:14, color: T.muted, fontFamily:"'Inter',sans-serif" }}>Upload ton emploi du temps pour que l'IA génère un planning adapté</p>
        </div>
      )}
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </main>
  );
}
