// services/database.ts
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let dbInitializationPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// --- OPEN DB & INIT ---
const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  if (dbInitializationPromise) return await dbInitializationPromise;

  dbInitializationPromise = (async () => {
    try {
      const newDb = await SQLite.openDatabaseAsync('moneysaving.db');
      await newDb.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          date TEXT NOT NULL,
          source TEXT NOT NULL,
          purpose TEXT NOT NULL
        );
      `);
      console.log('✅ Database initialized and ready');
      db = newDb;
      return newDb;
    } catch (error) {
      console.error('❌ Error initializing DB:', error);
      dbInitializationPromise = null;
      throw error;
    }
  })();

  return await dbInitializationPromise;
};

// --- ADD ---
export const addTransaction = async (
  title: string, amount: number, type: 'income' | 'expense', date: string, source: string, purpose: string
) => {
  const db = await getDB();
  try {
    await db.runAsync(
      `INSERT INTO transactions (title, amount, type, date, source, purpose)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [title, amount, type, date, source, purpose]
    );
    console.log('✅ Transaction added');
  } catch (error) {
    console.error('❌ Error adding transaction:', error);
    throw error;
  }
};

// --- UPDATE ---
export const updateTransaction = async (
  id: number, title: string, amount: number, type: 'income' | 'expense', date: string, source: string, purpose: string
) => {
  const db = await getDB();
  try {
    await db.runAsync(
      `UPDATE transactions 
       SET title = ?, amount = ?, type = ?, date = ?, source = ?, purpose = ?
       WHERE id = ?;`,
      [title, amount, type, date, source, purpose, id]
    );
    console.log('✅ Transaction updated');
  } catch (error) {
    console.error('❌ Error updating transaction:', error);
    throw error;
  }
};

// --- GET TRANSACTIONS (diperbaiki) ---
export const getTransactions = async (filterSource?: string, limit?: number) => {
  const db = await getDB();
  try {
    let query = `SELECT * FROM transactions`;
    const params: any[] = [];

    if (filterSource) {
      query += ` WHERE source = ?`;
      params.push(filterSource);
    }

    query += ` ORDER BY date DESC, id DESC`;

    if (limit) {
      query += ` LIMIT ?`;
      params.push(limit);
    }

    const results = await db.getAllAsync(query, params);
    return results;
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    throw error;
  }
};

// --- GET TOTALS ---
export const getTotals = async () => {
  const db = await getDB();
  try {
    const data = await db.getFirstAsync(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense
      FROM transactions;
    `);

    const income = data?.totalIncome || 0;
    const expense = data?.totalExpense || 0;
    const balance = income - expense;
    return { income, expense, balance };
  } catch (error) {
    console.error('❌ Error calculating totals:', error);
    throw error;
  }
};

// --- DELETE ---
export const deleteTransaction = async (id: number) => {
  const db = await getDB();
  try {
    await db.runAsync(`DELETE FROM transactions WHERE id = ?;`, [id]);
    console.log('✅ Transaction deleted');
  } catch (error) {
    console.error('❌ Error deleting transaction:', error);
    throw error;
  }
};

// --- GET BY ID ---
export const getTransactionById = async (id: number) => {
  const db = await getDB();
  try {
    const result = await db.getFirstAsync(
      `SELECT * FROM transactions WHERE id = ?;`,
      [id]
    );
    return result;
  } catch (error) {
    console.error('❌ Error fetching transaction by ID:', error);
    throw error;
  }
};

// --- GET BALANCES BY SOURCE ---
export const getBalancesBySource = async () => {
  const db = await getDB();
  try {
    const results = await db.getAllAsync(`
      SELECT 
        source,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense
      FROM transactions
      GROUP BY source;
    `);

    return results.map((item: any) => ({
      source: item.source,
      income: item.totalIncome || 0,
      expense: item.totalExpense || 0,
      balance: (item.totalIncome || 0) - (item.totalExpense || 0),
    }));
  } catch (error) {
    console.error('❌ Error fetching balances by source:', error);
    return [];
  }
};

// --- GET UNIQUE SOURCES ---
export const getUniqueSources = async () => {
  const db = await getDB();
  try {
    const results = await db.getAllAsync(`SELECT DISTINCT source FROM transactions;`);
    return results.map((item: any) => item.source);
  } catch (error) {
    console.error('❌ Error fetching unique sources:', error);
    return [];
  }
};
