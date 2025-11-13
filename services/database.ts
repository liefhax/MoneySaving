// services/database.ts
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let dbInitializationPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) {
    return db;
  }
  if (dbInitializationPromise) {
    return await dbInitializationPromise;
  }
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

// --- FUNGSI 'addTransaction' (Tetap Sama) ---
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

// --- FUNGSI 'updateTransaction' (Tetap Sama) ---
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


// --- UBAH FUNGSI INI (Biar bisa difilter) ---
export const getTransactions = async (filterSource?: string) => {
  const db = await getDB();
  try {
    let query = `SELECT * FROM transactions`;
    const params: any[] = [];
    
    // Jika ada filter, tambahkan 'WHERE'
    if (filterSource) {
      query += ` WHERE source = ?`;
      params.push(filterSource);
    }
    
    query += ` ORDER BY date DESC;`;
    
    const results: any[] = await db.getAllAsync(query, params);
    return results;
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    throw error; 
  }
};
// ------------------------------------------

// --- FUNGSI 'getTotals' (Tetap Sama) ---
export const getTotals = async () => {
  const db = await getDB();
  try {
    const [data]: any[] = await db.getAllAsync(`
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

// --- FUNGSI 'deleteTransaction' (Tetap Sama) ---
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

// --- FUNGSI 'getTransactionById' (Tetap Sama) ---
export const getTransactionById = async (id: number) => {
  const db = await getDB();
  try {
    const result: any = await db.getFirstAsync(
      `SELECT * FROM transactions WHERE id = ?;`,
      [id]
    );
    return result;
  } catch (error) {
    console.error('❌ Error fetching transaction by ID:', error);
    throw error;
  }
};

export const getBalancesBySource = async () => {
  const db = await getDB();
  try {
    // Query untuk menjumlahkan income dan expense, dikelompokkan berdasarkan 'source'
    const results: any[] = await db.getAllAsync(`
      SELECT 
        source,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense
      FROM transactions
      GROUP BY source;
    `);
    
    // Hitung saldo dan format output
    return results.map(item => ({
      source: item.source,
      income: item.totalIncome || 0,
      expense: item.totalExpense || 0,
      // Hitung balance: Income - Expense
      balance: (item.totalIncome || 0) - (item.totalExpense || 0),
    }));
  } catch (error) {
    console.error('❌ Error fetching balances by source:', error);
    return [];
  }
};


// --- FUNGSI BARU (Untuk filter) ---
export const getUniqueSources = async () => {
  const db = await getDB();
  try {
    const results: any[] = await db.getAllAsync(
      `SELECT DISTINCT source FROM transactions;`
    );
    // Ubah dari [{source: 'Bank'}, {source: 'Cash'}] jadi ['Bank', 'Cash']
    return results.map(item => item.source);
  } catch (error) {
    console.error('❌ Error fetching unique sources:', error);
    return [];
  }
};