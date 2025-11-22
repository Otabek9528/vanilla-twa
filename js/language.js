function initLanguageSwitcher() {
  const buttons = document.querySelectorAll(".language-bar button");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.textContent.trim();
      console.log(`Language switched to: ${lang}`);
      // TODO: Implement actual translation logic here
    });
  });
}
