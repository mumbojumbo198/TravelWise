import { View, StyleSheet, TouchableOpacity, FlatList, Alert, ImageBackground, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserTrips, deleteTrip } from '../../lib/tripService';
import { Card, Title, Paragraph, Button, Text, Chip, ActivityIndicator, FAB, Avatar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import theme, { commonStyles } from '../../theme';

// Mock trip data
const MOCK_TRIPS = [
  {
    id: 'trip-1',
    title: 'Summer in Bali',
    destination: 'Bali',
    description: 'Exploring the beaches and temples of Bali',
    start_date: '2025-06-15',
    end_date: '2025-06-25',
    status: 'planned',
    cover_image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
    activities: 8,
    budget: '$1,800',
    country: 'Indonesia'
  },
  {
    id: 'trip-2',
    title: 'Tokyo Adventure',
    destination: 'Tokyo',
    description: 'Exploring the vibrant city of Tokyo',
    start_date: '2025-07-10',
    end_date: '2025-07-20',
    status: 'active',
    cover_image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
    activities: 12,
    budget: '$2,500',
    country: 'Japan'
  },
  {
    id: 'trip-3',
    title: 'Paris Getaway',
    destination: 'Paris',
    description: 'Romantic weekend in the city of lights',
    start_date: '2025-05-05',
    end_date: '2025-05-08',
    status: 'completed',
    cover_image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
    activities: 6,
    budget: '$1,200',
    country: 'France'
  },
  {
    id: 'trip-4',
    title: 'Greek Island Hopping',
    destination: 'Santorini',
    description: 'Exploring the beautiful Greek islands',
    start_date: '2025-08-10',
    end_date: '2025-08-20',
    status: 'planned',
    cover_image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff',
    activities: 10,
    budget: '$2,800',
    country: 'Greece'
  },
  {
    id: 'trip-5',
    title: 'New York City Break',
    destination: 'New York',
    description: 'Exploring the Big Apple',
    start_date: '2025-09-15',
    end_date: '2025-09-22',
    status: 'planned',
    cover_image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
    activities: 15,
    budget: '$3,000',
    country: 'United States'
  }
];

// Trip status colors
const STATUS_COLORS = {
  planned: { bg: '#E3F2FD', text: '#1976D2', icon: 'event' },
  active: { bg: '#E8F5E9', text: '#2E7D32', icon: 'flight-takeoff' },
  completed: { bg: '#E0F2F1', text: '#00796B', icon: 'check-circle' },
  cancelled: { bg: '#FFEBEE', text: '#C62828', icon: 'cancel' }
};

export default function TripsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = useState(MOCK_TRIPS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      // In a real app, we would load trips from the API
      // For now, we'll just use our mock data
      setLoading(false);
    }
  }, [user]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      // In a real app, we would fetch trips from the API
      // const { data, error } = await fetchUserTrips(user.id);
      // if (error) throw error;
      // setTrips(data || []);
      
      // For now, we'll just use our mock data
      setTrips(MOCK_TRIPS);
    } catch (err) {
      console.error('Error loading trips:', err.message);
      setError('Failed to load trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = () => {
    // Navigate to trip creation screen
    router.push('/create-trip');
  };

  const handleTripPress = (trip) => {
    // Navigate to trip details screen
    router.push({
      pathname: `/trip/${trip.id}`,
      params: { id: trip.id }
    });
  };

  const handleDeleteTrip = (tripId) => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Remove the deleted trip from the state
            setTrips(trips.filter(trip => trip.id !== tripId));
          }
        },
      ]
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getFilteredTrips = () => {
    if (filter === 'all') return trips;
    return trips.filter(trip => trip.status === filter);
  };

  const renderTripItem = ({ item }) => {
    const statusInfo = STATUS_COLORS[item.status] || STATUS_COLORS.planned;
    
    return (
      <Card 
        style={styles.tripCard}
        onPress={() => handleTripPress(item)}
      >
        <ImageBackground 
          source={{ uri: item.cover_image_url }} 
          style={styles.tripImage}
          imageStyle={{ borderRadius: theme.roundness }}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.tripGradient}
          >
            <View style={styles.tripImageContent}>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                <MaterialIcons name={statusInfo.icon} size={14} color={statusInfo.text} />
                <Text style={[styles.statusText, { color: statusInfo.text }]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
              
              <TouchableOpacity 
                onPress={() => handleDeleteTrip(item.id)}
                style={styles.deleteButton}
              >
                <MaterialIcons name="delete-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
        
        <Card.Content style={styles.tripContent}>
          <Title style={styles.tripTitle}>{item.title}</Title>
          
          <View style={styles.tripDetails}>
            <View style={styles.tripDetailItem}>
              <MaterialIcons name="place" size={16} color={theme.colors.primary} />
              <Text style={styles.tripDetailText}>{item.destination}, {item.country}</Text>
            </View>
            
            <View style={styles.tripDetailItem}>
              <MaterialIcons name="date-range" size={16} color={theme.colors.primary} />
              <Text style={styles.tripDetailText}>
                {formatDate(item.start_date)} - {formatDate(item.end_date)}
              </Text>
            </View>
            
            <View style={styles.tripStats}>
              <View style={styles.tripStat}>
                <MaterialIcons name="event" size={16} color={theme.colors.text} />
                <Text style={styles.tripStatText}>{item.activities} Activities</Text>
              </View>
              
              <View style={styles.tripStat}>
                <MaterialIcons name="account-balance-wallet" size={16} color={theme.colors.text} />
                <Text style={styles.tripStatText}>{item.budget}</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="luggage" size={60} color={theme.colors.primary} style={styles.emptyIcon} />
      <Text style={styles.emptyText}>You don't have any trips yet</Text>
      <Text style={styles.emptySubtext}>Create your first trip to get started</Text>
      <Button 
        mode="contained" 
        onPress={handleCreateTrip}
        style={styles.createTripButton}
        color={theme.colors.primary}
      >
        Create Trip
      </Button>
    </View>
  );

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScrollContent}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.activeFilterChip]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.activeFilterChipText]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, filter === 'planned' && styles.activeFilterChip]}
          onPress={() => setFilter('planned')}
        >
          <MaterialIcons name="event" size={16} color={filter === 'planned' ? 'white' : STATUS_COLORS.planned.text} />
          <Text style={[styles.filterChipText, filter === 'planned' && styles.activeFilterChipText]}>Planned</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, filter === 'active' && styles.activeFilterChip]}
          onPress={() => setFilter('active')}
        >
          <MaterialIcons name="flight-takeoff" size={16} color={filter === 'active' ? 'white' : STATUS_COLORS.active.text} />
          <Text style={[styles.filterChipText, filter === 'active' && styles.activeFilterChipText]}>Active</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, filter === 'completed' && styles.activeFilterChip]}
          onPress={() => setFilter('completed')}
        >
          <MaterialIcons name="check-circle" size={16} color={filter === 'completed' ? 'white' : STATUS_COLORS.completed.text} />
          <Text style={[styles.filterChipText, filter === 'completed' && styles.activeFilterChipText]}>Completed</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryLight]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>My Trips</Text>
        <Text style={styles.headerSubtitle}>Manage your travel plans</Text>
      </LinearGradient>
      
      {renderFilterChips()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained"
            onPress={loadTrips}
            style={styles.retryButton}
            color={theme.colors.primary}
          >
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={getFilteredTrips()}
          renderItem={renderTripItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        color="#fff"
        onPress={handleCreateTrip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filtersScrollContent: {
    paddingRight: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    marginLeft: 4,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterChipText: {
    color: 'white',
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
    fontSize: 16,
    color: '#ff3b30',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  tripCard: {
    marginBottom: 16,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    elevation: 3,
    backgroundColor: 'white',
  },
  tripImage: {
    height: 180,
    width: '100%',
  },
  tripGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    justifyContent: 'space-between',
    padding: 16,
  },
  tripImageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripContent: {
    padding: 16,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tripDetails: {
    marginTop: 4,
  },
  tripDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tripDetailText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 6,
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tripStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripStatText: {
    fontSize: 13,
    color: theme.colors.text,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 80,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  createTripButton: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
  },
});
