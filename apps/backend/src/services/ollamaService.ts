import { Ollama } from 'ollama';

let ollamaClient: Ollama | null = null;

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const EMBEDDING_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION || '768', 10);

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Initialize Ollama client
 */
export function initializeOllama(): Ollama {
  if (!ollamaClient) {
    ollamaClient = new Ollama({ host: OLLAMA_BASE_URL });
  }
  return ollamaClient;
}

/**
 * Check if Ollama service is running and model is available
 */
export async function checkOllamaHealth(): Promise<{ healthy: boolean; model: string; message: string }> {
  try {
    const client = initializeOllama();
    
    // Try to generate a test embedding
    const testResult = await client.embed({
      model: EMBEDDING_MODEL,
      input: 'test',
    });

    if (testResult.embeddings && testResult.embeddings.length > 0) {
      const embedding = testResult.embeddings[0];
      if (embedding.length !== EMBEDDING_DIMENSION) {
        return {
          healthy: false,
          model: EMBEDDING_MODEL,
          message: `Embedding dimension mismatch. Expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`,
        };
      }
    }

    return {
      healthy: true,
      model: EMBEDDING_MODEL,
      message: `Ollama service is healthy. Model: ${EMBEDDING_MODEL}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      healthy: false,
      model: EMBEDDING_MODEL,
      message: `Ollama service check failed: ${message}`,
    };
  }
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  if (text.length > 8192 * 4) {
    // Rough estimate: 8192 tokens ≈ 32k characters for nomic-embed-text
    throw new Error('Text exceeds maximum length for embedding');
  }

  const client = initializeOllama();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const startTime = Date.now();
      const result = await client.embed({
        model: EMBEDDING_MODEL,
        input: text,
      });

      const duration = Date.now() - startTime;
      console.log(`Generated embedding in ${duration}ms`);

      if (!result.embeddings || result.embeddings.length === 0) {
        throw new Error('No embeddings returned from Ollama');
      }

      const embedding = result.embeddings[0];
      if (embedding.length !== EMBEDDING_DIMENSION) {
        throw new Error(
          `Invalid embedding dimension. Expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`
        );
      }

      return embedding;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.warn(
          `Embedding generation failed (attempt ${attempt + 1}/${MAX_RETRIES}). Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to generate embedding after max retries');
}

/**
 * Generate embeddings for a batch of texts with retry logic
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<{ embeddings: number[][]; failedIndices: number[] }> {
  if (!texts || texts.length === 0) {
    return { embeddings: [], failedIndices: [] };
  }

  const embeddings: number[][] = new Array(texts.length).fill(null);
  const failedIndices: number[] = [];

  console.log(`Generating embeddings for batch of ${texts.length} texts`);
  const startTime = Date.now();

  for (let i = 0; i < texts.length; i++) {
    try {
      embeddings[i] = await generateEmbedding(texts[i]);
    } catch (error) {
      console.error(
        `Failed to generate embedding for text ${i}:`,
        error instanceof Error ? error.message : error
      );
      failedIndices.push(i);
    }
  }

  const duration = Date.now() - startTime;
  const successCount = texts.length - failedIndices.length;
  const throughput = (successCount / duration) * 1000;

  console.log(
    `Batch embedding generation complete: ${successCount}/${texts.length} succeeded in ${duration}ms (${throughput.toFixed(2)} chunks/sec)`
  );

  return { embeddings, failedIndices };
}

/**
 * Get embedding model name
 */
export function getEmbeddingModel(): string {
  return EMBEDDING_MODEL;
}

/**
 * Get expected embedding dimension
 */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIMENSION;
}
