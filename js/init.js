Telegram.WebApp.ready();

let userLocation = null;
let cityName = "Noma’lum joy";

function initLocation() {
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      userLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      cityName = await getCityName(userLocation.latitude, userLocation.longitude);
      updatePrayerTimes(userLocation, cityName);
    },
    (err) => {
      Telegram.WebApp.showAlert("❌ Lokatsiyani olish imkoni bo‘lmadi. Iltimos, ruxsat bering.");
    }
  );
}
