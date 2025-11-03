async function updatePrayerTimes(location, city) {
  const timings = await getPrayerTimes(location.latitude, location.longitude);
  renderPrayerTimes(timings);
  updateHeader(city, getUzbekDate());
}

// Entry point
initLocation();
