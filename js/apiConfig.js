// apiConfig.js - Centralized API configuration
// This file contains the base URL for the Muslim Vegukin API

const API_CONFIG = {
  // Base URL for the Flask API deployed on Render
  BASE_URL: 'https://muslim-vegukin-api.onrender.com',
  
  // API endpoints
  ENDPOINTS: {
    // Mosques
    MOSQUES_NEARBY: '/api/mosques/nearby',
    MOSQUES_BY_ADDRESS: '/api/mosques/by-address',
    MOSQUE_DETAIL: '/api/mosque',

    //Restaurants
    RESTAURANTS_NEARBY: '/api/restaurants/nearby',
    RESTAURANTS_BY_ADDRESS: '/api/restaurants/by-address',
    RESTAURANTS_DETAIL: '/api/restaurant',

    //Shops
    SHOPS_NEARBY: '/api/shops/nearby',
    SHOPS_BY_ADDRESS: '/api/shops/by-address',
    SHOPS_DETAIL: '/api/shop',
    
    // Health & Stats
    HEALTH: '/api/health',
    STATS: '/api/stats'
  },
  
  // Default settings
  DEFAULTS: {
    LIMIT: 5,  // Number of results to fetch
    TIMEOUT: 30000  // 30 seconds (for cold starts on Render free tier)
  }
};

// Helper function to build full API URLs
function getApiUrl(endpoint, params = {}) {
  const url = new URL(API_CONFIG.BASE_URL + endpoint);
  
  // Add query parameters
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  return url.toString();
}

// Make available globally
window.API_CONFIG = API_CONFIG;
window.getApiUrl = getApiUrl;

console.log('✅ API Config loaded:', API_CONFIG.BASE_URL);