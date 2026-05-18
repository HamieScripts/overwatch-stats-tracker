# Database Initialization

This directory contains the database initialization script for the project.

## Instructions

1. Install dependencies:

```bash
npm install
```

2. Initialize the database:

```bash
npm run db:init
```

This will create `database/data.db` and a `users` table.

The `users` table includes these minimum columns:
- `id`
- `name`
- `avatar`
- `namecard`
- `title`
- `endorsment_level`
- `endorsment_frame`

Note: `sqlite3` may require build tools on Windows.
