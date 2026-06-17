
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

  // Hide navbar on landing page
  if (!user && location.pathname === '/') return null;

  return (
    <nav style={{
      background: isDark ? 'rgba(22,27,39,0.95)' : 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${isDark ? '#2d3650' : '#e2e8f0'}`,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>

        {/* LOGO */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
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
        />        
       
          <div>
            <span style={{
              fontFamily: 'Syne,sans-serif',
              fontWeight: 800,
              fontSize: 18,
              color: isDark ? '#e8eaf6' : '#1e293b'
            }}>
              StudyAI
            </span>
            <span style={{
              display: 'block',
              fontSize: 9,
              color: isDark ? '#8892b0' : '#94a3b8'
            }}>
              Assistant Intelligent
            </span>
          </div>
        </Link>

        {/* NAV LINKS */}
        {user && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>

            {/* 🔥 ADMIN MODE */}
            {user.isAdmin ? (
              <Link
                to="/admin"
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#f59e0b',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.25)',
                }}
              >
                🛡️ Dashboard Admin
              </Link>
            ) : (
              <>
                {/* 👤 USER NORMAL MENU */}
                {[
                  { path: '/', label: '🏠 Accueil' },
                  { path: '/profile', label: '📊 Mon Profil' },
                  { path: '/schedule', label: '📅 Planning' },
                ].map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 10,
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: 600,
                      color: isActive(item.path)
                        ? '#6366f1'
                        : (isDark ? '#8892b0' : '#64748b'),
                      background: isActive(item.path)
                        ? 'rgba(99,102,241,0.1)'
                        : 'transparent',
                      border: isActive(item.path)
                        ? '1px solid rgba(99,102,241,0.2)'
                        : '1px solid transparent',
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </div>
        )}

        {/* RIGHT SIDE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* Theme */}
          <button
            onClick={toggleTheme}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: `1px solid ${isDark ? '#2d3650' : '#e2e8f0'}`,
              background: isDark ? '#1e2535' : '#f8f9ff',
              cursor: 'pointer'
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* USER INFO */}
          {user && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 10,
                background: isDark ? '#1e2535' : '#f8f9ff',
                border: `1px solid ${isDark ? '#2d3650' : '#e2e8f0'}`,
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6366f1,#06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <p style={{ fontSize: 12, fontWeight: 600 }}>
                    {user.name}
                  </p>
                  <p style={{ fontSize: 10, opacity: 0.7 }}>
                    {user.isAdmin ? 'Admin' : 'Étudiant'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  border: `1px solid ${isDark ? '#2d3650' : '#e2e8f0'}`,
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                Déconnexion
              </button>
            </>
          )}

          {/* AUTH BUTTONS */}
          {!user && (
            <>
              <button onClick={() => navigate('/login')} style={{
                padding: '9px 18px',
                borderRadius: 12,
                background: 'rgba(99,102,241,0.05)',
                border: '1px solid rgba(99,102,241,0.15)',
                color: '#6366f1',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                transition: 'all .3s'
              }}>
                Connexion
              </button>
              <button onClick={() => navigate('/login')} style={{
                padding: '9px 18px',
                borderRadius: 12,
                background: 'rgba(99,102,241,0.05)',
                border: '1px solid rgba(99,102,241,0.15)',
                color: '#6366f1',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                transition: 'all .3s'
              }}>
                Inscription
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
