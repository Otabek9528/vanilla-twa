Telegram.WebApp.ready();

let userLocation = null;
let cityName = "Noma’lum joy";

function initApp() {
  initLanguageSwitcher();
  initFeatureButtons();

  requestUserLocation(
    async (pos) => {
      userLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      };
      cityName = await getCityName(userLocation.latitude, userLocation.longitude);
      updatePrayerTimes(cityName, userLocation);
    },
    (err) => {
      Telegram.WebApp.showAlert("❌ Lokatsiyani olish imkoni bo‘lmadi. Iltimos, ruxsat bering.");
    }
  );
}

initApp();
