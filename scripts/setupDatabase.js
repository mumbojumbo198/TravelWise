// This script sets up the necessary database tables for TravelWise
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with direct credentials
const supabaseUrl = 'https://jutkmmspogewqjfgrwdr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dGttbXNwb2dld3FqZmdyd2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MTYxODUsImV4cCI6MjA1Nzk5MjE4NX0.NBkYzC_xx7T31wqjBuwnnNwooM5GQ4vBvdIq3Hxj4LA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('Setting up TravelWise database...');
  
  try {
    // Create exec_sql function if it doesn't exist
    console.log('Creating exec_sql function...');
    const { error: createFunctionError } = await supabase
      .rpc('exec_sql', {
        sql: `
          DO $$ 
          BEGIN
            CREATE OR REPLACE FUNCTION exec_sql(sql text)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $func$
            BEGIN
              EXECUTE sql;
            END;
            $func$;
          EXCEPTION 
            WHEN others THEN null;
          END $$;
        `
      });

    if (createFunctionError) {
      console.error('Error creating exec_sql function:', createFunctionError.message);
      // Try direct SQL execution if RPC fails
      const { error: directError } = await supabase.from('rpc').select('*').eq('name', 'exec_sql');
      if (directError) {
        console.error('Could not verify exec_sql function:', directError.message);
      }
    } else {
      console.log('exec_sql function created or already exists.');
    }

    // Check if users table exists
    const { data: usersTable, error: usersTableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersTableError && usersTableError.message.includes('does not exist')) {
      console.log('Creating users table...');
      
      // Create users table using SQL
      const { error: createUsersError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            email TEXT NOT NULL,
            username TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createUsersError) {
        console.error('Error creating users table:', createUsersError.message);
      } else {
        console.log('Users table created successfully!');
      }
    } else {
      console.log('Users table already exists.');
    }
    
    // Check if trips table exists
    const { data: tripsTable, error: tripsTableError } = await supabase
      .from('trips')
      .select('*')
      .limit(1);
    
    if (tripsTableError && tripsTableError.message.includes('does not exist')) {
      console.log('Creating trips table...');
      
      // Create trips table using SQL
      const { error: createTripsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS trips (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            destination TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            status TEXT DEFAULT 'planned',
            category TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createTripsError) {
        console.error('Error creating trips table:', createTripsError.message);
      } else {
        console.log('Trips table created successfully!');
      }
    } else {
      console.log('Trips table already exists.');
      
      // Add title column if it doesn't exist (for existing tables)
      const { error: alterTripsError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE trips 
          ADD COLUMN IF NOT EXISTS title TEXT;
        `
      });
      
      if (alterTripsError) {
        console.error('Error adding title column to trips table:', alterTripsError.message);
      } else {
        console.log('Title column added to trips table (if it didn\'t exist).');
      }

      // Check if category column exists in trips table
      const { error: alterTripsCategoryError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE trips 
          ADD COLUMN IF NOT EXISTS category TEXT;
        `
      });
      
      if (alterTripsCategoryError) {
        console.error('Error adding category column to trips table:', alterTripsCategoryError.message);
      } else {
        console.log('Category column added to trips table (if it didn\'t exist).');
      }
    }
    
    // Check if itinerary_days table exists
    const { data: itineraryDaysTable, error: itineraryDaysTableError } = await supabase
      .from('itinerary_days')
      .select('*')
      .limit(1);
    
    if (itineraryDaysTableError && itineraryDaysTableError.message.includes('does not exist')) {
      console.log('Creating itinerary_days table...');
      
      // Create itinerary_days table using SQL
      const { error: createItineraryDaysError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS itinerary_days (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
            day_number INTEGER NOT NULL,
            date DATE NOT NULL,
            title TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createItineraryDaysError) {
        console.error('Error creating itinerary_days table:', createItineraryDaysError.message);
      } else {
        console.log('Itinerary days table created successfully!');
      }
    } else {
      console.log('Itinerary days table already exists.');
    }
    
    // Check if activities table exists
    const { data: activitiesTable, error: activitiesTableError } = await supabase
      .from('activities')
      .select('*')
      .limit(1);
    
    if (activitiesTableError && activitiesTableError.message.includes('does not exist')) {
      console.log('Creating activities table...');
      
      // Create activities table using SQL
      const { error: createActivitiesError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS activities (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            itinerary_day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            time TEXT,
            type TEXT DEFAULT 'activity',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createActivitiesError) {
        console.error('Error creating activities table:', createActivitiesError.message);
      } else {
        console.log('Activities table created successfully!');
      }
    } else {
      console.log('Activities table already exists.');
    }
    
    console.log('Database setup completed!');
  } catch (error) {
    console.error('Error setting up database:', error.message);
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('Setup script completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Setup script failed:', error);
    process.exit(1);
  });
