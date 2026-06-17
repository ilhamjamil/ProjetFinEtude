import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('studyai_theme') || 'light');

  useEffect(() => {
    localStorage.setItem('studyai_theme', theme);
    const r = document.documentElement;
    if (theme === 'dark') {
      r.style.setProperty('--bg', '#080B1F');
      r.style.setProperty('--surface', '#12172E');
      r.style.setProperty('--surface2', '#1A2040');
      r.style.setProperty('--border', 'rgba(120,130,255,0.15)');
      r.style.setProperty('--text', '#F8FAFC');
      r.style.setProperty('--text-muted', '#A5B4D6');
      r.style.setProperty('--shadow', '0 10px 40px rgba(0,0,0,0.45)');
        document.body.style.background = `
          radial-gradient(circle at 10% 10%, rgba(139,92,246,0.20), transparent 35%),
          radial-gradient(circle at 90% 5%, rgba(236,72,153,0.15), transparent 30%),
          #080B1F
        `;
    } else {
      r.style.setProperty('--bg', '#F5F7FB');
      r.style.setProperty('--surface', '#FFFFFF');
      r.style.setProperty('--surface2', '#F8FAFD');
      r.style.setProperty('--border', '#E7ECF5');
      r.style.setProperty('--text', '#1E293B');
      r.style.setProperty('--text-muted', '#64748B');
      r.style.setProperty('--shadow', '0 10px 35px rgba(99,102,241,0.08)');
      document.body.style.background = `
          radial-gradient(circle at 10% 10%, rgba(168,85,247,0.10), transparent 35%),
          radial-gradient(circle at 90% 5%, rgba(59,130,246,0.10), transparent 30%),
          #F6F8FF
        `;
    }
     
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark'), isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
