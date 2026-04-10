import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const T = isDark
    ? { bg:'#0f1117', card:'#161b27', border:'#2d3650', text:'#e8eaf6', muted:'#8892b0', input:'#1e2535' }
    : { bg:'#f0f4ff', card:'#ffffff', border:'#e2e8f0', text:'#1e293b', muted:'#64748b', input:'#f8f9ff' };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    if (!form.email || !form.password) return setError('Email et mot de passe requis.');
    if (mode === 'register' && !form.name) return setError('Nom requis.');
    setLoading(true);
    try {
      const fn = mode === 'login' ? login : register;
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
      const res = await fn(payload);
      loginUser(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur. Réessaie.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', background: T.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' }}>
      {/* Blobs */}
      <div style={{ position:'absolute', top:-150, right:-150, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-150, left:-150, width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:420, background: T.card, border:`1px solid ${T.border}`, borderRadius:24, padding:'40px 36px', boxShadow:'0 20px 60px rgba(99,102,241,0.12)', position:'relative', zIndex:1, animation:'fadeUp 0.4s ease' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52, height:52, background:'linear-gradient(135deg,#6366f1,#06b6d4)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, margin:'0 auto 12px' }}>🎓</div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color: T.text, marginBottom:4 }}>
            {mode === 'login' ? 'Bon retour !' : 'Rejoins StudyAI'}
          </h1>
          <p style={{ color: T.muted, fontSize:13 }}>
            {mode === 'login' ? 'Connecte-toi pour accéder à tes cours' : 'Crée ton compte gratuitement'}
          </p>
        </div>

        {/* Form */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize:12, fontWeight:600, color: T.muted, display:'block', marginBottom:6 }}>Prénom</label>
              <input name="name" type="text" placeholder="Ex: Ilham" value={form.name} onChange={handleChange}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ width:'100%', padding:'11px 14px', borderRadius:10, background: T.input, border:`1px solid ${T.border}`, color: T.text, fontFamily:'DM Sans,sans-serif', fontSize:14, outline:'none', transition:'border-color 0.2s' }} />
            </div>
          )}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color: T.muted, display:'block', marginBottom:6 }}>Email</label>
            <input name="email" type="email" placeholder="ton@email.com" value={form.email} onChange={handleChange}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width:'100%', padding:'11px 14px', borderRadius:10, background: T.input, border:`1px solid ${T.border}`, color: T.text, fontFamily:'DM Sans,sans-serif', fontSize:14, outline:'none' }} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color: T.muted, display:'block', marginBottom:6 }}>Mot de passe</label>
            <input name="password" type="password" placeholder="Minimum 6 caractères" value={form.password} onChange={handleChange}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width:'100%', padding:'11px 14px', borderRadius:10, background: T.input, border:`1px solid ${T.border}`, color: T.text, fontFamily:'DM Sans,sans-serif', fontSize:14, outline:'none' }} />
          </div>

          {error && (
            <div style={{ padding:'10px 14px', background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', borderRadius:10, color:'#f43f5e', fontSize:13 }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:14, borderRadius:12, background:'linear-gradient(135deg,#6366f1,#818cf8)', color:'white', border:'none', cursor:loading?'not-allowed':'pointer', fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, boxShadow:'0 4px 16px rgba(99,102,241,0.35)', marginTop:4, opacity: loading ? 0.7 : 1, transition:'all 0.2s' }}>
            {loading ? <span className="spinner" /> : mode === 'login' ? '→ Se connecter' : '→ Créer mon compte'}
          </button>
        </div>

        {/* Toggle */}
        <p style={{ textAlign:'center', marginTop:20, fontSize:13, color: T.muted }}>
          {mode === 'login' ? "Pas encore de compte ? " : "Déjà un compte ? "}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            style={{ background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontWeight:600, fontSize:13, fontFamily:'DM Sans,sans-serif', textDecoration:'underline' }}>
            {mode === 'login' ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </div>
    </div>
  );
}
