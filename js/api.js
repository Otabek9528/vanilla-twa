async function getCityName(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=uz`);
    const data = await res.json();
    return data.address.city || data.address.town || data.address.village || "Noma’lum joy";
  } catch {
    return "Noma’lum joy";
  }
}

async function getPrayerTimes(lat, lon, method = 3, madhab = 1) {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${method}&school=${madhab}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data.timings;
}
