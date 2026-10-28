import mysql from 'mysql2/promise';

export const DROPBOX_SHARED_MANUALS_URL = "https://www.dropbox.com/scl/fo/8qcrahcyse84f4075mntd/AOE38-nLR3MacO3t0v_avhU?rlkey=zvufk5975fdapbiyyt6vzgzxg&dl=0";

async function main() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'san_furniture'
  });

  console.log("Linking products needing assembly to official Dropbox manual repository...");

  // Update furniture_specs where assembly is required and no specific local manual is assigned
  const [res] = await pool.query(
    `UPDATE furniture_specs 
     SET assembly_instructions_url = ?,
         assembly_required = 1
     WHERE (assembly_instructions_url IS NULL OR assembly_instructions_url = '' OR assembly_instructions_url = '/documents/assembly/sample_manual.pdf')
       AND (assembly_required = 1 OR product_id LIKE '%ftg%')`,
    [DROPBOX_SHARED_MANUALS_URL]
  );

  console.log(`Updated ${res.affectedRows} product specifications.`);

  const [verified] = await pool.query(
    `SELECT p.id, p.sku, p.title, s.assembly_instructions_url, s.assembly_required
     FROM products p
     JOIN furniture_specs s ON p.id = s.product_id
     WHERE s.assembly_instructions_url IS NOT NULL`
  );

  console.log(`\nVerified ${verified.length} products with active assembly URLs:`);
  for (const item of verified) {
    console.log(`- [${item.sku || item.id}] ${item.title}: ${item.assembly_instructions_url}`);
  }

  await pool.end();
}

main().catch(console.error);
