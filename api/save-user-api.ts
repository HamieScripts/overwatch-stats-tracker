import sqlite3 from 'sqlite3';
import path from 'path';
import { RawDataApi } from './raw-data.api';

const DB_PATH = path.resolve(__dirname, '../database/data.db');

function runQuery(db: sqlite3.Database, sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

export class SaveUserApi {
  private rawApi = new RawDataApi();

  async save(id: string): Promise<void> {
    const rawData = await this.rawApi.get(id);
    const summary = rawData?.summary;
    if (!summary) {
      throw new Error('Missing raw data summary');
    }

    const userId = id.replace('#', '-').toLowerCase();
    const name = summary.username || null;
    const avatar = summary.avatar || null;
    const namecard = summary.namecard || null;
    const title = summary.title || null;
    const endorsmentLevel = summary.endorsement?.level ?? null;
    const endorsmentFrame = summary.endorsement?.frame || null;

    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        throw err;
      }
    });

    try {
      await runQuery(
        db,
        `INSERT OR REPLACE INTO users
          (id, name, avatar, namecard, title, endorsment_level, endorsment_frame)
          VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [userId, name, avatar, namecard, title, endorsmentLevel, endorsmentFrame]
      );
    } finally {
      db.close();
    }
  }
}
