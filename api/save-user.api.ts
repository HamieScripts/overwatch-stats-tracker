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

function addColumnIfMissing(db: sqlite3.Database, colName: string, table: string = 'hero_stats'): Promise<void> {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table});`, (err, rows: any[]) => {
      if (err) return reject(err);
      const existing = new Set(rows.map((row) => row.name));
      if (existing.has(colName)) return resolve();
      db.run(`ALTER TABLE ${table} ADD COLUMN "${colName}" REAL;`, (alterErr) => {
        if (alterErr) return reject(alterErr);
        resolve();
      });
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
    const competitivePcSeason = summary.competitive?.pc?.season ?? null;
    const competitivePcTankDivision = summary.competitive?.pc?.tank?.division || null;
    const competitivePcTankTier = summary.competitive?.pc?.tank?.tier ?? null;
    const competitivePcDamageDivision = summary.competitive?.pc?.damage?.division || null;
    const competitivePcDamageTier = summary.competitive?.pc?.damage?.tier ?? null;
    const competitivePcSupportDivision = summary.competitive?.pc?.support?.division || null;
    const competitivePcSupportTier = summary.competitive?.pc?.support?.tier ?? null;
    const competitivePcOpenDivision = summary.competitive?.pc?.open?.division || null;
    const competitivePcOpenTier = summary.competitive?.pc?.open?.tier ?? null;
    const lastUpdatedAt = Number(summary.last_updated_at) || null;

    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        throw err;
      }
    });

    async function saveHeroStats(comparisons: any, careerStats: any): Promise<void> {
      if (!comparisons || typeof comparisons !== 'object') return;

      const heroMap: Record<string, Record<string, number | null>> = {};

      for (const metricKey of Object.keys(comparisons)) {
        const metricBlock = comparisons[metricKey];
        if (!metricBlock || !Array.isArray(metricBlock.values)) continue;

        metricBlock.values.forEach((item: any) => {
          const hero = item?.hero;
          if (!hero) return;
          const value = item.value == null ? null : item.value;
          heroMap[hero] = heroMap[hero] || {};
          heroMap[hero][metricKey] = value;
        });
      }

      // Collect all hero-stat columns needed from career_stats
      const careerStatColumns: Record<string, Record<string, number | null>> = {};
      if (careerStats && typeof careerStats === 'object') {
        for (const hero of Object.keys(careerStats)) {
          const heroStatsArray = careerStats[hero];
          if (!heroStatsArray || !Array.isArray(heroStatsArray)) continue;
          
          careerStatColumns[hero] = careerStatColumns[hero] || {};
          
          // Flatten nested structure: each category has stats array
          heroStatsArray.forEach((categoryBlock: any) => {
            if (!categoryBlock || !Array.isArray(categoryBlock.stats)) return;
            categoryBlock.stats.forEach(async (stat: any) => {
              const statKey = stat?.key;
              const value = stat?.value;
              if (!statKey) return;
              
              careerStatColumns[hero][statKey] = (value == null ? null : Number(value));
              // Ensure column exists with hero and stat name prefix
              const colName = `${hero}_${statKey}`.toUpperCase();
              await addColumnIfMissing(db, colName, 'hero_stats');
            });
          });
        }
      }

      const baseColumns = ['userId', 'hero', 'time_played', 'games_won', 'win_percentage', 'weapon_accuracy_best_in_game',
        'eliminations_per_life', 'kill_streak_best', 'multikill_best', 'eliminations_avg_per_10_min',
        'deaths_avg_per_10_min', 'final_blows_avg_per_10_min', 'solo_kills_avg_per_10_min',
        'objective_kills_avg_per_10_min', 'objective_time_avg_per_10_min',
        'hero_damage_done_avg_per_10_min', 'healing_done_avg_per_10_min'];

      for (const hero of Object.keys(heroMap)) {
        const metrics = heroMap[hero];
        const heroCareerStats = careerStatColumns[hero] || {};
        
        // Build dynamic column list
        const columns = [...baseColumns];
        const values: any[] = [
          userId,
          hero,
          metrics.time_played ?? null,
          metrics.games_won ?? null,
          metrics.win_percentage ?? null,
          metrics.weapon_accuracy_best_in_game ?? null,
          metrics.eliminations_per_life ?? null,
          metrics.kill_streak_best ?? null,
          metrics.multikill_best ?? null,
          metrics.eliminations_avg_per_10_min ?? null,
          metrics.deaths_avg_per_10_min ?? null,
          metrics.final_blows_avg_per_10_min ?? null,
          metrics.solo_kills_avg_per_10_min ?? null,
          metrics.objective_kills_avg_per_10_min ?? null,
          metrics.objective_time_avg_per_10_min ?? null,
          metrics.hero_damage_done_avg_per_10_min ?? null,
          metrics.healing_done_avg_per_10_min ?? null
        ];

        // Add career stat columns and values
        for (const statName of Object.keys(heroCareerStats)) {
          columns.push(`${hero}_${statName}`);
          values.push(heroCareerStats[statName]);
        }

        const placeholders = columns.map(() => '?').join(', ');
        const quotedColumns = columns.map(c => `"${c}"`);
        const insertSql = `INSERT OR REPLACE INTO hero_stats (${quotedColumns.join(', ')}) VALUES (${placeholders});`;

        await runQuery(db, insertSql, values);
      }
    }

    try {
      await runQuery(
        db,
        `INSERT OR REPLACE INTO users
          (id, name, avatar, namecard, title, endorsment_level, endorsment_frame,
           competitive_pc_season, competitive_pc_tank_division, competitive_pc_tank_tier,
           competitive_pc_damage_division, competitive_pc_damage_tier,
           competitive_pc_support_division, competitive_pc_support_tier,
           competitive_pc_open_division, competitive_pc_open_tier,
           last_updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          userId,
          name,
          avatar,
          namecard,
          title,
          endorsmentLevel,
          endorsmentFrame,
          competitivePcSeason,
          competitivePcTankDivision,
          competitivePcTankTier,
          competitivePcDamageDivision,
          competitivePcDamageTier,
          competitivePcSupportDivision,
          competitivePcSupportTier,
          competitivePcOpenDivision,
          competitivePcOpenTier,
          lastUpdatedAt
        ]
      );

      const careerStats = rawData?.stats?.pc?.competitive?.career_stats;
      await saveHeroStats(rawData?.stats?.pc?.competitive?.heroes_comparisons, careerStats);
    } finally {
      db.close();
    }
  }
}
