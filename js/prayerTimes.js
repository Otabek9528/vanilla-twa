// ===============================
//   prayerTimes.js
//   Uses geolocation.js for location
// ===============================

// -------------------------------
// Calculation Helpers
// -------------------------------

async function getPrayerTimes(lat, lon) {
    const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`;
    const res = await fetch(url);
    const data = await res.json();
    return data.data;
}

function getCurrentPrayer(timings) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const prayerOrder = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
    let previousPrayer = "Isha";
    let nextPrayer = "Fajr";

    const convertToMinutes = (t) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    };

    for (let i = 0; i < prayerOrder.length; i++) {
        const prayer = prayerOrder[i];
        const prayerTime = convertToMinutes(timings[prayer]);

        if (nowMinutes >= prayerTime) {
            previousPrayer = prayer;
        }
        if (nowMinutes < prayerTime) {
            nextPrayer = prayer;
            break;
        }
    }

    return { current: previousPrayer, next: nextPrayer };
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// -------------------------------
// UI: Update Countdown
// -------------------------------

function updateCountdown(nextPrayer, timings) {
    const nextTime = timings[nextPrayer];
    const [hours, minutes] = nextTime.split(":").map(Number);
    const now = new Date();

    const nextPrayerDate = new Date();
    nextPrayerDate.setHours(hours, minutes, 0, 0);

    if (nextPrayerDate <= now) {
        nextPrayerDate.setDate(nextPrayerDate.getDate() + 1);
    }

    const diff = nextPrayerDate - now;
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const countdown = document.getElementById("countdown");
    countdown.innerText = `${diffHours}h ${diffMinutes}m`;
}

// -------------------------------
// MAIN: Called when location is ready
// -------------------------------

async function updatePrayerData(lat, lon, city) {
    document.getElementById("cityName").innerText = city;
    document.getElementById("coords").innerText =
        `(${lat.toFixed(4)}, ${lon.toFixed(4)})`;

    // Fetch prayer times
    const data = await getPrayerTimes(lat, lon);
    const timings = data.timings;

    // Show each time
    document.getElementById("fajr").innerText = timings.Fajr;
    document.getElementById("sunrise").innerText = timings.Sunrise;
    document.getElementById("dhuhr").innerText = timings.Dhuhr;
    document.getElementById("asr").innerText = timings.Asr;
    document.getElementById("maghrib").innerText = timings.Maghrib;
    document.getElementById("isha").innerText = timings.Isha;

    // Determine current/next prayer
    const { current, next } = getCurrentPrayer(timings);

    document.getElementById("currentPrayerName").innerText = current;
    document.getElementById("nextPrayerName").innerText = next;

    updateCountdown(next, timings);

    // Optional: Update countdown every minute
    setInterval(() => updateCountdown(next, timings), 60000);
}

// -------------------------------
// INIT: Run on every page load
// -------------------------------

document.addEventListener("DOMContentLoaded", () => {
    // initLocation comes from geolocation.js
    initLocation((lat, lon, city) => {
        updatePrayerData(lat, lon, city);
    });
});
