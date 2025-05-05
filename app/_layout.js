import { Slot, Stack, Tabs, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import ThemeProvider from '../components/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

// Initialize database schema
async function initializeDatabase() {
  try {
    // Try to select the time column to check if it exists
    const { error: checkError } = await supabase
      .from('activities')
      .select('time')
      .limit(1);

    // If we get an error about the column not existing, try to add it
    if (checkError?.message?.includes('column "time" does not exist')) {
      const { error: alterError } = await supabase
        .from('activities')
        .update({ time: null })
        .eq('id', '00000000-0000-0000-0000-000000000000') // This ID doesn't exist, but the query will create the column
        .select();
      
      if (alterError) {
        console.error('Error adding time column:', alterError.message);
      }
    }
  } catch (error) {
    console.error('Error in database initialization:', error);
  }
}

// This component handles protected routes
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Initialize database on app start
    initializeDatabase();

    const isAuthScreen = segments[0] === 'login' || segments[0] === 'signup';
    const isWelcomeScreen = segments.length === 0 || segments[0] === 'index';
    const isOnboardingScreen = segments[0] === 'onboarding';
    const isCreateTripScreen = segments[0] === 'create-trip';
    const isTripDetailsScreen = segments[0] === 'trip-details';
    const isTabsScreen = segments[0] === 'tabs';
    
    // Screens that don't need authentication
    const isPublicScreen = isAuthScreen || isWelcomeScreen;
    
    // Screens that require authentication
    const isAuthRequiredScreen = isTabsScreen || isOnboardingScreen || isCreateTripScreen || isTripDetailsScreen;

    // If the user is not signed in and trying to access a protected screen,
    // redirect to the welcome screen
    if (!user && isAuthRequiredScreen) {
      router.replace('/');
    } 
    // If the user is signed in and trying to access an auth screen,
    // redirect to the dashboard
    else if (user && isPublicScreen) {
      router.replace('/tabs/dashboard');
    }
  }, [user, loading, segments]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Non-authenticated screens */}
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        
        {/* Authenticated screens */}
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="create-trip" />
        <Stack.Screen name="trip-details" />
        <Stack.Screen name="tabs" />
        
        {/* Dynamic routes */}
        <Stack.Screen name="destination/[name]" />
        <Stack.Screen name="trip/[id]" />
      </Stack>
    </>
  );
}

// Wrap the root layout with providers
export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  );
}
