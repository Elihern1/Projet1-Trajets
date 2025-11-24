import type { User } from '@/services/types';
import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('trajets.db');

      // Activer les clés étrangères (utile plus tard pour trips/positions)
      await db.execAsync('PRAGMA foreign_keys = ON;');

      // Table users
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL
        );
      `);

      return db;
    })();
  }
  return dbPromise;
}

// --- USERS ---

export async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<void> {
  const db = await openDb();

  await db.runAsync(
    `INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)`,
    [data.firstName, data.lastName, data.email, data.password]
  );
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await openDb();

  const row = await db.getFirstAsync<User>(
    `SELECT * FROM users WHERE email = ?`,
    [email]
  );

  return row ?? null;
}

export async function updateUserPassword(
  userId: number,
  newPassword: string
): Promise<void> {
  const db = await openDb();

  await db.runAsync(
    `UPDATE users SET password = ? WHERE id = ?`,
    [newPassword, userId]
  );
}