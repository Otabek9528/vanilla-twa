// main.js — unified logic for main and prayer pages
Telegram.WebApp.ready();

/* ----------------------
   UTILITIES & API HELPERS
----------------------- */

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

async function getPrayerTimes(lat, lon) {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=3&school=1`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data;
}

function getCurrentPrayer(timings) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const prayerOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const times = prayerOrder.map((p) => {
    const [h, m] = timings[p].split(":").map(Number);
    return { name: p, total: h * 60 + m };
  });

  let current = times[0];
  let next = times[1];

  for (let i = 0; i < times.length; i++) {
    if (
      currentTime >= times[i].total &&
      (i === times.length - 1 || currentTime < times[i + 1].total)
    ) {
      current = times[i];
      next = times[(i + 1) % times.length];
      break;
    }
  }

  return { current, next };
}

function formatCountdown(nextTime) {
  const now = new Date();
  const [h, m] = nextTime.split(":").map(Number);
  const next = new Date();
  next.setHours(h, m, 0, 0);
  let diff = (next - now) / 1000;
  if (diff < 0) diff += 24 * 3600;
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = Math.floor(diff % 60);
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/* ----------------------
   RENDERING FUNCTIONS
----------------------- */

async function renderMainPage(lat, lon, city) {
  const data = await getPrayerTimes(lat, lon);
  const { current, next } = getCurrentPrayer(data.timings);

  document.getElementById("cityName").innerText = city;
  document.getElementById("currentPrayer").innerText = current.name;
  document.getElementById("prayerTime").innerText = data.timings[current.name];
  document.getElementById("nextPrayer").innerText = next.name;

  const weekday = data.date.gregorian.weekday.en;
  const greg = data.date.gregorian.date;
  const hijri = data.date.hijri.date;
  document.getElementById("weekday").innerText = `${weekday}, ${greg}`;
  document.getElementById("hijri").innerText = hijri;

  function updateCountdown() {
    document.getElementById("countdown").innerText = formatCountdown(
      data.timings[next.name]
    );
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

async function renderPrayerPage(lat, lon, city) {
  const data = await getPrayerTimes(lat, lon);
  const { current, next } = getCurrentPrayer(data.timings);

  // city & coordinates
  document.getElementById("cityName").textContent = city;
  const coordsEl = document.getElementById("coords");
  if (coordsEl) coordsEl.textContent = `Coordinates: ${lat}, ${lon}`;

  // date info
  const greg = data.date.gregorian.date;
  const hijri = data.date.hijri.date;
  document.getElementById("todayDate").textContent = `${greg} (${hijri})`;

  // prayer list
  const list = document.getElementById("prayerList");
  list.innerHTML = "";

  const prayerOrder = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
  prayerOrder.forEach((name) => {
    const time = data.timings[name];
    const div = document.createElement("div");
    div.className = "prayer-item";
    if (name === current.name) div.classList.add("current-prayer");
    div.innerHTML = `<span>${name}</span><span>${time}</span>`;
    list.appendChild(div);
  });

  document.getElementById("nextPrayerName").textContent = next.name;

  function updateCountdown() {
    document.getElementById("countdown").textContent = formatCountdown(
      data.timings[next.name]
    );
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // back button
  const back = document.getElementById("backToMain");
  if (back) {
    back.addEventListener("click", () => {
      if (window.history.length > 1) window.history.back();
      else window.location.replace("../index.html");
    });
  }
}

/* ----------------------
   LOCATION HANDLER
----------------------- */

async function getUserLocation() {
  let stored = JSON.parse(localStorage.getItem("userLocation"));
  if (stored && stored.lat && stored.lon && stored.city) {
    refreshLocationSilently(stored);
    return stored;
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        const city = await getCityName(lat, lon);
        const loc = { lat, lon, city };
        localStorage.setItem("userLocation", JSON.stringify(loc));
        resolve(loc);
      },
      (err) => {
        Telegram.WebApp.showAlert("Location permission denied.");
        reject(err);
      }
    );
  });
}

async function refreshLocationSilently(stored) {
  if (!navigator.permissions) return;
  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    if (permission.state === "granted") {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        const city = await getCityName(lat, lon);
        const newLoc = { lat, lon, city };
        localStorage.setItem("userLocation", JSON.stringify(newLoc));
        console.log(`📍 Background location updated: ${lat}, ${lon}`);
      });
    }
  } catch (err) {
    console.warn("Background refresh failed:", err);
  }
}

/* ----------------------
   ENTRY POINT
----------------------- */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { lat, lon, city } = await getUserLocation();
    if (document.getElementById("prayerList")) {
      await renderPrayerPage(lat, lon, city);
    } else {
      await renderMainPage(lat, lon, city);
    }
  } catch (err) {
    console.error("Initialization failed:", err);
  }
});
