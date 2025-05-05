// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // Replace with your access key
const UNSPLASH_API_URL = 'https://api.unsplash.com';

/**
 * Get a photo URL for a destination with proper attribution
 */
export const getDestinationPhotoUrl = async (query) => {
  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          'Accept-Version': 'v1'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch image from Unsplash');
    }

    const data = await response.json();
    return {
      url: data.urls.regular,
      attribution: {
        name: data.user.name,
        username: data.user.username,
        link: data.links.html
      }
    };
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
    // Fallback to a default image if the API call fails
    return {
      url: getFallbackImage(query),
      attribution: null
    };
  }
};

/**
 * Get multiple photos for a destination
 */
export const getDestinationPhotos = async (query, count = 5) => {
  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/photos/random?query=${encodeURIComponent(query)}&count=${count}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          'Accept-Version': 'v1'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch images from Unsplash');
    }

    const data = await response.json();
    return data.map(photo => ({
      url: photo.urls.regular,
      attribution: {
        name: photo.user.name,
        username: photo.user.username,
        link: photo.links.html
      }
    }));
  } catch (error) {
    console.error('Error fetching Unsplash images:', error);
    // Return fallback images
    return Array(count).fill(null).map(() => ({
      url: getFallbackImage(query),
      attribution: null
    }));
  }
};

/**
 * Cache photos for destinations to avoid rate limits
 */
export const cacheDestinationPhotos = async (destinations) => {
  try {
    const photoPromises = destinations.map(dest => 
      getDestinationPhotoUrl(`${dest.name} ${dest.country} landmark`)
    );
    const photos = await Promise.all(photoPromises);
    return destinations.map((dest, index) => ({
      ...dest,
      image: photos[index].url,
      imageAttribution: photos[index].attribution
    }));
  } catch (error) {
    console.error('Error caching destination photos:', error);
    return destinations.map(dest => ({
      ...dest,
      image: getFallbackImage(dest.name),
      imageAttribution: null
    }));
  }
};

/**
 * Get a fallback image URL when the API fails
 */
const getFallbackImage = (query) => {
  const fallbackImages = {
    default: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
    city: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df',
    nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
    landmark: 'https://images.unsplash.com/photo-1488747279002-c8523379faaa',
    beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    mountain: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b'
  };

  const type = query.toLowerCase();
  if (type.includes('beach')) return fallbackImages.beach;
  if (type.includes('mountain')) return fallbackImages.mountain;
  if (type.includes('nature')) return fallbackImages.nature;
  if (type.includes('city')) return fallbackImages.city;
  if (type.includes('landmark')) return fallbackImages.landmark;
  return fallbackImages.default;
};