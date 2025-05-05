// This script sets up Row Level Security (RLS) policies for TravelWise tables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupRLS() {
  console.log('Setting up Row Level Security policies...');
  
  try {
    // Enable RLS on users table
    const { error: enableUsersRLSError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (enableUsersRLSError) {
      console.error('Error enabling RLS on users table:', enableUsersRLSError.message);
    } else {
      console.log('RLS enabled on users table');
    }
    
    // Create policy for users table - allow insert for authenticated users
    const { error: createUsersPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can insert their own profile"
        ON users
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = id);
      `
    });
    
    if (createUsersPolicyError) {
      console.error('Error creating users insert policy:', createUsersPolicyError.message);
    } else {
      console.log('Users insert policy created');
    }
    
    // Create policy for users table - allow select for authenticated users
    const { error: createUsersSelectPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can view their own profile"
        ON users
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
      `
    });
    
    if (createUsersSelectPolicyError) {
      console.error('Error creating users select policy:', createUsersSelectPolicyError.message);
    } else {
      console.log('Users select policy created');
    }
    
    // Create policy for users table - allow update for authenticated users
    const { error: createUsersUpdatePolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can update their own profile"
        ON users
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = id);
      `
    });
    
    if (createUsersUpdatePolicyError) {
      console.error('Error creating users update policy:', createUsersUpdatePolicyError.message);
    } else {
      console.log('Users update policy created');
    }
    
    // Enable RLS on trips table
    const { error: enableTripsRLSError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (enableTripsRLSError) {
      console.error('Error enabling RLS on trips table:', enableTripsRLSError.message);
    } else {
      console.log('RLS enabled on trips table');
    }
    
    // Create policy for trips table - allow all operations for authenticated users
    const { error: createTripsPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can manage their own trips"
        ON trips
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id);
      `
    });
    
    if (createTripsPolicyError) {
      console.error('Error creating trips policy:', createTripsPolicyError.message);
    } else {
      console.log('Trips policy created');
    }
    
    // Enable RLS on itinerary_days table
    const { error: enableItineraryDaysRLSError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (enableItineraryDaysRLSError) {
      console.error('Error enabling RLS on itinerary_days table:', enableItineraryDaysRLSError.message);
    } else {
      console.log('RLS enabled on itinerary_days table');
    }
    
    // Create policy for itinerary_days table - allow all operations for authenticated users
    const { error: createItineraryDaysPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can manage their own itinerary days"
        ON itinerary_days
        FOR ALL
        TO authenticated
        USING (EXISTS (
          SELECT 1 FROM trips
          WHERE trips.id = itinerary_days.trip_id
          AND trips.user_id = auth.uid()
        ));
      `
    });
    
    if (createItineraryDaysPolicyError) {
      console.error('Error creating itinerary_days policy:', createItineraryDaysPolicyError.message);
    } else {
      console.log('Itinerary days policy created');
    }
    
    // Enable RLS on activities table
    const { error: enableActivitiesRLSError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (enableActivitiesRLSError) {
      console.error('Error enabling RLS on activities table:', enableActivitiesRLSError.message);
    } else {
      console.log('RLS enabled on activities table');
    }
    
    // Create policy for activities table - allow all operations for authenticated users
    const { error: createActivitiesPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can manage their own activities"
        ON activities
        FOR ALL
        TO authenticated
        USING (EXISTS (
          SELECT 1 FROM itinerary_days
          JOIN trips ON trips.id = itinerary_days.trip_id
          WHERE itinerary_days.id = activities.itinerary_day_id
          AND trips.user_id = auth.uid()
        ));
      `
    });
    
    if (createActivitiesPolicyError) {
      console.error('Error creating activities policy:', createActivitiesPolicyError.message);
    } else {
      console.log('Activities policy created');
    }
    
    console.log('Row Level Security setup completed!');
  } catch (error) {
    console.error('Error setting up RLS:', error.message);
  }
}

// Run the setup
setupRLS()
  .then(() => {
    console.log('RLS setup script completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('RLS setup script failed:', error);
    process.exit(1);
  });
