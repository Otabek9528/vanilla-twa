function initFeatureButtons() {
  const features = document.querySelectorAll(".feature");

  features.forEach(feature => {
    feature.addEventListener("click", () => {
      const label = feature.querySelector("span").textContent;
      Telegram.WebApp.showAlert(`🔍 "${label}" funksiyasi hali tayyor emas!`);
      // TODO: Implement separate logic for each feature (Masjid, Restoran, Do‘kon)
    });
  });
}
