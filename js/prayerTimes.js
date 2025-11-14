// prayerTimes.js - Updated to work with LocationManager
Telegram.WebApp.ready();

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
  try {
    const data = await getPrayerTimes(lat, lon);
    const { current, next } = getCurrentPrayer(data.timings);

    // Update current prayer display
    const currentPrayerElem = document.getElementById("currentPrayer");
    const prayerTimeElem = document.getElementById("prayerTime");
    const nextPrayerElem = document.getElementById("nextPrayer");
    const countdownElem = document.getElementById("countdown");

    if (currentPrayerElem) currentPrayerElem.innerText = current.name;
    if (prayerTimeElem) prayerTimeElem.innerText = data.timings[current.name];
    if (nextPrayerElem) nextPrayerElem.innerText = next.name;

    // Update countdown every second
    function updateCountdown() {
      if (countdownElem) {
        countdownElem.innerText = formatCountdown(data.timings[next.name]);
      }
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Update date displays
    if (document.getElementById("weekday")) {
      const hijri = data.date.hijri.date;
      const greg = data.date.gregorian.date;
      const weekday = data.date.gregorian.weekday.en;
      document.getElementById("weekday").innerText = `${weekday}, ${greg}`;
      
      const hijriElem = document.getElementById("hijri");
      if (hijriElem) {
        hijriElem.innerText = hijri;
      }
    }

    // Update detailed page elements if they exist
    const todayDateElem = document.getElementById("todayDate");
    if (todayDateElem) {
      todayDateElem.innerText = `${data.date.gregorian.weekday.en}, ${data.date.gregorian.date}`;
    }

    const nextPrayerNameElem = document.getElementById("nextPrayerName");
    if (nextPrayerNameElem) {
      nextPrayerNameElem.innerText = next.name;
    }

    // Populate prayer list if on detailed page
    const prayerListElem = document.getElementById("prayerList");
    if (prayerListElem) {
      populatePrayerList(data.timings, current.name);
    }

  } catch (error) {
    console.error("Error updating prayer data:", error);
    Telegram.WebApp.showAlert("⚠️ Could not load prayer times. Please check your connection.");
  }
}

// Populate detailed prayer list
function populatePrayerList(timings, currentPrayerName) {
  const prayerListElem = document.getElementById("prayerList");
  if (!prayerListElem) return;

  const prayerOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  prayerListElem.innerHTML = '';

  prayerOrder.forEach(prayer => {
    const div = document.createElement('div');
    div.className = 'prayer-item';
    if (prayer === currentPrayerName) {
      div.classList.add('current-prayer');
    }

    const nameSpan = document.createElement('span');
    nameSpan.textContent = prayer;

    const timeSpan = document.createElement('span');
    timeSpan.textContent = timings[prayer];

    div.appendChild(nameSpan);
    div.appendChild(timeSpan);
    prayerListElem.appendChild(div);
  });
}

// Listen for location updates from LocationManager
window.addEventListener('locationUpdated', (event) => {
  const { lat, lon, city } = event.detail;
  updatePrayerData(lat, lon, city);
});

// Make updatePrayerData available globally for LocationManager
window.updatePrayerData = updatePrayerData;