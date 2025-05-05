import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Button, Card, Chip, ActivityIndicator, IconButton, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { fetchTripById, fetchTripItinerary, updateTrip } from '../../lib/tripService';
import ImageCard from '../../components/ImageCard';

// Status colors
const STATUS_COLORS = {
  planned: '#4a148c',
  active: '#2e7d32',
  completed: '#1565c0',
  cancelled: '#c62828'
};

export default function TripDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id;
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [imageUrl, setImageUrl] = useState(null);
  
  // Get a destination image from Unsplash
  const getDestinationImage = (destination) => {
    return `https://source.unsplash.com/featured/?${encodeURIComponent(destination)},travel`;
  };
  
  useEffect(() => {
    if (id && user) {
      fetchTripDetails();
    }
  }, [id, user]);
  
  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        throw new Error('No trip ID provided');
      }

      // For mock trips (if you're using them)
      if (id.startsWith('mock')) {
        const mockTrip = getMockTrip(id);
        setTrip(mockTrip);
        setItinerary(mockTrip.itinerary || []);
        setImageUrl(getDestinationImage(mockTrip.destination));
      } else {
        // Fetch real trip data
        const { data: tripData, error } = await fetchTripById(id);
        if (error) throw error;
        if (!tripData) throw new Error('Trip not found');
        
        setTrip(tripData);
        setImageUrl(getDestinationImage(tripData.destination));
        
        // Fetch itinerary
        const { data: itineraryData } = await fetchTripItinerary(id);
        setItinerary(itineraryData || []);
      }
    } catch (error) {
      console.error('Error fetching trip details:', error);
      setError(error.message || 'Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };
  
  // Mock data for demo purposes
  const getMockTrip = (mockId) => {
    // Paris mock trip
    if (mockId === 'mock1') {
      return {
        id: 'mock1',
        title: 'Paris Getaway',
        destination: 'Paris, France',
        description: 'A romantic week in the City of Lights',
        start_date: '2025-05-15',
        end_date: '2025-05-22',
        status: 'planned',
        category: 'Romantic',
        itinerary: [
          {
            id: 'day1-mock1',
            day_number: 1,
            date: '2025-05-15',
            title: 'Arrival Day',
            activities: [
              {
                id: 'act1-day1-mock1',
                title: 'Arrival at Charles de Gaulle Airport',
                time: '10:00 AM',
                type: 'transport',
                notes: 'Terminal 2E'
              },
              {
                id: 'act2-day1-mock1',
                title: 'Check-in at Hotel Lutetia',
                time: '2:00 PM',
                type: 'accommodation',
                notes: 'Luxury room with Eiffel Tower view'
              },
              {
                id: 'act3-day1-mock1',
                title: 'Dinner at Le Jules Verne',
                time: '8:00 PM',
                type: 'food',
                notes: 'Restaurant in the Eiffel Tower'
              }
            ]
          },
          {
            id: 'day2-mock1',
            day_number: 2,
            date: '2025-05-16',
            title: 'Louvre & Seine',
            activities: [
              {
                id: 'act1-day2-mock1',
                title: 'Louvre Museum',
                time: '9:00 AM',
                type: 'activity',
                notes: 'Skip the line tickets'
              },
              {
                id: 'act2-day2-mock1',
                title: 'Lunch at Café Marly',
                time: '1:00 PM',
                type: 'food',
                notes: 'Overlooks the Louvre Pyramid'
              }
            ]
          }
        ]
      };
    }
    
    // Default mock trip
    return {
      id: mockId,
      title: 'Sample Trip',
      destination: 'Unknown Destination',
      description: 'This is a sample trip',
      start_date: '2025-01-01',
      end_date: '2025-01-07',
      status: 'planned',
      itinerary: []
    };
  };
  
  const handleStatusChange = async (newStatus) => {
    try {
      if (id.includes('mock')) {
        // Just update local state for mock trips
        setTrip({...trip, status: newStatus});
      } else {
        // Update real trip in database
        const { data } = await updateTrip(id, {status: newStatus});
        if (data) {
          setTrip(data);
        }
      }
    } catch (error) {
      console.error('Error updating trip status:', error);
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a148c" />
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </View>
    );
  }
  
  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#c62828" />
        <Text style={styles.errorText}>Trip not found</Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header with background image */}
        <View style={styles.header}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.headerGradient}
          >
            <IconButton
              icon="arrow-left"
              iconColor="white"
              size={28}
              style={styles.backButton}
              onPress={() => router.back()}
            />
            
            <View style={styles.headerContent}>
              <Chip 
                style={[styles.statusChip, { backgroundColor: STATUS_COLORS[trip.status] }]}
              >
                {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
              </Chip>
              
              <Text style={styles.title}>{trip.title || trip.destination}</Text>
              
              <View style={styles.dateContainer}>
                <MaterialIcons name="date-range" size={16} color="white" />
                <Text style={styles.dateText}>
                  {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                </Text>
                <Text style={styles.durationText}>
                  ({calculateDuration(trip.start_date, trip.end_date)} days)
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
        
        {/* Tab buttons */}
        <View style={styles.tabContainer}>
          <Button 
            mode={activeTab === 'overview' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('overview')}
            style={styles.tabButton}
          >
            Overview
          </Button>
          <Button 
            mode={activeTab === 'itinerary' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('itinerary')}
            style={styles.tabButton}
          >
            Itinerary
          </Button>
          <Button 
            mode={activeTab === 'expenses' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('expenses')}
            style={styles.tabButton}
          >
            Expenses
          </Button>
        </View>
        
        {/* Tab content */}
        <View style={styles.content}>
          {activeTab === 'overview' && (
            <View>
              {/* Description */}
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.description}>{trip.description || 'No description provided.'}</Text>
                </Card.Content>
              </Card>
              
              {/* Status actions */}
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Trip Status</Text>
                  <View style={styles.statusButtons}>
                    <Button 
                      mode={trip.status === 'planned' ? 'contained' : 'outlined'}
                      onPress={() => handleStatusChange('planned')}
                      style={styles.statusButton}
                      buttonColor={trip.status === 'planned' ? STATUS_COLORS.planned : undefined}
                    >
                      Planned
                    </Button>
                    <Button 
                      mode={trip.status === 'active' ? 'contained' : 'outlined'}
                      onPress={() => handleStatusChange('active')}
                      style={styles.statusButton}
                      buttonColor={trip.status === 'active' ? STATUS_COLORS.active : undefined}
                    >
                      Active
                    </Button>
                    <Button 
                      mode={trip.status === 'completed' ? 'contained' : 'outlined'}
                      onPress={() => handleStatusChange('completed')}
                      style={styles.statusButton}
                      buttonColor={trip.status === 'completed' ? STATUS_COLORS.completed : undefined}
                    >
                      Completed
                    </Button>
                  </View>
                </Card.Content>
              </Card>
              
              {/* Nearby attractions */}
              <Card style={styles.card}>
                <Card.Title title="Nearby Attractions" />
                <Card.Content>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <ImageCard
                      id="place1"
                      title="Eiffel Tower"
                      subtitle="Paris, France"
                      type="place"
                      imageUrl="https://images.unsplash.com/photo-1543349689-9a4d426bee8e"
                      horizontal={true}
                      style={styles.horizontalCard}
                    />
                    <ImageCard
                      id="place2"
                      title="Louvre Museum"
                      subtitle="Paris, France"
                      type="place"
                      imageUrl="https://images.unsplash.com/photo-1565099824688-e93eb20fe622"
                      horizontal={true}
                      style={styles.horizontalCard}
                    />
                    <ImageCard
                      id="place3"
                      title="Notre-Dame Cathedral"
                      subtitle="Paris, France"
                      type="place"
                      imageUrl="https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94"
                      horizontal={true}
                      style={styles.horizontalCard}
                    />
                  </ScrollView>
                </Card.Content>
              </Card>
            </View>
          )}
          
          {activeTab === 'itinerary' && (
            <View>
              {itinerary.length > 0 ? (
                itinerary.map((day, index) => (
                  <Card key={day.id || index} style={styles.card}>
                    <Card.Title 
                      title={`Day ${day.day_number}: ${day.title || formatDate(day.date)}`}
                      subtitle={formatDate(day.date)}
                    />
                    <Card.Content>
                      {day.activities && day.activities.length > 0 ? (
                        day.activities.map((activity, actIndex) => (
                          <View key={activity.id || actIndex} style={styles.activityItem}>
                            <View style={styles.activityTimeContainer}>
                              <Text style={styles.activityTime}>{activity.time || 'All day'}</Text>
                            </View>
                            
                            <View style={[
                              styles.activityContent, 
                              { borderLeftColor: getActivityColor(activity.type) }
                            ]}>
                              <View style={styles.activityHeader}>
                                <MaterialIcons 
                                  name={getActivityIcon(activity.type)} 
                                  size={20} 
                                  color={getActivityColor(activity.type)} 
                                />
                                <Text style={styles.activityTitle}>{activity.title}</Text>
                              </View>
                              
                              {activity.notes && (
                                <Text style={styles.activityNotes}>{activity.notes}</Text>
                              )}
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.emptyText}>No activities planned for this day.</Text>
                      )}
                    </Card.Content>
                  </Card>
                ))
              ) : (
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.emptyContainer}>
                      <MaterialIcons name="event-busy" size={64} color="#9e9e9e" />
                      <Text style={styles.emptyTitle}>No Itinerary Yet</Text>
                      <Text style={styles.emptyText}>
                        Start planning your trip by adding days and activities.
                      </Text>
                      <Button 
                        mode="contained" 
                        icon="plus"
                        onPress={() => {}}
                        style={styles.addButton}
                      >
                        Add to Itinerary
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              )}
            </View>
          )}
          
          {activeTab === 'expenses' && (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="account-balance-wallet" size={64} color="#9e9e9e" />
                  <Text style={styles.emptyTitle}>No Expenses Yet</Text>
                  <Text style={styles.emptyText}>
                    Track your travel expenses to stay on budget.
                  </Text>
                  <Button 
                    mode="contained" 
                    icon="plus"
                    onPress={() => {}}
                    style={styles.addButton}
                  >
                    Add Expense
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>
      
      {/* Floating action button */}
      <FAB
        icon="pencil"
        style={styles.fab}
        onPress={() => {}}
      />
    </View>
  );
}

// Helper functions
const getActivityIcon = (type) => {
  switch (type) {
    case 'transport': return 'flight';
    case 'accommodation': return 'hotel';
    case 'food': return 'restaurant';
    case 'activity': return 'event';
    default: return 'place';
  }
};

const getActivityColor = (type) => {
  switch (type) {
    case 'transport': return '#5c6bc0';
    case 'accommodation': return '#26a69a';
    case 'food': return '#f57c00';
    case 'activity': return '#7cb342';
    default: return '#9e9e9e';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    marginVertical: 16,
  },
  header: {
    height: 250,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  backButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerContent: {
    marginBottom: 16,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 4,
  },
  durationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'white',
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#4a148c',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusButton: {
    marginVertical: 8,
    width: '32%',
  },
  horizontalCard: {
    marginRight: 12,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  activityTimeContainer: {
    width: 80,
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  activityTime: {
    fontSize: 14,
    color: '#757575',
  },
  activityContent: {
    flex: 1,
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  activityNotes: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 28,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4a148c',
  },
});
