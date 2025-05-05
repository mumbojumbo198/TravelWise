import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

// Sample itinerary data
const sampleItinerary = {
  destination: 'Paris, France',
  dates: 'May 15 - May 22, 2025',
  days: [
    {
      id: '1',
      date: 'May 15, 2025',
      activities: [
        { id: '1-1', time: '09:00 AM', title: 'Arrival at Charles de Gaulle Airport', type: 'transport' },
        { id: '1-2', time: '11:30 AM', title: 'Check-in at Hotel', type: 'accommodation' },
        { id: '1-3', time: '01:00 PM', title: 'Lunch at Café de Flore', type: 'food' },
        { id: '1-4', time: '03:00 PM', title: 'Explore Saint-Germain-des-Prés', type: 'activity' },
        { id: '1-5', time: '07:00 PM', title: 'Dinner at Le Comptoir', type: 'food' },
      ]
    },
    {
      id: '2',
      date: 'May 16, 2025',
      activities: [
        { id: '2-1', time: '08:30 AM', title: 'Breakfast at Hotel', type: 'food' },
        { id: '2-2', time: '10:00 AM', title: 'Visit the Louvre Museum', type: 'activity' },
        { id: '2-3', time: '01:30 PM', title: 'Lunch at Angelina', type: 'food' },
        { id: '2-4', time: '03:00 PM', title: 'Walk through Tuileries Garden', type: 'activity' },
        { id: '2-5', time: '04:30 PM', title: 'Shopping on Champs-Élysées', type: 'activity' },
        { id: '2-6', time: '08:00 PM', title: 'Dinner at Le Jules Verne (Eiffel Tower)', type: 'food' },
      ]
    },
  ]
};

export default function ItineraryScreen() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState(sampleItinerary);
  const [activeDay, setActiveDay] = useState('1');

  // Get the activities for the active day
  const activeDayData = itinerary.days.find(day => day.id === activeDay);

  // Function to get icon based on activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'transport': return '✈️';
      case 'accommodation': return '🏨';
      case 'food': return '🍽️';
      case 'activity': return '🎭';
      default: return '📌';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Itinerary Planner</Text>
        <TouchableOpacity>
          <Text style={styles.editButton}>Edit</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tripInfo}>
        <Text style={styles.destination}>{itinerary.destination}</Text>
        <Text style={styles.dates}>{itinerary.dates}</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysContainer}>
        {itinerary.days.map(day => (
          <TouchableOpacity 
            key={day.id}
            style={[styles.dayTab, activeDay === day.id && styles.activeDayTab]}
            onPress={() => setActiveDay(day.id)}
          >
            <Text style={[styles.dayTabText, activeDay === day.id && styles.activeDayTabText]}>
              Day {day.id}
            </Text>
            <Text style={[styles.dayTabDate, activeDay === day.id && styles.activeDayTabText]}>
              {day.date.split(',')[0]}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addDayTab}>
          <Text style={styles.addDayText}>+ Add Day</Text>
        </TouchableOpacity>
      </ScrollView>
      
      <ScrollView style={styles.activitiesContainer}>
        {activeDayData?.activities.map((activity, index) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityTimeContainer}>
              <Text style={styles.activityTime}>{activity.time}</Text>
              {index < activeDayData.activities.length - 1 && (
                <View style={styles.timeConnector} />
              )}
            </View>
            
            <View style={styles.activityContent}>
              <View style={styles.activityIconContainer}>
                <Text style={styles.activityIcon}>{getActivityIcon(activity.type)}</Text>
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityType}>{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</Text>
              </View>
              <TouchableOpacity style={styles.activityOptions}>
                <Text>⋮</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        <TouchableOpacity style={styles.addActivityButton}>
          <Text style={styles.addActivityButtonText}>+ Add Activity</Text>
        </TouchableOpacity>
      </ScrollView>
      
      <View style={styles.aiSuggestionContainer}>
        <View style={styles.aiSuggestionHeader}>
          <Text style={styles.aiSuggestionTitle}>AI Suggestion</Text>
          <TouchableOpacity>
            <Text style={styles.refreshButton}>🔄</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.aiSuggestionText}>
          Consider visiting Montmartre and Sacré-Cœur Basilica on your third day. The area offers beautiful views of Paris and a charming artistic atmosphere.
        </Text>
        <View style={styles.aiSuggestionActions}>
          <TouchableOpacity style={styles.aiActionButton}>
            <Text style={styles.aiActionButtonText}>Add to Itinerary</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.aiActionButton, styles.aiActionButtonSecondary]}>
            <Text style={styles.aiActionButtonTextSecondary}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  editButton: {
    color: '#fff',
    fontSize: 16,
  },
  tripInfo: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  destination: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dates: {
    fontSize: 16,
    color: '#666',
  },
  daysContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  activeDayTab: {
    backgroundColor: '#0066cc',
  },
  dayTabText: {
    fontWeight: 'bold',
    color: '#333',
  },
  dayTabDate: {
    fontSize: 12,
    color: '#666',
  },
  activeDayTabText: {
    color: '#fff',
  },
  addDayTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDayText: {
    color: '#0066cc',
    fontWeight: 'bold',
  },
  activitiesContainer: {
    flex: 1,
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  activityTimeContainer: {
    width: 80,
    alignItems: 'center',
  },
  activityTime: {
    fontSize: 14,
    color: '#666',
  },
  timeConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#ddd',
    marginTop: 5,
    marginBottom: -15,
    alignSelf: 'center',
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  activityType: {
    fontSize: 14,
    color: '#666',
  },
  activityOptions: {
    padding: 5,
  },
  addActivityButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  addActivityButtonText: {
    color: '#0066cc',
    fontWeight: '500',
  },
  aiSuggestionContainer: {
    backgroundColor: '#e6f2ff',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    marginTop: 0,
  },
  aiSuggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiSuggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  refreshButton: {
    fontSize: 16,
  },
  aiSuggestionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  aiSuggestionActions: {
    flexDirection: 'row',
  },
  aiActionButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
  },
  aiActionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  aiActionButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  aiActionButtonTextSecondary: {
    color: '#0066cc',
    fontWeight: '500',
    fontSize: 14,
  },
});
