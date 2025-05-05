import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ImageBackground, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Text, Card, Title, Paragraph, Chip, Button, Divider, IconButton, Surface, ActivityIndicator, Dialog, Portal, TextInput, Modal } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { fetchUserTrips, fetchTripItinerary, createItineraryDay, createActivity, updateActivity, deleteActivity } from '../../lib/tripService';
import { LinearGradient } from 'expo-linear-gradient';

// Mock data for itineraries
const mockItineraries = [
  {
    id: 'mock1',
    destination: 'Paris, France',
    start_date: '2025-05-15',
    end_date: '2025-05-22',
    description: 'Romantic getaway\n\nCategory: leisure',
    status: 'planned',
    image: 'https://source.unsplash.com/featured/600x400/?paris,eiffel',
    days: [
      {
        id: 'day1-mock1',
        day_number: 1,
        date: '2025-05-15',
        title: 'Day 1 - Arrival',
        activities: [
          { id: 'act1-day1-mock1', time: '09:00 AM', title: 'Arrival at Charles de Gaulle Airport', type: 'transport', notes: 'Terminal 2E, Flight AF1234' },
          { id: 'act2-day1-mock1', time: '11:30 AM', title: 'Check-in at Hotel Le Marais', type: 'accommodation', notes: 'Reservation #12345' },
          { id: 'act3-day1-mock1', time: '01:00 PM', title: 'Lunch at Café de Flore', type: 'food', notes: 'Famous historic café' },
          { id: 'act4-day1-mock1', time: '03:00 PM', title: 'Explore Saint-Germain-des-Prés', type: 'activity', notes: 'Charming neighborhood with boutiques' },
          { id: 'act5-day1-mock1', time: '07:00 PM', title: 'Dinner at Le Comptoir', type: 'food', notes: 'Reservation recommended' },
        ]
      },
      {
        id: 'day2-mock1',
        day_number: 2,
        date: '2025-05-16',
        title: 'Day 2 - Museums',
        activities: [
          { id: 'act1-day2-mock1', time: '08:30 AM', title: 'Breakfast at Hotel', type: 'food', notes: 'Continental breakfast included' },
          { id: 'act2-day2-mock1', time: '10:00 AM', title: 'Visit the Louvre Museum', type: 'activity', notes: 'Book tickets in advance, see Mona Lisa' },
          { id: 'act3-day2-mock1', time: '01:30 PM', title: 'Lunch at Angelina', type: 'food', notes: 'Famous for hot chocolate' },
          { id: 'act4-day2-mock1', time: '03:00 PM', title: 'Walk through Tuileries Garden', type: 'activity', notes: 'Beautiful formal garden' },
          { id: 'act5-day2-mock1', time: '04:30 PM', title: 'Shopping on Champs-Élysées', type: 'activity', notes: 'Luxury shopping avenue' },
          { id: 'act6-day2-mock1', time: '08:00 PM', title: 'Dinner at Le Jules Verne (Eiffel Tower)', type: 'food', notes: 'Reservation required months in advance' },
        ]
      },
    ]
  },
  {
    id: 'mock2',
    destination: 'Tokyo, Japan',
    start_date: '2025-06-10',
    end_date: '2025-06-18',
    description: 'Exploring Japanese culture\n\nCategory: leisure',
    status: 'planned',
    image: 'https://source.unsplash.com/featured/600x400/?tokyo,japan',
    days: [
      {
        id: 'day1-mock2',
        day_number: 1,
        date: '2025-06-10',
        title: 'Day 1 - Arrival',
        activities: [
          { id: 'act1-day1-mock2', time: '10:00 AM', title: 'Arrival at Narita Airport', type: 'transport', notes: 'Terminal 1, Flight JL123' },
          { id: 'act2-day1-mock2', time: '01:00 PM', title: 'Check-in at Hotel Metropolitan', type: 'accommodation', notes: 'Reservation #67890' },
          { id: 'act3-day1-mock2', time: '03:00 PM', title: 'Visit Senso-ji Temple', type: 'activity', notes: 'Ancient Buddhist temple' },
          { id: 'act4-day1-mock2', time: '06:00 PM', title: 'Dinner at Sushi Dai', type: 'food', notes: 'Famous sushi restaurant' },
        ]
      },
      {
        id: 'day2-mock2',
        day_number: 2,
        date: '2025-06-11',
        title: 'Day 2 - City Exploration',
        activities: [
          { id: 'act1-day2-mock2', time: '08:00 AM', title: 'Breakfast at Hotel', type: 'food', notes: 'Buffet breakfast' },
          { id: 'act2-day2-mock2', time: '09:30 AM', title: 'Tokyo Skytree', type: 'activity', notes: 'Tallest tower in Japan' },
          { id: 'act3-day2-mock2', time: '12:30 PM', title: 'Lunch at Ichiran Ramen', type: 'food', notes: 'Famous ramen chain' },
          { id: 'act4-day2-mock2', time: '02:00 PM', title: 'Explore Akihabara', type: 'activity', notes: 'Electronics and anime district' },
          { id: 'act5-day2-mock2', time: '07:00 PM', title: 'Dinner at Robot Restaurant', type: 'food', notes: 'Unique dining experience' },
        ]
      },
    ]
  },
  {
    id: 'mock3',
    destination: 'New York City, USA',
    start_date: '2025-07-20',
    end_date: '2025-07-26',
    description: 'Business trip with weekend exploration\n\nCategory: business',
    status: 'planned',
    image: 'https://source.unsplash.com/featured/600x400/?newyork,skyline',
    days: [
      {
        id: 'day1-mock3',
        day_number: 1,
        date: '2025-07-20',
        title: 'Day 1 - Arrival',
        activities: [
          { id: 'act1-day1-mock3', time: '11:00 AM', title: 'Arrival at JFK Airport', type: 'transport', notes: 'Terminal 4, Flight DL456' },
          { id: 'act2-day1-mock3', time: '01:30 PM', title: 'Check-in at Marriott Marquis', type: 'accommodation', notes: 'Times Square location' },
          { id: 'act3-day1-mock3', time: '03:00 PM', title: 'Walk around Times Square', type: 'activity', notes: 'Iconic NYC location' },
          { id: 'act4-day1-mock3', time: '07:00 PM', title: 'Dinner at Carmine\'s', type: 'food', notes: 'Italian family-style restaurant' },
        ]
      },
      {
        id: 'day2-mock3',
        day_number: 2,
        date: '2025-07-21',
        title: 'Day 2 - Business Meetings',
        activities: [
          { id: 'act1-day2-mock3', time: '08:00 AM', title: 'Breakfast at Hotel', type: 'food', notes: 'Room service' },
          { id: 'act2-day2-mock3', time: '10:00 AM', title: 'Meeting with Clients', type: 'activity', notes: 'Midtown office' },
          { id: 'act3-day2-mock3', time: '12:30 PM', title: 'Business Lunch at The Capital Grille', type: 'food', notes: 'Expense account' },
          { id: 'act4-day2-mock3', time: '02:00 PM', title: 'Afternoon Meetings', type: 'activity', notes: 'Financial District' },
          { id: 'act5-day2-mock3', time: '07:00 PM', title: 'Dinner with Partners', type: 'food', notes: 'Peter Luger Steakhouse' },
        ]
      },
    ]
  }
];

export default function ItineraryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userTrips, setUserTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [itineraryDays, setItineraryDays] = useState([]);
  const [activeDay, setActiveDay] = useState(null);
  const [activeDayData, setActiveDayData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Modal states
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [tripSelectorVisible, setTripSelectorVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  // Form states
  const [editingActivity, setEditingActivity] = useState(null);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityTime, setActivityTime] = useState('');
  const [activityType, setActivityType] = useState('activity');
  const [activityNotes, setActivityNotes] = useState('');
  const [dayDate, setDayDate] = useState('');
  const [dayNumber, setDayNumber] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);

  // Add new state for sorting and view options
  const [sortBy, setSortBy] = useState('time'); // 'time' or 'type'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'timeline'
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'morning', 'afternoon', 'evening'

  useEffect(() => {
    if (user) {
      // Use mock data instead of loading from database
      setUserTrips(mockItineraries);
      setSelectedTrip(mockItineraries[0]);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedTrip) {
      // Use mock data for itinerary days
      setItineraryDays(selectedTrip.days || []);
    }
  }, [selectedTrip]);

  useEffect(() => {
    if (itineraryDays.length > 0 && !activeDay) {
      setActiveDay(itineraryDays[0].id);
    }
  }, [itineraryDays]);

  useEffect(() => {
    if (activeDay) {
      const dayData = itineraryDays.find(day => day.id === activeDay);
      setActiveDayData(dayData);
    }
  }, [activeDay, itineraryDays]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = [];

    // Search through all trips and their activities
    mockItineraries.forEach(trip => {
      // Check if query matches trip destination
      if (trip.destination.toLowerCase().includes(query)) {
        results.push({
          type: 'trip',
          id: trip.id,
          title: trip.destination,
          subtitle: `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`,
          image: trip.image
        });
      }

      // Search through days and activities
      trip.days.forEach(day => {
        day.activities.forEach(activity => {
          if (
            activity.title.toLowerCase().includes(query) ||
            (activity.notes && activity.notes.toLowerCase().includes(query))
          ) {
            results.push({
              type: 'activity',
              id: activity.id,
              title: activity.title,
              subtitle: `${formatDate(day.date)} at ${activity.time}`,
              tripId: trip.id,
              dayId: day.id,
              image: trip.image
            });
          }
        });
      });
    });

    setSearchResults(results);
    setShowSearchResults(true);
  };

  const handleSearchResultPress = (item) => {
    setShowSearchResults(false);
    setSearchQuery('');

    if (item.type === 'trip') {
      const trip = mockItineraries.find(t => t.id === item.id);
      if (trip) {
        setSelectedTrip(trip);
      }
    } else if (item.type === 'activity') {
      const trip = mockItineraries.find(t => t.id === item.tripId);
      if (trip) {
        setSelectedTrip(trip);
        setActiveDay(item.dayId);
      }
    }
  };

  const loadUserTrips = async () => {
    try {
      setLoading(true);
      const { data, error } = await fetchUserTrips(user.id);

      if (error) throw error;

      setUserTrips(data || []);

      // If there are trips, select the first one
      if (data && data.length > 0) {
        setSelectedTrip(data[0]);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching trips:', error.message);
      Alert.alert('Error', 'Failed to load your trips. Please try again.');
      setLoading(false);
    }
  };

  const loadTripItinerary = async () => {
    try {
      setLoading(true);
      const { data, error } = await fetchTripItinerary(selectedTrip.id);

      if (error) throw error;

      // Sort days by day_number
      const sortedDays = (data || []).sort((a, b) => a.day_number - b.day_number);
      setItineraryDays(sortedDays);

      // Reset active day
      if (sortedDays.length > 0) {
        setActiveDay(sortedDays[0].id);
      } else {
        setActiveDay(null);
        setActiveDayData(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching itinerary:', error.message);
      Alert.alert('Error', 'Failed to load itinerary. Please try again.');
      setLoading(false);
    }
  };

  const handleAddDay = async () => {
    // Format date properly
    const formattedDate = new Date().toISOString().split('T')[0];

    // Calculate next day number
    const nextDayNumber = itineraryDays.length > 0
      ? Math.max(...itineraryDays.map(day => day.day_number)) + 1
      : 1;

    const newDay = {
      trip_id: selectedTrip.id,
      day_number: nextDayNumber,
      date: formattedDate,
      title: `Day ${nextDayNumber}`
    };

    try {
      setLoading(true);
      const { data, error } = await createItineraryDay(newDay);

      if (error) throw error;

      // Add the new day to the state
      setItineraryDays(prev => [...prev, { ...data, activities: [] }]);
      setActiveDay(data.id);
      setLoading(false);

      // Show success message
      Alert.alert('Success', 'New day added to your itinerary!');
    } catch (error) {
      console.error('Error adding day:', error.message);
      Alert.alert('Error', 'Failed to add day. Please try again.');
      setLoading(false);
    }
  };

  const handleAddActivity = async () => {
    if (!activityTitle.trim()) {
      Alert.alert('Error', 'Please enter an activity title');
      return;
    }

    if (!activeDay) {
      Alert.alert('Error', 'Please select a day first');
      return;
    }

    const newActivity = {
      itinerary_day_id: activeDay,
      title: activityTitle.trim(),
      time: activityTime || null,
      type: activityType,
      notes: activityNotes ? activityNotes.trim() : null
    };

    try {
      setLoading(true);

      // If editing, update existing activity
      if (editingActivity) {
        const { data, error } = await updateActivity(editingActivity.id, newActivity);

        if (error) {
          console.error('Error updating activity:', error);
          throw new Error('Failed to update activity: ' + error.message);
        }

        // Update the activity in the state
        setItineraryDays(prev =>
          prev.map(day => {
            if (day.id === activeDay) {
              return {
                ...day,
                activities: day.activities.map(act =>
                  act.id === editingActivity.id ? data : act
                )
              };
            }
            return day;
          })
        );
      } else {
        // Create new activity
        const { data, error } = await createActivity(newActivity);

        if (error) {
          console.error('Error creating activity:', error);
          throw new Error('Failed to create activity: ' + error.message);
        }

        // Add the new activity to the state
        setItineraryDays(prev =>
          prev.map(day => {
            if (day.id === activeDay) {
              return {
                ...day,
                activities: [...(day.activities || []), data]
              };
            }
            return day;
          })
        );
      }

      // Reset form and close modal
      resetActivityForm();
      setActivityModalVisible(false);

      // Show success message
      Alert.alert('Success', editingActivity ? 'Activity updated successfully!' : 'Activity added successfully!');
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert('Error', error.message || 'Failed to save activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setActivityTitle(activity.title);
    setActivityTime(activity.time || '');
    setActivityType(activity.type || 'activity');
    setActivityNotes(activity.notes || '');
    setActivityModalVisible(true);
  };

  const handleDeleteActivity = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);
      const { error } = await deleteActivity(itemToDelete.id);

      if (error) throw error;

      // Remove the activity from the state
      setItineraryDays(prev =>
        prev.map(day => {
          if (day.id === activeDay) {
            return {
              ...day,
              activities: day.activities.filter(act => act.id !== itemToDelete.id)
            };
          }
          return day;
        })
      );

      setDeleteConfirmVisible(false);
      setItemToDelete(null);
      setLoading(false);

      // Show success message
      Alert.alert('Success', 'Activity deleted successfully!');
    } catch (error) {
      console.error('Error deleting activity:', error.message);
      Alert.alert('Error', 'Failed to delete activity. Please try again.');
      setLoading(false);
    }
  };

  const confirmDeleteActivity = (activity) => {
    setItemToDelete(activity);
    setDeleteConfirmVisible(true);
  };

  const resetActivityForm = () => {
    setEditingActivity(null);
    setActivityTitle('');
    setActivityTime('');
    setActivityType('activity');
    setActivityNotes('');
  };

  // Function to get icon based on activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'transport': return 'flight';
      case 'accommodation': return 'hotel';
      case 'food': return 'restaurant';
      case 'activity': return 'event';
      default: return 'place';
    }
  };

  // Function to get color based on activity type
  const getActivityColor = (type) => {
    switch (type) {
      case 'transport': return '#5c6bc0';
      case 'accommodation': return '#26a69a';
      case 'food': return '#f57c00';
      case 'activity': return '#7cb342';
      default: return '#757575';
    }
  };

  // Add time filtering function
  const filterActivitiesByTime = (activities) => {
    if (timeFilter === 'all') return activities;

    return activities.filter(activity => {
      if (!activity.time) return false;
      const hour = parseInt(activity.time.split(':')[0]);
      switch (timeFilter) {
        case 'morning': return hour >= 5 && hour < 12;
        case 'afternoon': return hour >= 12 && hour < 17;
        case 'evening': return hour >= 17 || hour < 5;
        default: return true;
      }
    });
  };

  // Enhanced sorting function
  const sortActivities = (activities) => {
    if (!activities) return [];

    return [...activities].sort((a, b) => {
      if (sortBy === 'time') {
        const timeA = a.time ? new Date(`2000/01/01 ${a.time}`).getTime() : Number.MAX_SAFE_INTEGER;
        const timeB = b.time ? new Date(`2000/01/01 ${b.time}`).getTime() : Number.MAX_SAFE_INTEGER;
        return timeA - timeB;
      } else {
        // Sort by type and then by time within each type
        if (a.type !== b.type) {
          const typeOrder = { transport: 1, accommodation: 2, food: 3, activity: 4 };
          return typeOrder[a.type] - typeOrder[b.type];
        }
        const timeA = a.time ? new Date(`2000/01/01 ${a.time}`).getTime() : Number.MAX_SAFE_INTEGER;
        const timeB = b.time ? new Date(`2000/01/01 ${b.time}`).getTime() : Number.MAX_SAFE_INTEGER;
        return timeA - timeB;
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ImageBackground
        source={{ uri: selectedTrip ? 
          `https://source.unsplash.com/featured/1200x800/?travel,${encodeURIComponent(selectedTrip.destination)}` : 
          'https://source.unsplash.com/featured/1200x800/?travel'
        }}
        style={styles.headerBackground}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Itinerary Planner</Text>
            <View style={styles.searchContainer}>
              <TextInput
                placeholder="Search destinations, activities..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.trim().length >= 2) {
                    handleSearch();
                  } else {
                    setShowSearchResults(false);
                  }
                }}
                style={styles.searchInput}
                mode="outlined"
                right={<TextInput.Icon icon="magnify" />}
                onSubmitEditing={handleSearch}
              />
            </View>
            <TouchableOpacity 
              onPress={() => setTripSelectorVisible(true)} 
              style={styles.tripSelector}
            >
              <Text style={styles.tripSelectorText}>
                {selectedTrip ? selectedTrip.destination : 'Select Trip'} 
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>

      {showSearchResults ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.searchResultItem}
              onPress={() => handleSearchResultPress(item)}
            >
              <ImageBackground
                source={{ uri: item.image }}
                style={styles.searchResultImage}
                imageStyle={{ borderRadius: 8 }}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.searchResultGradient}
                >
                  <View style={styles.searchResultContent}>
                    <Text style={styles.searchResultTitle}>{item.title}</Text>
                    <Text style={styles.searchResultSubtitle}>{item.subtitle}</Text>
                    <Chip 
                      style={styles.searchResultTypeChip}
                      textStyle={styles.searchResultTypeText}
                    >
                      {item.type === 'trip' ? 'Trip' : 'Activity'}
                    </Chip>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.searchResultsContainer}
        />
      ) : (
        loading && !itineraryDays.length ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Loading your itinerary...</Text>
          </View>
        ) : (
          selectedTrip ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysContainer}>
                {itineraryDays.map(day => (
                  <Chip
                    key={day.id}
                    selected={activeDay === day.id}
                    onPress={() => setActiveDay(day.id)}
                    style={[styles.dayChip, activeDay === day.id && styles.activeDayChip]}
                    textStyle={[styles.dayChipText, activeDay === day.id && styles.activeDayChipText]}
                  >
                    Day {day.day_number} • {formatDate(day.date)}
                  </Chip>
                ))}
                <Chip
                  icon="plus"
                  onPress={handleAddDay}
                  style={styles.addDayChip}
                >
                  Add Day
                </Chip>
              </ScrollView>

              {activeDayData && (
                <View style={styles.controlsContainer}>
                  <View style={styles.filterControls}>
                    <Text style={styles.controlLabel}>Filter by:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <Chip
                        selected={timeFilter === 'all'}
                        onPress={() => setTimeFilter('all')}
                        style={styles.filterChip}
                      >
                        All
                      </Chip>
                      <Chip
                        selected={timeFilter === 'morning'}
                        onPress={() => setTimeFilter('morning')}
                        style={styles.filterChip}
                      >
                        Morning
                      </Chip>
                      <Chip
                        selected={timeFilter === 'afternoon'}
                        onPress={() => setTimeFilter('afternoon')}
                        style={styles.filterChip}
                      >
                        Afternoon
                      </Chip>
                      <Chip
                        selected={timeFilter === 'evening'}
                        onPress={() => setTimeFilter('evening')}
                        style={styles.filterChip}
                      >
                        Evening
                      </Chip>
                    </ScrollView>
                  </View>
                  
                  <View style={styles.sortControls}>
                    <Text style={styles.controlLabel}>Sort by:</Text>
                    <View style={styles.buttonGroup}>
                      <Button
                        mode={sortBy === 'time' ? 'contained' : 'outlined'}
                        onPress={() => setSortBy('time')}
                        style={styles.sortButton}
                      >
                        Time
                      </Button>
                      <Button
                        mode={sortBy === 'type' ? 'contained' : 'outlined'}
                        onPress={() => setSortBy('type')}
                        style={styles.sortButton}
                      >
                        Type
                      </Button>
                    </View>
                  </View>
                  
                  <View style={styles.viewControls}>
                    <Text style={styles.controlLabel}>View:</Text>
                    <View style={styles.buttonGroup}>
                      <IconButton
                        icon="format-list-bulleted"
                        selected={viewMode === 'list'}
                        onPress={() => setViewMode('list')}
                        size={24}
                      />
                      <IconButton
                        icon="timeline"
                        selected={viewMode === 'timeline'}
                        onPress={() => setViewMode('timeline')}
                        size={24}
                      />
                    </View>
                  </View>
                </View>
              )}

              {activeDayData ? (
                <ScrollView style={styles.activitiesContainer}>
                  {filterActivitiesByTime(sortActivities(activeDayData.activities)).length > 0 ? (
                    filterActivitiesByTime(sortActivities(activeDayData.activities))
                      .map((activity, index) => (
                        <View key={activity.id} style={styles.activityItem}>
                          <View style={styles.activityTimeContainer}>
                            <Text style={styles.activityTime}>{activity.time || 'Any time'}</Text>
                            {index < activeDayData.activities.length - 1 && (
                              <View style={styles.timeConnector} />
                            )}
                          </View>

                          <Surface style={styles.activityContent}>
                            <View style={[styles.activityIconContainer, { backgroundColor: getActivityColor(activity.type) }]}>
                              <MaterialIcons name={getActivityIcon(activity.type)} size={24} color="#fff" />
                            </View>
                            <View style={styles.activityDetails}>
                              <Text style={styles.activityTitle}>{activity.title}</Text>
                              <Text style={styles.activityType}>{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</Text>
                              {activity.notes && (
                                <Text style={styles.activityNotes}>{activity.notes}</Text>
                              )}
                            </View>
                            <View style={styles.activityActions}>
                              <IconButton
                                icon="pencil"
                                size={20}
                                onPress={() => handleEditActivity(activity)}
                              />
                              <IconButton
                                icon="delete"
                                size={20}
                                iconColor="#ff3b30"
                                onPress={() => confirmDeleteActivity(activity)}
                              />
                            </View>
                          </Surface>
                        </View>
                      ))
                  ) : (
                    <View style={styles.emptyState}>
                      <MaterialIcons name="event-note" size={64} color="#ccc" />
                      <Text style={styles.emptyStateText}>No activities yet</Text>
                      <Text style={styles.emptyStateSubtext}>Add activities to plan your day</Text>
                    </View>
                  )}

                  <Button 
                    mode="contained" 
                    icon="plus" 
                    onPress={() => {
                      resetActivityForm();
                      setActivityModalVisible(true);
                    }}
                    style={styles.addActivityButton}
                  >
                    Add Activity
                  </Button>
                </ScrollView>
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons name="calendar-today" size={64} color="#ccc" />
                  <Text style={styles.emptyStateText}>No days in your itinerary</Text>
                  <Text style={styles.emptyStateSubtext}>Add a day to start planning</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="flight" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>No trips found</Text>
              <Text style={styles.emptyStateSubtext}>Create a trip to start planning your itinerary</Text>
              <Button 
                mode="contained" 
                icon="plus" 
                onPress={() => router.push('/create-trip')}
                style={styles.createTripButton}
              >
                Create Trip
              </Button>
            </View>
          )
        )
      )}

      {/* Activity Modal */}
      <Portal>
        <Modal
          visible={activityModalVisible}
          onDismiss={() => setActivityModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>
            {editingActivity ? 'Edit Activity' : 'Add Activity'}
          </Text>

          <TextInput
            label="Activity Title"
            value={activityTitle}
            onChangeText={setActivityTitle}
            style={styles.modalInput}
            mode="outlined"
          />

          <TextInput
            label="Time (e.g. 2:30 PM)"
            value={activityTime}
            onChangeText={setActivityTime}
            style={styles.modalInput}
            mode="outlined"
            placeholder="Any time"
          />

          <Text style={styles.modalLabel}>Activity Type</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity 
              style={[styles.typeButton, activityType === 'activity' && styles.typeButtonActive]}
              onPress={() => setActivityType('activity')}
            >
              <MaterialIcons 
                name="event" 
                size={24} 
                color={activityType === 'activity' ? '#fff' : '#7cb342'} 
              />
              <Text style={[styles.typeText, activityType === 'activity' && styles.typeTextActive]}>
                Activity
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.typeButton, activityType === 'food' && styles.typeButtonActive]}
              onPress={() => setActivityType('food')}
            >
              <MaterialIcons 
                name="restaurant" 
                size={24} 
                color={activityType === 'food' ? '#fff' : '#f57c00'} 
              />
              <Text style={[styles.typeText, activityType === 'food' && styles.typeTextActive]}>
                Food
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.typeButton, activityType === 'transport' && styles.typeButtonActive]}
              onPress={() => setActivityType('transport')}
            >
              <MaterialIcons 
                name="flight" 
                size={24} 
                color={activityType === 'transport' ? '#fff' : '#5c6bc0'} 
              />
              <Text style={[styles.typeText, activityType === 'transport' && styles.typeTextActive]}>
                Transport
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.typeButton, activityType === 'accommodation' && styles.typeButtonActive]}
              onPress={() => setActivityType('accommodation')}
            >
              <MaterialIcons 
                name="hotel" 
                size={24} 
                color={activityType === 'accommodation' ? '#fff' : '#26a69a'} 
              />
              <Text style={[styles.typeText, activityType === 'accommodation' && styles.typeTextActive]}>
                Stay
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            label="Notes (optional)"
            value={activityNotes}
            onChangeText={setActivityNotes}
            style={styles.modalInput}
            mode="outlined"
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setActivityModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleAddActivity}
              style={styles.modalButton}
              loading={loading}
              disabled={loading || !activityTitle.trim()}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Trip Selector Modal */}
      <Portal>
        <Modal
          visible={tripSelectorVisible}
          onDismiss={() => setTripSelectorVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Select Trip</Text>

          <ScrollView style={styles.tripList}>
            {userTrips.map(trip => (
              <TouchableOpacity
                key={trip.id}
                style={[styles.tripItem, selectedTrip?.id === trip.id && styles.selectedTripItem]}
                onPress={() => {
                  setTripSelectorVisible(false);
                  router.push({
                    pathname: `/trip/${trip.id}`,
                    params: { id: trip.id }
                  });
                }}
              >
                <Text style={styles.tripItemDestination}>{trip.destination}</Text>
                <Text style={styles.tripItemDates}>
                  {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                </Text>
                {selectedTrip?.id === trip.id && (
                  <MaterialIcons name="check" size={24} color="#0066cc" style={styles.tripItemCheck} />
                )}
              </TouchableOpacity>
            ))}

            {userTrips.length === 0 && (
              <View style={styles.emptyTripList}>
                <Text style={styles.emptyTripText}>No trips found</Text>
                <Button 
                  mode="contained" 
                  icon="plus" 
                  onPress={() => {
                    setTripSelectorVisible(false);
                    router.push('/create-trip');
                  }}
                  style={styles.createTripButton}
                >
                  Create Trip
                </Button>
              </View>
            )}
          </ScrollView>

          <Button 
            mode="outlined" 
            onPress={() => setTripSelectorVisible(false)}
            style={styles.modalButtonFull}
          >
            Close
          </Button>
        </Modal>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
        >
          <Dialog.Title>Delete Activity</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to delete this activity? This action cannot be undone.</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteConfirmVisible(false)}>Cancel</Button>
            <Button onPress={handleDeleteActivity} color="#ff3b30">Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  headerBackground: {
    height: 180,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  header: {
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    height: 45,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchResultsContainer: {
    padding: 16,
  },
  searchResultItem: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    height: 160,
  },
  searchResultImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  searchResultGradient: {
    height: '100%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  searchResultContent: {
    flexDirection: 'column',
  },
  searchResultTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  searchResultSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  searchResultTypeChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 102, 204, 0.8)',
  },
  searchResultTypeText: {
    color: 'white',
    fontSize: 12,
  },
  tripSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  tripSelectorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  daysContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayChip: {
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
  },
  activeDayChip: {
    backgroundColor: '#0066cc',
  },
  dayChipText: {
    color: '#333',
  },
  activeDayChipText: {
    color: '#fff',
  },
  addDayChip: {
    marginHorizontal: 4,
    backgroundColor: '#e8f4ff',
  },
  activitiesContainer: {
    flex: 1,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  activityTimeContainer: {
    width: 80,
    alignItems: 'center',
  },
  activityTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  timeConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#ddd',
    marginTop: 5,
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activityType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  activityNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  activityActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addActivityButton: {
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  createTripButton: {
    marginTop: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  typeButtonActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  typeText: {
    marginLeft: 8,
    fontSize: 14,
  },
  typeTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    marginLeft: 8,
  },
  modalButtonFull: {
    marginTop: 16,
  },
  tripList: {
    maxHeight: 400,
  },
  tripItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedTripItem: {
    backgroundColor: '#f0f7ff',
  },
  tripItemDestination: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tripItemDates: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tripItemCheck: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  emptyTripList: {
    padding: 20,
    alignItems: 'center',
  },
  emptyTripText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  controlsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterControls: {
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  sortControls: {
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    marginRight: 8,
  },
  viewControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
