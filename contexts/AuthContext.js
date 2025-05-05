import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Check for existing session on app load
    checkUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`Supabase auth event: ${event}`);
        setSession(newSession);
        
        // Create a basic profile object from auth data
        if (newSession?.user) {
          // Load or create profile from AsyncStorage
          const userWithProfile = await loadOrCreateProfile(newSession.user);
          setUser(userWithProfile);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const loadOrCreateProfile = async (authUser) => {
    try {
      // Try to load profile from AsyncStorage
      const profileKey = `profile:${authUser.id}`;
      const storedProfile = await AsyncStorage.getItem(profileKey);
      
      if (storedProfile) {
        // Profile exists in AsyncStorage
        const profile = JSON.parse(storedProfile);
        console.log('Loaded profile from AsyncStorage');
        return {
          ...authUser,
          profile
        };
      } else {
        // Create a new profile
        console.log('Creating new profile in AsyncStorage');
        const newProfile = {
          id: authUser.id,
          email: authUser.email,
          username: authUser.email?.split('@')[0] || 'traveler',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Save to AsyncStorage
        await AsyncStorage.setItem(profileKey, JSON.stringify(newProfile));
        
        return {
          ...authUser,
          profile: newProfile
        };
      }
    } catch (error) {
      console.error('Error in loadOrCreateProfile:', error.message);
      // Return basic profile as fallback
      return {
        ...authUser,
        profile: {
          id: authUser.id,
          email: authUser.email,
          username: authUser.email?.split('@')[0] || 'traveler'
        }
      };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const updatedProfile = {
        ...user.profile,
        ...profileData,
        updated_at: new Date().toISOString()
      };
      
      // Save to AsyncStorage
      const profileKey = `profile:${user.id}`;
      await AsyncStorage.setItem(profileKey, JSON.stringify(updatedProfile));
      
      // Update user state
      setUser({
        ...user,
        profile: updatedProfile
      });
      
      return { data: updatedProfile, error: null };
    } catch (error) {
      console.error('Error updating profile:', error.message);
      return { data: null, error };
    }
  };

  const checkUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      
      // Create a basic profile object from auth data
      if (data.session?.user) {
        // Load or create profile from AsyncStorage
        const userWithProfile = await loadOrCreateProfile(data.session.user);
        setUser(userWithProfile);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth state:', error.message);
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async ({ email, password }) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error signing up:', error.message);
      setAuthError(error.message);
      return { data: null, error };
    }
  };

  const signIn = async ({ email, password }) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error.message);
      setAuthError(error.message);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error.message);
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        authError,
        signUp,
        signIn,
        signOut,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
