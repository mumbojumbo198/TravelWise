import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { Text, Button, Card, Chip, ActivityIndicator, IconButton, FAB, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getDestinationDetails, getDestinationAttractions } from '../../lib/destinationService';
import MapView, { Marker } from 'react-native-maps';

const { width } = Dimensions.get('window');

export default function DestinationScreen() {
  const { name, latitude, longitude } = useLocalSearchParams();
  const { user } = useAuth();
  const [destination, setDestination] = useState(null);
  const [attractions, setAttractions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadDestinationData();
  }, [name, latitude, longitude]);
  
  const loadDestinationData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load destination details and attractions in parallel
      const [destResponse, attrResponse] = await Promise.all([
        getDestinationDetails({ 
          name: decodeURIComponent(name),
          latitude,
          longitude
        }),
        getDestinationAttractions(decodeURIComponent(name))
      ]);
      
      if (destResponse.error) throw new Error(destResponse.error);
      setDestination(destResponse.data);
      
      if (attrResponse.error) {
        console.error('Error loading attractions:', attrResponse.error);
      } else {
        setAttractions(attrResponse.data);
      }
    } catch (err) {
      console.error('Error loading destination:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = () => {
    if (destination) {
      router.push({
        pathname: '/create-trip',
        params: { 
          destination: `${destination.name}, ${destination.country}`,
          prefill: 'true'
        }
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View>
            {/* Description */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>About {destination.name}</Text>
                <Text style={styles.description}>{destination.description}</Text>
              </Card.Content>
            </Card>
            
            {/* Quick Info */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Essential Information</Text>
                
                <View style={styles.infoItem}>
                  <MaterialIcons name="calendar-today" size={24} color="#4a148c" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Best Time to Visit</Text>
                    <Text style={styles.infoValue}>{details.best_time_to_visit}</Text>
                  </View>
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.infoItem}>
                  <MaterialIcons name="attach-money" size={24} color="#4a148c" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Daily Budget</Text>
                    <Text style={styles.infoValue}>{details.estimated_daily_budget}</Text>
                  </View>
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.infoItem}>
                  <MaterialIcons name="wb-sunny" size={24} color="#4a148c" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Weather & Climate</Text>
                    <Text style={styles.infoValue}>{details.local_weather_and_climate}</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
            
            {/* Cultural Highlights */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Cultural Highlights</Text>
                <Text style={styles.description}>{details.cultural_highlights_and_customs}</Text>
              </Card.Content>
            </Card>
            
            {/* Local Cuisine */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Local Cuisine</Text>
                <Text style={styles.description}>{details.local_cuisine_and_food_recommendations}</Text>
              </Card.Content>
            </Card>
          </View>
        );
      case 'wikipedia':
        return (
          <View>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Wikipedia</Text>
                <Text style={styles.description}>{destination.wikiSummary || destination.description}</Text>
                {destination.wikiImage && (
                  <Image
                    source={{ uri: destination.wikiImage }}
                    style={styles.wikiImage}
                    resizeMode="cover"
                  />
                )}
                <Button
                  mode="outlined"
                  onPress={() => Linking.openURL(`https://en.wikipedia.org/wiki/${encodeURIComponent(destination.name)}`)}
                  style={styles.wikiButton}
                >
                  Read more on Wikipedia
                </Button>
              </Card.Content>
            </Card>
          </View>
        );
      case 'map':
        return (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              <Marker
                coordinate={{
                  latitude: parseFloat(latitude),
                  longitude: parseFloat(longitude),
                }}
                title={decodeURIComponent(name)}
              />
            </MapView>
          </View>
        );
      case 'attractions':
        return (
          <View>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Top Attractions</Text>
                <Text style={styles.description}>{attractions || 'Loading attractions...'}</Text>
              </Card.Content>
            </Card>
          </View>
        );
      case 'tips':
        return (
          <View>
            {/* Transportation Tips */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Transportation Tips</Text>
                <Text style={styles.description}>{details.transportation_tips}</Text>
              </Card.Content>
            </Card>
            
            {/* Safety Tips */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Safety Tips</Text>
                <Text style={styles.description}>{details.safety_tips}</Text>
              </Card.Content>
            </Card>
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a148c" />
        <Text style={styles.loadingText}>Loading destination details...</Text>
      </View>
    );
  }

  if (error || !destination) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#c62828" />
        <Text style={styles.errorText}>
          {error || 'Destination not found'}
        </Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  // Parse the detailed information from Gemini response
  const details = destination.details.split('\n').reduce((acc, line) => {
    const section = line.match(/^-\s*(.*?):\s*(.*)/);
    if (section) {
      const [_, key, value] = section;
      acc[key.toLowerCase().replace(/\s+/g, '_')] = value.trim();
    }
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header with background image */}
        <View style={styles.header}>
          <Image
            source={{ uri: destination.image }}
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
              <Text style={styles.title}>{destination.name}</Text>
              <Text style={styles.subtitle}>{destination.country}</Text>
              <Text style={styles.location}>{destination.address}</Text>
            </View>
          </LinearGradient>
        </View>
        
        {/* Tab navigation */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'map' && styles.activeTab]}
              onPress={() => setActiveTab('map')}
            >
              <Text style={[styles.tabText, activeTab === 'map' && styles.activeTabText]}>Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'attractions' && styles.activeTab]}
              onPress={() => setActiveTab('attractions')}
            >
              <Text style={[styles.tabText, activeTab === 'attractions' && styles.activeTabText]}>Attractions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'tips' && styles.activeTab]}
              onPress={() => setActiveTab('tips')}
            >
              <Text style={[styles.tabText, activeTab === 'tips' && styles.activeTabText]}>Travel Tips</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'wikipedia' && styles.activeTab]}
              onPress={() => setActiveTab('wikipedia')}
            >
              <Text style={[styles.tabText, activeTab === 'wikipedia' && styles.activeTabText]}>Wikipedia</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {renderContent()}
      </ScrollView>
      
      {/* Floating action button */}
      <FAB
        icon="airplane"
        label="Plan Trip"
        style={styles.fab}
        onPress={handleCreateTrip}
      />
    </View>
  );
}

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
    height: 300,
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
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 20,
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  location: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: '#4a148c',
  },
  tabText: {
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
  },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  attribution: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    padding: 16,
    backgroundColor: '#f5f5f5'
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4a148c',
  },
  wikiImage: {
    width: '100%',
    height: 200,
    marginVertical: 16,
    borderRadius: 8,
  },
  wikiButton: {
    marginTop: 16,
  },
});
