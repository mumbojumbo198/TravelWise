import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, Title, Paragraph, Button, Searchbar, Chip, Avatar, Badge } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import theme, { commonStyles } from '../../theme';
import ImageCard from '../../components/ImageCard';

// High-quality destination images
const POPULAR_DESTINATIONS = [
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
    rating: 4.8,
    lat: "48.8566",
    lon: "2.3522"
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
    rating: 4.7,
    lat: "35.6762",
    lon: "139.6503"
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'United States',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
    rating: 4.6,
    lat: "40.7128",
    lon: "-74.0060"
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
    rating: 4.5,
    lat: "-8.3405",
    lon: "115.0920"
  },
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
    rating: 4.7,
    lat: "41.9028",
    lon: "12.4964"
  }
];

export default function DashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUpcomingTrips();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingTrips = async () => {
    try {
      // Get current date in ISO format
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(3);

      if (error) throw error;
      setUpcomingTrips(data || []);
    } catch (error) {
      console.error('Error fetching upcoming trips:', error.message);
    }
  };
  
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Navigate to search results
    router.push({
      pathname: '/search-results',
      params: { query: searchQuery }
    });
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          onPress: async () => {
            await signOut();
            router.replace('/');
          }
        },
      ]
    );
  };

  const navigateTo = (screen) => {
    router.push(`/${screen}`);
  };

  const handleDestinationPress = (destination) => {
    router.push({
      pathname: `/destination/${encodeURIComponent(destination.name)}`,
      params: {
        name: destination.name,
        latitude: destination.lat || "48.8566",  // Default coordinates for testing
        longitude: destination.lon || "2.3522"   // These will be replaced by real coordinates in production
      }
    });
  };

  const handleTripPress = (tripId) => {
    router.push({
      pathname: `/trip/${tripId}`,
      params: { id: tripId }
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello, {userProfile?.username || 'Traveler'}!</Text>
            <Text style={styles.subGreeting}>Where to next?</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/tabs/profile')} 
            style={styles.profileButton}
          >
            {userProfile?.avatar_url ? (
              <Avatar.Image 
                size={40} 
                source={{ uri: userProfile.avatar_url }} 
              />
            ) : (
              <Avatar.Text 
                size={40} 
                label={userProfile?.username?.[0]?.toUpperCase() || 'T'} 
                backgroundColor={theme.colors.primaryDark}
                color="white"
              />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search destinations, hotels, activities..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            onSubmitEditing={handleSearch}
            style={styles.searchbar}
            iconColor={theme.colors.primary}
          />
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.content}>
        {/* Popular Destinations */}
        <View style={styles.sectionHeader}>
          <Text style={commonStyles.sectionTitle}>Popular Destinations</Text>
          <TouchableOpacity onPress={() => router.push('/tabs/explore')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
        >
          {POPULAR_DESTINATIONS.map((destination) => (
            <TouchableOpacity
              key={destination.id}
              onPress={() => handleDestinationPress(destination)}
              activeOpacity={0.9}
            >
              <Card style={styles.destinationCard}>
                <ImageBackground 
                  source={{ uri: destination.image }} 
                  style={styles.destinationImage}
                  imageStyle={{ borderRadius: theme.roundness }}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.destinationGradient}
                  >
                    <Text style={styles.destinationName}>{destination.name}</Text>
                    <Text style={styles.destinationCountry}>{destination.country}</Text>
                    <View style={styles.ratingContainer}>
                      <MaterialIcons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>{destination.rating}</Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Quick Actions */}
        <Text style={commonStyles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.quickAccessGrid}>
          <TouchableOpacity 
            style={styles.quickAccessItem} 
            onPress={() => navigateTo('tabs/chatbot')}
          >
            <View style={styles.quickAccessIconContainer}>
              <MaterialIcons name="chat" size={24} color="white" />
            </View>
            <Text style={styles.quickAccessText}>AI Assistant</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAccessItem}
            onPress={() => navigateTo('create-trip')}
          >
            <View style={[styles.quickAccessIconContainer, { backgroundColor: '#4CAF50' }]}>
              <MaterialIcons name="add-circle-outline" size={24} color="white" />
            </View>
            <Text style={styles.quickAccessText}>Create Trip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAccessItem}
            onPress={() => navigateTo('tabs/explore')}
          >
            <View style={[styles.quickAccessIconContainer, { backgroundColor: '#FF9800' }]}>
              <MaterialIcons name="explore" size={24} color="white" />
            </View>
            <Text style={styles.quickAccessText}>Explore</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAccessItem}
            onPress={() => navigateTo('tabs/itinerary')}
          >
            <View style={[styles.quickAccessIconContainer, { backgroundColor: '#2196F3' }]}>
              <MaterialIcons name="event-note" size={24} color="white" />
            </View>
            <Text style={styles.quickAccessText}>Itinerary</Text>
          </TouchableOpacity>
        </View>
        
        {/* Upcoming Trips */}
        <View style={styles.sectionHeader}>
          <Text style={commonStyles.sectionTitle}>Upcoming Trips</Text>
          <TouchableOpacity onPress={() => navigateTo('tabs/itinerary')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingTrips.length > 0 ? (
          upcomingTrips.map((trip) => (
            <ImageCard
              key={trip.id}
              id={trip.id}
              title={trip.title || trip.destination}
              subtitle={`${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`}
              imageUrl={`https://source.unsplash.com/featured/?${trip.destination}`}
              type="trip"
              route="/trip/[id]"
              params={{ id: trip.id }}
              style={styles.tripCard}
              status={trip.status}
            />
          ))
        ) : (
          <Card style={styles.emptyStateCard}>
            <Card.Content style={styles.emptyStateContent}>
              <MaterialIcons name="flight" size={48} color={theme.colors.primary} />
              <Title style={styles.emptyStateTitle}>No upcoming trips</Title>
              <Paragraph style={styles.emptyStateParagraph}>
                Start planning your next adventure!
              </Paragraph>
              <Button 
                mode="contained" 
                onPress={() => navigateTo('create-trip')}
                style={styles.createTripButton}
              >
                Create Trip
              </Button>
            </Card.Content>
          </Card>
        )}
        
        <View style={styles.footer} />
      </ScrollView>
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
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subGreeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchbar: {
    borderRadius: theme.roundness,
    elevation: 4,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  seeAllText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  horizontalScroll: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  destinationCard: {
    width: 180,
    marginRight: 16,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    elevation: 4,
  },
  destinationImage: {
    width: '100%',
    height: 220,
    justifyContent: 'flex-end',
  },
  destinationGradient: {
    padding: 12,
    height: '50%',
    justifyContent: 'flex-end',
  },
  destinationContent: {
    padding: 8,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  destinationCountry: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    color: 'white',
    fontSize: 14,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAccessItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: theme.roundness,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  quickAccessIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  tripCard: {
    marginBottom: 16,
  },
  emptyStateCard: {
    marginBottom: 24,
    borderRadius: theme.roundness,
    elevation: 2,
  },
  emptyStateContent: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 18,
  },
  emptyStateParagraph: {
    textAlign: 'center',
    marginBottom: 16,
  },
  createTripButton: {
    marginTop: 8,
    backgroundColor: theme.colors.primary,
  },
  footer: {
    height: 40,
  },
});
