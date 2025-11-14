// ===============================
//  geolocation.js
//  Shared geolocation manager for
//  Telegram WebApp (Android)
// ===============================

Telegram.WebApp.ready();

// Local storage keys
const GEO_STATUS_KEY = "geoPermissionStatus";  // "granted" | "denied"
const LOCATION_KEY   = "userLocation";         // {lat, lon, city, ts}

// ------------------------------------------------
// Storage helpers
// ------------------------------------------------

function loadStoredLocation() {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredLocation(lat, lon, city) {
  const payload = { lat, lon, city, ts: Date.now() };
  localStorage.setItem(LOCATION_KEY, JSON.stringify(payload));
}

function setGeoStatus(status) {
  localStorage.setItem(GEO_STATUS_KEY, status);
}

function getGeoStatus() {
  return localStorage.getItem(GEO_STATUS_KEY); // null | granted | denied
}

// ------------------------------------------------
// Reverse geocoding (OpenStreetMap)
// ------------------------------------------------

async function getCityName(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`
    );
    const data = await res.json();
    return (
      data.address.city ||
      data.address.town ||
      data.address.village ||
      "Unknown"
    );
  } catch {
    return "Unknown";
  }
}

// ------------------------------------------------
// Internal geolocation request handler
// ------------------------------------------------
// isFirstRun → used only the very first time the app loads
// fromButton → when pressing "Update Location"
// onLocation → callback(lat, lon, city)

function requestAndSaveLocation(isFirstRun, fromButton, onLocation) {
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      setGeoStatus("granted");

      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const city = await getCityName(lat, lon);

      saveStoredLocation(lat, lon, city);

      if (typeof onLocation === "function") {
        onLocation(lat, lon, city);
      }
    },
    (err) => {
      console.warn("Geolocation error:", err);

      if (isFirstRun) {
        setGeoStatus("denied");
        Telegram.WebApp.showAlert(
          "❌ Unable to access location. Allow location access for this Telegram Mini App in system + Telegram settings."
        );
      } else if (fromButton) {
        Telegram.WebApp.showAlert(
          "⚠️ Could not refresh location.\nPlease check Telegram's location permission."
        );
      }
      // If it's a non-first-run, non-button call, stay silent.
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    }
  );
}

// ------------------------------------------------
// PUBLIC API: Call this on every page
// ------------------------------------------------
// onLocation(lat, lon, city) → your page logic

function initLocation(onLocation) {
  if (!navigator.geolocation) {
    Telegram.WebApp.showAlert("❌ Geolocation not supported here.");
    return;
  }

  const stored = loadStoredLocation();
  const status = getGeoStatus();

  // 1) If we have a cached location, use it immediately
  if (stored && typeof onLocation === "function") {
    onLocation(stored.lat, stored.lon, stored.city);
  }

  // 2) Wire up Update Location button (optional)
  const updateBtn = document.getElementById("update-location");
  if (updateBtn) {
    updateBtn.addEventListener("click", () => {
      requestAndSaveLocation(false, true, onLocation);
    });
  }

  // 3) First-ever run → auto ask once
  if (!status) {
    requestAndSaveLocation(true, false, onLocation);
    return;
  }

  // 4) After first run:
  // — we do NOT auto-refresh to avoid accidental permission dialogs.
  // — only the button refreshes GPS.
}

// ------------------------------------------------
// Expose globally for all pages
// ------------------------------------------------

window.initLocation = initLocation;
window.loadStoredLocation = loadStoredLocation;
