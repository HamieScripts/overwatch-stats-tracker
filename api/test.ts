import { SaveUserApi } from './save-user-api';
import sqlite3 from 'sqlite3';
import path from 'path';

const id = 'Hamie#21834';
const dbPath = path.resolve(__dirname, '../database/data.db');

async function run() {
  const saveUserApi = new SaveUserApi();
  await saveUserApi.save(id);
  console.log(`Saved user ${id}`);

  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }

    db.get(
      'SELECT id, name, avatar, namecard, title, endorsment_level, endorsment_frame FROM users WHERE id = ?',
      [id.replace('#', '-').toLowerCase()],
      (err, row) => {
        if (err) {
          console.error('Error querying database:', err.message);
        } else {
          console.log('DB row:', row);
        }
        db.close();
      }
    );
  });
}

run().catch(err => console.error(err));