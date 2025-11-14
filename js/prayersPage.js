// prayersPage.js - Logic specific to the detailed prayers page
// This file handles the prayer list display and page-specific interactions

// Initialize the prayers page
function initPrayersPage() {
  const tg = window.Telegram.WebApp;
  
  // Hide Telegram native back button – we use our own
  tg.BackButton.hide();

  // Handle footer back button click
  const backBtn = document.getElementById("backToMain");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "../index.html";
    });
  }

  // Handle manual location refresh
  const refreshBtn = document.getElementById('refreshLocationBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await LocationManager.manualRefresh();
    });
  }

  // Update timestamp display when location updates
  window.addEventListener('locationUpdated', (event) => {
    updateTimestampDisplay(event.detail.timestamp);
  });

  // Show initial timestamp from cached location
  const location = LocationManager.getStoredLocation();
  if (location && location.timestamp) {
    updateTimestampDisplay(location.timestamp);
  }

  // Check if location is stale and show warning
  if (LocationManager.isLocationStale()) {
    showStaleLocationWarning();
  }
}

// Update the timestamp display element
function updateTimestampDisplay(timestamp) {
  const timestampElem = document.getElementById('locationTimestamp');
  if (timestampElem && timestamp) {
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString();
    const dateString = date.toLocaleDateString();
    timestampElem.innerText = `Last updated: ${timeString}, ${dateString}`;
  }
}

// Show warning if location data is stale
function showStaleLocationWarning() {
  const timestampElem = document.getElementById('locationTimestamp');
  if (timestampElem) {
    timestampElem.style.color = '#ff9800';
    timestampElem.innerHTML += ' ⚠️ <small>(Consider refreshing)</small>';
  }

  // Add pulse animation to refresh button
  const refreshBtn = document.getElementById('refreshLocationBtn');
  if (refreshBtn) {
    refreshBtn.classList.add('stale');
  }
}

// Populate the detailed prayer list
function populateDetailedPrayerList(timings, currentPrayerName) {
  const prayerListElem = document.getElementById("prayerList");
  if (!prayerListElem) return;

  const prayerOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  prayerListElem.innerHTML = '';

  prayerOrder.forEach(prayer => {
    const div = document.createElement('div');
    div.className = 'prayer-item';
    
    // Highlight current prayer
    if (prayer === currentPrayerName) {
      div.classList.add('current-prayer');
    }

    const nameSpan = document.createElement('span');
    nameSpan.textContent = prayer;
    nameSpan.style.fontWeight = '600';

    const timeSpan = document.createElement('span');
    timeSpan.textContent = timings[prayer];
    timeSpan.style.fontWeight = '500';

    div.appendChild(nameSpan);
    div.appendChild(timeSpan);
    prayerListElem.appendChild(div);
  });
}

// Listen for prayer data updates and populate the list
window.addEventListener('prayerDataUpdated', (event) => {
  if (event.detail && event.detail.timings && event.detail.currentPrayer) {
    populateDetailedPrayerList(event.detail.timings, event.detail.currentPrayer);
  }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initPrayersPage);