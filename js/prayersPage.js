document.addEventListener("DOMContentLoaded", async () => {
  Telegram.WebApp.ready();

  // Back button behavior
  document.getElementById("backToMain").addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else window.location.replace("../index.html");
  });

  // Debug notification system
  const notify = (msg) => {
    let note = document.createElement("div");
    note.className = "debug-note";
    note.textContent = msg;
    document.body.appendChild(note);
    setTimeout(() => note.classList.add("show"), 100);
    setTimeout(() => note.classList.remove("show"), 4000);
    setTimeout(() => note.remove(), 4500);
  };

  // Use cached location or refresh quietly
  let stored = JSON.parse(localStorage.getItem("userLocation"));
  let updated = false;

  if (navigator.permissions) {
    try {
      const perm = await navigator.permissions.query({ name: "geolocation" });
      if (perm.state === "granted") {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude.toFixed(4);
            const lon = pos.coords.longitude.toFixed(4);
            const city = await getCityName(lat, lon);
            localStorage.setItem("userLocation", JSON.stringify({ lat, lon, city }));
            stored = { lat, lon, city };
            updated = true;
            if (window.Telegram?.WebApp) {
                Telegram.WebApp.showAlert(`📍 New location updated.\nCoordinates: ${lon}, ${lat}`);
              } else {
                notify(`📍 New location updated. Coordinates: ${lon}, ${lat}`);
              }

            loadPrayerData(stored);
          },
          (err) => {
            console.warn("⚠️ Silent refresh failed:", err.message);
            if (stored) loadPrayerData(stored);
          }
        );
        return;
      }
    } catch (e) {
      console.warn("Permissions API not supported, fallback to cache");
    }
  }

  if (stored && !updated) loadPrayerData(stored);
  else if (!stored) Telegram.WebApp.showAlert("Location not found. Please reopen main page.");
});

async function loadPrayerData({ lat, lon, city }) {
  document.getElementById("cityName").textContent = city;

  const data = await getPrayerTimes(lat, lon);

  // Date display
  const greg = data.date.gregorian.date;
  const hijri = data.date.hijri.date;
  document.getElementById("todayDate").textContent = `${greg} (${hijri})`;

  // List build
  const list = document.getElementById("prayerList");
  list.innerHTML = "";

  const prayerOrder = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const { current, next } = getCurrentPrayer(data.timings);

  prayerOrder.forEach((name) => {
    const time = data.timings[name];
    const div = document.createElement("div");
    div.className = "prayer-item";
    if (name === current.name) div.classList.add("current-prayer");
    div.innerHTML = `<span>${name}</span><span>${time}</span>`;
    list.appendChild(div);
  });

  // Countdown section
  document.getElementById("nextPrayerName").textContent = next.name;

  function updateCountdown() {
    document.getElementById("countdown").textContent = formatCountdown(data.timings[next.name]);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
}
