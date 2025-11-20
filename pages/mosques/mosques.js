// mosques.js - Updated with real API integration
// Maintains all design features: collapsible search, carousel, star ratings

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

// State management
let currentMode = 'location'; // 'location' or 'address'
let currentSearchAddress = '';
let currentMosques = []; // Store fetched mosques
let carouselIntervals = {}; // Store carousel intervals for each mosque

// DOM Elements
const mosqueCardsContainer = document.getElementById('mosqueCards');
const searchBar = document.getElementById('addressSearchBar');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchBtn = document.getElementById('searchBtn');
const searchToggleBtn = document.getElementById('searchToggleBtn');
const searchCollapsible = document.getElementById('searchCollapsible');
const toggleArrow = document.getElementById('toggleArrow');
const loadingIndicator = document.getElementById('loadingIndicator');
const noResults = document.getElementById('noResults');

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch nearby mosques based on coordinates
 */
async function fetchNearbyMosques(lat, lon, limit = 5) {
  const url = getApiUrl(API_CONFIG.ENDPOINTS.MOSQUES_NEARBY, { lat, lon, limit });
  
  console.log('🔍 Fetching nearby mosques:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(API_CONFIG.DEFAULTS.TIMEOUT)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response:', data);
    
    if (data.success && data.mosques) {
      return data.mosques;
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    console.error('❌ Error fetching nearby mosques:', error);
    throw error;
  }
}

/**
 * Fetch mosques by address search
 */
async function fetchMosquesByAddress(address, limit = 5) {
  const url = getApiUrl(API_CONFIG.ENDPOINTS.MOSQUES_BY_ADDRESS, { address, limit });
  
  console.log('🔍 Fetching mosques by address:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(API_CONFIG.DEFAULTS.TIMEOUT)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response:', data);
    
    if (data.success && data.mosques) {
      return data.mosques;
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    console.error('❌ Error fetching mosques by address:', error);
    throw error;
  }
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

/**
 * Generate star rating HTML
 */
function generateStarRating(reviews) {
  if (!reviews || reviews.length === 0) {
    return `<span class="no-rating-text">Sharhlar yo'q</span>`;
  }
  
  // Calculate average rating
  const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const roundedRating = Math.round(avgRating);
  
  let starsHTML = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= roundedRating) {
      starsHTML += `<span class="star gold">⭐</span>`;
    } else {
      starsHTML += `<span class="star grey">⭐</span>`;
    }
  }
  
  return `<div class="star-container">${starsHTML}</div>`;
}

/**
 * Discover available photos in a folder
 * Tries loading 1.jpg/jpeg/png, 2.jpg/jpeg/png, etc. up to maxPhotos
 */
async function discoverPhotos(photoPath, maxPhotos = 10) {
  const photos = [];
  const extensions = ['jpg', 'jpeg', 'png'];
  const basePath = `../../${photoPath}`;
  
  for (let i = 1; i <= maxPhotos; i++) {
    let photoFound = false;
    
    // Try each extension
    for (const ext of extensions) {
      const photoUrl = `${basePath}/${i}.${ext}`;
      
      try {
        // Try to load the image
        const exists = await checkImageExists(photoUrl);
        if (exists) {
          photos.push(photoUrl);
          photoFound = true;
          break; // Found this number, move to next
        }
      } catch (e) {
        // Image doesn't exist, try next extension
        continue;
      }
    }
    
    // If no photo found with this number, assume no more photos
    if (!photoFound) {
      break;
    }
  }
  
  return photos;
}

/**
 * Check if an image URL exists and is loadable
 */
function checkImageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Create photo carousel HTML
 */
function createPhotoCarousel(mosqueId, photos) {
  if (!photos || photos.length === 0) {
    // Fallback to placeholder
    return `
      <div class="mosque-photo-single">
        <img src="../../assets/mosque.png" alt="Mosque photo" />
      </div>
    `;
  }
  
  if (photos.length === 1) {
    // Single photo display
    return `
      <div class="mosque-photo-single">
        <img src="${photos[0]}" alt="Mosque photo" />
      </div>
    `;
  }
  
  // Multiple photos - create carousel
  let photosHTML = '';
  let dotsHTML = '';
  
  photos.forEach((photo, index) => {
    const positionClass = index === 0 ? 'center' : 
                         index === 1 ? 'right' : 'hidden';
    
    photosHTML += `
      <div class="carousel-photo ${positionClass}" data-index="${index}">
        <img src="${photo}" alt="Mosque photo ${index + 1}" />
      </div>
    `;
    
    dotsHTML += `
      <span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
    `;
  });
  
  return `
    <div class="photo-carousel" data-mosque-id="${mosqueId}">
      <div class="carousel-track">
        ${photosHTML}
      </div>
      <div class="carousel-dots">
        ${dotsHTML}
      </div>
    </div>
  `;
}

/**
 * Initialize carousel for a mosque card
 */
function initCarousel(mosqueId, photoCount) {
  const carousel = document.querySelector(`.photo-carousel[data-mosque-id="${mosqueId}"]`);
  if (!carousel || photoCount <= 1) return;
  
  const photos = carousel.querySelectorAll('.carousel-photo');
  const dots = carousel.querySelectorAll('.dot');
  let currentIndex = 0;
  
  // Position classes for smooth bidirectional animation
  const positions = ['center', 'right', 'hidden', 'hidden', 'hidden', 'hidden', 'hidden', 'hidden', 'hidden', 'left'];
  
  function updateCarousel(newIndex) {
    const totalPhotos = photos.length;
    
    // Update photo positions
    photos.forEach((photo, index) => {
      // Calculate relative position
      let relativePos = (index - newIndex + totalPhotos) % totalPhotos;
      
      // Remove all position classes
      photo.classList.remove('center', 'left', 'right', 'hidden');
      
      // Assign new position
      if (relativePos === 0) {
        photo.classList.add('center');
      } else if (relativePos === 1) {
        photo.classList.add('right');
      } else if (relativePos === totalPhotos - 1) {
        photo.classList.add('left');
      } else {
        photo.classList.add('hidden');
      }
    });
    
    // Update dots
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === newIndex);
    });
    
    currentIndex = newIndex;
  }
  
  // Dot click handlers
  dots.forEach((dot, index) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card click
      updateCarousel(index);
      
      // Reset auto-rotation
      if (carouselIntervals[mosqueId]) {
        clearInterval(carouselIntervals[mosqueId]);
      }
      startAutoRotation();
    });
  });
  
  // Auto-rotation (every 3 seconds)
  function startAutoRotation() {
    carouselIntervals[mosqueId] = setInterval(() => {
      const nextIndex = (currentIndex + 1) % photos.length;
      updateCarousel(nextIndex);
    }, 3000);
  }
  
  // Start auto-rotation
  startAutoRotation();
  
  // Pause on hover
  carousel.addEventListener('mouseenter', () => {
    if (carouselIntervals[mosqueId]) {
      clearInterval(carouselIntervals[mosqueId]);
    }
  });
  
  // Resume on leave
  carousel.addEventListener('mouseleave', () => {
    startAutoRotation();
  });
}

/**
 * Render mosque cards from API data
 */
async function renderMosqueCards(mosques) {
  // Clear any existing carousel intervals
  Object.values(carouselIntervals).forEach(interval => clearInterval(interval));
  carouselIntervals = {};
  
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
  
  // Process each mosque and discover photos
  for (const mosque of mosques) {
    // Discover available photos for this mosque
    const photos = await discoverPhotos(mosque.photo, 10);
    
    const card = document.createElement('div');
    card.className = 'mosque-card';
    card.onclick = () => {
      // Navigate to detail page with mosque ID
      console.log('Clicked mosque:', mosque.id);
      window.location.href = `mosques-detail.html?id=${mosque.id}`;
    };
    
    // Generate star rating
    const starRatingHTML = generateStarRating(mosque.reviews);
    
    // Format distance to 1 decimal place
    const distanceDisplay = mosque.distance ? mosque.distance.toFixed(1) : 'N/A';
    
    // Create photo HTML
    const photoHTML = createPhotoCarousel(mosque.id, photos);
    
    // Format phone number (handle missing phones)
    const phoneDisplay = mosque.phone || 'Ma\'lumot yo\'q';
    
    card.innerHTML = `
      <!-- Card Top Badges (Above card) -->
      <div class="card-top-badges">
        <!-- Star Rating Badge (Left) -->
        <div class="mosque-rating-badge">
          ${starRatingHTML}
        </div>
        
        <!-- Distance Badge (Right) -->
        <div class="mosque-distance-badge">
          <span>📍</span>
          <span>${distanceDisplay} km</span>
        </div>
      </div>
      
      <!-- Card Image -->
      <div class="mosque-card-image">
        ${photoHTML}
      </div>
      
      <!-- Card Content -->
      <div class="mosque-card-content">
        <h3 class="mosque-name">${mosque.name}</h3>
        <p class="mosque-name-ko">${mosque.city || 'Unknown City'}</p>
        <div class="mosque-info">
          <div class="mosque-info-item">
            <span class="info-icon">📞</span>
            <span class="info-text">${phoneDisplay}</span>
          </div>
          <div class="mosque-info-item">
            <span class="info-icon">📍</span>
            <span class="info-text">${mosque.address || 'Manzil ma\'lumoti yo\'q'}</span>
          </div>
        </div>
      </div>
    `;
    
    mosqueCardsContainer.appendChild(card);
    
    // Initialize carousel if multiple photos
    if (photos.length > 1) {
      initCarousel(mosque.id, photos.length);
    }
  }
  
  // Store mosques for later use
  currentMosques = mosques;
}

/**
 * Show error message to user
 */
function showError(message) {
  loadingIndicator.style.display = 'none';
  noResults.style.display = 'block';
  mosqueCardsContainer.style.display = 'none';
  
  // Update error message
  const noResultsText = document.querySelector('.no-results-text');
  const noResultsHint = document.querySelector('.no-results-hint');
  
  if (noResultsText) {
    noResultsText.textContent = 'Xatolik yuz berdi';
  }
  if (noResultsHint) {
    noResultsHint.textContent = message;
  }
}

// ============================================
// SEARCH SECTION HANDLERS
// ============================================

/**
 * Toggle collapsible search section
 */
searchToggleBtn.addEventListener('click', () => {
  const isVisible = searchCollapsible.style.display !== 'none';
  
  if (isVisible) {
    // Hide search section
    searchCollapsible.style.display = 'none';
    toggleArrow.classList.remove('rotated');
    searchToggleBtn.classList.remove('active');
  } else {
    // Show search section
    searchCollapsible.style.display = 'block';
    toggleArrow.classList.add('rotated');
    searchToggleBtn.classList.add('active');
  }
});

/**
 * Handle search bar input
 */
searchBar.addEventListener('input', (e) => {
  const value = e.target.value.trim();
  
  // Show/hide clear button
  if (value) {
    clearSearchBtn.style.display = 'flex';
  } else {
    clearSearchBtn.style.display = 'none';
  }
});

/**
 * Handle search bar Enter key
 */
searchBar.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const address = searchBar.value.trim();
    
    if (address) {
      performAddressSearch(address);
    }
  }
});

/**
 * Handle search button click
 */
searchBtn.addEventListener('click', () => {
  const address = searchBar.value.trim();
  
  if (address) {
    performAddressSearch(address);
  }
});

/**
 * Handle clear search button
 */
clearSearchBtn.addEventListener('click', async () => {
  searchBar.value = '';
  clearSearchBtn.style.display = 'none';
  searchBar.focus();
  
  // Reset to location mode
  currentMode = 'location';
  currentSearchAddress = '';
  
  // Collapse search section
  searchCollapsible.style.display = 'none';
  toggleArrow.classList.remove('rotated');
  searchToggleBtn.classList.remove('active');
  
  // Show loading
  loadingIndicator.style.display = 'flex';
  mosqueCardsContainer.style.display = 'none';
  
  // Get current location and fetch nearby mosques
  const location = LocationManager.getCurrentLocation();
  
  if (location && location.lat && location.lon) {
    try {
      const mosques = await fetchNearbyMosques(location.lat, location.lon, 5);
      loadingIndicator.style.display = 'none';
      await renderMosqueCards(mosques);
    } catch (error) {
      console.error('❌ Error fetching mosques:', error);
      showError('Masjidlarni yuklashda xatolik yuz berdi');
    }
  } else {
    loadingIndicator.style.display = 'none';
    showError('Joylashuv ma\'lumotlari topilmadi');
  }
});

/**
 * Perform address search
 */
async function performAddressSearch(address) {
  console.log('🔍 Searching for address:', address);
  
  // Update mode
  currentMode = 'address';
  currentSearchAddress = address;
  
  // Show loading
  loadingIndicator.style.display = 'flex';
  mosqueCardsContainer.style.display = 'none';
  noResults.style.display = 'none';
  
  // Blur search bar
  searchBar.blur();
  
  // Collapse search section
  searchCollapsible.style.display = 'none';
  toggleArrow.classList.remove('rotated');
  searchToggleBtn.classList.remove('active');
  
  try {
    // Fetch mosques by address from API
    const mosques = await fetchMosquesByAddress(address, 5);
    
    // Hide loading
    loadingIndicator.style.display = 'none';
    
    // Render results
    await renderMosqueCards(mosques);
    
    console.log('✅ Search completed');
    
  } catch (error) {
    console.error('❌ Error searching by address:', error);
    
    // Show error
    let errorMessage = 'Manzil bo\'yicha qidirishda xatolik. Iltimos, boshqa manzilni sinab ko\'ring.';
    
    if (error.name === 'TimeoutError') {
      errorMessage = 'Server javob bermadi (30 soniya). Iltimos, bir oz kuting va qaytadan urinib ko\'ring.';
    }
    
    showError(errorMessage);
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize page - load mosques based on current location
 */
async function initializeMosquesPage() {
  console.log('📱 Mosques page initialized');
  
  // Show loading
  loadingIndicator.style.display = 'flex';
  mosqueCardsContainer.style.display = 'none';
  noResults.style.display = 'none';
  
  // Get user location from LocationManager
  const location = LocationManager.getCurrentLocation();
  
  if (location && location.lat && location.lon) {
    console.log('📍 User location:', location.city, location.lat, location.lon);
    
    try {
      // Fetch nearby mosques
      const mosques = await fetchNearbyMosques(location.lat, location.lon, 5);
      
      // Hide loading
      loadingIndicator.style.display = 'none';
      
      // Render mosques
      await renderMosqueCards(mosques);
      
    } catch (error) {
      console.error('❌ Error loading initial mosques:', error);
      
      let errorMessage = 'Masjidlarni yuklashda xatolik yuz berdi. Iltimos, sahifani yangilang.';
      
      if (error.name === 'TimeoutError') {
        errorMessage = 'Server uyg\'onmoqda... Iltimos, 1 daqiqa kuting va sahifani yangilang.';
      }
      
      showError(errorMessage);
    }
  } else {
    // No location available
    console.warn('⚠️ No location available yet');
    loadingIndicator.style.display = 'none';
    showError('Joylashuv ma\'lumotlari topilmadi. Iltimos, brauzerda joylashuvni yoqing va sahifani yangilang.');
  }
}

// Start initialization when page loads
document.addEventListener('DOMContentLoaded', initializeMosquesPage);