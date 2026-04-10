import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { getDocuments, uploadPDF, deleteDocument } from '../utils/api';
import { useTheme } from '../hooks/useTheme';

export default function Home() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const T = isDark
    ? { card:'#1e2535', card2:'#161b27', border:'#2d3650', text:'#e8eaf6', muted:'#8892b0' }
    : { card:'#ffffff', card2:'#f8f9ff', border:'#e2e8f0', text:'#1e293b', muted:'#64748b' };

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    try { const res = await getDocuments(); setDocuments(res.data); }
    catch { setError('Impossible de charger les documents'); }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setError(''); setUploading(true); setProgress(0);
    try {
      const res = await uploadPDF(file, setProgress);
      await fetchDocs();
      navigate(`/chapters/${res.data.document._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'upload');
    } finally { setUploading(false); }
  }, [navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept:{'application/pdf':['.pdf']}, maxFiles:1, disabled:uploading
  });

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer ce document ?')) return;
    try { await deleteDocument(id); setDocuments(prev => prev.filter(d => d._id !== id)); }
    catch { setError('Erreur suppression'); }
  };

  const formatDate = d => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

  return (
    <main style={{ maxWidth:1000, margin:'0 auto', padding:'40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom:40 }}>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:800, color: T.text, marginBottom:8 }}>
          📚 Mes Cours
        </h1>
        <p style={{ color: T.muted, fontSize:15 }}>Upload un PDF et laisse l'IA t'aider à réviser</p>
      </div>

      {/* Upload zone */}
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? '#6366f1' : T.border}`,
        borderRadius:20, padding:'40px 24px', textAlign:'center', cursor:'pointer',
        background: isDragActive ? 'rgba(99,102,241,0.06)' : T.card,
        transition:'all 0.3s', marginBottom:40,
        boxShadow: isDragActive ? '0 0 30px rgba(99,102,241,0.2)' : '0 4px 20px rgba(99,102,241,0.06)',
        transform: isDragActive ? 'scale(1.01)' : 'scale(1)',
        opacity: uploading ? 0.7 : 1,
      }}>
        <input {...getInputProps()} />
        {uploading ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <div style={{ width:200, height:8, background: T.border, borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#6366f1,#06b6d4)', borderRadius:4, transition:'width 0.3s' }} />
            </div>
            <p style={{ color: T.muted, fontSize:14 }}>Analyse du PDF... {progress}%</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize:48, marginBottom:12 }}>{isDragActive ? '📂' : '📄'}</div>
            <p style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:700, color: T.text, marginBottom:6 }}>
              {isDragActive ? 'Dépose ton PDF ici !' : 'Glisser-déposer ou importer ton document'}
            </p>
            <p style={{ fontSize:13, color: T.muted, marginBottom:16 }}>Formats supportés : PDF · Max 10MB</p>
            <span style={{ padding:'10px 24px', borderRadius:12, background:'linear-gradient(135deg,#6366f1,#818cf8)', color:'white', fontSize:14, fontWeight:600, boxShadow:'0 4px 16px rgba(99,102,241,0.3)', display:'inline-block' }}>
              ☁️ Ajouter un document
            </span>
          </>
        )}
      </div>

      {error && (
        <div style={{ marginBottom:20, padding:'12px 16px', background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', borderRadius:12, color:'#f43f5e', fontSize:13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Documents list */}
      {documents.length > 0 && (
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, color: T.text, marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
            Mes documents
            <span style={{ fontSize:12, padding:'2px 10px', background: T.card2, border:`1px solid ${T.border}`, borderRadius:20, color: T.muted, fontFamily:'DM Sans,sans-serif' }}>
              {documents.length}
            </span>
          </h2>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {documents.map((doc, i) => (
              <div key={doc._id} style={{ background: T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:'hidden', boxShadow:'0 4px 16px rgba(99,102,241,0.06)', animation:`fadeUp 0.4s ease ${i*0.05}s both` }}>
                <div style={{ padding:'18px 20px 12px', display:'flex', alignItems:'center', gap:14, cursor:'pointer' }} onClick={() => navigate(`/chapters/${doc._id}`)}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'rgba(99,102,241,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>📄</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color: T.text, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {doc.originalName.replace('.pdf','')}
                    </p>
                    <p style={{ fontSize:12, color: T.muted }}>{formatDate(doc.uploadedAt)}</p>
                  </div>
                  {doc.summary && <span style={{ fontSize:11, padding:'3px 8px', borderRadius:20, background:'rgba(16,185,129,0.1)', color:'#10b981', border:'1px solid rgba(16,185,129,0.2)', fontWeight:600, flexShrink:0 }}>✓ Résumé</span>}
                </div>
                <div style={{ display:'flex', borderTop:`1px solid ${T.border}` }}>
                  {[
                    { label:'📖 Chapitres', action:() => navigate(`/chapters/${doc._id}`) },
                    { label:'💬 Mode libre', action:() => navigate(`/study/${doc._id}`) },
                    { label:'🗑️', action:(e) => handleDelete(e,doc._id), danger:true },
                  ].map((btn, j) => (
                    <button key={j} onClick={btn.action} style={{
                      flex: j === 2 ? 0 : 1, padding:'10px 16px', background:'none', border:'none',
                      borderRight: j < 2 ? `1px solid ${T.border}` : 'none',
                      cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'DM Sans,sans-serif',
                      color: btn.danger ? '#f43f5e' : T.muted, transition:'all 0.2s',
                      minWidth: j === 2 ? 44 : 'auto',
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
        <div style={{ textAlign:'center', padding:48, color: T.muted, background: T.card, borderRadius:20, border:`1px solid ${T.border}` }}>
          <p style={{ fontSize:36, marginBottom:12 }}>🎯</p>
          <p style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, marginBottom:6 }}>Aucun cours uploadé</p>
          <p style={{ fontSize:14 }}>Upload ton premier PDF pour commencer !</p>
        </div>
      )}
    </main>
  );
}
