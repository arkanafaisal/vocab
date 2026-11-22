import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '../migrations');

async function runMigrations() {
  const connection = await mysql.createConnection({
    uri: process.env.DB_URI,
    multipleStatements: true
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const [rows] = await connection.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(rows.map(row => row.version));

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    let count = 0;
    for (const file of files) {
      const match = file.match(/^(V[0-9]+)__(.+)\.sql$/);
      const version = match ? match[1] : file;

      if (appliedVersions.has(version)) {
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await connection.query(sql);
      await connection.query('INSERT INTO schema_migrations (version, name) VALUES (?, ?)', [version, file]);
      console.log(`Applied: ${file}`);
      count++;
    }

    console.log(`Migrations complete. ${count} applied.`);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

runMigrations();
