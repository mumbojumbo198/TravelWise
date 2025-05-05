// OpenRouter API service for AI chatbot integration
// This service handles communication with OpenRouter to access Gemini model
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// OpenRouter API key and URL - Key should be moved to environment variables in production
const OPENROUTER_API_KEY = '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model to use - Gemma 3 27B
const MODEL = 'google/gemma-3-27b-it';

// Request configuration
const MAX_RETRIES = 1; // Reduced from 3 to 1
const INITIAL_TIMEOUT = 10000; // Reduced from 20000 to 10000
const RETRY_DELAY = 1000; // Reduced from 2000 to 1000
const MAX_TIMEOUT = 15000; // Reduced from 30000 to 15000

// Fallback responses for when API is not available
const FALLBACK_RESPONSES = [
  "I recommend visiting the local markets and trying the street food for an authentic experience.",
  "The best time to visit would be during the spring when the weather is mild and the crowds are smaller.",
  "You might want to check out the museum district, it has some amazing exhibits this time of year.",
  "For budget accommodation, I'd suggest looking at guesthouses in the old town area.",
  "Don't miss the sunset view from the hilltop viewpoint, it's absolutely breathtaking!",
  "A great day trip would be to the nearby coastal villages, they're just an hour away by bus.",
  "If you're interested in local culture, try to attend one of the traditional festivals happening this month.",
  "The hiking trails in the national park offer stunning views and are suitable for all experience levels.",
  "I suggest downloading the local transit app to make getting around the city much easier.",
  "The restaurant on the corner of Main Street and 5th Avenue has the best local cuisine in town."
];

/**
 * Check network connectivity
 * @returns {Promise<boolean>} - True if connected, false otherwise
 */
const checkNetworkConnection = async () => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected && netInfo.isInternetReachable;
};

/**
 * Make API request with retry mechanism
 * @param {Object} config - Request configuration
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise} - API response
 */
const makeRequestWithRetry = async (config, retryCount = 0) => {
  const timeoutDuration = Math.min(INITIAL_TIMEOUT + (retryCount * 5000), MAX_TIMEOUT);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

  try {
    const response = await fetch(OPENROUTER_URL, {
      ...config,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.log(`Request timed out after ${timeoutDuration}ms`);
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return makeRequestWithRetry(config, retryCount + 1);
      }
      throw new Error('Request timed out after all retry attempts');
    }

    if (retryCount < MAX_RETRIES && (error.message.includes('network') || error.message.includes('failed'))) {
      console.log(`Request failed, retrying (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return makeRequestWithRetry(config, retryCount + 1);
    }

    throw error;
  }
};

/**
 * Send a message to the AI model and get a response
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options for the API call
 * @returns {Promise} - Promise with the AI response
 */
export const sendMessageToAI = async (messages, options = {}) => {
  try {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      console.error('No network connection');
      return mockAIResponse(messages, 'network');
    }

    console.log('Sending message to OpenRouter API');
    
    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://travelwise.app',
        'X-Title': 'TravelWise AI Travel Assistant'
      },
      body: JSON.stringify({
        model: MODEL, // Using Gemma 3 27B model
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        top_p: options.top_p || 0.95,
        stream: false
      })
    };

    const response = await makeRequestWithRetry(config);
    const data = await response.json();

    if (!data.choices?.[0]?.message) {
      throw new Error('Invalid response format from OpenRouter API');
    }
    
    return data.choices[0].message;
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    return mockAIResponse(messages, error.message);
  }
};

/**
 * Generate a mock AI response when the API is not available
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} errorType - Type of error encountered
 * @returns {Object} - Mock AI response
 */
const mockAIResponse = (messages, errorType = '') => {
  // Get the last user message
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const userQuery = lastUserMessage?.content || '';
  
  let response = '';
  
  // Check for specific keywords to give more relevant responses
  if (userQuery.toLowerCase().includes('hello') || userQuery.toLowerCase().includes('hi')) {
    response = "Hello! I'm your TravelWise assistant. How can I help with your travel plans today?";
  } else if (userQuery.toLowerCase().includes('weather')) {
    response = "I don't have real-time weather data, but I can suggest checking a weather app for the most accurate forecast for your destination.";
  } else if (userQuery.toLowerCase().includes('hotel') || userQuery.toLowerCase().includes('stay') || userQuery.toLowerCase().includes('accommodation')) {
    response = "For accommodations, I recommend checking booking.com or Airbnb for options that match your budget and preferences. Look for places with good reviews and convenient locations near public transportation.";
  } else if (userQuery.toLowerCase().includes('restaurant') || userQuery.toLowerCase().includes('food') || userQuery.toLowerCase().includes('eat')) {
    response = "To find great local food, I suggest trying restaurants away from tourist areas. Ask locals for recommendations or use apps like TripAdvisor to find highly-rated authentic restaurants.";
  } else if (userQuery.toLowerCase().includes('flight') || userQuery.toLowerCase().includes('plane') || userQuery.toLowerCase().includes('airport')) {
    response = "For the best flight deals, I recommend booking 2-3 months in advance and using price comparison sites like Skyscanner or Google Flights. Being flexible with your dates can also help you find better prices.";
  } else if (userQuery.toLowerCase().includes('budget') || userQuery.toLowerCase().includes('money') || userQuery.toLowerCase().includes('cost')) {
    response = "To travel on a budget, consider visiting during shoulder season, staying in hostels or guesthouses, using public transportation, and eating where locals eat. Many cities also offer free walking tours and museum days.";
  } else if (userQuery.toLowerCase().includes('itinerary') || userQuery.toLowerCase().includes('plan') || userQuery.toLowerCase().includes('schedule')) {
    response = "When planning your itinerary, I suggest not overcrowding your schedule. Allow time for unexpected discoveries and rest. Group activities by location to minimize travel time, and include a mix of must-see attractions and off-the-beaten-path experiences.";
  } else {
    // If no specific keywords match, use a random fallback response
    const randomIndex = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
    response = FALLBACK_RESPONSES[randomIndex];
  }

  if (errorType === 'network') {
    response = "I'm having trouble connecting to the internet. Please check your connection and try again.";
  } else if (errorType === 'timeout' || errorType.includes('timed out')) {
    response = "I apologize for the delay. The service is taking longer than expected to respond. Please try again in a moment.";
  } else if (errorType.includes('rate limit')) {
    response = "I'm currently experiencing high demand. Please try again in a minute.";
  }
  
  return {
    role: 'assistant',
    content: response
  };
};

/**
 * Formats the conversation history for the OpenRouter API
 * @param {Array} messages - Array of message objects with sender and text properties
 * @returns {Array} - Formatted messages for OpenRouter API
 */
export const formatConversationForAI = (messages) => {
  // Initial system message to set the context
  const formattedMessages = [
    {
      role: 'system',
      content: 'You are an AI travel assistant for the TravelWise app. You help users plan trips, provide travel recommendations, answer questions about destinations, and offer personalized travel advice. Be friendly, helpful, and concise in your responses. If you don\'t know something, be honest about it.'
    }
  ];

  // Add user and assistant messages
  messages.forEach(message => {
    formattedMessages.push({
      role: message.sender === 'user' ? 'user' : 'assistant',
      content: message.text
    });
  });

  return formattedMessages;
};

/**
 * Generate travel recommendations based on user preferences
 * @param {Object} preferences - User preferences for travel
 * @returns {Promise} - Promise with AI-generated recommendations
 */
export const generateTravelRecommendations = async (preferences) => {
  try {
    const prompt = `Based on the following user preferences, suggest 3-5 travel destinations with brief descriptions:
    Travel Style: ${preferences.travelStyle || 'Not specified'}
    Budget: ${preferences.budget || 'Not specified'}
    Interests: ${preferences.interests?.join(', ') || 'Not specified'}
    Season: ${preferences.season || 'Not specified'}
    Duration: ${preferences.duration || 'Not specified'}
    
    For each destination, include:
    1. Why it's a good match for their preferences
    2. Best time to visit
    3. One must-see attraction
    4. Estimated daily budget`;

    const messages = [
      { role: 'system', content: 'You are a travel recommendation expert for the TravelWise app.' },
      { role: 'user', content: prompt }
    ];

    const response = await sendMessageToAI(messages);
    return response.content;
  } catch (error) {
    console.error('Error generating travel recommendations:', error);
    throw error;
  }
};

/**
 * Generate an itinerary for a specific destination
 * @param {Object} tripDetails - Details about the trip
 * @returns {Promise} - Promise with AI-generated itinerary
 */
export const generateItinerary = async (tripDetails) => {
  try {
    const prompt = `Create a detailed day-by-day itinerary for a trip to ${tripDetails.destination} for ${tripDetails.duration} days.
    
    Trip Details:
    - Destination: ${tripDetails.destination}
    - Duration: ${tripDetails.duration} days
    - Start Date: ${tripDetails.startDate}
    - End Date: ${tripDetails.endDate}
    - Interests: ${tripDetails.interests?.join(', ') || 'General sightseeing'}
    - Budget Level: ${tripDetails.budget || 'Medium'}
    
    For each day, include:
    1. Morning activities (with approximate times)
    2. Lunch recommendation
    3. Afternoon activities
    4. Dinner recommendation
    5. Evening activities (if applicable)
    
    Also include practical tips like transportation between locations and estimated costs where relevant.`;

    const messages = [
      { role: 'system', content: 'You are an expert travel itinerary planner for the TravelWise app.' },
      { role: 'user', content: prompt }
    ];

    const response = await sendMessageToAI(messages, { temperature: 0.8, max_tokens: 1500 });
    return response.content;
  } catch (error) {
    console.error('Error generating itinerary:', error);
    throw error;
  }
};
