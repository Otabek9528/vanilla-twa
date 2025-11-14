// locationManager.js
// Universal location manager for Telegram WebApp
// Works across multiple HTML pages without re-prompting

const LocationManager = {
  STORAGE_KEY: 'userLocation',
  PERMISSION_KEY: 'locationPermissionGranted',
  LAST_UPDATE_KEY: 'lastLocationUpdate',
  UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes

  // Initialize on every page load
  async init() {
    Telegram.WebApp.ready();
    
    const hasPermission = localStorage.getItem(this.PERMISSION_KEY) === 'true';
    const storedLocation = this.getStoredLocation();
    
    if (hasPermission && storedLocation) {
      console.log('✅ Using stored location');
      // Use cached location immediately
      this.updateUI(storedLocation);
      
      // Try silent background refresh (won't prompt)
      this.silentRefresh();
    } else if (storedLocation) {
      // Have location but no permission flag (legacy case)
      console.log('📍 Using cached location (no permission flag)');
      this.updateUI(storedLocation);
      localStorage.setItem(this.PERMISSION_KEY, 'true');
    } else {
      // First time - need to ask for permission
      console.log('🔓 First time - requesting permission');
      await this.requestInitialPermission();
    }
  },

  // Get stored location data
  getStoredLocation() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Request permission only on first use
  async requestInitialPermission() {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const locationData = await this.processPosition(pos);
          localStorage.setItem(this.PERMISSION_KEY, 'true');
          this.updateUI(locationData);
          resolve(locationData);
        },
        (error) => {
          console.error('❌ Location permission denied:', error);
          Telegram.WebApp.showAlert(
            '📍 Location access is required for prayer times. Please enable it in your browser settings.'
          );
          // Use default fallback location
          const fallback = {
            lat: 37.5665,
            lon: 126.9780,
            city: 'Seoul',
            timestamp: Date.now()
          };
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(fallback));
          this.updateUI(fallback);
          resolve(fallback);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  },

  // Silent refresh (no permission prompt after initial grant)
  async silentRefresh() {
    const lastUpdate = parseInt(localStorage.getItem(this.LAST_UPDATE_KEY) || '0');
    const now = Date.now();
    
    // Don't refresh too frequently
    if (now - lastUpdate < this.UPDATE_INTERVAL) {
      console.log('⏱️ Skipping refresh (too soon)');
      return;
    }

    // Try to get new position silently
    // Note: In Telegram WebView, this might still prompt, but we minimize calls
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const locationData = await this.processPosition(pos);
        console.log('🔄 Location refreshed silently');
        this.updateUI(locationData);
      },
      (error) => {
        console.warn('⚠️ Silent refresh failed (expected in WebView):', error.message);
        // Continue using cached location
      },
      {
        enableHighAccuracy: false, // Lower accuracy = less prompt likelihood
        timeout: 5000,
        maximumAge: 60000 // Accept 1-minute-old cached position
      }
    );
  },

  // Manual refresh triggered by user button
  async manualRefresh() {
    Telegram.WebApp.showPopup({
      title: '📍 Updating Location',
      message: 'Getting your current location...',
      buttons: []
    });

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const locationData = await this.processPosition(pos);
          Telegram.WebApp.showPopup({
            title: '✅ Location Updated',
            message: `New location: ${locationData.city}`,
            buttons: [{type: 'ok'}]
          });
          this.updateUI(locationData);
          resolve(locationData);
        },
        (error) => {
          Telegram.WebApp.showAlert(
            '❌ Could not update location. Using cached location.'
          );
          resolve(this.getStoredLocation());
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  },

  // Process position and get city name
  async processPosition(pos) {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const city = await this.getCityName(lat, lon);
    
    const locationData = {
      lat,
      lon,
      city,
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(locationData));
    localStorage.setItem(this.LAST_UPDATE_KEY, locationData.timestamp.toString());
    
    return locationData;
  },

  // Reverse geocoding
  async getCityName(lat, lon) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`
      );
      const data = await res.json();
      return (
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.county ||
        'Unknown'
      );
    } catch (error) {
      console.error('Geocoding error:', error);
      return 'Unknown';
    }
  },

  // Update UI elements on current page
  updateUI(locationData) {
    // Update city name elements
    const cityElements = document.querySelectorAll('#cityName, .city-name');
    cityElements.forEach(el => {
      if (el) el.innerText = locationData.city;
    });

    // Update coordinates if element exists
    const coordsElem = document.getElementById('coords');
    if (coordsElem) {
      coordsElem.innerText = `Coordinates: ${locationData.lat.toFixed(4)}, ${locationData.lon.toFixed(4)}`;
    }

    // Update timestamp display if exists
    const timestampElem = document.getElementById('locationTimestamp');
    if (timestampElem) {
      const date = new Date(locationData.timestamp);
      timestampElem.innerText = `Last updated: ${date.toLocaleTimeString()}`;
    }

    // Trigger prayer times update
    if (typeof updatePrayerData === 'function') {
      updatePrayerData(locationData.lat, locationData.lon, locationData.city);
    }

    // Dispatch custom event for other scripts
    window.dispatchEvent(new CustomEvent('locationUpdated', { 
      detail: locationData 
    }));
  },

  // Get current location (returns cached if available)
  getCurrentLocation() {
    return this.getStoredLocation();
  },

  // Check if location is stale (older than 24 hours)
  isLocationStale() {
    const location = this.getStoredLocation();
    if (!location || !location.timestamp) return true;
    
    const age = Date.now() - location.timestamp;
    return age > 24 * 60 * 60 * 1000; // 24 hours
  }
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  LocationManager.init();
});

// Make available globally
window.LocationManager = LocationManager;