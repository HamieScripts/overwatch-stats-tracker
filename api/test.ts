import { SaveUserApi } from './save-user.api';
import sqlite3 from 'sqlite3';
import path from 'path';
import { ids } from './test-ids';

const dbPath = path.resolve(__dirname, '../database/data.db');

async function run(id:string) {
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
        //   console.log('DB row:', row);
        }
        db.close();
      }
    );
  });
}

ids.forEach(async (userId: string) => {
    let count = 0;
    setTimeout(async () => {
        await run(userId);
    }, count++ * 5000); // 5 second delay between each API call
});