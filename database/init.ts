import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, 'data.db');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
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
      endorsment_frame TEXT,
      competitive_pc_season INTEGER,
      competitive_pc_tank_division TEXT,
      competitive_pc_tank_tier INTEGER,
      competitive_pc_damage_division TEXT,
      competitive_pc_damage_tier INTEGER,
      competitive_pc_support_division TEXT,
      competitive_pc_support_tier INTEGER,
      competitive_pc_open_division TEXT,
      competitive_pc_open_tier INTEGER,
      last_updated_at INTEGER
    );
  `;

  const columnsToEnsure: Array<[string, string]> = [
    ['competitive_pc_season', 'INTEGER'],
    ['competitive_pc_tank_division', 'TEXT'],
    ['competitive_pc_tank_tier', 'INTEGER'],
    ['competitive_pc_damage_division', 'TEXT'],
    ['competitive_pc_damage_tier', 'INTEGER'],
    ['competitive_pc_support_division', 'TEXT'],
    ['competitive_pc_support_tier', 'INTEGER'],
    ['competitive_pc_open_division', 'TEXT'],
    ['competitive_pc_open_tier', 'INTEGER'],
    ['last_updated_at', 'INTEGER']
  ];

  // Export function to dynamically add hero_stat columns
  const heroDynamicColumns = new Set<string>();

  function addColumnIfMissing(name: string, type: string, table: string = 'users'): Promise<void> {
    return new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(${table});`, (infoError, rows: any[]) => {
        if (infoError) return reject(infoError);
        const existing = new Set(rows.map((row) => row.name));
        if (existing.has(name)) return resolve();
        db.run(`ALTER TABLE ${table} ADD COLUMN ${name} REAL;`, (alterError) => {
          if (alterError) return reject(alterError);
          resolve();
        });
      });
    });
  }

  function ensureColumns(): Promise<void> {
    return columnsToEnsure.reduce((promise, [name, type]) => {
      return promise.then(() => addColumnIfMissing(name, type));
    }, Promise.resolve());
  }

  const createHeroStatsTable = `
    CREATE TABLE IF NOT EXISTS hero_stats (
      userId TEXT NOT NULL,
      hero TEXT NOT NULL,
      time_played INTEGER,
      games_won INTEGER,
      win_percentage INTEGER,
      weapon_accuracy_best_in_game INTEGER,
      eliminations_per_life REAL,
      kill_streak_best INTEGER,
      multikill_best INTEGER,
      eliminations_avg_per_10_min REAL,
      deaths_avg_per_10_min REAL,
      final_blows_avg_per_10_min REAL,
      solo_kills_avg_per_10_min REAL,
      objective_kills_avg_per_10_min REAL,
      objective_time_avg_per_10_min REAL,
      hero_damage_done_avg_per_10_min REAL,
      healing_done_avg_per_10_min REAL,
      PRIMARY KEY(userId, hero)
    );
  `;

  db.serialize(() => {
    db.run(createTable, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
        process.exit(1);
      }
    });

    db.run(createHeroStatsTable, (err) => {
      if (err) {
        console.error('Error creating hero_stats table:', err.message);
        process.exit(1);
      }
    });

    ensureColumns()
      .then(() => {
        console.log(`DB initialized at ${dbPath}`);
        process.nextTick(() => db.close());
      })
      .catch((ensureErr) => {
        console.error('Error ensuring schema columns:', ensureErr);
        process.exit(1);
      });
  });
});
