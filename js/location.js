async function getCityName(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=uz`);
    const data = await res.json();
    return data.address.city || data.address.town || data.address.village || "Noma’lum joy";
  } catch {
    return "Noma’lum joy";
  }
}

function requestUserLocation(onSuccess, onError) {
  navigator.geolocation.getCurrentPosition(onSuccess, onError);
}
