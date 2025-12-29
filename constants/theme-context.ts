import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContext {
  setTheme: (value: Theme) => void;
  theme: Theme;
}

export const ThemeContext = createContext<ThemeContext | undefined>(undefined);

export const useThemeContext = () => {
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }

  // Wrap setTheme to log the new theme
  const wrappedSetTheme = (value: Theme) => {
    console.log(`Theme changed to: ${value}`);
    themeContext.setTheme(value);
  };

  return {
    theme: themeContext.theme,
    setTheme: wrappedSetTheme,
  };
};
