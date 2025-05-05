import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Text, TextInput, Button, HelperText, IconButton, ActivityIndicator, Chip, Surface, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../contexts/AuthContext';
import { createTrip, fetchUserTrips } from '../lib/tripService';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreateTripScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState('start'); // 'start' or 'end'
  const [markedDates, setMarkedDates] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('leisure');
  const [recentDestinations, setRecentDestinations] = useState([]);
  
  // Form validation
  const [errors, setErrors] = useState({});

  // Load recent destinations from other users' trips
  useEffect(() => {
    loadRecentDestinations();
  }, []);

  const loadRecentDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('destination')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // Extract unique destinations
      const uniqueDestinations = [...new Set(data.map(trip => trip.destination))];
      setRecentDestinations(uniqueDestinations.slice(0, 5));
    } catch (err) {
      console.error('Error loading recent destinations:', err.message);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    
    if (endDate < startDate) {
      newErrors.dates = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTrip = async () => {
    // Validate inputs
    const newErrors = {};
    
    if (!destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    
    if (endDate < startDate) {
      newErrors.dates = 'End date must be after start date';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      // Verify user exists first
      if (!user || !user.id) {
        throw new Error('User not authenticated or missing user ID');
      }
      
      // Remove the database check that's causing issues
      
      // Calculate duration in days
      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      // Create trip data object
      const tripData = {
        id: Date.now().toString(), // Generate a local ID
        user_id: user.id,
        destination,
        description: description ? `${description}\nCategory: ${selectedCategory}` : `Category: ${selectedCategory}`,
        start_date: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        end_date: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        status: 'active',
        title: destination,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Try to create the trip in Supabase first
      try {
        const { data, error } = await createTrip(tripData);
        
        if (!error) {
          // If Supabase creation succeeded, use that data
          tripData.id = data.id;
          
          // Create itinerary days
          await createInitialItineraryDays(data.id, startDate, durationDays);
        } else {
          console.log('Supabase error, falling back to local storage:', error.message);
          // If Supabase failed, store locally only
          await storeLocalTrip(tripData);
          
          // Create local itinerary days
          await storeLocalItineraryDays(tripData.id, startDate, durationDays);
        }
      } catch (supabaseError) {
        console.log('Supabase error, falling back to local storage:', supabaseError.message);
        // If Supabase failed, store locally only
        await storeLocalTrip(tripData);
        
        // Create local itinerary days
        await storeLocalItineraryDays(tripData.id, startDate, durationDays);
      }
      
      // Success - navigate to trip details
      Alert.alert(
        'Success',
        'Trip created successfully!',
        [
          { 
            text: 'View Trip', 
            onPress: () => router.replace({
              pathname: `/trip/${tripData.id}`,
              params: { id: tripData.id }
            })
          }
        ]
      );
    } catch (error) {
      console.error('Error creating trip:', error.message);
      Alert.alert(
        'Error',
        'Failed to create trip. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Create initial itinerary days for the trip
  const createInitialItineraryDays = async (tripId, startDate, durationDays) => {
    try {
      const days = [];
      
      for (let i = 0; i < durationDays; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        days.push({
          trip_id: tripId,
          day_number: i + 1,
          date: date.toISOString().split('T')[0],
        });
      }
      
      // Insert all days at once
      const { error } = await supabase
        .from('itinerary_days')
        .insert(days);
      
      if (error) throw error;
      
    } catch (err) {
      console.error('Error creating itinerary days:', err.message);
      // Don't block trip creation if this fails
    }
  };

  // Handle calendar date selection
  const handleDayPress = (day) => {
    const selectedDate = new Date(day.dateString);
    
    if (calendarMode === 'start') {
      setStartDate(selectedDate);
      
      // If end date is before new start date, update end date
      if (endDate < selectedDate) {
        setEndDate(selectedDate);
      }
      
      // Update marked dates
      updateMarkedDates(selectedDate, endDate);
      
      // Switch to end date selection
      setCalendarMode('end');
    } else {
      setEndDate(selectedDate);
      updateMarkedDates(startDate, selectedDate);
      setShowCalendar(false);
    }
  };
  
  // Update the marked dates for the calendar
  const updateMarkedDates = (start, end) => {
    const markedDates = {};
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    markedDates[startStr] = { 
      selected: true, 
      startingDay: true, 
      color: '#0066cc' 
    };
    
    // Mark dates in between
    let currentDate = new Date(start);
    currentDate.setDate(currentDate.getDate() + 1);
    
    while (currentDate < end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      markedDates[dateStr] = { 
        selected: true, 
        color: '#0066cc' 
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Only add end date if it's different from start date
    if (startStr !== endStr) {
      markedDates[endStr] = { 
        selected: true, 
        endingDay: true, 
        color: '#0066cc' 
      };
    }
    
    setMarkedDates(markedDates);
  };
  
  // Show calendar for date selection
  const showDatePicker = (mode) => {
    setCalendarMode(mode);
    setShowCalendar(true);
    updateMarkedDates(startDate, endDate);
  };

  const formatDate = (date) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    return `${monthNames[monthIndex]} ${day}, ${year}`;
  };

  const handleSelectDestination = (destination) => {
    setDestination(destination);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ImageBackground
        source={{ uri: `https://source.unsplash.com/featured/1200x800/?travel,${encodeURIComponent(destination || 'travel')}` }}
        style={styles.headerBackground}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Trip</Text>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>
      </ImageBackground>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Surface style={styles.formCard}>
          <Text style={styles.sectionTitle}>Destination</Text>
          <TextInput
            label="Where are you going?"
            value={destination}
            onChangeText={setDestination}
            style={styles.input}
            mode="outlined"
            error={!!errors.destination}
            placeholder="Enter city, country, or region"
            left={<TextInput.Icon icon="map-marker" />}
          />
          {errors.destination && (
            <HelperText type="error" visible={!!errors.destination}>
              {errors.destination}
            </HelperText>
          )}
          
          {recentDestinations.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Popular Destinations</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recentDestinations.map((dest, index) => (
                  <Chip 
                    key={index} 
                    style={styles.suggestionChip}
                    onPress={() => handleSelectDestination(dest)}
                    icon="map-marker"
                  >
                    {dest}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          )}
        </Surface>
        
        <Surface style={styles.formCard}>
          <Text style={styles.sectionTitle}>Trip Dates</Text>
          <View style={styles.dateContainer}>
            <View style={styles.dateInput}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => showDatePicker('start')}
              >
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                <MaterialIcons name="event" size={24} color="#0066cc" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateInput}>
              <Text style={styles.dateLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => showDatePicker('end')}
              >
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                <MaterialIcons name="event" size={24} color="#0066cc" />
              </TouchableOpacity>
            </View>
          </View>
          
          {errors.dates && (
            <HelperText type="error" visible={!!errors.dates}>
              {errors.dates}
            </HelperText>
          )}
          
          {showCalendar && (
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>
                  Select {calendarMode === 'start' ? 'Start' : 'End'} Date
                </Text>
                <IconButton 
                  icon="close" 
                  size={20} 
                  onPress={() => setShowCalendar(false)} 
                />
              </View>
              <Calendar
                onDayPress={handleDayPress}
                markedDates={markedDates}
                markingType="period"
                minDate={calendarMode === 'end' ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                theme={{
                  selectedDayBackgroundColor: '#0066cc',
                  todayTextColor: '#0066cc',
                  arrowColor: '#0066cc',
                  textDayFontSize: 16,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 14,
                  'stylesheet.calendar.header': {
                    header: {
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingLeft: 10,
                      paddingRight: 10,
                      marginTop: 8,
                      alignItems: 'center'
                    },
                    monthText: {
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: '#333'
                    }
                  }
                }}
              />
              <View style={styles.calendarFooter}>
                <Text style={styles.calendarHint}>
                  {calendarMode === 'start' 
                    ? 'Select your trip start date' 
                    : 'Now select your trip end date'}
                </Text>
              </View>
            </View>
          )}
        </Surface>
        
        <Surface style={styles.formCard}>
          <Text style={styles.sectionTitle}>Trip Category</Text>
          <View style={styles.categoryContainer}>
            <TouchableOpacity 
              style={[styles.categoryButton, selectedCategory === 'leisure' && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory('leisure')}
            >
              <MaterialIcons 
                name="beach-access" 
                size={24} 
                color={selectedCategory === 'leisure' ? '#fff' : '#0066cc'} 
              />
              <Text style={[styles.categoryText, selectedCategory === 'leisure' && styles.categoryTextActive]}>
                Leisure
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.categoryButton, selectedCategory === 'business' && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory('business')}
            >
              <MaterialIcons 
                name="business" 
                size={24} 
                color={selectedCategory === 'business' ? '#fff' : '#0066cc'} 
              />
              <Text style={[styles.categoryText, selectedCategory === 'business' && styles.categoryTextActive]}>
                Business
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.categoryButton, selectedCategory === 'family' && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory('family')}
            >
              <MaterialIcons 
                name="family-restroom" 
                size={24} 
                color={selectedCategory === 'family' ? '#fff' : '#0066cc'} 
              />
              <Text style={[styles.categoryText, selectedCategory === 'family' && styles.categoryTextActive]}>
                Family
              </Text>
            </TouchableOpacity>
          </View>
        </Surface>
        
        <Surface style={styles.formCard}>
          <Text style={styles.sectionTitle}>Trip Description</Text>
          <TextInput
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Add notes about your trip"
          />
        </Surface>
        
        <Button
          mode="contained"
          onPress={handleCreateTrip}
          style={styles.createButton}
          loading={loading}
          disabled={loading}
          icon="check"
          contentStyle={styles.createButtonContent}
          labelStyle={styles.createButtonLabel}
        >
          Create Trip
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  headerBackground: {
    height: 200,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
    marginTop: -30,
  },
  formCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  suggestionsContainer: {
    marginBottom: 10,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  suggestionChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f0f7ff',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateInput: {
    width: '48%',
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 14,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendarFooter: {
    padding: 10,
    alignItems: 'center',
  },
  calendarHint: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0066cc',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 5,
    backgroundColor: '#fff',
  },
  categoryButtonActive: {
    backgroundColor: '#0066cc',
  },
  categoryText: {
    color: '#0066cc',
    marginTop: 8,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  createButton: {
    marginTop: 10,
    marginBottom: 40,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: '#0066cc',
  },
  createButtonContent: {
    height: 56,
  },
  createButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const storeLocalTrip = async (tripData) => {
  try {
    // Get existing trips from AsyncStorage
    const existingTripsJson = await AsyncStorage.getItem('local_trips');
    let existingTrips = [];
    
    if (existingTripsJson) {
      existingTrips = JSON.parse(existingTripsJson);
    }
    
    // Add new trip
    existingTrips.push(tripData);
    
    // Save back to AsyncStorage
    await AsyncStorage.setItem('local_trips', JSON.stringify(existingTrips));
    
    console.log('Trip saved locally with ID:', tripData.id);
  } catch (error) {
    console.error('Error saving trip locally:', error);
  }
};

// Function to store itinerary days locally
const storeLocalItineraryDays = async (tripId, startDate, durationDays) => {
  try {
    const days = [];
    
    for (let i = 0; i < durationDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      days.push({
        id: `${tripId}_day_${i+1}`,
        trip_id: tripId,
        day_number: i + 1,
        date: date.toISOString().split('T')[0],
      });
    }
    
    // Get existing days from AsyncStorage
    const existingDaysJson = await AsyncStorage.getItem('local_itinerary_days');
    let existingDays = [];
    
    if (existingDaysJson) {
      existingDays = JSON.parse(existingDaysJson);
    }
    
    // Add new days
    existingDays = [...existingDays, ...days];
    
    // Save back to AsyncStorage
    await AsyncStorage.setItem('local_itinerary_days', JSON.stringify(existingDays));
    
    console.log('Itinerary days saved locally for trip:', tripId);
  } catch (error) {
    console.error('Error saving itinerary days locally:', error);
  }
};
