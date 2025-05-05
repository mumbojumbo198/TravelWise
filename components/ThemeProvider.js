import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import theme from '../theme';

/**
 * ThemeProvider component that wraps the app with React Native Paper's theme
 * and provides consistent styling across the application.
 */
export default function ThemeProvider({ children }) {
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" backgroundColor={theme.colors.primaryDark} />
      {children}
    </PaperProvider>
  );
}
