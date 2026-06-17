import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '📄', title: 'Upload de cours PDF', desc: 'Importe tes fichiers PDF en un clic. Le système extrait automatiquement le texte et structure ton cours.', color: '#6366f1' },
  { icon: '📝', title: 'Résumé automatique', desc: 'L\'IA génère un résumé structuré avec les points clés, les concepts importants et une conclusion synthétique.', color: '#06b6d4' },
  { icon: '💬', title: 'Chat contextuel', desc: 'Pose des questions à l\'IA sur ton cours. Les réponses sont basées uniquement sur ton document.', color: '#10b981' },
  { icon: '🧠', title: 'QCM intelligents', desc: 'Génère des quiz personnalisés par chapitre. Correction immédiate avec explications détaillées.', color: '#f59e0b' },
  { icon: '📖', title: 'Apprentissage par chapitres', desc: 'L\'IA détecte les chapitres, les verrouille et les débloque progressivement selon tes scores (70% requis).', color: '#8b5cf6' },
  { icon: '📅', title: 'Planning de révision', desc: 'Upload ton emploi du temps et reçois un planning personnalisé avec notifications email de rappel.', color: '#f43f5e' },
  { icon: '📊', title: 'Suivi de progression', desc: 'Tableau de bord avec statistiques, graphiques d\'évolution hebdomadaire et niveau par matière.', color: '#06b6d4' },
  { icon: '🏆', title: 'Gamification', desc: 'Gagne des XP, monte en niveau (Débutant → Expert) et débloque des badges motivants.', color: '#f59e0b' },
  { icon: '🌙', title: 'Mode sombre / clair', desc: 'Interface adaptée à tes préférences visuelles avec toggle dark/light mode persistant.', color: '#6366f1' },
];

const FAQ = [
  { q: 'Comment utiliser StudyAI ?', a: 'Crée un compte, upload ton cours PDF, puis explore les fonctionnalités : résumé automatique, chat IA, QCM par chapitre et planning de révision.' },
  { q: 'Mes données sont-elles sécurisées ?', a: 'Oui. Les mots de passe sont hashés avec bcrypt, les sessions sont sécurisées via JWT, et chaque étudiant accède uniquement à ses propres documents.' },
  { q: 'Quel format de fichier est accepté ?', a: 'StudyAI accepte les fichiers PDF (pour les cours) et les PDF ou images JPG/PNG (pour l\'emploi du temps). Taille maximale : 10 MB.' },
  { q: 'Combien de questions peut générer le QCM ?', a: 'Entre 3 et 20 questions par QCM. Les questions sont générées automatiquement par l\'IA basée sur le contenu exact de ton cours.' },
  { q: 'Comment fonctionne le système de chapitres ?', a: 'L\'IA détecte automatiquement les chapitres de ton cours. Le chapitre suivant se débloque uniquement si tu obtiens 70% au QCM du chapitre actuel.' },
  { q: 'Comment activer les notifications email ?', a: 'Configure ton email Gmail dans le panneau de planning. StudyAI t\'enverra un rappel le jour de chaque session de révision prévue.' },
  { q: 'Le service est-il gratuit ?', a: 'Oui, StudyAI est entièrement gratuit. Il utilise des APIs gratuites (Groq) pour la génération de contenu IA.' },
  { q: 'Puis-je utiliser StudyAI sur mobile ?', a: 'Oui, l\'interface est responsive et s\'adapte aux écrans mobile et tablette.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [activeSection, setActiveSection] = useState('accueil');

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(id);
  };

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif", background: `
      linear-gradient(
      180deg,
      #eef2ff 0%,
      #f5f3ff 35%,
      #eff6ff 70%,
      #ffffff 100%
      )
      `, minHeight: '100vh'
    }}>
      {/* BG blobs */}
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -200, left: -200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── NAV ── */}
      <nav style={{
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(99,102,241,0.12)',
        boxShadow: '0 10px 35px rgba(99,102,241,0.10)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <img
 src="/logo.png"
 alt="StudyAI logo"
 style={{
   width: 90,
   height: 90,
   borderRadius: "12px",
   objectFit: "contain",
   backgroundColor: "transparent",
   padding: "4px"
        
            }}
/>            <div>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 19, color: '#1e293b' }}>StudyAI</span>
              <span style={{ display: 'block', fontSize: 9, color: '#94a3b8', lineHeight: 1 }}>Assistant Intelligent</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {[['accueil', 'Accueil'], ['fonctionnalites', 'Fonctionnalités'], ['faq', 'FAQ']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                style={{
                  padding: '8px 16px', background: activeSection === id ? 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))' : 'transparent', border: activeSection === id ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                  color: activeSection === id ? '#6366f1' : '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all .3s ease', boxShadow: activeSection === id ? '0 4px 12px rgba(99,102,241,0.12)' : 'none'
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '9px 18px',
                borderRadius: 12,
                background: 'rgba(99,102,241,0.05)',
                border: '1px solid rgba(99,102,241,0.15)',
                color: '#6366f1',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                transition: 'all .3s'
              }}
            >
              Connexion
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '9px 20px',
                borderRadius: 12,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                boxShadow: '0 10px 25px rgba(99,102,241,0.35)'
              }}
            >
              👤 Inscription
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */} <section id="accueil" style={{ maxWidth: 1100, margin: '0 auto', padding: '70px 28px 60px', display: 'flex', alignItems: 'center', gap: 60, position: 'relative', zIndex: 1 }}> 
        <div style={{ flex: 1 }}> <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1', fontSize: 13, fontWeight: 600, marginBottom: 22 }}> 🇲🇦 Conçu pour les étudiants marocains </div> 
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 44, fontWeight: 800, lineHeight: 1.18, color: '#1e293b', marginBottom: 18 }}> Votre assistant IA<br />pour des études<br />
         <span style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> réussies ! 🤖 </span> 
         </h1> <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.75, marginBottom: 32, maxWidth: 440 }}> Télécharge tes fichiers de cours PDF et laisse StudyAI t'aider à réviser, poser des questions, générer des QCM personnalisés et suivre ta progression. </p>

        {/* Upload Box */}
        <div
          onClick={() => navigate('/login')}
          style={{
            maxWidth: 420,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 24,
            padding: '28px',
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99,102,241,0.15)',
            boxShadow: '0 20px 50px rgba(99,102,241,0.15)'
          }}
        >

          <div style={{ position: 'absolute',top: -80,right: -80, width: 180,height: 180,borderRadius: '50%',background: 'radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)' }} />

          <div style={{ width: 74,height: 74,margin: '0 auto 16px',borderRadius: 20,background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)',display: 'flex', alignItems: 'center',
            justifyContent: 'center',fontSize: 34, color: 'white',boxShadow: '0 15px 35px rgba(99,102,241,0.35)'
          }}>
            📄
          </div>

          <p style={{
            fontFamily: "'Outfit',sans-serif",
            fontSize: 18,
            fontWeight: 800,
            textAlign: 'center',
            color: '#1e293b',
            marginBottom: 6
          }}>
            Importe ton cours
          </p>

          <p style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#94a3b8',
            marginBottom: 20
          }}>
            PDF • Résumés • Chat IA • Quiz intelligents
          </p>

          <button style={{
            width: '100%',
            padding: '13px',
            borderRadius: 14,
            border: 'none',
            cursor: 'pointer',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: 'white',
            fontWeight: 800,
            fontSize: 14,
            boxShadow: '0 10px 25px rgba(99,102,241,0.30)',
            marginBottom: 10
          }}>
            ☁️ Ajouter un document
          </button>

          <button style={{
            width: '100%',
            padding: '12px',
            borderRadius: 14,
            background: 'rgba(99,102,241,0.05)',
            border: '1px solid rgba(99,102,241,0.12)',
            color: '#6366f1',
            fontWeight: 700,
            cursor: 'pointer'
          }}>
            ✨ Commencer gratuitement
          </button>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 14,
            marginTop: 18,
            fontSize: 12,
            color: '#64748b'
          }}>
            <span>⚡ Rapide</span>
            <span>🔒 Sécurisé</span>
            <span>🤖 IA</span>
          </div>

        </div>

      </div>

        {/* Illustration */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative', minHeight: 360 }}>
          <span style={{ fontSize: 130, animation: 'float 3s ease-in-out infinite', filter: 'drop-shadow(0 20px 40px rgba(99,102,241,0.2))', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>👩‍💻</span>
          {[
            { top: 20, right: 20, icon: '📚', title: 'Cours uploadé', sub: 'Algorithmes.pdf', check: true },
            { bottom: 60, right: 10, icon: '🧠', title: 'QCM généré', sub: '5 questions · 80%' },
            { top: 100, left: 10, icon: '📈', title: 'Progression', sub: '75% ce chapitre' },
          ].map((card, i) => (
            <div key={i} style={{ position: 'absolute', top: card.top, bottom: card.bottom, left: card.left, right: card.right, background: 'white', borderRadius: 13, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 6px 24px rgba(99,102,241,0.12)', border: '1px solid #e2e8f0', animation: `float 3s ease-in-out infinite ${i * 0.5}s`, minWidth: 160 }}>
              <span style={{ fontSize: 22 }}>{card.icon}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{card.title}</p>
                <p style={{ fontSize: 11, color: '#64748b' }}>{card.sub}</p>
              </div>
              {card.check && <span style={{ color: '#10b981', fontSize: 16, marginLeft: 'auto' }}>✓</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ maxWidth: 900, margin: '0 auto 70px', padding: '0 28px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[['Chat', 'Basé sur vos cours'], ['100%', 'Gratuit'], ['∞', 'Quiz générés'], ['24/7', 'Disponible']].map(([v, l], i) => (
          <div key={i} style={{ background: 'white', borderRadius: 16, padding: '20px', textAlign: 'center', boxShadow: '0 4px 20px rgba(99,102,241,0.07)', border: '1px solid #e2e8f0' }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 30, fontWeight: 800, color: '#6366f1', marginBottom: 4 }}>{v}</p>
            <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{l}</p>
          </div>
        ))}
      </section>

      {/* ── FONCTIONNALITÉS ── */}
<section id="fonctionnalites" style={{maxWidth:1100,margin:'0 auto 100px',padding:'0 28px'}}>
  
  <div style={{textAlign:'center',marginBottom:60}}>
    <div style={{
      display:'inline-flex',
      alignItems:'center',
      gap:8,
      padding:'8px 16px',
      borderRadius:30,
      background:'rgba(99,102,241,0.08)',
      border:'1px solid rgba(99,102,241,0.15)',
      color:'#6366f1',
      fontSize:13,
      fontWeight:700,
      marginBottom:18
    }}>
      ✨ Fonctionnalités principales
    </div>

    <h2 style={{
      fontFamily:"'Outfit',sans-serif",
      fontSize:36,
      fontWeight:900,
      color:'#0f172a',
      marginBottom:14
    }}>
      Tout ce qu'il faut pour réussir
    </h2>

    <p style={{
      color:'#64748b',
      fontSize:16,
      maxWidth:620,
      margin:'0 auto',
      lineHeight:1.8
    }}>
      Une plateforme intelligente qui t'accompagne depuis l'importation de ton cours jusqu'à la révision finale.
    </p>
  </div>

  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
    {FEATURES.slice(0,6).map((f,i)=>(
      <div
        key={i}
        style={{
          background:'rgba(255,255,255,0.85)',
          backdropFilter:'blur(20px)',
          borderRadius:24,
          padding:28,
          border:'1px solid rgba(99,102,241,0.10)',
          boxShadow:'0 15px 35px rgba(99,102,241,0.08)',
          position:'relative',
          overflow:'hidden',
          animation:`fadeUp .4s ease ${i*0.08}s both`
        }}
      >

        <div style={{
          position:'absolute',
          top:-45,
          right:-45,
          width:110,
          height:110,
          borderRadius:'50%',
          background:`${f.color}15`
        }}/>

        <div style={{
          width:62,
          height:62,
          borderRadius:18,
          background:`linear-gradient(135deg,${f.color},#06b6d4)`,
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          fontSize:28,
          color:'white',
          marginBottom:18,
          boxShadow:`0 12px 25px ${f.color}35`
        }}>
          {f.icon}
        </div>

        <h3 style={{
          fontFamily:"'Outfit',sans-serif",
          fontSize:18,
          fontWeight:800,
          color:'#1e293b',
          marginBottom:10
        }}>
          {f.title}
        </h3>

        <p style={{
          fontSize:14,
          color:'#64748b',
          lineHeight:1.8
        }}>
          {f.desc}
        </p>

      </div>
    ))}
  </div>

</section>

     {/* ── FAQ ── */}
<section id="faq" style={{ maxWidth:760, margin:'0 auto 100px', padding:'0 28px' }}>
  <div style={{ textAlign:'center', marginBottom:50 }}>
    <span style={{ display:'inline-block', padding:'8px 16px', borderRadius:20, background:'rgba(99,102,241,0.1)', color:'#6366f1', fontWeight:700, fontSize:13, marginBottom:16 }}>
      ❓ FAQ
    </span>
    <h2 style={{ fontFamily:"'Outfit', sans-serif", fontSize:34, fontWeight:800, color:'#1e293b', marginBottom:12 }}>
      Questions fréquentes
    </h2>
    <p style={{ color:'#64748b', fontSize:15 }}>
      Tout ce qu'il faut savoir avant de commencer.
    </p>
  </div>

  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
    {FAQ.slice(0,6).map((item, i) => (
      <div key={i} style={{
        background:'rgba(255,255,255,0.9)',
        backdropFilter:'blur(16px)',
        border:'1px solid rgba(99,102,241,0.12)',
        borderRadius:18,
        overflow:'hidden',
        boxShadow:'0 12px 35px rgba(99,102,241,0.08)',
        transition:'all .3s'
      }}>
        <button
          onClick={() => setOpenFaq(openFaq === i ? null : i)}
          style={{
            width:'100%',
            display:'flex',
            justifyContent:'space-between',
            alignItems:'center',
            padding:'20px 24px',
            background:'none',
            border:'none',
            cursor:'pointer',
            textAlign:'left'
          }}
        >
          <span style={{
            fontSize:15,
            fontWeight:700,
            color:'#1e293b',
            lineHeight:1.5
          }}>
            {item.q}
          </span>

          <div style={{
            width:32,
            height:32,
            borderRadius:10,
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            color:'white',
            fontWeight:700,
            flexShrink:0,
            transform: openFaq===i ? 'rotate(45deg)' : 'rotate(0)',
            transition:'all .3s'
          }}>
            +
          </div>
        </button>

        {openFaq === i && (
          <div style={{
            padding:'0 24px 20px',
            borderTop:'1px solid rgba(99,102,241,0.08)',
            background:'linear-gradient(180deg,rgba(99,102,241,0.02),transparent)'
          }}>
            <p style={{
              marginTop:16,
              color:'#64748b',
              fontSize:14,
              lineHeight:1.8
            }}>
              {item.a}
            </p>
          </div>
        )}
      </div>
    ))}
  </div>
</section>

      {/* ── CTA ── */}
      <section style={{ maxWidth: 880, margin: '0 auto 80px', padding: '0 28px' }}>
        <div style={{ borderRadius: 26, padding: '54px 40px', textAlign: 'center', background: 'linear-gradient(135deg,#6366f1 0%,#06b6d4 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 12, position: 'relative' }}>
            Prêt à transformer ta façon d'étudier ?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 15, marginBottom: 26, position: 'relative' }}>
            Rejoins StudyAI gratuitement et commence dès aujourd'hui.
          </p>
          <button onClick={() => navigate('/login')} style={{ padding: '13px 32px', borderRadius: 12, background: 'white', color: '#6366f1', border: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', position: 'relative' }}>
            🚀 Commencer maintenant
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '24px 28px', maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/logo.png" alt="StudyAI logo" style={{
      width: 70,
      height: 70,
      borderRadius: "12px",objectFit: "contain",backgroundColor: "transparent",padding: "4px"}}/>          
       <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16, color: '#1e293b' }}>StudyAI</span>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>© 2025 StudyAI · Assistant Intelligent de Révision Académique · Maroc 🇲🇦</p>
      </footer>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
