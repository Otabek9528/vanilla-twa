// Telegram WebApp Fix – ensure permission requested only once
window.__tgGeoPermissionRequested = false;

Telegram.WebApp.ready();

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

async function updatePrayerData(lat, lon, city) {
  document.getElementById("cityName").innerText = city;

  // Update coordinates if coords element exists (prayers.html)
  const coordsElem = document.getElementById("coords");
  if (coordsElem) {
    coordsElem.innerText = `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }


  const data = await getPrayerTimes(lat, lon);
  const { current, next } = getCurrentPrayer(data.timings);

  document.getElementById("currentPrayer").innerText = current.name;
  document.getElementById("prayerTime").innerText =
    data.timings[current.name];
  document.getElementById("nextPrayer").innerText = next.name;

  function updateCountdown() {
    document.getElementById("countdown").innerText = formatCountdown(
      data.timings[next.name]
    );
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Update Hijri/Gregorian date if present
  if (document.getElementById("weekday")) {
    const hijri = data.date.hijri.date;
    const greg = data.date.gregorian.date;
    const weekday = data.date.gregorian.weekday.en;
    document.getElementById("weekday").innerText = `${weekday}, ${greg}`;
    if (document.getElementById("hijri")) {
      document.getElementById("hijri").innerText = hijri;
    }
  }
}

async function init() {
  const tg = Telegram.WebApp;
  tg.ready(); // very important: counts as user gesture in Telegram

  // --- FIRST-TIME PERMISSION REQUEST (ONLY ONCE EVER) ---
  if (!window.__tgGeoPermissionRequested) {
    window.__tgGeoPermissionRequested = true;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const city = await getCityName(lat, lon);

        updatePrayerData(lat, lon, city);

        // After permission is granted, the rest of the pages
        // can call geolocation silently with no popups.
      },
      (err) => {
        tg.showAlert("❌ Location permission denied. Please enable.");
      }
    );

    return; // stop here on first run, do not continue
  }

  // --- AFTER PERMISSION IS GRANTED: ALWAYS SILENT GPS ---
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const city = await getCityName(lat, lon);

      updatePrayerData(lat, lon, city);
    },
    (err) => {
      console.warn("Silent geolocation failed:", err.message);
    }
  );
}


document.addEventListener("DOMContentLoaded", init);
