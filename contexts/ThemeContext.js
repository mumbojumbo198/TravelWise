import React, { createContext, useContext, useState } from 'react';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';

// Define our custom theme based on React Native Paper
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0066cc',
    secondary: '#5c6bc0',
    accent: '#03dac4',
    background: '#f8f9fa',
    surface: '#ffffff',
    error: '#ff3b30',
    text: '#000000',
    onSurface: '#000000',
    disabled: '#9e9e9e',
    placeholder: '#9e9e9e',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#ff3b30',
  },
  roundness: 8,
};

const ThemeContext = createContext({
  theme: lightTheme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme);

  // This could be expanded to support dark mode in the future
  const toggleTheme = () => {
    setTheme(theme === lightTheme ? darkTheme : lightTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <PaperProvider theme={theme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
