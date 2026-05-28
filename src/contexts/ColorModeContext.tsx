'use client';

// Dark mode removed — stub kept so existing imports don't break
import { createContext, useContext, ReactNode } from 'react';

interface ColorModeContextType {
  colorMode: 'claro';
  setColorMode: (mode: 'claro') => void;
  mounted: boolean;
}

const ColorModeContext = createContext<ColorModeContextType>({
  colorMode: 'claro',
  setColorMode: () => {},
  mounted: true,
});

export function ColorModeProvider({ children }: { children: ReactNode }) {
  return (
    <ColorModeContext.Provider value={{ colorMode: 'claro', setColorMode: () => {}, mounted: true }}>
      {children}
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  return useContext(ColorModeContext);
}
