import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserTrips, deleteTrip } from '../lib/tripService';

export default function TripsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadTrips();
    }
  }, [user]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchUserTrips(user.id);
      if (error) throw error;
      setTrips(data || []);
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
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await deleteTrip(tripId);
              if (error) throw error;
              // Remove the deleted trip from the state
              setTrips(trips.filter(trip => trip.id !== tripId));
            } catch (err) {
              console.error('Error deleting trip:', err.message);
              Alert.alert('Error', 'Failed to delete trip. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  const renderTripItem = ({ item }) => {
    // Format dates
    const startDate = new Date(item.start_date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endDate = new Date(item.end_date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <TouchableOpacity 
        style={styles.tripCard}
        onPress={() => handleTripPress(item)}
      >
        <View style={styles.tripHeader}>
          <Text style={styles.tripDestination}>{item.destination}</Text>
          <TouchableOpacity 
            onPress={() => handleDeleteTrip(item.id)}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.tripDates}>{startDate} - {endDate}</Text>
        
        <View style={styles.tripStatus}>
          <View style={[styles.statusIndicator, styles[`status_${item.status}`]]} />
          <Text style={styles.statusText}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>You don't have any trips yet</Text>
      <Text style={styles.emptySubtext}>Create your first trip to get started</Text>
      <TouchableOpacity 
        style={styles.createTripButton}
        onPress={handleCreateTrip}
      >
        <Text style={styles.createTripButtonText}>Create Trip</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Trips</Text>
        <TouchableOpacity onPress={handleCreateTrip}>
          <Text style={styles.addButton}>+</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadTrips}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0066cc',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    fontSize: 24,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    fontSize: 24,
    color: '#fff',
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
  retryButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  tripDestination: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontSize: 16,
  },
  tripDates: {
    color: '#666',
    marginBottom: 10,
  },
  tripStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  status_planned: {
    backgroundColor: '#ffcc00',
  },
  status_active: {
    backgroundColor: '#34c759',
  },
  status_completed: {
    backgroundColor: '#8e8e93',
  },
  status_cancelled: {
    backgroundColor: '#ff3b30',
  },
  statusText: {
    color: '#666',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    height: 300,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  createTripButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  createTripButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
