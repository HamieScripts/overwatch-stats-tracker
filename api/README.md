# Local DB UI

This folder contains a lightweight local SQLite UI for `database/data.db`.

## Run the UI

1. Ensure the database exists:
   ```bash
   npm run db:init
   ```
2. Start the local UI server:
   ```bash
   npm run db:ui
   ```
3. Open your browser at:
   ```text
   http://localhost:4000
   ```

## What it does

- `GET /api/users` returns saved user rows from the `users` table
- `POST /api/query` executes a custom SQL query against the DB
- `db-ui.html` provides a query editor and result table

## Notes

- This UI is intended for read-only inspection of `database/data.db`.
- For a dedicated third-party SQLite application, use DB Browser for SQLite or SQLiteStudio.
