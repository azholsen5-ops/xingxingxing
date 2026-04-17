import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'xh_club.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    className TEXT,
    avatar TEXT,
    category TEXT DEFAULT 'core',
    intro TEXT,
    role TEXT DEFAULT 'member',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS presence (
    userId TEXT PRIMARY KEY,
    status TEXT DEFAULT 'offline',
    lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
`);

export default db;
