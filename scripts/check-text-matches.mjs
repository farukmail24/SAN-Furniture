import mysql from "mysql2/promise";

async function run() {
  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");
  const [rows] = await conn.execute("SELECT id, handle, title, description, subtitle FROM products");

  let titleMatches = [];
  let descMatches = [];
  let subMatches = [];

  for (const r of rows) {
    const t = (r.title || "").toLowerCase();
    const d = (r.description || "").toLowerCase();
    const s = (r.subtitle || "").toLowerCase();

    if (t.includes("amos mann") || t.includes("furniture to go") || t.includes("ftg")) {
      titleMatches.push({ id: r.id, title: r.title });
    }
    if (d.includes("amos mann") || d.includes("furniture to go") || d.includes("ftg")) {
      descMatches.push({ id: r.id, handle: r.handle });
    }
    if (s.includes("amos mann") || s.includes("furniture to go") || s.includes("ftg")) {
      subMatches.push({ id: r.id, subtitle: r.subtitle });
    }
  }

  console.log("Title matches:", titleMatches);
  console.log("Description matches:", descMatches);
  console.log("Subtitle matches:", subMatches);

  await conn.end();
}

run().catch(console.error);
