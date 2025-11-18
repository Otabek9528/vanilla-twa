// mosques.js - Mosques feature logic with dummy data

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

// Check if LocationManager is available
const hasLocationManager = typeof LocationManager !== 'undefined';
console.log('📍 LocationManager available:', hasLocationManager);

// Dummy mosque data
const DUMMY_MOSQUES = [
  {
    id: 1,
    name: "Seoul Central Mosque",
    nameKo: "서울중앙성원",
    phone: "+82-2-793-6908",
    address: "39-1 Hannam-dong, Yongsan-gu, Seoul",
    addressKo: "서울특별시 용산구 우사단로 10길 39-1",
    distance: 1.2,
    photo: "../../assets/mosque.png",
    lat: 37.5347,
    lng: 126.9996
  },
  {
    id: 2,
    name: "Busan Mosque",
    nameKo: "부산 성원",
    phone: "+82-51-631-2308",
    address: "15 Jungang-daero 691, Busanjin-gu, Busan",
    addressKo: "부산광역시 부산진구 중앙대로 691번길 15",
    distance: 2.5,
    photo: "../../assets/mosque.png",
    lat: 35.1543,
    lng: 129.0598
  },
  {
    id: 3,
    name: "Ansan Mosque",
    nameKo: "안산 성원",
    phone: "+82-31-491-5943",
    address: "123 Wonkok-dong, Danwon-gu, Ansan",
    addressKo: "경기도 안산시 단원구 원곡동 123",
    distance: 3.8,
    photo: "../../assets/mosque.png",
    lat: 37.3236,
    lng: 126.8216
  },
  {
    id: 4,
    name: "Daegu Mosque",
    nameKo: "대구 성원",
    phone: "+82-53-743-9875",
    address: "78 Dongseong-ro, Jung-gu, Daegu",
    addressKo: "대구광역시 중구 동성로 78",
    distance: 5.1,
    photo: "../../assets/mosque.png",
    lat: 35.8686,
    lng: 128.5936
  },
  {
    id: 5,
    name: "Gwangju Mosque",
    nameKo: "광주 성원",
    phone: "+82-62-222-1234",
    address: "456 Geumnam-ro, Dong-gu, Gwangju",
    addressKo: "광주광역시 동구 금남로 456",
    distance: 6.3,
    photo: "../../assets/mosque.png",
    lat: 35.1468,
    lng: 126.9213
  }
];

// State management
let currentMode = 'location'; // 'location' or 'address'
let currentSearchAddress = '';

// DOM Elements
const mosqueCardsContainer = document.getElementById('mosqueCards');
const searchBar = document.getElementById('addressSearchBar');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchModeIcon = document.getElementById('searchModeIcon');
const searchModeText = document.getElementById('searchModeText');
const loadingIndicator = document.getElementById('loadingIndicator');
const noResults = document.getElementById('noResults');

// Render mosque cards
function renderMosqueCards(mosques) {
  mosqueCardsContainer.innerHTML = '';
  
  if (!mosques || mosques.length === 0) {
    // Show no results message
    loadingIndicator.style.display = 'none';
    noResults.style.display = 'block';
    mosqueCardsContainer.style.display = 'none';
    return;
  }
  
  // Hide no results, show cards
  noResults.style.display = 'none';
  mosqueCardsContainer.style.display = 'flex';
  
  mosques.forEach(mosque => {
    const card = document.createElement('div');
    card.className = 'mosque-card';
    card.onclick = () => {
      // Navigate to detail page (will implement later)
      console.log('Clicked mosque:', mosque.id);
      // window.location.href = `mosque-detail.html?id=${mosque.id}`;
    };
    
    card.innerHTML = `
      <div class="mosque-card-image">
        <img src="${mosque.photo}" alt="${mosque.name}" />
        <div class="mosque-distance-badge">
          <span>📍</span>
          <span>${mosque.distance} km</span>
        </div>
      </div>
      <div class="mosque-card-content">
        <h3 class="mosque-name">${mosque.name}</h3>
        <p class="mosque-name-ko">${mosque.nameKo}</p>
        <div class="mosque-info">
          <div class="mosque-info-item">
            <span class="info-icon">📞</span>
            <span class="info-text">${mosque.phone}</span>
          </div>
          <div class="mosque-info-item">
            <span class="info-icon">📍</span>
            <span class="info-text">${mosque.addressKo}</span>
          </div>
        </div>
      </div>
    `;
    
    mosqueCardsContainer.appendChild(card);
  });
}

// Update search mode indicator
function updateSearchModeIndicator(mode, address = '') {
  if (mode === 'location') {
    searchModeIcon.textContent = '📍';
    searchModeText.textContent = 'Hozirgi joylashuvingiz asosida';
  } else {
    searchModeIcon.textContent = '🔍';
    searchModeText.textContent = `"${address}" atrofida`;
  }
}

// Auto-update location and load mosques
async function autoUpdateLocationAndLoadMosques() {
  console.log('🔄 Loading mosques...');
  
  // Show loading
  loadingIndicator.style.display = 'flex';
  mosqueCardsContainer.style.display = 'none';
  noResults.style.display = 'none';
  
  try {
    // Check if LocationManager is available
    if (hasLocationManager) {
      console.log('📍 Checking cached location...');
      
      // First, try to get cached location
      let currentLocation = LocationManager.getStoredLocation();
      
      // Check if location is stale (older than 1 hour)
      const isStale = LocationManager.isLocationStale();
      
      if (!currentLocation || isStale) {
        console.log('🔄 Location is stale or missing, refreshing...');
        
        // Only refresh if location is stale or missing
        try {
          await LocationManager.manualRefresh();
          currentLocation = LocationManager.getStoredLocation();
          console.log('✅ Location refreshed:', currentLocation);
        } catch (error) {
          console.warn('⚠️ Location refresh failed, using cached data:', error);
          // Continue with cached location even if refresh fails
        }
      } else {
        console.log('✅ Using cached location (fresh):', currentLocation);
      }
      
      // TODO: Here you would call your mosque database/API with the location
      // For now, we'll use dummy data
      // Example: const mosques = await fetchNearbyMosques(currentLocation.lat, currentLocation.lng);
      
      // Simulate a small delay for data fetching
      setTimeout(() => {
        loadingIndicator.style.display = 'none';
        renderMosqueCards(DUMMY_MOSQUES);
        console.log('✅ Mosques loaded');
      }, 500);
      
    } else {
      console.warn('⚠️ LocationManager not available, using dummy data');
      
      // Fallback: just load dummy data after a delay
      setTimeout(() => {
        loadingIndicator.style.display = 'none';
        renderMosqueCards(DUMMY_MOSQUES);
        console.log('✅ Mosques loaded (without location update)');
      }, 1500);
    }
    
  } catch (error) {
    console.error('❌ Error loading mosques:', error);
    
    // On error, still show dummy data
    loadingIndicator.style.display = 'none';
    renderMosqueCards(DUMMY_MOSQUES);
  }
}

// Handle search bar input
searchBar.addEventListener('input', (e) => {
  const value = e.target.value.trim();
  
  // Show/hide clear button
  if (value) {
    clearSearchBtn.style.display = 'flex';
  } else {
    clearSearchBtn.style.display = 'none';
  }
});

// Handle search bar Enter key
searchBar.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const address = searchBar.value.trim();
    
    if (address) {
      performAddressSearch(address);
    }
  }
});

// Handle clear search button
clearSearchBtn.addEventListener('click', () => {
  searchBar.value = '';
  clearSearchBtn.style.display = 'none';
  searchBar.focus();
  
  // Reset to location mode
  currentMode = 'location';
  currentSearchAddress = '';
  updateSearchModeIndicator('location');
  
  // Show loading
  loadingIndicator.style.display = 'flex';
  mosqueCardsContainer.style.display = 'none';
  
  // Simulate loading
  setTimeout(() => {
    loadingIndicator.style.display = 'none';
    renderMosqueCards(DUMMY_MOSQUES);
  }, 500);
});

// Perform address search
function performAddressSearch(address) {
  console.log('🔍 Searching for address:', address);
  
  // Update mode
  currentMode = 'address';
  currentSearchAddress = address;
  updateSearchModeIndicator('address', address);
  
  // Show loading
  loadingIndicator.style.display = 'flex';
  mosqueCardsContainer.style.display = 'none';
  noResults.style.display = 'none';
  
  // Blur search bar
  searchBar.blur();
  
  // Simulate API call (2 seconds)
  setTimeout(() => {
    loadingIndicator.style.display = 'none';
    
    // For demo: randomly show results or no results
    const hasResults = Math.random() > 0.3;
    
    if (hasResults) {
      // Modify dummy data distances for address search
      const modifiedMosques = DUMMY_MOSQUES.map(m => ({
        ...m,
        distance: (Math.random() * 8 + 0.5).toFixed(1)
      })).sort((a, b) => a.distance - b.distance);
      
      renderMosqueCards(modifiedMosques);
    } else {
      // Show no results
      renderMosqueCards([]);
    }
    
    console.log('✅ Search completed');
  }, 2000);
}

// Initialize page - auto-update location and load mosques
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 Mosques page initialized');
  
  // Set initial mode
  updateSearchModeIndicator('location');
  
  // Auto-update location and load mosques
  autoUpdateLocationAndLoadMosques();
});