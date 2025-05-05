import { sendMessageToAI } from './openRouterService';
import { getDestinationPhotoUrl, cacheDestinationPhotos } from './unsplashService';

// Rate limiting configuration for OpenStreetMap API
const RATE_LIMIT_DELAY = 500; // Reduced from 1000ms to 500ms
let lastRequestTime = 0;

// Add cache at the top of the file after imports
const destinationCache = new Map();
const CACHE_DURATION = 1000 * 60 * 60 * 24; // Increased cache duration to 24 hours for better performance

// Fallback data for popular destinations
const POPULAR_DESTINATION_FALLBACKS = {
  'Paris': {
    description: 'The City of Light, known for its iconic Eiffel Tower, world-class museums, and exquisite cuisine.',
    details: `Best time to visit: April-June, September-November
Popular attractions and activities: Eiffel Tower, Louvre Museum, Notre-Dame Cathedral, Arc de Triomphe, River Seine cruises
Local cuisine and food recommendations: Croissants, Coq au Vin, French pastries, Fine dining restaurants
Transportation tips: Metro system is extensive and efficient, Walking is great for central areas
Cultural highlights and customs: Art, fashion, café culture, Wine appreciation
Estimated daily budget (in USD): $150-200
Safety tips: Be aware of pickpockets in tourist areas, Keep valuables secure
Local weather and climate: Mild with occasional rain, Warm summers and cool winters`
  },
  'Tokyo': {
    description: 'A fascinating blend of ultramodern and traditional, Tokyo is Japan\'s bustling capital.',
    details: `Best time to visit: March-April (cherry blossoms), October-November
Popular attractions and activities: Shibuya Crossing, Senso-ji Temple, Tokyo Skytree, Tsukiji Fish Market
Local cuisine and food recommendations: Sushi, Ramen, Tempura, Izakaya dining
Transportation tips: Efficient train and subway system, Get a IC transport card
Cultural highlights and customs: Respect local etiquette, Bow when greeting, Remove shoes indoors
Estimated daily budget (in USD): $100-150
Safety tips: One of the safest major cities, Natural disaster preparation
Local weather and climate: Hot humid summers, Mild winters, Cherry blossom season in spring`
  },
  'New York': {
    description: 'The City That Never Sleeps, featuring iconic skyscrapers, Broadway shows, and diverse culture.',
    details: `Best time to visit: April-June, September-November
Popular attractions and activities: Times Square, Central Park, Statue of Liberty, Broadway shows
Local cuisine and food recommendations: Pizza, Bagels, Food trucks, Diverse international cuisine
Transportation tips: Subway runs 24/7, Yellow cabs are abundant
Cultural highlights and customs: Fast-paced lifestyle, Arts and theater scene, Shopping
Estimated daily budget (in USD): $200-250
Safety tips: Stay aware in busy areas, Keep belongings close
Local weather and climate: Hot summers, Cold winters, Pleasant spring and fall`
  },
  'Bali': {
    description: 'A tropical paradise known for its beautiful beaches, vibrant culture, and spiritual atmosphere.',
    details: `Best time to visit: April-October (dry season)
Popular attractions and activities: Uluwatu Temple, Ubud Monkey Forest, Rice terraces, Nusa Penida island
Local cuisine and food recommendations: Nasi Goreng, Satay Lilit, Fresh seafood, Traditional warungs
Transportation tips: Rent a scooter, Use Grab/Gojek apps, Book reliable drivers
Cultural highlights and customs: Temple etiquette, Traditional dances, Local ceremonies
Estimated daily budget (in USD): $50-100
Safety tips: Use reputable transport, Respect local customs, Stay hydrated
Local weather and climate: Tropical climate, Dry and wet seasons, Consistently warm`
  },
  'Rome': {
    description: 'The Eternal City, home to ancient ruins, artistic masterpieces, and world-renowned cuisine.',
    details: `Best time to visit: March-May, September-November
Popular attractions and activities: Colosseum, Vatican Museums, Roman Forum, Trevi Fountain
Local cuisine and food recommendations: Pasta alla Carbonara, Pizza al Taglio, Gelato, Local wine
Transportation tips: Metro system is efficient, Walking in historic center, Valid bus tickets
Cultural highlights and customs: Aperitivo culture, Dress codes for churches, Late dinners
Estimated daily budget (in USD): $150-200
Safety tips: Watch for pickpockets, Validate transport tickets, Avoid tourist scams
Local weather and climate: Hot summers, Mild winters, Pleasant spring and autumn`
  }
};

const POPULAR_DESTINATION_ATTRACTIONS = {
  'Paris': `Top Attractions in Paris:
1. Eiffel Tower - Iconic symbol of Paris, offering stunning city views especially at sunset
2. Louvre Museum - Home to the Mona Lisa and countless masterpieces
3. Notre-Dame Cathedral - Gothic masterpiece currently under restoration
4. Arc de Triomphe - Historic monument offering views down the Champs-Élysées
5. Palace of Versailles - Opulent royal château with magnificent gardens
6. Musée d'Orsay - Impressive collection of Impressionist art
7. Seine River - Take a river cruise to see the city from the water
8. Montmartre - Artistic neighborhood with Sacré-Cœur Basilica
9. Latin Quarter - Historic area with charming cafes and bookshops
10. Jardin des Tuileries - Beautiful garden between Louvre and Place de la Concorde`,

  'Tokyo': `Top Attractions in Tokyo:
1. Senso-ji Temple - Tokyo's oldest Buddhist temple in Asakusa
2. Shibuya Crossing - World's busiest pedestrian crossing
3. Tokyo Skytree - Tallest structure in Japan with observation decks
4. Meiji Shrine - Serene Shinto shrine in a forest setting
5. Shinjuku Gyoen - Beautiful park perfect for cherry blossom viewing
6. Tsukiji Outer Market - Famous for fresh seafood and street food
7. Akihabara - Electronics and anime culture district
8. Imperial Palace - Home of Japan's Imperial Family
9. Ueno Park - Large public park with multiple museums
10. Tokyo Tower - Iconic communications and observation tower`,

  'New York': `Top Attractions in New York City:
1. Statue of Liberty - Iconic symbol of freedom and democracy
2. Central Park - Massive urban park with various attractions
3. Times Square - Bustling entertainment and commercial intersection
4. Empire State Building - Historic skyscraper with observation deck
5. Metropolitan Museum of Art - World-class art collection
6. Broadway - Home to world-famous theater productions
7. 9/11 Memorial & Museum - Moving tribute to the 2001 tragedy
8. High Line - Elevated park built on former railway tracks
9. Brooklyn Bridge - Historic bridge with amazing city views
10. Rockefeller Center - Art Deco complex with observation deck`,

  'Bali': `Top Attractions in Bali:
1. Tanah Lot Temple - Ancient sea temple perched on a rock formation
2. Uluwatu Temple - Clifftop temple known for Kecak fire dance
3. Ubud Monkey Forest - Sacred forest with temples and monkeys
4. Tegalalang Rice Terraces - Stunning terraced rice paddies
5. Nusa Penida Island - Beautiful beaches and natural formations
6. Sacred Monkey Forest - Nature reserve and Hindu temple complex
7. Mount Batur - Active volcano offering sunrise trekking
8. Seminyak Beach - Trendy beach area with sunset views
9. Ubud Art Market - Traditional market selling local crafts
10. Tirta Empul - Holy water temple with purification pools`,

  'Rome': `Top Attractions in Rome:
1. Colosseum - Ancient amphitheater and icon of Rome
2. Vatican Museums - Vast museum complex including Sistine Chapel
3. Roman Forum - Ruins of ancient Rome's main marketplace
4. Pantheon - Former Roman temple with perfect dome
5. Trevi Fountain - Baroque fountain famous for coin tossing
6. Spanish Steps - Monumental staircase and popular meeting place
7. St. Peter's Basilica - Center of the Catholic Church
8. Borghese Gallery - Art museum in beautiful gardens
9. Piazza Navona - Beautiful square with three fountains
10. Catacombs - Ancient underground burial tunnels`
};

// Helper function to handle rate limiting
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

/**
 * Search for destinations using OpenStreetMap Nominatim
 */
export const searchDestinations = async (query) => {
  try {
    if (!query || query.trim().length < 2) {
      return { data: [], error: null };
    }

    // Check cache first
    const cacheKey = `search:${query}`;
    const cached = destinationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    await waitForRateLimit();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TravelWise/1.0'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Search failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      return { data: [], error: 'No results found' };
    }

    // Process each result with Wikipedia data
    const results = await Promise.all(data.map(async item => {
      const wikiData = await getWikipediaSummary(item.display_name);
      return {
        name: item.display_name,
        latitude: item.lat,  // Changed from lat to latitude
        longitude: item.lon, // Changed from lon to longitude
        type: item.type,
        importance: item.importance,
        wikiSummary: wikiData?.summary || null,
        wikiImage: wikiData?.image || null
      };
    }));

    // Cache the results
    destinationCache.set(cacheKey, {
      data: { data: results, error: null },
      timestamp: Date.now()
    });

    return { data: results, error: null };
  } catch (error) {
    console.error('Search error:', error);
    return { data: [], error: error.message };
  }
};

// Helper function to categorize places
function getCategoryType(type, className) {
  if (type === 'city' || type === 'town' || type === 'village') return 'Urban';
  if (className === 'natural') return 'Nature';
  if (className === 'tourism') return 'Tourist';
  if (className === 'historic') return 'Historical';
  return 'General';
}

/**
 * Get Wikipedia summary for a destination
 */
const getWikipediaSummary = async (destination) => {
  try {
    // Extract the first part of the destination (usually the city name)
    const cityName = destination.split(',')[0].trim();
    
    // Search for Wikipedia pages with just the city name
    const searchResponse = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cityName)}&format=json&origin=*`
    );
    const searchData = await searchResponse.json();
    
    if (!searchData.query?.search?.[0]?.pageid) {
      throw new Error('No Wikipedia page found');
    }

    // Get page content with a larger extract and high-quality image
    const pageId = searchData.query.search[0].pageid;
    const contentResponse = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro&explaintext&format=json&origin=*&pageids=${pageId}&pithumbsize=1000`
    );
    const contentData = await contentResponse.json();
    
    if (!contentData.query?.pages?.[pageId]) {
      throw new Error('Failed to fetch Wikipedia content');
    }

    const page = contentData.query.pages[pageId];
    return {
      summary: page.extract,
      image: page.thumbnail?.source
    };
  } catch (error) {
    console.error('Error fetching Wikipedia data:', error);
    return null;
  }
};

/**
 * Get location details using OpenStreetMap
 */
const getLocationDetails = async (latitude, longitude) => {
  try {
    await waitForRateLimit();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TravelWise/1.0'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Location lookup failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.address) {
      throw new Error('Invalid location data received');
    }

    return data;
  } catch (error) {
    console.error('Error fetching location details:', error);
    if (error.name === 'AbortError') {
      throw new Error('Location lookup timed out. Please try again.');
    }
    throw error;
  }
};

/**
 * Get detailed destination information using Wikipedia and Gemini
 */
export const getDestinationDetails = async (destination) => {
  try {
    // Check for fallback data first
    const fallbackData = POPULAR_DESTINATION_FALLBACKS[destination.name];

    // Check cache first
    const cacheKey = `details:${destination.name}:${destination.latitude}:${destination.longitude}`;
    const cached = destinationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Fetch data in parallel where possible
    const [wikiData, locationData] = await Promise.all([
      getWikipediaSummary(destination.name),
      getLocationDetails(destination.latitude, destination.longitude)
    ]);
    
    // Get enhanced details from AI
    const prompt = `Give me detailed information about ${destination.name}, ${locationData?.address?.country || ''} as a travel destination. 
    Include the following information in a structured format:
    - Best time to visit
    - Popular attractions and activities
    - Local cuisine and food recommendations
    - Transportation tips
    - Cultural highlights and customs
    - Estimated daily budget (in USD)
    - Safety tips
    - Local weather and climate`;

    const messages = [
      { 
        role: 'system', 
        content: 'You are a knowledgeable travel expert. Provide accurate, concise, and well-structured information about destinations.' 
      },
      { role: 'user', content: prompt }
    ];

    const aiResponse = await sendMessageToAI(messages, { 
      temperature: 0.7,
      max_tokens: 1500
    });
    
    const result = {
      data: {
        ...destination,
        description: wikiData?.summary || '',
        wikiSummary: wikiData?.summary || '',
        wikiImage: wikiData?.image,
        details: aiResponse.content,
        image: wikiData?.image || `https://source.unsplash.com/featured/?${encodeURIComponent(destination.name + ' ' + (locationData?.address?.country || ''))},city`,
        address: locationData?.display_name,
        administrativeArea: locationData?.address?.state || locationData?.address?.county,
        country: locationData?.address?.country,
        countryCode: locationData?.address?.country_code?.toUpperCase(),
        currency: getCurrencyByCountryCode(locationData?.address?.country_code?.toUpperCase())
      },
      error: null
    };

    destinationCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching destination details:', error);

    // If API fails, use fallback data for known destinations
    const fallbackData = POPULAR_DESTINATION_FALLBACKS[destination.name];
    if (fallbackData) {
      return {
        data: {
          name: destination.name,
          description: fallbackData.description,
          details: fallbackData.details,
          image: `https://source.unsplash.com/featured/?${encodeURIComponent(destination.name)},landmark`,
          latitude: destination.latitude,
          longitude: destination.longitude
        },
        error: null
      };
    }

    return {
      data: null,
      error: error.message
    };
  }
};

/**
 * Get currency code for a country (basic mapping)
 */
const getCurrencyByCountryCode = (countryCode) => {
  const currencyMap = {
    'US': 'USD',
    'GB': 'GBP',
    'EU': 'EUR',
    'JP': 'JPY',
    'AU': 'AUD',
    'CA': 'CAD',
    // Add more as needed
  };
  return currencyMap[countryCode] || 'Unknown';
};

/**
 * Get attractions and activities for a destination
 */
export const getDestinationAttractions = async (destination) => {
  try {
    // Check for fallback data first
    const fallbackAttractions = POPULAR_DESTINATION_ATTRACTIONS[destination];
    if (fallbackAttractions) {
      return {
        data: {
          details: fallbackAttractions
        },
        error: null
      };
    }

    await waitForRateLimit();

    // First try to get tourist attractions
    const touristResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`tourist attractions in ${destination}`)}&format=json&limit=5`
    );
    
    await waitForRateLimit();

    // Then get popular places
    const placesResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`popular places in ${destination}`)}&format=json&limit=5`
    );
    
    const [touristAttractions, popularPlaces] = await Promise.all([
      touristResponse.json(),
      placesResponse.json()
    ]);
    
    // Combine and deduplicate results
    const allPlaces = [...touristAttractions, ...popularPlaces];
    const uniquePlaces = Array.from(new Set(allPlaces.map(p => p.display_name)))
      .map(name => allPlaces.find(p => p.display_name === name))
      .filter(Boolean);

    // Get enhanced details from AI
    const prompt = `List and describe the top attractions in ${destination}. Include tips, recommendations, and interesting facts about each attraction.

    Known attractions:
    ${uniquePlaces.map(a => a.display_name).join('\n')}`;

    const messages = [
      { 
        role: 'system', 
        content: 'You are a local tour guide expert. Provide detailed, engaging information about attractions that would interest visitors.' 
      },
      { role: 'user', content: prompt }
    ];

    const aiResponse = await sendMessageToAI(messages, {
      temperature: 0.7,
      max_tokens: 2000
    });

    return {
      data: {
        attractions: uniquePlaces,
        details: aiResponse.content
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching attractions:', error);
    return {
      data: null,
      error: error.name === 'AbortError' ? 
        'Request timed out. Please try again.' : 
        'Unable to fetch attractions. Please check your connection and try again.'
    };
  }
};