import { createServer } from 'http';
import { readFile } from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';
import { URL } from 'url';

const PORT = Number(process.env.PORT || 4000);
const DB_FILE = path.resolve(__dirname, '../database/data.db');
const UI_FILE = path.resolve(__dirname, 'db-ui.html');

function respondJson(response: any, status: number, body: unknown) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(body, null, 2));
}

function respondHtml(response: any, html: string) {
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(html);
}

function respondText(response: any, status: number, text: string) {
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  response.end(text);
}

function parseRequestBody(request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      if (!body) return resolve(null);
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function withDatabase<T>(callback: (db: sqlite3.Database) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        return reject(err);
      }
      callback(db)
        .then((result) => {
          db.close(() => resolve(result));
        })
        .catch((error) => {
          db.close(() => reject(error));
        });
    });
  });
}

function allQuery(db: sqlite3.Database, sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function getTables(db: sqlite3.Database): Promise<any[]> {
  return allQuery(db, "SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY name");
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`);

  if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    try {
      const html = await readFile(UI_FILE, 'utf8');
      return respondHtml(response, html);
    } catch (error) {
      return respondText(response, 500, `Unable to load UI: ${String(error)}`);
    }
  }

  if (request.method === 'GET' && url.pathname === '/api/users') {
    try {
      const rows = await withDatabase((db) => allQuery(db, 'SELECT id, name, avatar, namecard, title, endorsment_level AS endorsmentLevel, endorsment_frame AS endorsmentFrame FROM users ORDER BY name COLLATE NOCASE'));
      return respondJson(response, 200, { users: rows, db: DB_FILE });
    } catch (error) {
      return respondJson(response, 500, { error: String(error) });
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/query') {
    try {
      const body = await parseRequestBody(request);
      const sql = typeof body?.sql === 'string' ? body.sql : '';
      const params = Array.isArray(body?.params) ? body.params : [];

      if (!sql.trim()) {
        return respondJson(response, 400, { error: 'SQL query is required.' });
      }

      const rows = await withDatabase((db) => allQuery(db, sql, params));
      return respondJson(response, 200, { rows });
    } catch (error) {
      return respondJson(response, 500, { error: String(error) });
    }
  }

  return respondText(response, 404, 'Not found');
});

server.listen(PORT, () => {
  console.log(`Local DB UI running at http://localhost:${PORT}`);
  console.log(`Using SQLite file: ${DB_FILE}`);
});
