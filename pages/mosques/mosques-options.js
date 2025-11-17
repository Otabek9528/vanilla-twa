// mosque-options.js - Logic for mosque search options page

// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();

try {
  tg.expand();
  console.log('✅ WebApp expanded');
} catch (e) {
  console.log('⚠️ Expand not supported');
}

// Show back button
try {
  if (tg.BackButton) {
    tg.BackButton.show();
    tg.onEvent('backButtonClicked', () => {
      window.location.href = "../../index.html";
    });
    console.log('✅ BackButton configured');
  }
} catch (e) {
  console.log('⚠️ BackButton not supported');
}

// DOM Elements
const currentCityElem = document.getElementById('currentCity');
const lastUpdatedElem = document.getElementById('lastUpdated');
const locationOptionBtn = document.getElementById('locationOptionBtn');
const addressInput = document.getElementById('addressInput');
const addressOptionBtn = document.getElementById('addressOptionBtn');

// Dummy location data (replace with real data later)
let currentLocation = {
  city: 'Seoul, Gangnam-gu',
  lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  lat: 37.4979,
  lng: 127.0276
};

// Format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Hozirgina';
  if (diffMins < 60) return `${diffMins} daqiqa avval`;
  if (diffHours < 24) return `${diffHours} soat avval`;
  return `${diffDays} kun avval`;
}

// Check if location is stale (older than 1 hour)
function isLocationStale(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours > 1;
}

// Update location display
function updateLocationDisplay() {
  currentCityElem.textContent = currentLocation.city;
  const timeAgo = getTimeAgo(currentLocation.lastUpdated);
  lastUpdatedElem.textContent = timeAgo;
  
  // Mark as stale if old
  if (isLocationStale(currentLocation.lastUpdated)) {
    lastUpdatedElem.classList.add('stale');
  } else {
    lastUpdatedElem.classList.remove('stale');
  }
}

// Handle location option button (always updates, then continues)
locationOptionBtn.addEventListener('click', async () => {
  console.log('📍 Location option selected - updating and searching');
  
  // Add loading state
  locationOptionBtn.classList.add('loading');
  locationOptionBtn.disabled = true;
  
  // Simulate location update (2 seconds)
  setTimeout(() => {
    // Update location data
    currentLocation.lastUpdated = new Date();
    currentLocation.city = 'Seoul, Gangnam-gu'; // Simulate updated city
    
    // Navigate to mosques list page
    console.log('✅ Navigating to mosques list (location mode)');
    window.location.href = 'mosques.html?mode=location';
  }, 2000);
});

// Handle address input
addressInput.addEventListener('input', (e) => {
  const value = e.target.value.trim();
  
  // Enable/disable button based on input
  if (value.length > 0) {
    addressOptionBtn.disabled = false;
  } else {
    addressOptionBtn.disabled = true;
  }
});

// Handle address input Enter key
addressInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const address = addressInput.value.trim();
    if (address) {
      performAddressSearch(address);
    }
  }
});

// Handle address option button
addressOptionBtn.addEventListener('click', () => {
  const address = addressInput.value.trim();
  if (address) {
    performAddressSearch(address);
  }
});

// Perform address search
function performAddressSearch(address) {
  console.log('🔍 Address option selected:', address);
  
  // Disable button and input
  addressOptionBtn.disabled = true;
  addressInput.disabled = true;
  addressOptionBtn.classList.add('loading');
  
  // Navigate to mosques list page with address parameter
  const encodedAddress = encodeURIComponent(address);
  window.location.href = `mosques.html?mode=address&address=${encodedAddress}`;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 Mosque options page initialized');
  
  // Display current location info
  updateLocationDisplay();
});