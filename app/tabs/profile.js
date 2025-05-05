import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Card, TextInput, Avatar, Divider, Switch } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [preferences, setPreferences] = useState({
    notifications: true,
    darkMode: false,
    offlineMode: true,
    language: 'English',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    tripsPlanned: 0,
    tripsCompleted: 0,
    countriesVisited: 0,
  });

  useEffect(() => {
    if (user?.profile) {
      setUsername(user.profile.username || '');
      setBio(user.profile.bio || '');
      setProfileImage(user.profile.avatar_url || null);
      
      // Load preferences from profile or defaults
      if (user.profile.preferences) {
        try {
          setPreferences(JSON.parse(user.profile.preferences));
        } catch (e) {
          console.error('Error parsing preferences:', e);
        }
      }
    }
    
    // Load trip stats
    loadTripStats();
  }, [user]);

  const loadTripStats = async () => {
    try {
      // Try to get cached trips from AsyncStorage
      const cachedTrips = await AsyncStorage.getItem('@travelwise:trips');
      if (cachedTrips) {
        const trips = JSON.parse(cachedTrips);
        const userTrips = trips.filter(trip => trip.user_id === user?.id);
        
        // Calculate stats
        const completed = userTrips.filter(trip => trip.status === 'completed').length;
        const countries = new Set(userTrips.map(trip => trip.destination.split(',').pop().trim()));
        
        setStats({
          tripsPlanned: userTrips.length,
          tripsCompleted: completed,
          countriesVisited: countries.size,
        });
      }
    } catch (error) {
      console.error('Error loading trip stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const updatedProfile = {
        username,
        bio,
        avatar_url: profileImage,
        preferences: JSON.stringify(preferences),
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await updateProfile(updatedProfile);
      
      if (error) {
        Alert.alert('Error', 'Failed to update profile');
      } else {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const pickImage = async () => {
    const placeholderImages = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12'
    ];
    
    const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
    setProfileImage(randomImage);
  };

  const renderProfileHeader = () => (
    <LinearGradient
      colors={['#4a148c', '#7b1fa2', '#e1bee7']}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={isEditing ? pickImage : null}
          disabled={!isEditing}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <Avatar.Text 
              size={100} 
              label={username?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'TW'} 
              style={styles.avatar}
            />
          )}
          {isEditing && (
            <View style={styles.editAvatarIcon}>
              <MaterialIcons name="edit" size={24} color="white" />
            </View>
          )}
        </TouchableOpacity>
        
        {isEditing ? (
          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            style={styles.usernameInput}
            mode="outlined"
          />
        ) : (
          <Text style={styles.username}>{username || user?.email?.split('@')[0] || 'Traveler'}</Text>
        )}
        
        <Text style={styles.email}>{user?.email}</Text>
      </View>
    </LinearGradient>
  );

  const renderStats = () => (
    <Card style={styles.statsCard}>
      <Card.Content style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.tripsPlanned}</Text>
          <Text style={styles.statLabel}>Trips Planned</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.tripsCompleted}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.countriesVisited}</Text>
          <Text style={styles.statLabel}>Countries</Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderBio = () => (
    <Card style={styles.bioCard}>
      <Card.Title title="About Me" />
      <Card.Content>
        {isEditing ? (
          <TextInput
            label="Bio"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            mode="outlined"
          />
        ) : (
          <Text style={styles.bioText}>{bio || 'No bio yet. Tap edit to add one!'}</Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderPreferences = () => (
    <Card style={styles.preferencesCard}>
      <Card.Title title="Preferences" />
      <Card.Content>
        <View style={styles.preferenceItem}>
          <Text>Push Notifications</Text>
          <Switch
            value={preferences.notifications}
            onValueChange={(value) => 
              setPreferences({...preferences, notifications: value})
            }
            disabled={!isEditing}
          />
        </View>
        <Divider style={styles.divider} />
        
        <View style={styles.preferenceItem}>
          <Text>Dark Mode</Text>
          <Switch
            value={preferences.darkMode}
            onValueChange={(value) => 
              setPreferences({...preferences, darkMode: value})
            }
            disabled={!isEditing}
          />
        </View>
        <Divider style={styles.divider} />
        
        <View style={styles.preferenceItem}>
          <Text>Save Trips Offline</Text>
          <Switch
            value={preferences.offlineMode}
            onValueChange={(value) => 
              setPreferences({...preferences, offlineMode: value})
            }
            disabled={!isEditing}
          />
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      {renderProfileHeader()}
      
      <View style={styles.content}>
        {renderStats()}
        {renderBio()}
        {renderPreferences()}
        
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <>
              <Button 
                mode="contained" 
                onPress={handleSaveProfile} 
                loading={isLoading}
                style={styles.button}
              >
                Save Profile
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => setIsEditing(false)}
                style={[styles.button, styles.cancelButton]}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button 
                mode="contained" 
                onPress={() => setIsEditing(true)}
                style={styles.button}
                icon="account-edit"
              >
                Edit Profile
              </Button>
              <Button 
                mode="outlined" 
                onPress={handleLogout}
                style={[styles.button, styles.logoutButton]}
                icon="logout"
              >
                Log Out
              </Button>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
    borderRadius: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#7b1fa2',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  usernameInput: {
    width: '80%',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  email: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
  },
  content: {
    padding: 16,
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7b1fa2',
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
  },
  bioCard: {
    marginBottom: 16,
    elevation: 2,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
  },
  preferencesCard: {
    marginBottom: 16,
    elevation: 2,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  button: {
    marginVertical: 8,
    paddingVertical: 6,
  },
  cancelButton: {
    borderColor: '#757575',
  },
  logoutButton: {
    borderColor: '#f44336',
  },
});
