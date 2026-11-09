import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    database: 'san_furniture'
  });

  const [rows] = await conn.query('SELECT section_key, content_json FROM site_page_sections WHERE section_key = "header_mega_menu"');
  if (rows.length > 0) {
    const data = typeof rows[0].content_json === 'string' ? JSON.parse(rows[0].content_json) : rows[0].content_json;
    for (const tab of data.tabs || []) {
      console.log(`\n=== Tab: ${tab.label} (${tab.id}) ===`);
      for (const col of tab.columns || []) {
        console.log(`  Col: "${col.title}"`);
        const seenHrefs = new Set();
        for (const link of col.links || []) {
          const isDup = seenHrefs.has(link.href) ? ' ❌ [DUPLICATE]' : '';
          seenHrefs.add(link.href);
          console.log(`    - ${link.label} -> ${link.href}${isDup}`);
        }
      }
    }
  }

  await conn.end();
}

main().catch(console.error);
