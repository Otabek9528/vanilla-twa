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
const locationSearchBtn = document.getElementById('locationSearchBtn');
const addressInput = document.getElementById('addressInput');
const addressSearchBtn = document.getElementById('addressSearchBtn');

// Handle location search button
locationSearchBtn.addEventListener('click', async () => {
  console.log('📍 Location search selected - updating and searching');
  
  // Add loading state
  locationSearchBtn.classList.add('loading');
  locationSearchBtn.disabled = true;
  
  // Simulate location update (2 seconds)
  setTimeout(() => {
    console.log('✅ Navigating to mosques list (location mode)');
    window.location.href = 'mosques.html?mode=location';
  }, 2000);
});

// Handle address input
addressInput.addEventListener('input', (e) => {
  const value = e.target.value.trim();
  
  // Enable/disable button based on input
  if (value.length > 0) {
    addressSearchBtn.disabled = false;
  } else {
    addressSearchBtn.disabled = true;
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

// Handle address search button
addressSearchBtn.addEventListener('click', () => {
  const address = addressInput.value.trim();
  if (address) {
    performAddressSearch(address);
  }
});

// Perform address search
function performAddressSearch(address) {
  console.log('🔍 Address search selected:', address);
  
  // Disable button and input
  addressSearchBtn.disabled = true;
  addressInput.disabled = true;
  addressSearchBtn.classList.add('loading');
  
  // Navigate to mosques list page with address parameter
  const encodedAddress = encodeURIComponent(address);
  window.location.href = `mosques.html?mode=address&address=${encodedAddress}`;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 Mosque options page initialized');
});