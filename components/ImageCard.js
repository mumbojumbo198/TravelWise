import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

/**
 * A reusable image card component for displaying places, trips, activities, etc.
 * 
 * @param {Object} props
 * @param {string} props.id - Unique identifier for the item
 * @param {string} props.title - Main title text
 * @param {string} props.subtitle - Subtitle or description text
 * @param {string} props.imageUrl - URL for the background image
 * @param {string} props.type - Type of item (trip, activity, place, etc.)
 * @param {string} props.icon - Material icon name for the type
 * @param {string} props.color - Color for the type indicator
 * @param {string} props.route - Route to navigate to when card is pressed
 * @param {Object} props.params - Params to pass to the route
 * @param {string} props.date - Date string if applicable
 * @param {boolean} props.horizontal - Whether to use horizontal layout
 * @param {Object} props.style - Additional style for the card
 */
export default function ImageCard({
  id,
  title,
  subtitle,
  imageUrl,
  type = 'place',
  icon = 'place',
  color = '#4a148c',
  route,
  params = {},
  date,
  horizontal = false,
  style = {},
}) {
  // Default image based on type if none provided
  const defaultImages = {
    trip: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
    activity: 'https://images.unsplash.com/photo-1533105079780-92b9be482077',
    food: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
    transport: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05',
    accommodation: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    place: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
  };
  
  const finalImageUrl = imageUrl || defaultImages[type] || defaultImages.place;
  
  // Get icon and color based on type
  const getTypeIcon = () => {
    switch (type) {
      case 'trip': return 'flight-takeoff';
      case 'activity': return 'event';
      case 'food': return 'restaurant';
      case 'transport': return 'flight';
      case 'accommodation': return 'hotel';
      default: return icon || 'place';
    }
  };
  
  const getTypeColor = () => {
    switch (type) {
      case 'trip': return '#4a148c';
      case 'activity': return '#7cb342';
      case 'food': return '#f57c00';
      case 'transport': return '#5c6bc0';
      case 'accommodation': return '#26a69a';
      default: return color;
    }
  };
  
  const handlePress = () => {
    if (route) {
      router.push({
        pathname: route,
        params: { id, ...params }
      });
    }
  };
  
  return (
    <TouchableOpacity 
      onPress={handlePress}
      activeOpacity={0.9}
      style={[
        styles.container,
        horizontal ? styles.horizontalContainer : {},
        style
      ]}
    >
      <Card style={horizontal ? styles.horizontalCard : styles.card}>
        <Image 
          source={{ uri: finalImageUrl + '?w=500&auto=format&fit=crop' }} 
          style={horizontal ? styles.horizontalImage : styles.image}
          resizeMode="cover"
        />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={horizontal ? styles.horizontalGradient : styles.gradient}
        >
          <View style={styles.contentContainer}>
            <View style={styles.typeContainer}>
              <Chip 
                icon={() => <MaterialIcons name={getTypeIcon()} size={16} color="white" />}
                style={[styles.typeChip, { backgroundColor: getTypeColor() }]}
              >
                <Text style={styles.typeText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              </Chip>
              
              {date && (
                <Chip 
                  icon="calendar"
                  style={styles.dateChip}
                >
                  <Text style={styles.dateText}>{date}</Text>
                </Chip>
              )}
            </View>
            
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={horizontal ? 1 : 2}>
                {subtitle}
              </Text>
            )}
          </View>
        </LinearGradient>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  horizontalContainer: {
    width: width * 0.85,
    marginRight: 16,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
  },
  horizontalCard: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 150,
    flexDirection: 'row',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  horizontalImage: {
    width: '40%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  horizontalGradient: {
    position: 'absolute',
    left: '40%',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 16,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  typeChip: {
    height: 28,
    marginRight: 8,
  },
  typeText: {
    color: 'white',
    fontSize: 12,
  },
  dateChip: {
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateText: {
    color: 'white',
    fontSize: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
