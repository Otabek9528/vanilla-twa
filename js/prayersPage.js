// prayersPage.js - Logic specific to the detailed prayers page
// This file handles the prayer list display and page-specific interactions

// Initialize the prayers page
function initPrayersPage() {
  const tg = window.Telegram.WebApp;
  
  // Try to hide Telegram native back button (ignore if not supported)
  try {
    if (tg.BackButton && tg.BackButton.hide) {
      tg.BackButton.hide();
    }
  } catch (e) {
    console.log('BackButton not supported, skipping...');
  }

  // Handle footer back button click
  const backBtn = document.getElementById("backToMain");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "../index.html";
    });
  }

  // Handle manual location refresh
  const refreshBtn = document.getElementById('refreshLocationBtn');
  console.log('🔍 Looking for refresh button:', refreshBtn);
  
  if (refreshBtn) {
    console.log('✅ Refresh button found! Adding click listener...');
    let isRefreshing = false;
    
    refreshBtn.addEventListener('click', async (e) => {
      console.log('🖱️ REFRESH BUTTON CLICKED!');
      e.preventDefault();
      e.stopPropagation();
      
      if (isRefreshing) {
        console.log('⏳ Refresh already in progress...');
        return;
      }
      
      isRefreshing = true;
      console.log('🔄 Starting refresh process...');
      
      // Visual feedback
      refreshBtn.style.opacity = '0.5';
      refreshBtn.disabled = true;
      
      try {
        console.log('📞 Calling LocationManager.manualRefresh()...');
        const result = await LocationManager.manualRefresh();
        console.log('✅ manualRefresh returned:', result);
      } catch (error) {
        console.error('❌ Refresh error:', error);
      } finally {
        // Re-enable button
        console.log('🔓 Re-enabling button...');
        refreshBtn.style.opacity = '1';
        refreshBtn.disabled = false;
        isRefreshing = false;
      }
    });
    
    console.log('✅ Click listener added successfully');
  } else {
    console.error('❌ REFRESH BUTTON NOT FOUND!');
  }

  // Update timestamp display when location updates
  window.addEventListener('locationUpdated', (event) => {
    console.log('🎉 locationUpdated EVENT received!', event.detail);
    updateTimestampDisplay(event.detail.timestamp);
  });

  // Show initial timestamp from cached location
  const location = LocationManager.getStoredLocation();
  console.log('📍 Initial location on page load:', location);
  
  if (location && location.timestamp) {
    updateTimestampDisplay(location.timestamp);
  } else {
    console.warn('⚠️ No location data available on page load');
    const timestampElem = document.getElementById('locationTimestamp');
    if (timestampElem) {
      timestampElem.innerText = 'Last updated: Never';
    }
  }

  // Check if location is stale and show warning
  if (LocationManager.isLocationStale()) {
    showStaleLocationWarning();
  }
  
  // DEBUG BUTTON - Force update timestamp to test if element works
  const debugBtn = document.getElementById('debugTimestamp');
  if (debugBtn) {
    debugBtn.addEventListener('click', () => {
      const timestampElem = document.getElementById('locationTimestamp');
      const now = Date.now();
      const date = new Date(now);
      
      console.log('🐛 DEBUG: Forcing timestamp update');
      console.log('🐛 Element found:', timestampElem);
      console.log('🐛 New time:', date.toLocaleString());
      
      if (timestampElem) {
        timestampElem.innerText = `Last updated: ${date.toLocaleTimeString()}, ${date.toLocaleDateString()}`;
        timestampElem.style.color = '#ff0000'; // Red to show it was forced
        console.log('✅ DEBUG: Timestamp element updated to:', timestampElem.innerText);
        
        // Also update localStorage to test
        const location = LocationManager.getStoredLocation();
        if (location) {
          location.timestamp = now;
          localStorage.setItem('userLocation', JSON.stringify(location));
          console.log('✅ DEBUG: localStorage also updated');
        }
      } else {
        console.error('❌ DEBUG: Timestamp element not found!');
      }
    });
  }
  
  // TEST: Add direct test for refresh button
  console.log('🧪 Testing if refresh button is accessible...');
  const testRefreshBtn = document.getElementById('refreshLocationBtn');
  if (testRefreshBtn) {
    console.log('✅ Refresh button IS in DOM');
    console.log('   Tag:', testRefreshBtn.tagName);
    console.log('   Class:', testRefreshBtn.className);
    console.log('   Disabled:', testRefreshBtn.disabled);
    console.log('   Visible:', window.getComputedStyle(testRefreshBtn).display !== 'none');
    console.log('   Try clicking it now!');
  } else {
    console.error('❌ Refresh button NOT in DOM!');
  }
  
  // BLUE TEST BUTTON - Directly call LocationManager.manualRefresh
  const testRefreshCall = document.getElementById('testRefreshCall');
  if (testRefreshCall) {
    testRefreshCall.addEventListener('click', async () => {
      console.log('🧪 BLUE TEST BUTTON CLICKED - Calling manualRefresh directly...');
      
      // First, verify timestamp element exists and is visible
      const tsElem = document.getElementById('locationTimestamp');
      console.log('🔍 Before refresh - timestamp element:', tsElem);
      console.log('   Current text:', tsElem ? tsElem.innerText : 'NOT FOUND');
      console.log('   Visible:', tsElem ? (window.getComputedStyle(tsElem).display !== 'none') : 'N/A');
      
      try {
        const result = await LocationManager.manualRefresh();
        console.log('✅ Test refresh completed:', result);
        
        // Check again after refresh
        console.log('🔍 After refresh - timestamp element text:', tsElem ? tsElem.innerText : 'NOT FOUND');
        
        alert('Refresh complete! Check if timestamp changed on page.');
      } catch (error) {
        console.error('❌ Test refresh failed:', error);
        alert('Failed! Error: ' + error.message);
      }
    });
    console.log('✅ Blue test button listener added');
  }
}

// Update the timestamp display element
function updateTimestampDisplay(timestamp) {
  const timestampElem = document.getElementById('locationTimestamp');
  console.log('🕒 updateTimestampDisplay called with:', timestamp, 'Element:', timestampElem);
  
  if (timestampElem && timestamp) {
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString();
    const dateString = date.toLocaleDateString();
    const newText = `Last updated: ${timeString}, ${dateString}`;
    
    // Update the text
    timestampElem.innerText = newText;
    timestampElem.textContent = newText; // Try both methods
    
    // Force visual update
    timestampElem.style.color = '#ff0000';
    timestampElem.style.fontWeight = 'bold';
    
    // Force repaint
    void timestampElem.offsetHeight;
    
    console.log('✅ Timestamp updated to:', timestampElem.innerText);
    console.log('   Element text content:', timestampElem.textContent);
    console.log('   Element innerHTML:', timestampElem.innerHTML);
    console.log('   Element visible:', window.getComputedStyle(timestampElem).display !== 'none');
    console.log('   Element in viewport:', timestampElem.getBoundingClientRect().top < window.innerHeight);
  } else {
    console.warn('⚠️ Could not update timestamp. Element:', timestampElem, 'Timestamp:', timestamp);
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