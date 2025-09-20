import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDirPath = path.join(process.cwd(), ".data");
const databaseFilePath = path.join(dataDirPath, "app.db");

let databaseInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!databaseInstance) {
    fs.mkdirSync(dataDirPath, { recursive: true });
    const db = new Database(databaseFilePath);
    db.pragma("journal_mode = WAL");
    db.exec(
      `CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        coverUrl TEXT,
        contentUrl TEXT,
        createdAt INTEGER NOT NULL
      );`
    );
    db.exec(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        passwordHash TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );`
    );
    db.exec(
      `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        createdAt INTEGER NOT NULL,
        expiresAt INTEGER NOT NULL,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      );`
    );
    db.exec(
      `CREATE TABLE IF NOT EXISTS social_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        platform TEXT NOT NULL,
        data TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        UNIQUE(userId, platform),
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      );`
    );
    databaseInstance = db;
  }
  return databaseInstance;
}

export type Project = {
  id: number;
  title: string;
  description: string | null;
  coverUrl: string | null;
  contentUrl: string | null;
  createdAt: number;
};

export type User = {
  id: number;
  email: string;
  name: string | null;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
};

export type Session = {
  id: number;
  userId: number;
  token: string;
  createdAt: number;
  expiresAt: number;
};

export type SocialCredential = {
  id: number;
  userId: number;
  platform: string;
  data: any;
  createdAt: number;
  updatedAt: number;
};

export function findUserByEmail(email: string): User | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  return row || null;
}

export function createUser(email: string, name: string | null, passwordHash: string): User {
  const db = getDb();
  const now = Date.now();
  const info = db
    .prepare("INSERT INTO users (email, name, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)")
    .run(email, name, passwordHash, now, now);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid) as any;
  return user as User;
}

export function getUserById(id: number): User | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
  return row || null;
}

export function createSession(userId: number, token: string, ttlMs: number): Session {
  const db = getDb();
  const now = Date.now();
  const expires = now + ttlMs;
  db.prepare("INSERT INTO sessions (userId, token, createdAt, expiresAt) VALUES (?, ?, ?, ?)").run(userId, token, now, expires);
  const row = db.prepare("SELECT * FROM sessions WHERE token = ?").get(token) as any;
  return row as Session;
}

export function getSessionByToken(token: string): Session | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM sessions WHERE token = ?").get(token) as any;
  return row || null;
}

export function deleteSessionByToken(token: string): void {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function upsertSocialCredential(userId: number, platform: string, data: any): SocialCredential {
  const db = getDb();
  const now = Date.now();
  db.prepare(
    "INSERT INTO social_credentials (userId, platform, data, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?) " +
      "ON CONFLICT(userId, platform) DO UPDATE SET data = excluded.data, updatedAt = excluded.updatedAt"
  ).run(userId, platform, JSON.stringify(data), now, now);
  const row = db.prepare("SELECT * FROM social_credentials WHERE userId = ? AND platform = ?").get(userId, platform) as any;
  if (row && typeof row.data === "string") {
    try {
      row.data = JSON.parse(row.data);
    } catch {}
  }
  return row as SocialCredential;
}

export function getSocialCredentials(userId: number): Array<SocialCredential> {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM social_credentials WHERE userId = ?").all(userId) as any[];
  return (rows || []).map((r) => {
    if (typeof r.data === "string") {
      try {
        r.data = JSON.parse(r.data);
      } catch {}
    }
    return r as SocialCredential;
  });
}

