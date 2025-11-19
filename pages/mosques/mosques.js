// mosques.js - Mosques feature logic with star ratings

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

// Dummy mosque data with star ratings and multiple photos
const DUMMY_MOSQUES = [
  {
    id: 1,
    name: "Seoul Central Mosque",
    nameKo: "서울중앙성원",
    phone: "+82-2-793-6908",
    address: "39-1 Hannam-dong, Yongsan-gu, Seoul",
    addressKo: "서울특별시 용산구 우사단로 10길 39-1",
    distance: 1.2,
    photos: [
      "../../assets/mosque.png",
      "../../assets/mosque.png",
      "../../assets/mosque.png"
    ], // Multiple photos
    lat: 37.5347,
    lng: 126.9996,
    rating: 4.5
  },
  {
    id: 2,
    name: "Busan Mosque",
    nameKo: "부산 성원",
    phone: "+82-51-631-2308",
    address: "15 Jungang-daero 691, Busanjin-gu, Busan",
    addressKo: "부산광역시 부산진구 중앙대로 691번길 15",
    distance: 2.5,
    photo: "../../assets/mosque.png", // Single photo
    lat: 35.1543,
    lng: 129.0598,
    rating: 3
  },
  {
    id: 3,
    name: "Ansan Mosque",
    nameKo: "안산 성원",
    phone: "+82-31-491-5943",
    address: "123 Wonkok-dong, Danwon-gu, Ansan",
    addressKo: "경기도 안산시 단원구 원곡동 123",
    distance: 3.8,
    photos: [
      "../../assets/mosque.png",
      "../../assets/mosque.png"
    ], // Multiple photos
    lat: 37.3236,
    lng: 126.8216,
    rating: 5
  },
  {
    id: 4,
    name: "Daegu Mosque",
    nameKo: "대구 성원",
    phone: "+82-53-743-9875",
    address: "78 Dongseong-ro, Jung-gu, Daegu",
    addressKo: "대구광역시 중구 동성로 78",
    distance: 5.1,
    photo: "../../assets/mosque.png", // Single photo
    lat: 35.8686,
    lng: 128.5936,
    rating: null
  },
  {
    id: 5,
    name: "Gwangju Mosque",
    nameKo: "광주 성원",
    phone: "+82-62-222-1234",
    address: "456 Geumnam-ro, Dong-gu, Gwangju",
    addressKo: "광주광역시 동구 금남로 456",
    distance: 6.3,
    photos: [
      "../../assets/mosque.png",
      "../../assets/mosque.png",
      "../../assets/mosque.png",
      "../../assets/mosque.png"
    ], // Multiple photos
    lat: 35.1468,
    lng: 126.9213,
    rating: 2
  }
];

// State management
let currentMode = 'location'; // 'location' or 'address'
let currentSearchAddress = '';

// DOM Elements
const mosqueCardsContainer = document.getElementById('mosqueCards');
const searchToggleBtn = document.getElementById('searchToggleBtn');
const searchCollapsible = document.getElementById('searchCollapsible');
const toggleArrow = document.getElementById('toggleArrow');
const searchBar = document.getElementById('addressSearchBar');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchBtn = document.getElementById('searchBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const noResults = document.getElementById('noResults');

// Handle search toggle button
searchToggleBtn.addEventListener('click', () => {
  const isCollapsed = searchCollapsible.style.display === 'none';
  
  if (isCollapsed) {
    // Expand
    searchCollapsible.style.display = 'block';
    toggleArrow.classList.add('rotated');
    searchToggleBtn.classList.add('active');
    console.log('🔽 Search expanded');
  } else {
    // Collapse
    searchCollapsible.style.display = 'none';
    toggleArrow.classList.remove('rotated');
    searchToggleBtn.classList.remove('active');
    console.log('🔼 Search collapsed');
  }
});

// Generate star rating HTML
function generateStarRating(rating) {
  if (rating === null || rating === undefined) {
    // No rating - show "Baholanmagan"
    return `
      <div class="mosque-rating-badge">
        <span class="no-rating-text">Baholanmagan</span>
      </div>
    `;
  }

  // Round rating to nearest integer for full stars
  const fullStars = Math.round(rating);
  const emptyStars = 5 - fullStars;
  
  let starsHTML = '<div class="star-container">';
  
  // Add gold stars
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<span class="star gold">⭐</span>';
  }
  
  // Add grey stars
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<span class="star grey">⭐</span>';
  }
  
  starsHTML += '</div>';
  
  return `
    <div class="mosque-rating-badge">
      ${starsHTML}
    </div>
  `;
}

// Render mosque cards with photo carousel
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
      // Navigate to detail page
      console.log('Clicked mosque:', mosque.id);
      window.location.href = `mosques-detail.html?id=${mosque.id}`;
    };
    
    // Generate photo carousel HTML
    const photosHTML = generatePhotoCarousel(mosque.photos || [mosque.photo], mosque.id);
    
    card.innerHTML = `
      <div class="mosque-card-image">
        ${photosHTML}
        <div class="card-top-badges">
          ${generateStarRating(mosque.rating)}
          <div class="mosque-distance-badge">
            <span>📍</span>
            <span>${mosque.distance} km</span>
          </div>
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
    
    // Initialize carousel for this mosque if it has multiple photos
    if (mosque.photos && mosque.photos.length > 1) {
      initializeCarousel(mosque.id);
    }
  });
}

// Generate photo carousel HTML
function generatePhotoCarousel(photos, mosqueId) {
  if (!Array.isArray(photos) || photos.length === 0) {
    photos = ['../../assets/mosque.png'];
  }
  
  if (photos.length === 1) {
    // Single photo - simple display
    return `<img src="${photos[0]}" alt="Mosque" class="mosque-photo-single" />`;
  }
  
  // Multiple photos - carousel
  let carouselHTML = `<div class="photo-carousel" data-mosque-id="${mosqueId}">`;
  carouselHTML += `<div class="carousel-track" data-current="0">`;
  
  photos.forEach((photo, index) => {
    const position = index === 0 ? 'center' : (index === 1 ? 'right' : 'hidden');
    carouselHTML += `
      <div class="carousel-photo ${position}" data-index="${index}">
        <img src="${photo}" alt="Mosque photo ${index + 1}" />
      </div>
    `;
  });
  
  carouselHTML += `</div>`;
  
  // Add navigation dots
  if (photos.length > 1) {
    carouselHTML += `<div class="carousel-dots">`;
    photos.forEach((_, index) => {
      carouselHTML += `<span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>`;
    });
    carouselHTML += `</div>`;
  }
  
  carouselHTML += `</div>`;
  
  return carouselHTML;
}

// Initialize carousel with swipe functionality
function initializeCarousel(mosqueId) {
  const carousel = document.querySelector(`[data-mosque-id="${mosqueId}"]`);
  if (!carousel) return;
  
  const track = carousel.querySelector('.carousel-track');
  const photos = Array.from(track.querySelectorAll('.carousel-photo'));
  const dots = Array.from(carousel.querySelectorAll('.dot'));
  
  let currentIndex = 0;
  let startX = 0;
  let isDragging = false;
  
  // Update carousel positions
  function updateCarousel() {
    photos.forEach((photo, index) => {
      photo.classList.remove('left', 'center', 'right', 'hidden');
      
      if (index === currentIndex) {
        photo.classList.add('center');
      } else if (index === currentIndex - 1 || (currentIndex === 0 && index === photos.length - 1)) {
        photo.classList.add('left');
      } else if (index === currentIndex + 1 || (currentIndex === photos.length - 1 && index === 0)) {
        photo.classList.add('right');
      } else {
        photo.classList.add('hidden');
      }
    });
    
    // Update dots
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
    
    track.setAttribute('data-current', currentIndex);
  }
  
  // Next photo
  function nextPhoto() {
    currentIndex = (currentIndex + 1) % photos.length;
    updateCarousel();
  }
  
  // Previous photo
  function prevPhoto() {
    currentIndex = (currentIndex - 1 + photos.length) % photos.length;
    updateCarousel();
  }
  
  // Touch events
  carousel.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  });
  
  carousel.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
  });
  
  carousel.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) {
        nextPhoto();
      } else {
        prevPhoto();
      }
    }
  });
  
  // Dot click navigation
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card click
      currentIndex = parseInt(dot.getAttribute('data-index'));
      updateCarousel();
    });
  });
  
  // Initialize
  updateCarousel();
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

// Handle search button click
searchBtn.addEventListener('click', () => {
  const address = searchBar.value.trim();
  
  if (address) {
    performAddressSearch(address);
  } else {
    // Show alert if search bar is empty
    if (tg.showAlert) {
      tg.showAlert('Iltimos, manzilni kiriting');
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

// Initialize page - render mosques based on current location
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 Mosques page initialized');
  
  // Initial render with dummy data
  renderMosqueCards(DUMMY_MOSQUES);
});