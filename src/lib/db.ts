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

