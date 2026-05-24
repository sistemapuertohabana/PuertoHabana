'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';

export type ColorMode = 'claro' | 'oscuro';

interface ColorModeContextType {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  mounted: boolean;
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

const STORAGE_KEY = 'colorMode';

function applyTheme(mode: ColorMode) {
  if (mode === 'oscuro') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>('claro');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as ColorMode | null;
    const initial = saved === 'oscuro' ? 'oscuro' : 'claro';
    setColorModeState(initial);
    applyTheme(initial);
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);
    window.dispatchEvent(new Event('ph_store_update'));
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorModeState(prev => {
      const next = prev === 'claro' ? 'oscuro' : 'claro';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      window.dispatchEvent(new Event('ph_store_update'));
      return next;
    });
  }, []);

  return (
    <ColorModeContext.Provider value={{ colorMode, setColorMode, toggleColorMode, mounted }}>
      {children}
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const context = useContext(ColorModeContext);
  if (context === undefined) {
    throw new Error('useColorMode must be used within a ColorModeProvider');
  }
  return context;
}
