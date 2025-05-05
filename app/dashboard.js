import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Use profile directly from user object
  const userProfile = user?.profile;

  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
    // This would be replaced with actual search logic
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

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello, {userProfile?.username || 'Traveler'}!</Text>
            <Text style={styles.subGreeting}>Where to next?</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.profileButton}>
            <Text style={styles.profileButtonText}>{userProfile?.username?.[0] || '👤'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search destinations, hotels, activities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        
        <View style={styles.quickAccessGrid}>
          <TouchableOpacity 
            style={styles.quickAccessItem} 
            onPress={() => navigateTo('chatbot')}
          >
            <Text style={styles.quickAccessIcon}>💬</Text>
            <Text style={styles.quickAccessText}>Chatbot</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAccessItem}
            onPress={() => navigateTo('itinerary')}
          >
            <Text style={styles.quickAccessIcon}>📅</Text>
            <Text style={styles.quickAccessText}>Itinerary</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAccessItem}
            onPress={() => navigateTo('trips')}
          >
            <Text style={styles.quickAccessIcon}>🧳</Text>
            <Text style={styles.quickAccessText}>Saved Trips</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAccessItem}
            onPress={() => navigateTo('recommendations')}
          >
            <Text style={styles.quickAccessIcon}>✨</Text>
            <Text style={styles.quickAccessText}>Recommendations</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.sectionTitle}>Popular Destinations</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.destinationsContainer}
        >
          {['Paris', 'Tokyo', 'New York', 'Bali', 'Rome'].map((city, index) => (
            <TouchableOpacity key={index} style={styles.destinationCard}>
              <View style={styles.destinationImagePlaceholder}>
                <Text style={styles.destinationImageText}>{city[0]}</Text>
              </View>
              <Text style={styles.destinationName}>{city}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <Text style={styles.sectionTitle}>Upcoming Trip</Text>
        
        <TouchableOpacity style={styles.upcomingTripCard}>
          <Text style={styles.upcomingTripTitle}>No upcoming trips</Text>
          <Text style={styles.upcomingTripSubtitle}>Start planning your next adventure!</Text>
          <TouchableOpacity 
            style={styles.planTripButton}
            onPress={() => navigateTo('itinerary')}
          >
            <Text style={styles.planTripButtonText}>Plan a Trip</Text>
          </TouchableOpacity>
        </TouchableOpacity>
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
    backgroundColor: '#0066cc',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  searchButton: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quickAccessIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '500',
  },
  destinationsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  destinationCard: {
    marginRight: 15,
    width: 120,
    alignItems: 'center',
  },
  destinationImagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#0066cc',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  destinationImageText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  destinationName: {
    fontSize: 14,
    fontWeight: '500',
  },
  upcomingTripCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    alignItems: 'center',
  },
  upcomingTripTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  upcomingTripSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  planTripButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  planTripButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});
