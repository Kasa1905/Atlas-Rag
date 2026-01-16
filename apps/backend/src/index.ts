import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mkdirSync, existsSync } from 'fs';
import { initializeDatabase } from '@atlas/database';
import { checkOllamaHealth, initializeOllama } from './services/ollamaService';
import { clearAllIndexes } from './services/vectorStoreService';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import projectsRouter from './routes/projects';
import documentsRouter from './routes/documents';
import chatsRouter from './routes/chats';
import uploadRouter from './routes/upload';
import embeddingsRouter from './routes/embeddings';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './data/uploads';

// Initialize services
async function initialize() {
  // Initialize database
  try {
    initializeDatabase(process.env.DATABASE_PATH);
    console.log('✓ Database initialized');
  } catch (error) {
    console.error('✗ Failed to initialize database:', error);
    process.exit(1);
  }

  // Initialize Ollama
  try {
    initializeOllama();
    const health = await checkOllamaHealth();
    if (health.healthy) {
      console.log(`✓ Ollama service healthy: ${health.message}`);
    } else {
      console.warn(`⚠ Ollama service unavailable: ${health.message}`);
      console.warn('⚠ Embedding generation will be skipped');
    }
  } catch (error) {
    console.warn('⚠ Failed to initialize Ollama:', error);
    console.warn('⚠ Embedding generation will be skipped');
  }

  // Ensure data directories exist
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('✓ Uploads directory created');
  }

  const VECTOR_INDEX_PATH = process.env.VECTOR_INDEX_PATH || './data/vector_index';
  if (!existsSync(VECTOR_INDEX_PATH)) {
    mkdirSync(VECTOR_INDEX_PATH, { recursive: true });
    console.log('✓ Vector index directory created');
  }
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
app.use('/api/embeddings', embeddingsRouter);

// Error handling
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  try {
    await clearAllIndexes();
    console.log('✓ Vector indexes saved');
  } catch (error) {
    console.error('Failed to save vector indexes:', error);
  }
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});

// Initialize and start
initialize().catch((error) => {
  console.error('Initialization failed:', error);
  process.exit(1);
});
