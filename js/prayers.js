// prayers.js

export async function fetchPrayerTimes(lat, lon, method = 3, madhab = 1) {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${method}&school=${madhab}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data.timings;
}

export function getUzbekDate() {
  const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
  const d = new Date();
  return `${d.getDate()}-${months[d.getMonth()]}`;
}