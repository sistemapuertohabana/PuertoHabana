'use client';

import { createContext, useContext, ReactNode } from 'react';

type ColorMode = 'claro';

interface ColorModeContextType {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  mounted: boolean;
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

export function ColorModeProvider({ children }: { children: ReactNode }) {
  return (
    <ColorModeContext.Provider value={{ colorMode: 'claro', setColorMode: () => {}, mounted: true }}>
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
