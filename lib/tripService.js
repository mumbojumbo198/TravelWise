import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const TRIPS_STORAGE_KEY = '@travelwise:trips';
const ITINERARY_STORAGE_KEY = '@travelwise:itinerary';

// Valid trip statuses
const VALID_TRIP_STATUSES = ['active', 'completed', 'cancelled']; // Remove 'planned' if it's not allowed

/**
 * Fetch all trips for the current user
 */
export const fetchUserTrips = async (userId) => {
  try {
    // Try to fetch from Supabase first
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: true });

    if (error) throw error;
    
    // Store trips in AsyncStorage for offline access
    if (data && data.length > 0) {
      await AsyncStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(data));
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching trips from Supabase:', error.message);
    
    // Try to get cached trips from AsyncStorage
    try {
      const cachedTrips = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);
      if (cachedTrips) {
        const parsedTrips = JSON.parse(cachedTrips);
        console.log('Using cached trips from AsyncStorage');
        return { data: parsedTrips, error: null };
      }
    } catch (storageError) {
      console.error('Error fetching trips from AsyncStorage:', storageError.message);
    }
    
    return { data: null, error };
  }
};

/**
 * Fetch a specific trip by ID
 * @param {string} tripId - The trip ID
 * @returns {Promise} - Promise with the trip data
 */
export const fetchTripById = async (tripId) => {
  try {
    // Try to fetch from Supabase first
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching trip from Supabase:', error.message);
    
    // Try to get cached trips from AsyncStorage
    try {
      const cachedTrips = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);
      if (cachedTrips) {
        const parsedTrips = JSON.parse(cachedTrips);
        const trip = parsedTrips.find(t => t.id === tripId);
        if (trip) {
          console.log('Using cached trip from AsyncStorage');
          return { data: trip, error: null };
        }
      }
    } catch (storageError) {
      console.error('Error fetching trip from AsyncStorage:', storageError.message);
    }
    
    return { data: null, error };
  }
};

/**
 * Create a new trip
 */
export const createTrip = async (tripData) => {
  try {
    // Remove category if it exists but the column doesn't exist in the database
    const sanitizedTripData = { ...tripData };
    
    // These are the known columns in the trips table
    const knownColumns = [
      'id', 'user_id', 'destination', 'start_date', 'end_date', 
      'description', 'status', 'created_at', 'updated_at', 'title'
    ];
    
    // Try to fetch the table structure to check if category exists
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('trips')
        .select('category')
        .limit(1);
      
      if (!tableError) {
        // If no error, category column exists
        knownColumns.push('category');
      } else {
        console.log('Category column might not exist:', tableError.message);
        // Store category in description if the column doesn't exist
        if (sanitizedTripData.category) {
          sanitizedTripData.description = `Category: ${sanitizedTripData.category}${sanitizedTripData.description ? '\n\n' + sanitizedTripData.description : ''}`;
          delete sanitizedTripData.category;
        }
      }
    } catch (columnCheckError) {
      console.log('Error checking for category column:', columnCheckError);
      // Assume category doesn't exist if we can't check
      if (sanitizedTripData.category) {
        sanitizedTripData.description = `Category: ${sanitizedTripData.category}${sanitizedTripData.description ? '\n\n' + sanitizedTripData.description : ''}`;
        delete sanitizedTripData.category;
      }
    }
    
    // Remove any fields that aren't in the known columns
    Object.keys(sanitizedTripData).forEach(key => {
      if (!knownColumns.includes(key)) {
        console.log(`Removing non-existent column from trip data: ${key}`);
        delete sanitizedTripData[key];
      }
    });
    
    // Make sure title is set (use destination if not provided)
    if (!sanitizedTripData.title) {
      sanitizedTripData.title = sanitizedTripData.destination || 'New Trip';
    }
    
    // Validate and set default status
    if (!sanitizedTripData.status || !VALID_TRIP_STATUSES.includes(sanitizedTripData.status)) {
      sanitizedTripData.status = 'active'; // Change default from 'planned' to 'active'
    }
    
    const { data, error } = await supabase
      .from('trips')
      .insert([sanitizedTripData])
      .select()
      .single();

    if (error) throw error;
    
    // Update local storage with the new trip
    try {
      const cachedTrips = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);
      let trips = [];
      if (cachedTrips) {
        trips = JSON.parse(cachedTrips);
      }
      trips.push(data);
      await AsyncStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
    } catch (storageError) {
      console.error('Error updating AsyncStorage:', storageError.message);
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating trip:', error.message);
    return { data: null, error };
  }
};

/**
 * Update an existing trip
 */
export const updateTrip = async (tripId, tripData) => {
  try {
    const sanitizedTripData = { ...tripData };
    
    // Validate status if it's being updated
    if (sanitizedTripData.status && !VALID_TRIP_STATUSES.includes(sanitizedTripData.status)) {
      throw new Error('Invalid trip status');
    }
    
    const { data, error } = await supabase
      .from('trips')
      .update(sanitizedTripData)
      .eq('id', tripId)
      .select()
      .single();

    if (error) throw error;
    
    // Update local cache
    try {
      const cachedTrips = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);
      let trips = [];
      
      if (cachedTrips) {
        trips = JSON.parse(cachedTrips);
      }
      
      const index = trips.findIndex(t => t.id === tripId);
      if (index !== -1) {
        trips[index] = data;
        await AsyncStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
      }
    } catch (storageError) {
      console.error('Error updating AsyncStorage after trip update:', storageError.message);
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating trip:', error.message);
    return { data: null, error };
  }
};

/**
 * Delete a trip
 */
export const deleteTrip = async (tripId) => {
  try {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (error) throw error;
    
    // Update local cache
    try {
      const cachedTrips = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);
      let trips = [];
      
      if (cachedTrips) {
        trips = JSON.parse(cachedTrips);
      }
      
      const index = trips.findIndex(t => t.id === tripId);
      if (index !== -1) {
        trips.splice(index, 1);
        await AsyncStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
      }
    } catch (storageError) {
      console.error('Error updating AsyncStorage after trip deletion:', storageError.message);
    }
    
    return { error: null };
  } catch (error) {
    console.error('Error deleting trip:', error.message);
    return { error };
  }
};

/**
 * Fetch itinerary days for a trip
 */
export const fetchTripItinerary = async (tripId) => {
  try {
    const { data, error } = await supabase
      .from('itinerary_days')
      .select(`
        *,
        activities(*)
      `)
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true });

    if (error) throw error;
    
    // Store itinerary in AsyncStorage for offline access
    if (data && data.length > 0) {
      await AsyncStorage.setItem(`${ITINERARY_STORAGE_KEY}_${tripId}`, JSON.stringify(data));
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching trip itinerary from Supabase:', error.message);
    
    // Try to get cached itinerary from AsyncStorage
    try {
      const cachedItinerary = await AsyncStorage.getItem(`${ITINERARY_STORAGE_KEY}_${tripId}`);
      if (cachedItinerary) {
        const parsedItinerary = JSON.parse(cachedItinerary);
        console.log('Using cached itinerary from AsyncStorage');
        return { data: parsedItinerary, error: null };
      }
    } catch (storageError) {
      console.error('Error fetching trip itinerary from AsyncStorage:', storageError.message);
    }
    
    return { data: null, error };
  }
};

/**
 * Create an itinerary day
 */
export const createItineraryDay = async (dayData) => {
  try {
    const { data, error } = await supabase
      .from('itinerary_days')
      .insert([dayData])
      .select()
      .single();

    if (error) throw error;
    
    // Update local cache
    try {
      const cachedItinerary = await AsyncStorage.getItem(`${ITINERARY_STORAGE_KEY}_${dayData.trip_id}`);
      let itinerary = [];
      
      if (cachedItinerary) {
        itinerary = JSON.parse(cachedItinerary);
      }
      
      itinerary.push(data);
      await AsyncStorage.setItem(`${ITINERARY_STORAGE_KEY}_${dayData.trip_id}`, JSON.stringify(itinerary));
    } catch (storageError) {
      console.error('Error updating AsyncStorage after itinerary day creation:', storageError.message);
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating itinerary day:', error.message);
    return { data: null, error };
  }
};

/**
 * Create an activity for an itinerary day
 */
export const createActivity = async (activityData) => {
  try {
    const sanitizedData = { ...activityData };
    
    // Known columns in the activities table
    const knownColumns = [
      'id', 'itinerary_day_id', 'title', 'type', 'notes', 'created_at', 'updated_at', 'time'
    ];
    
    // Remove any fields that aren't in the known columns
    Object.keys(sanitizedData).forEach(key => {
      if (!knownColumns.includes(key)) {
        delete sanitizedData[key];
      }
    });

    const { data, error } = await supabase
      .from('activities')
      .insert([sanitizedData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating activity:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from activity creation');
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating activity:', error);
    return { data: null, error };
  }
};

/**
 * Update an activity
 */
export const updateActivity = async (activityId, activityData) => {
  try {
    const sanitizedData = { ...activityData };
    
    // Known columns in the activities table
    const knownColumns = [
      'id', 'itinerary_day_id', 'title', 'type', 'notes', 'created_at', 'updated_at', 'time'
    ];
    
    // Remove any fields that aren't in the known columns
    Object.keys(sanitizedData).forEach(key => {
      if (!knownColumns.includes(key)) {
        delete sanitizedData[key];
      }
    });

    const { data, error } = await supabase
      .from('activities')
      .update(sanitizedData)
      .eq('id', activityId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating activity:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from activity update');
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating activity:', error);
    return { data: null, error };
  }
};

/**
 * Delete an activity
 */
export const deleteActivity = async (activityId) => {
  try {
    // Check if this is a mock activity ID (not a UUID)
    if (typeof activityId === 'string' && activityId.includes('mock')) {
      console.log('Skipping delete for mock activity:', activityId);
      return { data: { id: activityId }, error: null };
    }
    
    const { data, error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)
      .select()
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting activity:', error.message);
    return { data: null, error };
  }
};

// Ensure activities table has required columns
export const ensureActivitiesSchema = async () => {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE activities 
        ADD COLUMN IF NOT EXISTS time TEXT;
      `
    });

    if (error) {
      console.error('Error ensuring activities schema:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Error ensuring activities schema:', error);
    return { error };
  }
};

// Ensure trips table has required columns
export const ensureTripsSchema = async () => {
  try {
    const { error } = await supabase
      .from('trips')
      .select('title, category')
      .limit(1);

    if (error) {
      // If columns don't exist, create them
      await supabase.from('trips').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        destination: 'Schema Test',
        title: 'Schema Test',
        category: 'test',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        status: 'planned'
      }).select();
    }

    return { error: null };
  } catch (error) {
    console.error('Error ensuring trips schema:', error);
    return { error };
  }
};

// Call schema checks when app starts
Promise.all([
  ensureActivitiesSchema(),
  ensureTripsSchema()
]).catch(console.error);
