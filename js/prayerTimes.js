// prayerTimes.js - Updated with UZBEK translations and USER'S LOCAL TIMEZONE
Telegram.WebApp.ready();

// Uzbek translations
const TRANSLATIONS = {
  prayers: {
    "Fajr": "Bomdod",
    "Dhuhr": "Peshin",
    "Asr": "Asr",
    "Maghrib": "Shom",
    "Isha": "Xufton",
    "Sunrise": "Quyosh chiqishi"
  },
  weekdays: {
    "Monday": "Dushanba",
    "Tuesday": "Seshanba",
    "Wednesday": "Chorshanba",
    "Thursday": "Payshanba",
    "Friday": "Juma",
    "Saturday": "Shanba",
    "Sunday": "Yakshanba"
  }
};

async function getPrayerTimes(lat, lon) {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=3&school=1`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data;
}

function getCurrentPrayer(timings) {
  // CRITICAL: Use user's local time, not server time
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  console.log('🕐 Current local time:', now.toLocaleTimeString(), '(' + currentTime + ' minutes)');

  const prayerOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const times = prayerOrder.map((p) => {
    const [h, m] = timings[p].split(":").map(Number);
    const totalMinutes = h * 60 + m;
    console.log(`   ${p}: ${timings[p]} (${totalMinutes} minutes)`);
    return { name: p, total: totalMinutes };
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

  console.log('✅ Current prayer:', current.name, '| Next prayer:', next.name);
  return { current, next };
}

function formatCountdown(nextTime) {
  // CRITICAL: Use user's local time, not server time
  const now = new Date();
  const [h, m] = nextTime.split(":").map(Number);
  const next = new Date();
  next.setHours(h, m, 0, 0);
  
  let diff = (next - now) / 1000;
  if (diff < 0) diff += 24 * 3600; // Add 24 hours if next prayer is tomorrow
  
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = Math.floor(diff % 60);
  
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Translate prayer name to Uzbek
function translatePrayer(prayerName) {
  return TRANSLATIONS.prayers[prayerName] || prayerName;
}

// Translate weekday to Uzbek
function translateWeekday(weekdayEnglish) {
  return TRANSLATIONS.weekdays[weekdayEnglish] || weekdayEnglish;
}

async function updatePrayerData(lat, lon, city) {
  try {
    console.log('📿 Fetching prayer times for:', city, '(' + lat + ', ' + lon + ')');
    
    const data = await getPrayerTimes(lat, lon);
    const { current, next } = getCurrentPrayer(data.timings);

    // Prayer emoji mapping
    const prayerEmojis = {
      "Fajr": "🌅",
      "Dhuhr": "☀️",
      "Asr": "🌤️",
      "Maghrib": "🌇",
      "Isha": "🌙"
    };

    // Update current prayer display with UZBEK names
    const currentPrayerElem = document.getElementById("currentPrayer");
    const prayerTimeElem = document.getElementById("prayerTime");
    const currentEmojiElem = document.getElementById("currentEmoji");
    
    const nextPrayerElem = document.getElementById("nextPrayer");
    const countdownElem = document.getElementById("countdown");
    const nextEmojiElem = document.getElementById("nextEmoji");
    const nextPrayerTimeElem = document.getElementById("nextPrayerTime");

    if (currentPrayerElem) currentPrayerElem.innerText = translatePrayer(current.name);
    if (prayerTimeElem) prayerTimeElem.innerText = data.timings[current.name];
    if (currentEmojiElem) currentEmojiElem.innerText = prayerEmojis[current.name] || '🕌';
    
    if (nextPrayerElem) nextPrayerElem.innerText = translatePrayer(next.name);
    if (nextEmojiElem) nextEmojiElem.innerText = prayerEmojis[next.name] || '🕌';
    if (nextPrayerTimeElem) nextPrayerTimeElem.innerText = data.timings[next.name];

    // Update countdown every second (using local time)
    function updateCountdown() {
      if (countdownElem) {
        countdownElem.innerText = formatCountdown(data.timings[next.name]);
      }
    }
    updateCountdown();
    
    // Clear any existing interval to prevent duplicates
    if (window.prayerCountdownInterval) {
      clearInterval(window.prayerCountdownInterval);
    }
    window.prayerCountdownInterval = setInterval(updateCountdown, 1000);

    // Update date displays (using local time) with UZBEK weekday
    const localDate = new Date();
    const weekdayEnglish = localDate.toLocaleDateString('en-US', { weekday: 'long' });
    const weekdayUzbek = translateWeekday(weekdayEnglish);
    const gregorianDate = localDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    
    if (document.getElementById("weekday")) {
      const hijri = data.date.hijri.date;
      document.getElementById("weekday").innerText = `${weekdayUzbek}, ${gregorianDate}`;
      
      const hijriElem = document.getElementById("hijri");
      if (hijriElem) {
        hijriElem.innerText = hijri;
      }
    }

    // Update detailed page elements if they exist
    const todayDateElem = document.getElementById("todayDate");
    if (todayDateElem) {
      todayDateElem.innerText = `${weekdayUzbek}, ${gregorianDate}`;
    }

    const nextPrayerNameElem = document.getElementById("nextPrayerName");
    if (nextPrayerNameElem) {
      nextPrayerNameElem.innerText = translatePrayer(next.name);
    }

    // Dispatch event with prayer data for detailed page
    window.dispatchEvent(new CustomEvent('prayerDataUpdated', {
      detail: {
        timings: data.timings,
        currentPrayer: current.name,
        nextPrayer: next.name,
        date: data.date
      }
    }));

  } catch (error) {
    console.error("Error updating prayer data:", error);
  }
}

// Listen for location updates from LocationManager
window.addEventListener('locationUpdated', (event) => {
  const { lat, lon, city } = event.detail;
  updatePrayerData(lat, lon, city);
});

// Make updatePrayerData available globally for LocationManager
window.updatePrayerData = updatePrayerData;

// Make translation functions available globally
window.translatePrayer = translatePrayer;
window.translateWeekday = translateWeekday;