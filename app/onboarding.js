import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

const onboardingSteps = [
  {
    title: 'AI Travel Assistant',
    description: 'Get personalized recommendations and real-time assistance from our intelligent chatbot.',
    icon: '🤖',
  },
  {
    title: 'Smart Itinerary Planner',
    description: 'Create and manage your travel plans with our drag-and-drop itinerary builder.',
    icon: '📅',
  },
  {
    title: 'Personalized Recommendations',
    description: 'Discover flights, hotels, and activities tailored to your preferences and budget.',
    icon: '✨',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/dashboard');
    }
  };

  const handleSkip = () => {
    router.replace('/dashboard');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      
      <ScrollView 
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.scrollContent}
      >
        {onboardingSteps.map((step, index) => (
          <View key={index} style={[styles.step, { display: currentStep === index ? 'flex' : 'none' }]}>
            <Text style={styles.icon}>{step.icon}</Text>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.indicatorContainer}>
        {onboardingSteps.map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.indicator, 
              { backgroundColor: currentStep === index ? '#0066cc' : '#ddd' }
            ]} 
          />
        ))}
      </View>
      
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {currentStep < onboardingSteps.length - 1 ? 'Next' : 'Get Started'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  skipText: {
    color: '#0066cc',
    fontSize: 16,
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  step: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#0066cc',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#555',
    lineHeight: 24,
  },
  indicatorContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  button: {
    backgroundColor: '#0066cc',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
