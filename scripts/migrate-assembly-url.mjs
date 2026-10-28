import mysql from "mysql2/promise";

async function run() {
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "san_furniture",
  });

  const [cols] = await conn.query("SHOW COLUMNS FROM furniture_specs LIKE 'assembly_instructions_url'");
  if (cols.length === 0) {
    await conn.query("ALTER TABLE furniture_specs ADD COLUMN assembly_instructions_url VARCHAR(500) NULL AFTER assembly_time_mins");
    console.log("Successfully added assembly_instructions_url to furniture_specs table.");
  } else {
    console.log("assembly_instructions_url already exists.");
  }

  await conn.end();
}

run().catch(console.error);
