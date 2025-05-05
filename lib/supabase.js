import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your Supabase URL and anon key
const supabaseUrl = 'https://jutkmmspogewqjfgrwdr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dGttbXNwb2dld3FqZmdyd2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MTYxODUsImV4cCI6MjA1Nzk5MjE4NX0.NBkYzC_xx7T31wqjBuwnnNwooM5GQ4vBvdIq3Hxj4LA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
