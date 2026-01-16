import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let db = null;
export function getDatabase(dbPath) {
    if (db) {
        return db;
    }
    const path = dbPath || process.env.DATABASE_PATH || './data/atlas.db';
    // Create directory if it doesn't exist
    const dir = dirname(path);
    mkdirSync(dir, { recursive: true });
    db = new Database(path);
    // Set pragmas for better performance and data integrity
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    return db;
}
export function initializeDatabase(dbPath) {
    const database = getDatabase(dbPath);
    // Read and execute schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    // Execute schema statements
    database.exec(schema);
    console.log('Database initialized successfully');
    return database;
}
export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}
//# sourceMappingURL=db.js.map