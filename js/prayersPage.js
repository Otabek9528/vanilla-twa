document.addEventListener("DOMContentLoaded", async () => {
  Telegram.WebApp.ready();

  // Handle back button
  document.getElementById("backToMain").addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.replace("../index.html");
    }
  });

  // Load location data
  const stored = JSON.parse(localStorage.getItem("userLocation"));
  if (!stored) {
    Telegram.WebApp.showAlert("Location not found. Please return to main page.");
    return;
  }

  const { lat, lon, city } = stored;
  document.getElementById("cityName").textContent = city;

  // Get prayer times for this location
  const data = await getPrayerTimes(lat, lon);

  // Display date
  const gregorian = data.date.gregorian.date;
  const hijri = data.date.hijri.date;
  document.getElementById("todayDate").textContent = `${gregorian} (${hijri})`;

  // Build prayer list
  const container = document.getElementById("prayerList");
  container.innerHTML = "";

  const prayerOrder = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
  prayerOrder.forEach((name) => {
    const time = data.timings[name];
    const div = document.createElement("div");
    div.className = "prayer-item";
    div.innerHTML = `<span>${name}</span><span>${time}</span>`;
    container.appendChild(div);
  });
});
