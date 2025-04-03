import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  threadId: string;
}

export interface Thread {
  id: string;
  title: string;
  createdAt: number;
  lastMessageAt: number;
}

// Database row type with isUser as number for SQLite storage
type DatabaseMessageRow = Omit<Message, 'isUser'> & {
  isUser: number;
};

class DatabaseService {
  private db: SQLiteDatabase;
  private initialized: boolean = false;

  constructor() {
    if (Platform.OS === "web") {
      throw new Error("SQLite is not supported on web platform");
    }
    this.db = openDatabaseSync('dad.db');
    this.initDatabase().catch(error => {
      console.error('Failed to initialize database:', error);
      throw error;
    });
  }

  private async initDatabase() {
    if (this.initialized) return;

    try {
      // Create threads table
      await this.db.runAsync(
        `CREATE TABLE IF NOT EXISTS threads (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          createdAt INTEGER NOT NULL,
          lastMessageAt INTEGER NOT NULL
        );`
      );

      // Create messages table with thread reference
      await this.db.runAsync(
        `CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY NOT NULL,
          text TEXT NOT NULL,
          isUser INTEGER NOT NULL,
          timestamp INTEGER NOT NULL,
          threadId TEXT NOT NULL,
          FOREIGN KEY (threadId) REFERENCES threads (id)
        );`
      );

      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initDatabase();
    }
  }

  async createThread(thread: Thread): Promise<void> {
    await this.ensureInitialized();
    try {
      await this.db.runAsync(
        'INSERT INTO threads (id, title, createdAt, lastMessageAt) VALUES (?, ?, ?, ?)',
        [thread.id, thread.title, thread.createdAt, thread.lastMessageAt]
      );
      console.log('Thread created:', thread.id);
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }

  async getThreads(limit: number = 20): Promise<Thread[]> {
    return this.db.getAllAsync<Thread>(
      'SELECT * FROM threads ORDER BY lastMessageAt DESC LIMIT ?',
      [limit]
    );
  }

  async saveMessage(message: Message): Promise<void> {
    await this.ensureInitialized();
    try {
      // Update the thread's lastMessageAt timestamp
      await this.db.runAsync(
        'UPDATE threads SET lastMessageAt = ? WHERE id = ?',
        [message.timestamp, message.threadId]
      );

      // Save the message
      await this.db.runAsync(
        'INSERT INTO messages (id, text, isUser, timestamp, threadId) VALUES (?, ?, ?, ?, ?)',
        [message.id, message.text, message.isUser ? 1 : 0, message.timestamp, message.threadId]
      );
      console.log('Message saved:', message.id);
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async getMessagesForThread(threadId: string, limit: number = 50): Promise<Message[]> {
    const rows = await this.db.getAllAsync<DatabaseMessageRow>(
      'SELECT * FROM messages WHERE threadId = ? ORDER BY timestamp DESC LIMIT ?',
      [threadId, limit]
    );
    return rows.map(row => ({
      ...row,
      isUser: Boolean(row.isUser),
    })).reverse();
  }

  async deleteThread(threadId: string): Promise<void> {
    // Delete messages first due to foreign key constraint
    await this.db.runAsync('DELETE FROM messages WHERE threadId = ?', [threadId]);
    // Then delete the thread
    return this.db.runAsync('DELETE FROM threads WHERE id = ?', [threadId]).then(() => void 0);
  }

  async deleteAllThreads(): Promise<void> {
    // Delete all messages first due to foreign key constraint
    await this.db.runAsync('DELETE FROM messages', []);
    // Then delete all threads
    return this.db.runAsync('DELETE FROM threads', []).then(() => void 0);
  }

  async getThread(threadId: string): Promise<Thread | null> {
    return this.db.getFirstAsync<Thread>(
      'SELECT * FROM threads WHERE id = ?',
      [threadId]
    );
  }

  async updateThreadTitle(threadId: string, title: string): Promise<void> {
    return this.db.runAsync(
      'UPDATE threads SET title = ? WHERE id = ?',
      [title, threadId]
    ).then(() => void 0);
  }
}

export const database = new DatabaseService(); 