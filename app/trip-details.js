import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, FAB, ActivityIndicator, IconButton, Menu } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { fetchTripItinerary, updateTrip } from '../lib/tripService';
import { generateItinerary } from '../lib/openRouterService';

export default function TripDetailsScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingItinerary, setGeneratingItinerary] = useState(false);
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (tripId && user) {
      fetchTripDetails();
      fetchItineraryData();
    }
  }, [tripId, user]);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (error) throw error;
      setTrip(data);
    } catch (err) {
      console.error('Error fetching trip details:', err.message);
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const fetchItineraryData = async () => {
    try {
      const { data, error } = await fetchTripItinerary(tripId);
      if (error) throw error;
      setItinerary(data || []);
    } catch (err) {
      console.error('Error fetching itinerary:', err.message);
      // We don't set error here as the trip might not have an itinerary yet
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      const { data, error } = await updateTrip(tripId, { status: newStatus });
      if (error) throw error;
      setTrip({ ...trip, status: newStatus });
      setMenuVisible(false);
    } catch (err) {
      console.error('Error updating trip status:', err.message);
      Alert.alert('Error', 'Failed to update trip status');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateItinerary = async () => {
    if (!trip) return;
    
    Alert.alert(
      'Generate Itinerary',
      'Would you like to generate an AI-powered itinerary for this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate', 
          onPress: async () => {
            try {
              setGeneratingItinerary(true);
              
              // Calculate trip duration in days
              const startDate = new Date(trip.start_date);
              const endDate = new Date(trip.end_date);
              const durationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
              
              // Prepare trip details for AI
              const tripDetails = {
                destination: trip.destination,
                duration: durationInDays,
                startDate: trip.start_date,
                endDate: trip.end_date,
                interests: ['sightseeing', 'culture', 'food'], // This would come from user preferences
                budget: 'medium' // This would come from user preferences
              };
              
              // Generate itinerary using AI
              const itineraryText = await generateItinerary(tripDetails);
              
              // In a real app, we would parse the AI response and save it to the database
              // For now, we'll just show a success message
              Alert.alert(
                'Itinerary Generated',
                'Your AI-powered itinerary has been created! You can now view and edit it in the Itinerary tab.',
                [{ text: 'OK', onPress: () => setActiveTab('itinerary') }]
              );
              
              // Refresh itinerary data
              await fetchItineraryData();
            } catch (err) {
              console.error('Error generating itinerary:', err.message);
              Alert.alert('Error', 'Failed to generate itinerary. Please try again.');
            } finally {
              setGeneratingItinerary(false);
            }
          }
        },
      ]
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Share Trip',
      'Share this trip with friends and family?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => Alert.alert('Shared', 'Trip shared successfully!') }
      ]
    );
  };

  const handleEdit = () => {
    router.push({
      pathname: '/edit-trip',
      params: { tripId: trip.id }
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Calculate trip duration
  const getTripDuration = () => {
    if (!trip) return '';
    
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    const durationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    return `${durationInDays} ${durationInDays === 1 ? 'day' : 'days'}`;
  };

  // Render loading state
  if (loading && !trip) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchTripDetails}>Retry</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with trip image */}
      <View style={styles.header}>
        <Image 
          source={{ uri: trip?.cover_image_url || `https://source.unsplash.com/featured/1200x800/?travel,${encodeURIComponent(trip?.destination)},landmark` }}
          style={styles.headerImage}
        />
        <View style={styles.headerOverlay} />
        
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  iconColor="#fff"
                  size={24}
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item onPress={handleEdit} title="Edit Trip" />
              <Menu.Item onPress={handleShare} title="Share Trip" />
              <Divider />
              <Menu.Item onPress={() => handleStatusChange('planned')} title="Set as Planned" />
              <Menu.Item onPress={() => handleStatusChange('active')} title="Set as Active" />
              <Menu.Item onPress={() => handleStatusChange('completed')} title="Set as Completed" />
              <Menu.Item onPress={() => handleStatusChange('cancelled')} title="Set as Cancelled" />
            </Menu>
          </View>
          
          <View style={styles.headerBottomRow}>
            <Title style={styles.tripTitle}>{trip?.destination}</Title>
            <Chip 
              style={[styles.statusChip, styles[`status_${trip?.status}`]]}
              textStyle={styles.statusChipText}
            >
              {trip?.status.charAt(0).toUpperCase() + trip?.status.slice(1)}
            </Chip>
          </View>
        </View>
      </View>
      
      {/* Tab navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'itinerary' && styles.activeTab]}
          onPress={() => setActiveTab('itinerary')}
        >
          <Text style={[styles.tabText, activeTab === 'itinerary' && styles.activeTabText]}>Itinerary</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>Expenses</Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab content */}
      <ScrollView style={styles.content}>
        {activeTab === 'overview' && (
          <View>
            <Card style={styles.infoCard}>
              <Card.Content>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <MaterialIcons name="event" size={24} color="#0066cc" style={styles.infoIcon} />
                    <View>
                      <Text style={styles.infoLabel}>Start Date</Text>
                      <Text style={styles.infoValue}>{formatDate(trip?.start_date)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <MaterialIcons name="event" size={24} color="#0066cc" style={styles.infoIcon} />
                    <View>
                      <Text style={styles.infoLabel}>End Date</Text>
                      <Text style={styles.infoValue}>{formatDate(trip?.end_date)}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <MaterialIcons name="schedule" size={24} color="#0066cc" style={styles.infoIcon} />
                    <View>
                      <Text style={styles.infoLabel}>Duration</Text>
                      <Text style={styles.infoValue}>{getTripDuration()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <MaterialIcons name="attach-money" size={24} color="#0066cc" style={styles.infoIcon} />
                    <View>
                      <Text style={styles.infoLabel}>Budget</Text>
                      <Text style={styles.infoValue}>Not set</Text>
                    </View>
                  </View>
                </View>
              </Card.Content>
            </Card>
            
            {trip?.description && (
              <Card style={styles.descriptionCard}>
                <Card.Content>
                  <Title style={styles.sectionTitle}>Description</Title>
                  <Paragraph>{trip.description}</Paragraph>
                </Card.Content>
              </Card>
            )}
            
            <Card style={styles.actionsCard}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Trip Actions</Title>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={handleGenerateItinerary}
                    disabled={generatingItinerary}
                  >
                    {generatingItinerary ? (
                      <ActivityIndicator size="small" color="#0066cc" />
                    ) : (
                      <MaterialIcons name="auto-awesome" size={24} color="#0066cc" />
                    )}
                    <Text style={styles.actionButtonText}>Generate Itinerary</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                    <MaterialIcons name="share" size={24} color="#0066cc" />
                    <Text style={styles.actionButtonText}>Share Trip</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                    <MaterialIcons name="edit" size={24} color="#0066cc" />
                    <Text style={styles.actionButtonText}>Edit Trip</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
            
            <Card style={styles.weatherCard}>
              <Card.Content>
                <View style={styles.weatherHeader}>
                  <Title style={styles.sectionTitle}>Weather Forecast</Title>
                  <TouchableOpacity>
                    <Text style={styles.refreshText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.weatherContent}>
                  <Text style={styles.weatherMessage}>
                    Weather data will be available 7 days before your trip.
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}
        
        {activeTab === 'itinerary' && (
          <View>
            {itinerary.length > 0 ? (
              itinerary.map((day, index) => (
                <Card key={day.id} style={styles.dayCard}>
                  <Card.Content>
                    <View style={styles.dayHeader}>
                      <Title style={styles.dayTitle}>Day {day.day_number}</Title>
                      <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                    </View>
                    
                    {day.activities && day.activities.length > 0 ? (
                      day.activities.map((activity, actIndex) => (
                        <View key={activity.id}>
                          <View style={styles.activityItem}>
                            <View style={styles.activityTime}>
                              <Text style={styles.timeText}>{activity.start_time}</Text>
                            </View>
                            
                            <View style={styles.activityContent}>
                              <Text style={styles.activityTitle}>{activity.title}</Text>
                              {activity.description && (
                                <Text style={styles.activityDescription}>{activity.description}</Text>
                              )}
                              {activity.location && (
                                <View style={styles.locationRow}>
                                  <MaterialIcons name="location-on" size={16} color="#666" />
                                  <Text style={styles.locationText}>{activity.location}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          
                          {actIndex < day.activities.length - 1 && <Divider style={styles.activityDivider} />}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyDayText}>No activities planned for this day.</Text>
                    )}
                    
                    <Button 
                      mode="outlined" 
                      icon="plus" 
                      onPress={() => Alert.alert('Add Activity', 'Add activity functionality would be implemented here')}
                      style={styles.addActivityButton}
                    >
                      Add Activity
                    </Button>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <View style={styles.emptyItineraryContainer}>
                <MaterialIcons name="event-note" size={60} color="#0066cc" style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No Itinerary Yet</Text>
                <Text style={styles.emptyText}>
                  Create your itinerary by adding days and activities, or generate one with AI.
                </Text>
                <Button 
                  mode="contained" 
                  icon="auto-awesome"
                  onPress={handleGenerateItinerary}
                  style={styles.generateButton}
                  loading={generatingItinerary}
                  disabled={generatingItinerary}
                >
                  Generate with AI
                </Button>
              </View>
            )}
          </View>
        )}
        
        {activeTab === 'expenses' && (
          <View style={styles.emptyExpensesContainer}>
            <MaterialIcons name="account-balance-wallet" size={60} color="#0066cc" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No Expenses Yet</Text>
            <Text style={styles.emptyText}>
              Track your trip expenses to stay on budget and keep all your spending in one place.
            </Text>
            <Button 
              mode="contained" 
              icon="plus"
              onPress={() => Alert.alert('Add Expense', 'Add expense functionality would be implemented here')}
              style={styles.addExpenseButton}
            >
              Add Expense
            </Button>
          </View>
        )}
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {activeTab === 'itinerary' && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => Alert.alert('Add Day', 'Add day functionality would be implemented here')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    height: 200,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  headerContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusChip: {
    height: 28,
  },
  status_planned: {
    backgroundColor: '#FFF9C4',
  },
  status_active: {
    backgroundColor: '#C8E6C9',
  },
  status_completed: {
    backgroundColor: '#CFD8DC',
  },
  status_cancelled: {
    backgroundColor: '#FFCDD2',
  },
  statusChipText: {
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0066cc',
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#0066cc',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  infoCard: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionCard: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  actionsCard: {
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
  },
  actionButtonText: {
    marginTop: 5,
    fontSize: 12,
    color: '#0066cc',
    textAlign: 'center',
  },
  weatherCard: {
    marginBottom: 15,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshText: {
    color: '#0066cc',
    fontSize: 14,
  },
  weatherContent: {
    alignItems: 'center',
    padding: 20,
  },
  weatherMessage: {
    color: '#666',
    textAlign: 'center',
  },
  dayCard: {
    marginBottom: 15,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dayTitle: {
    fontSize: 18,
  },
  dayDate: {
    color: '#666',
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  activityTime: {
    width: 60,
    marginRight: 10,
  },
  timeText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  activityDivider: {
    marginVertical: 10,
  },
  emptyDayText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 15,
  },
  addActivityButton: {
    marginTop: 10,
  },
  emptyItineraryContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyExpensesContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  generateButton: {
    marginTop: 10,
  },
  addExpenseButton: {
    marginTop: 10,
  },
  bottomPadding: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0066cc',
  },
});
