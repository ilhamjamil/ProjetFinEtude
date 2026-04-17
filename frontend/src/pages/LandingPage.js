import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    {
      icon: '🤖',
      title: 'Poser des questions',
      desc: 'Pose des questions à StudyAI sur tes cours et obtiens des réponses instantanées et précises.',
      color: '#6366f1',
    },
    {
      icon: '🧠',
      title: 'Quiz & exercices adaptés',
      desc: 'Teste tes connaissances avec des quiz personnalisés générés automatiquement depuis ton cours.',
      color: '#06b6d4',
    },
    {
      icon: '📈',
      title: 'Suivi de progression',
      desc: 'Suis ta progression, reçois des recommandations IA et atteins tes objectifs académiques.',
      color: '#10b981',
    },
  ];

  const stats = [
    { value: '3', label: 'Modèles IA comparés' },
    { value: '100%', label: 'Gratuit' },
    { value: '∞', label: 'Quiz générés' },
    { value: '24/7', label: 'Disponible' },
  ];

  return (
    <div style={S.page}>
      {/* Fond décoratif */}
      <div style={S.bgBlob1} />
      <div style={S.bgBlob2} />

      {/* ── NAVBAR ── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.logo}>
            <div style={S.logoIcon}>🎓</div>
            <div>
              <span style={S.logoText}>StudyAI</span>
              <span style={S.logoSub}>Assistant Intelligent</span>
            </div>
          </div>

          <div style={S.navLinks}>
            {['Accueil','Fonctionnalités','FAQ'].map(l => (
              <a key={l} href="#" style={S.navLink}>{l}</a>
            ))}
          </div>

          <div style={S.navActions}>
            <button style={S.btnGhost} onClick={() => navigate('/login')}>Connexion</button>
            <button style={S.btnAccent} onClick={() => navigate('/login')}>
              👤 Inscription
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={S.hero}>
        <div style={S.heroLeft}>
          <div style={S.heroBadge}>🇲🇦 Conçu pour les étudiants marocains</div>
          <h1 style={S.heroTitle}>
            Votre assistant IA<br />
            pour des études<br />
            <span style={S.heroAccent}>réussies ! 🤖</span>
          </h1>
          <p style={S.heroDesc}>
            Télécharge tes fichiers de cours (PDF) et laisse StudyAI t'aider à réviser,
            poser des questions, générer des QCM et suivre ta progression.
          </p>

          {/* Upload box */}
          <div style={S.uploadBox} onClick={() => navigate('/login')}>
            <div style={S.uploadIcon}>📄</div>
            <p style={S.uploadTitle}><strong>Glisser-déposer</strong> ou importer ton document</p>
            <p style={S.uploadSub}>Formats supportés : PDF · Max 10MB</p>
            <button style={{ ...S.btnAccent, width:'100%', justifyContent:'center', marginTop:12 }}>
              ☁️ Ajouter un document
            </button>
            <button style={{ ...S.btnGhost, width:'100%', justifyContent:'center', marginTop:8, borderColor:'#e2e8f0' }}>
              ✨ Démo gratuite
            </button>
          </div>
        </div>

        {/* Illustration hero */}
        <div style={S.heroRight}>
          <div style={S.heroIllustration}>
            <div style={S.floatingCard1}>
              <span style={{ fontSize:24 }}>📚</span>
              <div>
                <p style={{ fontWeight:700, fontSize:13, color:'#1e293b' }}>Cours uploadé</p>
                <p style={{ fontSize:11, color:'#64748b' }}>Algorithmes.pdf</p>
              </div>
              <span style={{ color:'#10b981', fontSize:18 }}>✓</span>
            </div>
            <div style={S.floatingCard2}>
              <span style={{ fontSize:20 }}>🧠</span>
              <div>
                <p style={{ fontWeight:700, fontSize:12, color:'#1e293b' }}>QCM généré</p>
                <p style={{ fontSize:11, color:'#64748b' }}>5 questions · Score 80%</p>
              </div>
            </div>
            <div style={S.floatingCard3}>
              <span style={{ fontSize:20 }}>📈</span>
              <div>
                <p style={{ fontWeight:700, fontSize:12, color:'#1e293b' }}>Progression</p>
                <div style={{ width:80, height:6, background:'#e2e8f0', borderRadius:3, marginTop:4, overflow:'hidden' }}>
                  <div style={{ width:'75%', height:'100%', background:'linear-gradient(90deg,#6366f1,#06b6d4)', borderRadius:3 }} />
                </div>
              </div>
            </div>
            {/* Big emoji illustration */}
            <div style={S.heroEmoji}>👩‍💻</div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={S.statsSection}>
        {stats.map((s, i) => (
          <div key={i} style={S.statItem}>
            <p style={S.statValue}>{s.value}</p>
            <p style={S.statLabel}>{s.label}</p>
          </div>
        ))}
      </section>

      {/* ── FEATURES ── */}
      <section style={S.featuresSection}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={S.sectionTitle}>Pour réussir, il vous faut un <span style={{ color:'#6366f1' }}>student idi</span></h2>
          <p style={S.sectionDesc}>Retrouvez des fichiers, résumés, quiz et enseignements adaptés à votre niveau.</p>
        </div>
        <div style={S.featuresGrid}>
          {features.map((f, i) => (
            <div key={i} style={{ ...S.featureCard, animationDelay:`${i*0.1}s` }} className="animate-fade-up">
              <div style={{ ...S.featureIconWrap, background:`${f.color}15` }}>
                <span style={{ fontSize:36 }}>{f.icon}</span>
              </div>
              <h3 style={{ ...S.featureTitle, color: f.color }}>{f.title}</h3>
              <p style={S.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={S.howSection}>
        <h2 style={{ ...S.sectionTitle, textAlign:'center', marginBottom:48 }}>
          Comment ça fonctionne ?
        </h2>
        <div style={S.steps}>
          {[
            { n:'01', icon:'📄', title:'Upload ton cours', desc:'Importe ton PDF de cours en un clic' },
            { n:'02', icon:'🤖', title:'L\'IA analyse', desc:'Détection automatique des chapitres et concepts clés' },
            { n:'03', icon:'💬', title:'Pose des questions', desc:'Chatbot contextuel basé sur ton cours uniquement' },
            { n:'04', icon:'🏆', title:'Valide tes acquis', desc:'QCM par chapitre avec score et déblocage progressif' },
          ].map((s, i) => (
            <div key={i} style={S.step}>
              <div style={S.stepNum}>{s.n}</div>
              <span style={{ fontSize:32, marginBottom:12 }}>{s.icon}</span>
              <h4 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:15, marginBottom:6 }}>{s.title}</h4>
              <p style={{ fontSize:13, color:'#64748b', textAlign:'center', lineHeight:1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={S.ctaSection}>
        <div style={S.ctaBox}>
          <div style={S.ctaBg1} />
          <div style={S.ctaBg2} />
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:800, marginBottom:12, position:'relative', zIndex:1 }}>
            Prêt à transformer ta façon d'étudier ?
          </h2>
          <p style={{ color:'rgba(255,255,255,0.8)', fontSize:15, marginBottom:24, position:'relative', zIndex:1 }}>
            Rejoins StudyAI gratuitement et commence dès aujourd'hui.
          </p>
          <button
            style={{ ...S.btnWhite, position:'relative', zIndex:1 }}
            onClick={() => navigate('/login')}
          >
            🚀 Commencer maintenant
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <div style={S.logo}>
          <div style={S.logoIcon}>🎓</div>
          <span style={S.logoText}>StudyAI</span>
        </div>
        <p style={{ fontSize:13, color:'#94a3b8' }}>
          © 2025 StudyAI · Assistant Intelligent de Révision Académique · Maroc 🇲🇦
        </p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>
    </div>
  );
}

const S = {
  page: { minHeight:'100vh', background:'#f0f4ff', fontFamily:"'DM Sans',sans-serif", position:'relative', overflow:'hidden' },
  bgBlob1: { position:'fixed', top:-200, right:-200, width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 },
  bgBlob2: { position:'fixed', bottom:-200, left:-200, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 },

  // Nav
  nav: { background:'rgba(255,255,255,0.85)', backdropFilter:'blur(20px)', borderBottom:'1px solid #e2e8f0', position:'sticky', top:0, zIndex:100 },
  navInner: { maxWidth:1100, margin:'0 auto', padding:'0 32px', height:68, display:'flex', alignItems:'center', justifyContent:'space-between' },
  logo: { display:'flex', alignItems:'center', gap:10 },
  logoIcon: { width:40, height:40, background:'linear-gradient(135deg,#6366f1,#06b6d4)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 },
  logoText: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, color:'#1e293b' },
  logoSub: { display:'block', fontSize:10, color:'#64748b', fontWeight:400, lineHeight:1 },
  navLinks: { display:'flex', gap:32 },
  navLink: { fontSize:14, color:'#64748b', textDecoration:'none', fontWeight:500, transition:'color 0.2s' },
  navActions: { display:'flex', gap:10, alignItems:'center' },
  btnGhost: { padding:'9px 20px', borderRadius:10, background:'transparent', border:'1px solid #e2e8f0', color:'#64748b', cursor:'pointer', fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s' },
  btnAccent: { padding:'9px 20px', borderRadius:10, background:'linear-gradient(135deg,#6366f1,#818cf8)', color:'white', border:'none', cursor:'pointer', fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif", boxShadow:'0 4px 16px rgba(99,102,241,0.3)', transition:'all 0.2s', display:'inline-flex', alignItems:'center', gap:6 },
  btnWhite: { padding:'14px 32px', borderRadius:12, background:'white', color:'#6366f1', border:'none', cursor:'pointer', fontSize:15, fontWeight:700, fontFamily:"'Syne',sans-serif", boxShadow:'0 4px 20px rgba(0,0,0,0.15)', transition:'all 0.2s' },

  // Hero
  hero: { maxWidth:1100, margin:'0 auto', padding:'60px 32px', display:'flex', alignItems:'center', gap:60, position:'relative', zIndex:1 },
  heroLeft: { flex:1 },
  heroBadge: { display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', color:'#6366f1', fontSize:13, fontWeight:600, marginBottom:20 },
  heroTitle: { fontFamily:"'Syne',sans-serif", fontSize:42, fontWeight:800, lineHeight:1.2, color:'#1e293b', marginBottom:16 },
  heroAccent: { color:'#6366f1' },
  heroDesc: { fontSize:15, color:'#64748b', lineHeight:1.7, marginBottom:28, maxWidth:440 },
  uploadBox: { background:'white', border:'2px dashed #c7d2fe', borderRadius:20, padding:24, cursor:'pointer', maxWidth:380, boxShadow:'0 4px 24px rgba(99,102,241,0.1)', transition:'all 0.3s' },
  uploadIcon: { fontSize:48, textAlign:'center', display:'block', marginBottom:10 },
  uploadTitle: { fontSize:16, textAlign:'center', color:'#1e293b', marginBottom:4 },
  uploadSub: { fontSize:12, textAlign:'center', color:'#94a3b8', marginBottom:4 },

  // Hero right
  heroRight: { flex:1, display:'flex', justifyContent:'center' },
  heroIllustration: { position:'relative', width:380, height:380 },
  heroEmoji: { position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:140, animation:'float 3s ease-in-out infinite', filter:'drop-shadow(0 20px 40px rgba(99,102,241,0.2))' },
  floatingCard1: { position:'absolute', top:20, right:0, background:'white', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 8px 32px rgba(99,102,241,0.15)', border:'1px solid #e2e8f0', animation:'float 3s ease-in-out infinite 0.5s' },
  floatingCard2: { position:'absolute', bottom:60, right:10, background:'white', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 8px 32px rgba(6,182,212,0.15)', border:'1px solid #e2e8f0', animation:'float 3s ease-in-out infinite 1s' },
  floatingCard3: { position:'absolute', top:100, left:0, background:'white', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 8px 32px rgba(16,185,129,0.15)', border:'1px solid #e2e8f0', animation:'float 3s ease-in-out infinite 1.5s' },

  // Stats
  statsSection: { maxWidth:900, margin:'0 auto 60px', padding:'0 32px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 },
  statItem: { background:'white', borderRadius:16, padding:'20px', textAlign:'center', boxShadow:'0 4px 20px rgba(99,102,241,0.08)', border:'1px solid #e2e8f0' },
  statValue: { fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, color:'#6366f1', marginBottom:4 },
  statLabel: { fontSize:12, color:'#64748b', fontWeight:500 },

  // Features
  featuresSection: { maxWidth:1100, margin:'0 auto 80px', padding:'0 32px' },
  sectionTitle: { fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#1e293b', marginBottom:12 },
  sectionDesc: { fontSize:15, color:'#64748b', maxWidth:600, margin:'0 auto' },
  featuresGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 },
  featureCard: { background:'white', borderRadius:20, padding:28, textAlign:'center', border:'1px solid #e2e8f0', boxShadow:'0 4px 24px rgba(99,102,241,0.08)', transition:'all 0.3s' },
  featureIconWrap: { width:80, height:80, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' },
  featureTitle: { fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, marginBottom:10 },
  featureDesc: { fontSize:14, color:'#64748b', lineHeight:1.6 },

  // How it works
  howSection: { maxWidth:1100, margin:'0 auto 80px', padding:'0 32px' },
  steps: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 },
  step: { background:'white', borderRadius:20, padding:24, display:'flex', flexDirection:'column', alignItems:'center', border:'1px solid #e2e8f0', boxShadow:'0 4px 20px rgba(99,102,241,0.06)', position:'relative' },
  stepNum: { position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#6366f1,#818cf8)', color:'white', fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13, padding:'4px 12px', borderRadius:20 },

  // CTA
  ctaSection: { maxWidth:900, margin:'0 auto 80px', padding:'0 32px' },
  ctaBox: { borderRadius:28, padding:'56px 40px', textAlign:'center', background:'linear-gradient(135deg,#6366f1 0%,#06b6d4 100%)', color:'white', position:'relative', overflow:'hidden' },
  ctaBg1: { position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.1)' },
  ctaBg2: { position:'absolute', bottom:-80, left:-40, width:250, height:250, borderRadius:'50%', background:'rgba(255,255,255,0.07)' },

  // Footer
  footer: { borderTop:'1px solid #e2e8f0', padding:'24px 32px', display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:1100, margin:'0 auto' },
};
