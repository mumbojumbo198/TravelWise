import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Text, TextInput, Button, ActivityIndicator, HelperText, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
// We'll use a different date picker since @react-native-community/datetimepicker is causing issues
import { Button as PaperButton } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { fetchTripById, updateTrip } from '../lib/tripService';

export default function EditTripScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [status, setStatus] = useState('planned');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Form validation
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    if (tripId && user) {
      loadTripDetails();
    }
  }, [tripId, user]);
  
  const loadTripDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await fetchTripById(tripId);
      
      if (error) throw error;
      
      if (data) {
        setDestination(data.destination);
        setDescription(data.description || '');
        setStartDate(new Date(data.start_date));
        setEndDate(new Date(data.end_date));
        setStatus(data.status);
      }
    } catch (err) {
      console.error('Error loading trip details:', err.message);
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    
    if (endDate < startDate) {
      newErrors.dates = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      const tripData = {
        destination,
        description,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await updateTrip(tripId, tripData);
      
      if (error) throw error;
      
      if (data) {
        Alert.alert(
          'Success',
          'Trip updated successfully!',
          [
            { 
              text: 'View Trip', 
              onPress: () => router.replace({
                pathname: `/trip/${tripId}`,
                params: { id: tripId }
              })
            }
          ]
        );
      }
    } catch (err) {
      console.error('Error updating trip:', err.message);
      Alert.alert('Error', 'Failed to update trip. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleStartDateChange = () => {
    // Simple date increment for demo purposes
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + 1);
    setStartDate(newDate);
    
    // If end date is before new start date, update end date
    if (endDate < newDate) {
      setEndDate(newDate);
    }
    
    setShowStartDatePicker(false);
  };
  
  const handleEndDateChange = () => {
    // Simple date increment for demo purposes
    const newDate = new Date(endDate);
    newDate.setDate(newDate.getDate() + 1);
    setEndDate(newDate);
    
    setShowEndDatePicker(false);
  };
  
  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadTripDetails}>Retry</Button>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Trip</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.content}>
        <TextInput
          label="Destination"
          value={destination}
          onChangeText={setDestination}
          style={styles.input}
          mode="outlined"
          error={!!errors.destination}
        />
        {errors.destination && (
          <HelperText type="error" visible={!!errors.destination}>
            {errors.destination}
          </HelperText>
        )}
        
        <TextInput
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={3}
        />
        
        <Text style={styles.sectionTitle}>Trip Dates</Text>
        
        <View style={styles.dateContainer}>
          <View style={styles.dateInput}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(startDate)}</Text>
              <MaterialIcons name="event" size={24} color="#0066cc" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateInput}>
            <Text style={styles.dateLabel}>End Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(endDate)}</Text>
              <MaterialIcons name="event" size={24} color="#0066cc" />
            </TouchableOpacity>
          </View>
        </View>
        
        {errors.dates && (
          <HelperText type="error" visible={!!errors.dates}>
            {errors.dates}
          </HelperText>
        )}
        
        {/* Using manual date selection instead of DateTimePicker component */}
        
        <Text style={styles.sectionTitle}>Trip Status</Text>
        
        <View style={styles.statusContainer}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === 'planned' && styles.statusButtonActive
            ]}
            onPress={() => setStatus('planned')}
          >
            <MaterialIcons
              name="edit"
              size={24}
              color={status === 'planned' ? '#fff' : '#0066cc'}
            />
            <Text
              style={[
                styles.statusText,
                status === 'planned' && styles.statusTextActive
              ]}
            >
              Planned
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === 'active' && styles.statusButtonActive
            ]}
            onPress={() => setStatus('active')}
          >
            <MaterialIcons
              name="flight-takeoff"
              size={24}
              color={status === 'active' ? '#fff' : '#0066cc'}
            />
            <Text
              style={[
                styles.statusText,
                status === 'active' && styles.statusTextActive
              ]}
            >
              Active
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === 'completed' && styles.statusButtonActive
            ]}
            onPress={() => setStatus('completed')}
          >
            <MaterialIcons
              name="check-circle"
              size={24}
              color={status === 'completed' ? '#fff' : '#0066cc'}
            />
            <Text
              style={[
                styles.statusText,
                status === 'completed' && styles.statusTextActive
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === 'cancelled' && styles.statusButtonActive
            ]}
            onPress={() => setStatus('cancelled')}
          >
            <MaterialIcons
              name="cancel"
              size={24}
              color={status === 'cancelled' ? '#fff' : '#0066cc'}
            />
            <Text
              style={[
                styles.statusText,
                status === 'cancelled' && styles.statusTextActive
              ]}
            >
              Cancelled
            </Text>
          </TouchableOpacity>
        </View>
        
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          loading={saving}
          disabled={saving}
        >
          Save Changes
        </Button>
      </ScrollView>
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
    backgroundColor: '#0066cc',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 15,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateInput: {
    width: '48%',
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0066cc',
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  statusButtonActive: {
    backgroundColor: '#0066cc',
  },
  statusText: {
    color: '#0066cc',
    marginLeft: 8,
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#fff',
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});
