// ui.js

export function initTelegramWebApp() {
  Telegram.WebApp.ready();
  Telegram.WebApp.MainButton.setText("Namoz vaqtlarini ko‘rish");
  Telegram.WebApp.MainButton.show();
}

export function updatePrayerUI(timings) {
  const prayers = {
    "Fajr": "Bomdod",
    "Sunrise": "Quyosh",
    "Dhuhr": "Peshin",
    "Asr": "Asr",
    "Maghrib": "Shom",
    "Isha": "Xufton"
  };

  const grid = document.getElementById("prayerGrid");
  grid.innerHTML = "";
  Object.entries(prayers).forEach(([key, label]) => {
    const time = timings[key] || "--:--";
    const item = document.createElement("div");
    item.className = "prayer-box";
    item.innerHTML = `<b>${label}</b><br>${time}`;
    grid.appendChild(item);
  });
}

export function updateCityAndDate(city, date) {
  document.getElementById("cityName").innerText = city;
  document.getElementById("uzbekDate").innerText = date;
}
