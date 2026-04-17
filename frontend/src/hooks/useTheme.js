import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('studyai_theme') || 'light');

  useEffect(() => {
    localStorage.setItem('studyai_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    // Apply CSS variables globally
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--bg',        '#0f1117');
      root.style.setProperty('--surface',   '#161b27');
      root.style.setProperty('--surface2',  '#1e2535');
      root.style.setProperty('--border',    '#2d3650');
      root.style.setProperty('--text',      '#e8eaf6');
      root.style.setProperty('--text-muted','#8892b0');
      root.style.setProperty('--accent',    '#6366f1');
      root.style.setProperty('--accent2',   '#06b6d4');
      root.style.setProperty('--accent3',   '#f59e0b');
      root.style.setProperty('--success',   '#10b981');
      root.style.setProperty('--error',     '#f43f5e');
      root.style.setProperty('--shadow',    '0 4px 24px rgba(0,0,0,0.4)');
    } else {
      root.style.setProperty('--bg',        '#f0f4ff');
      root.style.setProperty('--surface',   '#ffffff');
      root.style.setProperty('--surface2',  '#f8f9ff');
      root.style.setProperty('--border',    '#e2e8f0');
      root.style.setProperty('--text',      '#1e293b');
      root.style.setProperty('--text-muted','#64748b');
      root.style.setProperty('--accent',    '#6366f1');
      root.style.setProperty('--accent2',   '#0891b2');
      root.style.setProperty('--accent3',   '#f59e0b');
      root.style.setProperty('--success',   '#10b981');
      root.style.setProperty('--error',     '#f43f5e');
      root.style.setProperty('--shadow',    '0 4px 24px rgba(99,102,241,0.12)');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
