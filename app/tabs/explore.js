import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ImageBackground, FlatList } from 'react-native';
import { Text, Searchbar, Button, Card, Title, Paragraph, Chip, ActivityIndicator, Surface } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { searchDestinations } from '../../lib/destinationService';
import { LinearGradient } from 'expo-linear-gradient';
import debounce from 'lodash/debounce';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  
  // Debounce search to respect API rate limits
  const debouncedSearch = useCallback(
    debounce(async (text) => {
      if (text.length >= 2) {
        setLoading(true);
        setShowResults(true);
        setError(null);
        setImageLoadErrors({});
        
        try {
          const { data, error } = await searchDestinations(text);
          if (error) throw new Error(error);
          setSearchResults(data || []);
        } catch (err) {
          console.error('Search error:', err);
          setError(err.message);
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setShowResults(false);
        setSearchResults([]);
        setError(null);
      }
    }, 500),
    []
  );

  const handleSearch = (text) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleRetry = () => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    }
  };

  const handleImageError = (itemId) => {
    setImageLoadErrors(prev => ({
      ...prev,
      [itemId]: true
    }));
  };

  const handleDestinationPress = (destination) => {
    router.push({
      pathname: `/destination/${encodeURIComponent(destination.name)}`,
      params: { 
        name: destination.name,
        latitude: destination.latitude,
        longitude: destination.longitude
      }
    });
  };

  const renderSearchResult = ({ item }) => (
    <Surface style={styles.resultCard} elevation={2}>
      <ImageBackground
        source={{ 
          uri: imageLoadErrors[item.id] 
            ? getFallbackImage(item.categoryType.toLowerCase())
            : item.image
        }}
        style={styles.resultImage}
        imageStyle={{ borderRadius: 8 }}
        onError={() => handleImageError(item.id)}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.resultGradient}
        >
          <View style={styles.resultContent}>
            <Title style={styles.resultTitle}>{item.name}</Title>
            <View style={styles.locationRow}>
              <MaterialIcons name="place" size={16} color="#fff" />
              <Text style={styles.resultLocation}>
                {[item.city, item.state, item.country].filter(Boolean).join(', ')}
              </Text>
            </View>
            <View style={styles.chipRow}>
              <Chip 
                style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.categoryType) }]}
                textStyle={styles.chipText}
              >
                {item.categoryType}
              </Chip>
              <Chip
                icon="arrow-right"
                style={styles.exploreChip}
                textStyle={styles.chipText}
                onPress={() => handleDestinationPress(item)}
              >
                Explore
              </Chip>
            </View>
            {item.imageAttribution && (
              <Text style={styles.attribution}>
                Photo by {item.imageAttribution.name} on Unsplash
              </Text>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </Surface>
  );

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Urban': return 'rgba(33, 150, 243, 0.8)';
      case 'Nature': return 'rgba(76, 175, 80, 0.8)';
      case 'Tourist': return 'rgba(255, 152, 0, 0.8)';
      case 'Historical': return 'rgba(121, 85, 72, 0.8)';
      default: return 'rgba(158, 158, 158, 0.8)';
    }
  };

  const getFallbackImage = (category) => {
    const fallbackImages = {
      urban: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df',
      nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
      tourist: 'https://images.unsplash.com/photo-1488747279002-c8523379faaa',
      historical: 'https://images.unsplash.com/photo-1552206112-a82e92cdce8f',
      default: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470'
    };
    return fallbackImages[category] || fallbackImages.default;
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a148c" />
          <Text style={styles.loadingText}>Searching destinations...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="error-outline" size={64} color="#c62828" />
          <Text style={styles.emptyTitle}>Search Error</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={handleRetry}
            style={styles.retryButton}
          >
            Try Again
          </Button>
        </View>
      );
    }

    if (searchQuery.length >= 2) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={64} color="#9e9e9e" />
          <Text style={styles.emptyTitle}>No destinations found</Text>
          <Text style={styles.emptyText}>Try adjusting your search terms</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4a148c', '#7b1fa2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Explore Destinations</Text>
        <Text style={styles.headerSubtitle}>Discover your next adventure</Text>
        
        <Searchbar
          placeholder="Search cities, countries, regions..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#4a148c"
          inputStyle={styles.searchInput}
        />
      </LinearGradient>
      
      {showResults ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={item => (item?.id ?? Math.random()).toString()}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={renderEmptyState}
        />
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          {/* Add your popular destinations content here */}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    paddingTop: 48,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  searchBar: {
    elevation: 4,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  searchInput: {
    color: '#333',
  },
  resultsList: {
    padding: 16,
  },
  resultCard: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  resultImage: {
    height: 200,
    justifyContent: 'flex-end',
  },
  resultGradient: {
    height: '100%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  resultContent: {
    flexDirection: 'column',
  },
  resultTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLocation: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginLeft: 4,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryChip: {
    height: 28,
  },
  exploreChip: {
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  chipText: {
    color: 'white',
    fontSize: 12,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#4a148c',
  },
  attribution: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
