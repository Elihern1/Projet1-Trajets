// services/database.native.ts
import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";
import type { User } from "./types";

// Ouvre / crée la BD native
export const db: SQLiteDatabase = openDatabaseSync("trajets.db");

let createTablesPromise: Promise<void> | null = null;

// Création des tables
export async function createTables() {
  if (createTablesPromise) {
    return createTablesPromise;
  }

  createTablesPromise = (async () => {
  console.log("Creating SQLite tables...");

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tripId INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (tripId) REFERENCES trips(id)
    );
  `);

  const tripColumns = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(trips);`
  );
  const hasUserId = tripColumns.some((c) => c.name === "userId");
  if (!hasUserId) {
    try {
      await db.execAsync(
        "ALTER TABLE trips ADD COLUMN userId INTEGER REFERENCES users(id);"
      );
    } catch (err: any) {
      // Ignore if another caller already added the column in parallel
      if (!String(err?.message ?? "").includes("duplicate column name")) {
        createTablesPromise = null;
        throw err;
      }
    }
  }

  console.log("Tables created.");
  })();

  return createTablesPromise;
}

/**
 * Helpers génériques
 */
export function run(sql: string, params: any[] = []) {
  return db.runAsync(sql, params);
}

export function getAll<T = any>(sql: string, params: any[] = []) {
  return db.getAllAsync<T>(sql, params);
}

/**
 * -------  FONCTIONS POUR AUTH  -------
 */

// Créer un utilisateur
export async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<void> {
  await db.runAsync(
    `INSERT INTO users (firstName, lastName, email, password)
     VALUES (?, ?, ?, ?);`,
    [data.firstName, data.lastName, data.email, data.password]
  );
}

// Trouver un user par email
export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await db.getAllAsync<User>(
    `SELECT * FROM users WHERE email = ? LIMIT 1;`,
    [email]
  );
  return rows[0] ?? null;
}

// Mettre à jour le mot de passe
export async function updateUserPassword(userId: number, newPassword: string) {
  await db.runAsync(
    `UPDATE users SET password = ? WHERE id = ?;`,
    [newPassword, userId]
  );
}
