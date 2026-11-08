async function checkLiveCats() {
  const res = await fetch("https://sanfurniture.com/api/categories");
  const data = await res.json();
  console.log("Categories count on live:", data.categories.length);
  data.categories.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.name} (/${c.handle}) [ID: ${c.id}]`);
  });
}

checkLiveCats().catch(console.error);
