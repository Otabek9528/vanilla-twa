// mosques.js - Updated with state clearing and modal navigation

const tg = window.Telegram.WebApp;
tg.ready();

try {
  tg.expand();
} catch (e) {}

try {
  if (tg.BackButton) {
    tg.BackButton.show();
    tg.onEvent('backButtonClicked', () => {
      clearSearchState();
      window.location.href = "../../index.html";
    });
  }
} catch (e) {}

const STATE_KEY = 'mosques_search_state';

let currentMode = 'location';
let currentSearchAddress = '';
let currentMosques = [];
let carouselIntervals = {};

function saveSearchState() {
  const state = {
    mode: currentMode,
    address: currentSearchAddress,
    mosques: currentMosques,
    timestamp: Date.now()
  };
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function loadSearchState() {
  const saved = localStorage.getItem(STATE_KEY);
  if (!saved) return null;
  
  try {
    const state = JSON.parse(saved);
    const age = Date.now() - state.timestamp;
    if (age > 30 * 60 * 1000) {
      clearSearchState();
      return null;
    }
    return state;
  } catch (e) {
    return null;
  }
}

function clearSearchState() {
  localStorage.removeItem(STATE_KEY);
}

const mosqueCardsContainer = document.getElementById('mosqueCards');
const searchBar = document.getElementById('addressSearchBar');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchBtn = document.getElementById('searchBtn');
const searchToggleBtn = document.getElementById('searchToggleBtn');
const searchCollapsible = document.getElementById('searchCollapsible');
const toggleArrow = document.getElementById('toggleArrow');
const loadingIndicator = document.getElementById('loadingIndicator');
const noResults = document.getElementById('noResults');
const mosquesPageTitle = document.querySelector('.mosques-page-title');

let imageModal = null;
let currentModalPhotos = [];
let currentModalIndex = 0;

function updatePageTitle() {
  if (currentMode === 'address' && currentSearchAddress) {
    mosquesPageTitle.textContent = `🕌 Izlangan manzilga eng yaqinlari`;
  } else {
    mosquesPageTitle.textContent = '🕌 Sizga eng yaqin 5 masjid';
  }
}

function createImageModal() {
  if (imageModal) return;
  
  imageModal = document.createElement('div');
  imageModal.className = 'image-modal';
  imageModal.innerHTML = `
    <div class="modal-content">
      <button class="modal-nav modal-nav-prev" id="modalPrev">‹</button>
      <img src="" alt="Full size image" class="modal-image" id="modalImage" />
      <button class="modal-nav modal-nav-next" id="modalNext">›</button>
      <button class="modal-close" id="modalClose">✕</button>
      <div class="modal-counter" id="modalCounter">1 / 1</div>
      <div class="modal-hint">← → yoki suring</div>
    </div>
  `;
  
  document.body.appendChild(imageModal);
  
  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) closeImageModal();
  });
  
  document.getElementById('modalClose').addEventListener('click', (e) => {
    e.stopPropagation();
    closeImageModal();
  });
  
  document.getElementById('modalPrev').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateModal(-1);
  });
  
  document.getElementById('modalNext').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateModal(1);
  });
  
  document.addEventListener('keydown', handleModalKeyboard);
  
  let touchStartX = 0;
  let touchEndX = 0;
  
  const modalContent = imageModal.querySelector('.modal-content');
  modalContent.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });
  
  modalContent.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const swipeThreshold = 50;
    if (touchStartX - touchEndX > swipeThreshold) {
      navigateModal(1);
    } else if (touchEndX - touchStartX > swipeThreshold) {
      navigateModal(-1);
    }
  });
}

function handleModalKeyboard(e) {
  if (!imageModal || !imageModal.classList.contains('active')) return;
  
  if (e.key === 'Escape') {
    closeImageModal();
  } else if (e.key === 'ArrowLeft') {
    navigateModal(-1);
  } else if (e.key === 'ArrowRight') {
    navigateModal(1);
  }
}

function openImageModal(photos, startIndex = 0) {
  if (!imageModal) createImageModal();
  
  currentModalPhotos = Array.isArray(photos) ? photos : [photos];
  currentModalIndex = startIndex;
  
  updateModalImage();
  imageModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeImageModal() {
  if (!imageModal) return;
  
  imageModal.classList.remove('active');
  document.body.style.overflow = '';
  currentModalPhotos = [];
  currentModalIndex = 0;
}

function navigateModal(direction) {
  if (currentModalPhotos.length <= 1) return;
  
  currentModalIndex += direction;
  
  if (currentModalIndex < 0) {
    currentModalIndex = currentModalPhotos.length - 1;
  } else if (currentModalIndex >= currentModalPhotos.length) {
    currentModalIndex = 0;
  }
  
  updateModalImage();
}

function updateModalImage() {
  const modalImage = document.getElementById('modalImage');
  const modalCounter = document.getElementById('modalCounter');
  const modalPrev = document.getElementById('modalPrev');
  const modalNext = document.getElementById('modalNext');
  
  if (modalImage && currentModalPhotos.length > 0) {
    modalImage.src = currentModalPhotos[currentModalIndex];
  }
  
  if (modalCounter) {
    modalCounter.textContent = `${currentModalIndex + 1} / ${currentModalPhotos.length}`;
  }
  
  if (modalPrev && modalNext) {
    const display = currentModalPhotos.length > 1 ? 'flex' : 'none';
    modalPrev.style.display = display;
    modalNext.style.display = display;
  }
}

async function fetchNearbyMosques(lat, lon, limit = 5) {
  const url = getApiUrl(API_CONFIG.ENDPOINTS.MOSQUES_NEARBY, { lat, lon, limit });
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(API_CONFIG.DEFAULTS.TIMEOUT)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.mosques) {
      return data.mosques;
    } else {
      throw new Error('Invalid API response');
    }
  } catch (error) {
    throw error;
  }
}

async function fetchMosquesByAddress(address, limit = 5) {
  const url = getApiUrl(API_CONFIG.ENDPOINTS.MOSQUES_BY_ADDRESS, { address, limit });
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(API_CONFIG.DEFAULTS.TIMEOUT)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.mosques) {
      return data.mosques;
    } else {
      throw new Error('Invalid API response');
    }
  } catch (error) {
    throw error;
  }
}

function generateStarRating(reviews) {
  if (!reviews || reviews.length === 0) {
    return `<span class="no-rating-text">Sharhlar yo'q</span>`;
  }
  
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

async function discoverPhotos(photoPath, maxPhotos = 10) {
  const photos = [];
  const extensions = ['jpg', 'jpeg', 'png'];
  const basePath = `../../${photoPath}`;
  
  for (let i = 1; i <= maxPhotos; i++) {
    let photoFound = false;
    
    for (const ext of extensions) {
      const photoUrl = `${basePath}/${i}.${ext}`;
      
      try {
        const exists = await checkImageExists(photoUrl);
        if (exists) {
          photos.push(photoUrl);
          photoFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!photoFound) break;
  }
  
  return photos;
}

function checkImageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

function createPhotoCarousel(mosqueId, photos) {
  if (!photos || photos.length === 0) {
    return `
      <div class="mosque-photo-single" data-photos='["../../assets/mosque.png"]' data-index="0">
        <img src="../../assets/mosque.png" alt="Mosque photo" />
      </div>
    `;
  }
  
  if (photos.length === 1) {
    return `
      <div class="mosque-photo-single" data-photos='${JSON.stringify(photos)}' data-index="0">
        <img src="${photos[0]}" alt="Mosque photo" />
      </div>
    `;
  }
  
  let photosHTML = '';
  let dotsHTML = '';
  
  photos.forEach((photo, index) => {
    const positionClass = index === 0 ? 'center' : 
                         index === 1 ? 'right' : 'hidden';
    
    photosHTML += `
      <div class="carousel-photo ${positionClass}" data-index="${index}" data-photo="${photo}">
        <img src="${photo}" alt="Mosque photo ${index + 1}" />
      </div>
    `;
    
    dotsHTML += `
      <span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
    `;
  });
  
  return `
    <div class="photo-carousel" data-mosque-id="${mosqueId}" data-photos='${JSON.stringify(photos)}'>
      <div class="carousel-track">
        ${photosHTML}
      </div>
      <div class="carousel-dots">
        ${dotsHTML}
      </div>
    </div>
  `;
}

function initCarousel(mosqueId, photoCount) {
  const carousel = document.querySelector(`.photo-carousel[data-mosque-id="${mosqueId}"]`);
  if (!carousel || photoCount <= 1) {
    const singlePhoto = document.querySelector(`.mosque-photo-single`);
    if (singlePhoto) {
      singlePhoto.addEventListener('click', (e) => {
        e.stopPropagation();
        const photos = JSON.parse(singlePhoto.getAttribute('data-photos'));
        openImageModal(photos, 0);
      });
    }
    return;
  }
  
  const photos = carousel.querySelectorAll('.carousel-photo');
  const dots = carousel.querySelectorAll('.dot');
  const allPhotos = JSON.parse(carousel.getAttribute('data-photos'));
  let currentIndex = 0;
  
  function updateCarousel(newIndex) {
    const totalPhotos = photos.length;
    
    photos.forEach((photo, index) => {
      let relativePos = (index - newIndex + totalPhotos) % totalPhotos;
      
      photo.classList.remove('center', 'left', 'right', 'hidden');
      
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
    
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === newIndex);
    });
    
    currentIndex = newIndex;
  }
  
  photos.forEach((photo) => {
    photo.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (photo.classList.contains('center')) {
        const photoIndex = parseInt(photo.getAttribute('data-index'));
        openImageModal(allPhotos, photoIndex);
      }
    });
  });
  
  dots.forEach((dot, index) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      updateCarousel(index);
      
      if (carouselIntervals[mosqueId]) {
        clearInterval(carouselIntervals[mosqueId]);
      }
      startAutoRotation();
    });
  });
  
  function startAutoRotation() {
    carouselIntervals[mosqueId] = setInterval(() => {
      const nextIndex = (currentIndex + 1) % photos.length;
      updateCarousel(nextIndex);
    }, 3000);
  }
  
  startAutoRotation();
  
  carousel.addEventListener('mouseenter', () => {
    if (carouselIntervals[mosqueId]) {
      clearInterval(carouselIntervals[mosqueId]);
    }
  });
  
  carousel.addEventListener('mouseleave', () => {
    startAutoRotation();
  });
}

async function renderMosqueCards(mosques) {
  Object.values(carouselIntervals).forEach(interval => clearInterval(interval));
  carouselIntervals = {};
  
  mosqueCardsContainer.innerHTML = '';
  
  if (!mosques || mosques.length === 0) {
    loadingIndicator.style.display = 'none';
    noResults.style.display = 'block';
    mosqueCardsContainer.style.display = 'none';
    return;
  }
  
  noResults.style.display = 'none';
  mosqueCardsContainer.style.display = 'flex';
  
  for (const mosque of mosques) {
    const photos = await discoverPhotos(mosque.photo, 10);
    
    const card = document.createElement('div');
    card.className = 'mosque-card';
    card.onclick = () => {
      saveSearchState();
      window.location.href = `mosques-detail.html?id=${mosque.id}`;
    };
    
    const starRatingHTML = generateStarRating(mosque.reviews);
    const distanceDisplay = mosque.distance ? mosque.distance.toFixed(1) : 'N/A';
    const photoHTML = createPhotoCarousel(mosque.id, photos);
    const phoneDisplay = mosque.phone || 'Ma\'lumot yo\'q';
    
    card.innerHTML = `
      <div class="card-top-badges">
        <div class="mosque-rating-badge">
          ${starRatingHTML}
        </div>
        <div class="mosque-distance-badge">
          <span>📍</span>
          <span>${distanceDisplay} km</span>
        </div>
      </div>
      
      <div class="mosque-card-image">
        ${photoHTML}
      </div>
      
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
    
    if (photos.length > 1) {
      initCarousel(mosque.id, photos.length);
    } else if (photos.length === 1) {
      const singlePhoto = card.querySelector('.mosque-photo-single');
      if (singlePhoto) {
        singlePhoto.addEventListener('click', (e) => {
          e.stopPropagation();
          openImageModal(photos, 0);
        });
      }
    }
  }
  
  currentMosques = mosques;
  updatePageTitle(); 
}

function showError(message) {
  loadingIndicator.style.display = 'none';
  noResults.style.display = 'block';
  mosqueCardsContainer.style.display = 'none';
  
  const noResultsText = document.querySelector('.no-results-text');
  const noResultsHint = document.querySelector('.no-results-hint');
  
  if (noResultsText) noResultsText.textContent = 'Xatolik yuz berdi';
  if (noResultsHint) noResultsHint.textContent = message;
}

searchToggleBtn.addEventListener('click', () => {
  const isVisible = searchCollapsible.style.display !== 'none';
  
  if (isVisible) {
    searchCollapsible.style.display = 'none';
    toggleArrow.classList.remove('rotated');
    searchToggleBtn.classList.remove('active');
  } else {
    searchCollapsible.style.display = 'block';
    toggleArrow.classList.add('rotated');
    searchToggleBtn.classList.add('active');
  }
});

searchBar.addEventListener('input', (e) => {
  const value = e.target.value.trim();
  clearSearchBtn.style.display = value ? 'flex' : 'none';
});

searchBar.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const address = searchBar.value.trim();
    if (address) performAddressSearch(address);
  }
});

searchBtn.addEventListener('click', () => {
  const address = searchBar.value.trim();
  if (address) performAddressSearch(address);
});

clearSearchBtn.addEventListener('click', async () => {
  searchBar.value = '';
  clearSearchBtn.style.display = 'none';
  searchBar.focus();
  
  currentMode = 'location';
  currentSearchAddress = '';
  updatePageTitle();
  clearSearchState();
  
  searchCollapsible.style.display = 'none';
  toggleArrow.classList.remove('rotated');
  searchToggleBtn.classList.remove('active');
  
  loadingIndicator.style.display = 'flex';
  mosqueCardsContainer.style.display = 'none';
  
  const location = LocationManager.getCurrentLocation();
  
  if (location && location.lat && location.lon) {
    try {
      const mosques = await fetchNearbyMosques(location.lat, location.lon, 5);
      loadingIndicator.style.display = 'none';
      await renderMosqueCards(mosques);
    } catch (error) {
      showError('Masjidlarni yuklashda xatolik yuz berdi');
    }
  } else {
    loadingIndicator.style.display = 'none';
    showError('Joylashuv ma\'lumotlari topilmadi');
  }
});

async function performAddressSearch(address) {
  currentMode = 'address';
  currentSearchAddress = address;
  updatePageTitle();
  
  loadingIndicator.style.display = 'flex';
  mosqueCardsContainer.style.display = 'none';
  noResults.style.display = 'none';
  
  searchBar.blur();
  
  searchCollapsible.style.display = 'none';
  toggleArrow.classList.remove('rotated');
  searchToggleBtn.classList.remove('active');
  
  try {
    const mosques = await fetchMosquesByAddress(address, 5);
    loadingIndicator.style.display = 'none';
    await renderMosqueCards(mosques);
    saveSearchState();
  } catch (error) {
    let errorMessage = 'Manzil bo\'yicha qidirishda xatolik. Iltimos, boshqa manzilni sinab ko\'ring.';
    
    if (error.name === 'TimeoutError') {
      errorMessage = 'Server javob bermadi (30 soniya). Iltimos, bir oz kuting va qaytadan urinib ko\'ring.';
    }
    
    showError(errorMessage);
  }
}

async function initializeMosquesPage() {
  const referrer = document.referrer;
  if (referrer.includes('index.html') || referrer.endsWith('/')) {
    clearSearchState();
  }
  
  const savedState = loadSearchState();
  
  if (savedState && savedState.mosques && savedState.mosques.length > 0) {
    currentMode = savedState.mode;
    currentSearchAddress = savedState.address;
    updatePageTitle();
    currentMosques = savedState.mosques;
    
    if (currentMode === 'address' && currentSearchAddress) {
      searchBar.value = currentSearchAddress;
      clearSearchBtn.style.display = 'flex';
    }
    
    loadingIndicator.style.display = 'none';
    await renderMosqueCards(savedState.mosques);
    return;
  }
  
  loadingIndicator.style.display = 'flex';
  mosqueCardsContainer.style.display = 'none';
  noResults.style.display = 'none';
  
  const location = LocationManager.getCurrentLocation();
  
  if (location && location.lat && location.lon) {
    try {
      const mosques = await fetchNearbyMosques(location.lat, location.lon, 5);
      loadingIndicator.style.display = 'none';
      await renderMosqueCards(mosques);
    } catch (error) {
      let errorMessage = 'Masjidlarni yuklashda xatolik yuz berdi. Iltimos, sahifani yangilang.';
      
      if (error.name === 'TimeoutError') {
        errorMessage = 'Server uyg\'onmoqda... Iltimos, 1 daqiqa kuting va sahifani yangilang.';
      }
      
      showError(errorMessage);
    }
  } else {
    loadingIndicator.style.display = 'none';
    showError('Joylashuv ma\'lumotlari topilmadi. Iltimos, brauzerda joylashuvni yoqing va sahifani yangilang.');
  }
}

createImageModal();
document.addEventListener('DOMContentLoaded', initializeMosquesPage);