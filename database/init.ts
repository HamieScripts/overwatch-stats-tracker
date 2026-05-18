import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, 'data.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }

  const createTable = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      avatar TEXT,
      namecard TEXT,
      title TEXT,
      endorsment_level INTEGER,
      endorsment_frame TEXT
    );
  `;

  db.run(createTable, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
      process.exit(1);
    }
    console.log(`DB initialized at ${dbPath}`);
    db.close();
  });
});
