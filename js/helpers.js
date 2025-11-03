function getUzbekDate() {
  const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
  const d = new Date();
  return `${d.getDate()}-${months[d.getMonth()]}`;
}
