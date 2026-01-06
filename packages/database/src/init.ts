import { initializeDatabase } from './db';

// Initialize database
const dbPath = process.env.DATABASE_PATH || './data/atlas.db';

console.log(`Initializing database at: ${dbPath}`);

try {
  initializeDatabase(dbPath);
  console.log('✓ Database initialized successfully');
} catch (error) {
  console.error('✗ Failed to initialize database:', error);
  process.exit(1);
}
