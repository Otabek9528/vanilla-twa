function renderPrayerTimes(timings) {
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
    const box = document.createElement("div");
    box.className = "prayer-box";
    box.innerHTML = `<b>${label}</b><div>${time}</div>`;
    grid.appendChild(box);
  });
}

function updateHeader(city, date) {
  document.getElementById("cityName").innerText = city;
  document.getElementById("uzbekDate").innerText = date;
}
