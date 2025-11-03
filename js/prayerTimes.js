function getUzbekDate() {
  const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
  const d = new Date();
  return `${d.getDate()}-${months[d.getMonth()]}`;
}

async function getPrayerTimes(lat, lon, method = 3, madhab = 1) {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${method}&school=${madhab}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data.timings;
}

async function updatePrayerTimes(cityName, userLocation) {
  if (!userLocation) return;

  const { latitude, longitude } = userLocation;
  const timings = await getPrayerTimes(latitude, longitude);
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

  document.getElementById("cityName").innerText = cityName;
  document.getElementById("uzbekDate").innerText = getUzbekDate();
}
