import { createContext, useState, useMemo, useEffect, useContext } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getAppTheme } from './theme';

export const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
});

export const useAppThemeContext = () => useContext(ThemeContext);

export function ThemeContextProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('app-theme-mode');
    return savedMode || 'light';
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const nextMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('app-theme-mode', nextMode);
      return nextMode;
    });
  };

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
