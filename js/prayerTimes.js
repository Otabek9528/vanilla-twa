// main.js — handles location, city, and prayer times

Telegram.WebApp.ready();

async function getCityName(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`);
    const data = await res.json();
    return data.address.city || data.address.town || data.address.village || "Unknown";
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

  let current = null;
  let next = null;

  const prayerOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const times = prayerOrder.map(p => {
    const [h, m] = timings[p].split(":").map(Number);
    return { name: p, total: h * 60 + m };
  });

  for (let i = 0; i < times.length; i++) {
    if (currentTime >= times[i].total && (i === times.length - 1 || currentTime < times[i + 1].total)) {
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
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function init() {
  if (!navigator.geolocation) {
    Telegram.WebApp.showAlert("❌ Geolocation is not supported on this device.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const city = await getCityName(lat, lon);
    document.getElementById("cityName").innerText = city;

    const data = await getPrayerTimes(lat, lon);
    const { current, next } = getCurrentPrayer(data.timings);

    document.getElementById("currentPrayer").innerText = current.name;
    document.getElementById("prayerTime").innerText = data.timings[current.name];
    document.getElementById("nextPrayer").innerText = next.name;

    function updateCountdown() {
      document.getElementById("countdown").innerText = formatCountdown(data.timings[next.name]);
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Optional: update Hijri & Gregorian dates if IDs exist
    if (document.getElementById("weekday")) {
      const hijri = data.date.hijri.date;
      const greg = data.date.gregorian.date;
      const weekday = data.date.gregorian.weekday.en;
      document.getElementById("weekday").innerText = `${weekday}, ${greg}`;
      if (document.getElementById("hijri")) {
        document.getElementById("hijri").innerText = hijri;
      }
    }
  }, () => {
    Telegram.WebApp.showAlert("❌ Unable to access your location. Please enable permissions.");
  });
}

document.addEventListener("DOMContentLoaded", init);
