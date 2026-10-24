import "../database/mysql-config.mjs";
import mysql from "mysql2/promise";
import { mysqlConnectionOptions } from "../database/mysql-config.mjs";

async function checkDatabase() {
  console.log("Checking MySQL connection with options:", {
    host: mysqlConnectionOptions.host,
    port: mysqlConnectionOptions.port,
    user: mysqlConnectionOptions.user,
    database: mysqlConnectionOptions.database,
  });

  try {
    const conn = await mysql.createConnection(mysqlConnectionOptions);
    const [tables] = await conn.query("SHOW TABLES");
    console.log(`Found ${tables.length} tables in database '${mysqlConnectionOptions.database}':`);
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log(tableNames.join(", "));

    // Count key rows
    const keyTables = ["products", "categories", "orders", "customers", "admin_users", "suppliers"];
    for (const tbl of keyTables) {
      if (tableNames.includes(tbl)) {
        const [rows] = await conn.query(`SELECT COUNT(*) as count FROM \`${tbl}\``);
        console.log(`- ${tbl}: ${rows[0].count} records`);
      } else {
        console.log(`- ${tbl}: MISSING`);
      }
    }
    await conn.end();
  } catch (err) {
    console.error("Database connection/query error:", err.message);
  }
}

checkDatabase();
