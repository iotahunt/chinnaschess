import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeTokens {
  mode: ThemeMode;
  bg: string;
  bgSecondary: string;
  cardBg: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  neonPrimary: string;
  neonSecondary: string;
  neonGlow: string;
  neonGlowStrong: string;
  neonBoxShadow: string;
  neonTextShadow: string;
  boardDarkSquare: string;
  boardLightSquare: string;
  boardHighlight: string;
  auraGreen: string;
  auraRed: string;
}

const darkTokens: ThemeTokens = {
  mode: 'dark',
  bg: '#09070f',
  bgSecondary: '#120d1e',
  cardBg: 'rgba(18, 13, 30, 0.85)',
  cardBorder: 'rgba(255, 102, 178, 0.35)',
  text: '#ffffff',
  textSecondary: '#e0c8de',
  textMuted: '#9a819b',
  neonPrimary: '#ff66b2', // Neon Baby Pink
  neonSecondary: '#ff99cc',
  neonGlow: '0 0 14px rgba(255, 102, 178, 0.55)',
  neonGlowStrong: '0 0 24px rgba(255, 102, 178, 0.85), 0 0 45px rgba(255, 102, 178, 0.45)',
  neonBoxShadow: '0 0 16px rgba(255, 102, 178, 0.45)',
  neonTextShadow: '0 0 10px rgba(255, 102, 178, 0.85)',
  boardDarkSquare: '#1e142b',
  boardLightSquare: '#2d1e3e',
  boardHighlight: 'rgba(255, 102, 178, 0.5)',
  auraGreen: '#00ff9d',
  auraRed: '#ff3366',
};

const lightTokens: ThemeTokens = {
  mode: 'light',
  bg: '#f5efe6', // Pastel beige
  bgSecondary: '#ece3d4',
  cardBg: 'rgba(255, 252, 247, 0.9)',
  cardBorder: 'rgba(255, 59, 59, 0.4)',
  text: '#221515',
  textSecondary: '#5a3d3d',
  textMuted: '#8a6b6b',
  neonPrimary: '#ff3b3b', // Neon Red
  neonSecondary: '#ff6b6b',
  neonGlow: '0 0 14px rgba(255, 59, 59, 0.55)',
  neonGlowStrong: '0 0 24px rgba(255, 59, 59, 0.85), 0 0 45px rgba(255, 59, 59, 0.45)',
  neonBoxShadow: '0 0 16px rgba(255, 59, 59, 0.45)',
  neonTextShadow: '0 0 10px rgba(255, 59, 59, 0.85)',
  boardDarkSquare: '#c29d7d',
  boardLightSquare: '#ebd4bc',
  boardHighlight: 'rgba(255, 59, 59, 0.5)',
  auraGreen: '#00b86e',
  auraRed: '#ff2222',
};

interface ThemeContextType {
  theme: ThemeMode;
  tokens: ThemeTokens;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  tokens: darkTokens,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chinnas_theme') as ThemeMode | null;
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'dark';
  });

  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chinnas_theme', next);
    }
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chinnas_theme', mode);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = tokens.bg;
      document.body.style.color = tokens.text;
    }
  }, [tokens]);

  return (
    <ThemeContext.Provider value={{ theme, tokens, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
