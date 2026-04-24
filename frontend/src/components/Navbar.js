import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  // Ne pas afficher la navbar sur la landing page
  if (!user && location.pathname === '/') return null;

  return (
    <nav style={{
      background: isDark ? 'rgba(22,27,39,0.95)' : 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${isDark ? '#2d3650' : '#e2e8f0'}`,
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>

        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#6366f1,#06b6d4)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎓</div>
          <div>
            <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color: isDark ? '#e8eaf6' : '#1e293b' }}>StudyAI</span>
            <span style={{ display:'block', fontSize:9, color: isDark ? '#8892b0' : '#94a3b8', lineHeight:1 }}>Assistant Intelligent</span>
          </div>
        </Link>

        {/* Nav links */}
        {user && (
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            {[
              { path:'/', label:'🏠 Accueil' },
              { path:'/profile', label:'📊 Mon Profil' },
              { path:'/schedule', label:'📅 Planning' },
            ].map(item => (
              <Link key={item.path} to={item.path} style={{
                padding:'7px 14px', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:600,
                color: isActive(item.path) ? '#6366f1' : (isDark ? '#8892b0' : '#64748b'),
                background: isActive(item.path) ? 'rgba(99,102,241,0.1)' : 'transparent',
                border: isActive(item.path) ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                transition:'all 0.2s',
              }}>
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right actions */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>

          {/* Theme toggle */}
          <button onClick={toggleTheme} style={{
            width:40, height:40, borderRadius:10, border:`1px solid ${isDark ? '#2d3650' : '#e2e8f0'}`,
            background: isDark ? '#1e2535' : '#f8f9ff', cursor:'pointer', fontSize:18,
            display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s',
          }} title={isDark ? 'Mode clair' : 'Mode sombre'}>
            {isDark ? '☀️' : '🌙'}
          </button>

          {user ? (
            <>
              <div style={{
                display:'flex', alignItems:'center', gap:8, padding:'6px 12px',
                borderRadius:10, background: isDark ? '#1e2535' : '#f8f9ff',
                border:`1px solid ${isDark ? '#2d3650' : '#e2e8f0'}`,
              }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'white' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize:12, fontWeight:600, color: isDark ? '#e8eaf6' : '#1e293b', lineHeight:1 }}>{user.name}</p>
                  <p style={{ fontSize:10, color: isDark ? '#8892b0' : '#94a3b8', lineHeight:1.4 }}>Étudiant</p>
                </div>
              </div>
              <button onClick={() => { logout(); navigate('/'); }} style={{
                padding:'7px 14px', borderRadius:10, background:'transparent',
                border:`1px solid ${isDark ? '#2d3650' : '#e2e8f0'}`,
                color: isDark ? '#8892b0' : '#64748b', cursor:'pointer', fontSize:12, fontWeight:600,
                fontFamily:'DM Sans,sans-serif', transition:'all 0.2s',
              }}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} style={{
                padding:'8px 16px', borderRadius:10, background:'transparent',
                border:'1px solid #e2e8f0', color:'#64748b', cursor:'pointer', fontSize:13, fontWeight:600,
                fontFamily:'DM Sans,sans-serif',
              }}>Connexion</button>
              <button onClick={() => navigate('/login')} style={{
                padding:'8px 16px', borderRadius:10,
                background:'linear-gradient(135deg,#6366f1,#818cf8)',
                color:'white', border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
                fontFamily:'DM Sans,sans-serif', boxShadow:'0 4px 12px rgba(99,102,241,0.3)',
              }}>Inscription</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
