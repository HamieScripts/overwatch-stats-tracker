import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database/data.db', (err) => {
  if (err) throw err;
  
  db.all('PRAGMA table_info(hero_stats);', (e, rows) => {
    if (e) throw e;
    console.log('hero_stats columns:');
    rows.forEach(row => console.log(`  ${row.name}`));
    
    // Also check a sample hero_stats row
    db.get('SELECT * FROM hero_stats LIMIT 1;', (e2, row) => {
      if (e2) throw e2;
      if (row) {
        console.log('\nSample row keys:');
        Object.keys(row).forEach(key => console.log(`  ${key}`));
      }
      db.close();
    });
  });
});
