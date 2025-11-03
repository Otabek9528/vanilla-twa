// app.js
import { initTelegramWebApp } from './ui.js';
import { getUserLocation } from './location.js';
import { fetchPrayerTimes, getUzbekDate } from './prayers.js';
import { updatePrayerUI, updateCityAndDate } from './ui.js';

let userLocation = null;
let cityName = "Noma’lum joy";

window.addEventListener('DOMContentLoaded', async () => {
  initTelegramWebApp();

  try {
    const { location, city } = await getUserLocation();
    userLocation = location;
    cityName = city;

    const timings = await fetchPrayerTimes(location.latitude, location.longitude);
    updatePrayerUI(timings);
    updateCityAndDate(cityName, getUzbekDate());
  } catch (err) {
    Telegram.WebApp.showAlert("❌ Lokatsiyani olish imkoni bo‘lmadi. Iltimos, ruxsat bering.");
  }
});