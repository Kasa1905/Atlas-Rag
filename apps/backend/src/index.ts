import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mkdirSync, existsSync } from 'fs';
import { initializeDatabase } from '@atlas/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import projectsRouter from './routes/projects';
import documentsRouter from './routes/documents';
import chatsRouter from './routes/chats';
import uploadRouter from './routes/upload';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './data/uploads';

// Initialize database
try {
  initializeDatabase(process.env.DATABASE_PATH);
  console.log('✓ Database initialized');
} catch (error) {
  console.error('✗ Failed to initialize database:', error);
  process.exit(1);
}
// Ensure uploads directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log('✓ Uploads directory created');
}


// Middleware
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(logger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/upload', uploadRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
