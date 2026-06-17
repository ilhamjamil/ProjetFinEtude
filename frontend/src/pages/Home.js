import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useTheme } from '../hooks/useTheme';
import { getDocuments, uploadPDF, deleteDocument } from '../utils/api';

export default function Home() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState('');
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const T = isDark
  ? {
      bg: '#080B1F',
      bg2: '#111738',
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

      glow: '0 0 35px rgba(139,92,246,.35)',
    }
  : {
      bg: '#F6F8FF',
      bg2: '#EEF2FF',
      card: '#FFFFFF',
      card2: '#F8FAFF',
      border: '#E6EAF8',
      text: '#1E1B4B',
      muted: '#64748B',

      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#3B82F6',

      gradient:
        'linear-gradient(135deg,#A855F7 0%,#6366F1 50%,#3B82F6 100%)',

      glow: '0 10px 40px rgba(99,102,241,.15)',
    };

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    try { const res = await getDocuments(); setDocuments(res.data); }
    catch { setError('Impossible de charger les documents'); }
  };

  const onDrop = useCallback(async (files) => {
    const file = files[0]; if (!file) return;
    setError(''); setUploading(true); setProgress(0);
    try {
      const res = await uploadPDF(file, setProgress);
      await fetchDocs();
      navigate(`/chapters/${res.data.document._id}`);
    } catch (err) { setError(err.response?.data?.error || 'Erreur upload'); }
    finally { setUploading(false); }
  }, [navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: {'application/pdf':['.pdf']}, maxFiles:1, disabled: uploading
  });

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer ce document ?')) return;
    try { await deleteDocument(id); setDocuments(p => p.filter(d => d._id !== id)); }
    catch { setError('Erreur suppression'); }
  };

  const fmtDate = d => new Date(d).toLocaleDateString('fr-FR', {day:'2-digit',month:'short',year:'numeric'});

  return (
    
    <main
    style={{
      minHeight: '100vh',
      maxWidth: 1200,
      margin: '0 auto',
      padding: '40px 24px',
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
    }}
  >
      <div style={{ marginBottom:36 }}>
        <h1 style={{ fontFamily:"'Outfit',sans-serif", fontSize:26, fontWeight:800, color: T.text, marginBottom:6 }}>📚 Mes Cours</h1>
        <p style={{ color: T.muted, fontSize:14, fontFamily:"'Inter',sans-serif" }}>Upload un PDF et laisse l'IA t'aider à réviser</p>
      </div>
      

      {/* Upload zone */}
      <div {...getRootProps()} style={{
        border:`2px dashed ${isDragActive ? '#6366f1' : T.border}`,
        borderRadius:18, padding:'38px 24px', textAlign:'center',
        cursor: uploading ? 'not-allowed' : 'pointer',
        background: isDragActive ? 'rgba(99,102,241,0.06)' : T.card,
        transition:'all 0.3s', marginBottom:36,
        boxShadow: isDragActive ? '0 0 28px rgba(99,102,241,0.18)' : '0 4px 20px rgba(99,102,241,0.05)',
        transform: isDragActive ? 'scale(1.01)' : 'scale(1)',
        opacity: uploading ? 0.75 : 1,

        //++++
                  background: isDark
          ? 'linear-gradient(145deg, rgba(25,32,75,.95), rgba(13,18,40,.95))'
          : '#ffffff',

          boxShadow: isDark
          ? '0 0 60px rgba(139,92,246,.25)'
          : '0 20px 50px rgba(99,102,241,.12)',

          border: `1px solid ${T.border}`,
      }}>
        <input {...getInputProps()} />
        {uploading ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
            <div className="spinner" style={{ width:30, height:30, borderWidth:3 }} />
            <div style={{ width:200, height:7, background: T.border, borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#6366f1,#06b6d4)', borderRadius:4, transition:'width 0.3s' }} />
            </div>
            <p style={{ color: T.muted, fontSize:13, fontFamily:"'Inter',sans-serif" }}>Analyse du PDF... {progress}%</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize:46, marginBottom:10 }}>{isDragActive ? '📂' : '📄'}</div>
            <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:700, color: T.text, marginBottom:5 }}>
              {isDragActive ? 'Dépose ton PDF ici !' : 'Glisser-déposer ou importer ton document'}
            </p>
            <p style={{ fontSize:13, color: T.muted, marginBottom:14, fontFamily:"'Inter',sans-serif" }}>Formats supportés : PDF </p>
            <span style={{ padding:'10px 22px', borderRadius:11, background:'linear-gradient(135deg,#6366f1,#818cf8)', color:'white', fontSize:13, fontWeight:700, boxShadow:'0 4px 14px rgba(99,102,241,0.28)', fontFamily:"'Outfit',sans-serif" }}>
              ☁️ Ajouter un document
            </span>
          </>
        )}
      </div>

      {error && <div style={{ marginBottom:18, padding:'11px 14px', background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', borderRadius:11, color:'#f43f5e', fontSize:13, fontFamily:"'Inter',sans-serif" }}>⚠️ {error}</div>}

      {documents.length > 0 && (
        <div>
          <h2 style={{ fontFamily:"'Outfit',sans-serif", fontSize:17, fontWeight:700, color: T.text, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            Mes documents
            <span style={{ fontSize:12, padding:'2px 9px', background: T.card2, border:`1px solid ${T.border}`, borderRadius:20, color: T.muted, fontFamily:"'Inter',sans-serif" }}>{documents.length}</span>
          </h2>
          <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
            {documents.map((doc, i) => (
              <div key={doc._id} style={{ background: T.card,
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                boxShadow: T.glow, border:`1px solid ${T.border}`, borderRadius:15, overflow:'hidden', boxShadow:'0 3px 14px rgba(99,102,241,0.05)', animation:`fadeUp 0.4s ease ${i*0.05}s both` }}>
                <div style={{ padding:'16px 18px 11px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={() => navigate(`/chapters/${doc._id}`)}>
                  <div style={{ width:42, height:42, borderRadius:11, background:'rgba(99,102,241,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>📄</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, color: T.text, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {doc.originalName.replace('.pdf','')}
                    </p>
                    <p style={{ fontSize:12, color: T.muted, fontFamily:"'Inter',sans-serif" }}>{fmtDate(doc.uploadedAt)}</p>
                  </div>
                  {doc.summary && <span style={{ fontSize:11, padding:'3px 8px', borderRadius:20, background:'rgba(16,185,129,0.1)', color:'#10b981', border:'1px solid rgba(16,185,129,0.2)', fontWeight:600, flexShrink:0, fontFamily:"'Inter',sans-serif" }}>✓ Résumé</span>}
                </div>
                <div style={{ display:'flex', borderTop:`1px solid ${T.border}` }}>
                  {[
                    { label:'📖 Chapitres', fn: () => navigate(`/chapters/${doc._id}`) },
                    { label:'💬 Mode libre', fn: () => navigate(`/study/${doc._id}`) },
                    { label:'🗑️', fn: e => handleDelete(e, doc._id), danger:true },
                  ].map((btn, j) => (
                    <button key={j} onClick={btn.fn} style={{
                      flex: j===2 ? 0 : 1, padding:'9px 14px', background:'none', border:'none',
                      borderRight: j<2 ? `1px solid ${T.border}` : 'none',
                      cursor:'pointer', fontSize:13, fontWeight:600,
                      fontFamily:"'Inter',sans-serif",
                      color: btn.danger ? '#f43f5e' : T.muted,
                      transition:'all 0.2s', minWidth: j===2 ? 42 : 'auto',
                      background: T.gradient,
                        color: '#fff',
                        fontWeight: 700,
                        border: 'none',
                        boxShadow: '0 10px 30px rgba(139,92,246,.35)',
                    }}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && !uploading && (
        <div style={{ textAlign:'center', padding:44, color: T.muted, background: T.card, borderRadius:18, border:`1px solid ${T.border}` }}>
          <p style={{ fontSize:36, marginBottom:10 }}>🎯</p>
          <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:700, color: T.text, marginBottom:5 }}>Aucun cours uploadé</p>
          <p style={{ fontSize:13, fontFamily:"'Inter',sans-serif" }}>Upload ton premier PDF pour commencer !</p>
        </div>
      )}
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </main>
  );
}
