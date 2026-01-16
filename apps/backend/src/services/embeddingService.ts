import {
  getChunksWithoutEmbeddings,
  getChunksWithoutEmbeddingsByProject,
  createEmbedding as createEmbeddingInDB,
  deleteEmbeddingsByDocument,
  getAllEmbeddingsByProject,
} from '@atlas/database';
import { getDocument, updateDocument, getProject } from '@atlas/database';
import { generateEmbeddingsBatch } from './ollamaService';
import { addEmbeddingsBatch, saveIndex, rebuildProjectIndex } from './vectorStoreService';
import { startTracking, updateProgress, getProgress } from './progressTracker';
import type { Chunk, ProjectSettings } from '@atlas/shared';

const BATCH_SIZE = 15; // Process chunks in batches of 15
const processingDocuments = new Set<string>();

/**
 * Main entry point for generating embeddings for a document
 */
export async function generateEmbeddingsForDocument(documentId: string): Promise<void> {
  // Prevent concurrent processing of same document
  if (processingDocuments.has(documentId)) {
    console.log(`Document ${documentId} is already being processed, skipping`);
    return;
  }

  processingDocuments.add(documentId);

  try {
    console.log(`Starting embedding generation for document ${documentId}`);

    const document = getDocument(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const project = getProject(document.projectId);
    if (!project) {
      throw new Error(`Project not found: ${document.projectId}`);
    }

    const projectSettings: ProjectSettings = project.settings || {
      chunkSize: 1000,
      chunkOverlap: 200,
      embeddingModel: 'nomic-embed-text',
      chatModel: 'llama2',
    };

    // Get chunks without embeddings
    const chunks = getChunksWithoutEmbeddings(documentId);

    if (chunks.length === 0) {
      console.log(`No chunks to embed for document ${documentId}`);
      return;
    }

    // Initialize progress tracking
    startTracking(documentId, chunks.length);
    updateProgress(documentId, 0, 0, 'processing');

    // Update document metadata
    updateDocument(documentId, {
      metadata: {
        embeddingStatus: 'processing',
        embeddingProgress: { total: chunks.length, completed: 0, failed: 0 },
      },
    });

    // Process in batches
    const { completed, failed } = await processEmbeddingBatch(chunks, BATCH_SIZE, document.projectId, documentId);

    // Mark as completed (or failed if all failed)
    const status = failed > 0 && completed === 0 ? 'failed' : 'completed';
    updateProgress(documentId, completed, failed, status);
    updateDocument(documentId, {
      metadata: {
        embeddingStatus: status,
        embeddingProgress: { total: chunks.length, completed, failed },
      },
    });

    console.log(`✓ Completed embedding generation for document ${documentId}`);
  } catch (error) {
    console.error(`Failed to generate embeddings for document ${documentId}:`, error);

    updateProgress(documentId, undefined, undefined, 'failed');
    updateDocument(documentId, {
      metadata: {
        embeddingStatus: 'failed',
        embeddingError: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  } finally {
    processingDocuments.delete(documentId);
  }
}

/**
 * Process embedding batch
 */
async function processEmbeddingBatch(
  chunks: Chunk[],
  batchSize: number,
  projectId: string,
  documentId: string
): Promise<{ completed: number; failed: number }> {
  let completed = 0;
  let failed = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, Math.min(i + batchSize, chunks.length));
    const texts = batch.map((c) => c.content);

    try {
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(chunks.length / batchSize)}`);

      // Generate embeddings
      const { embeddings, failedIndices } = await generateEmbeddingsBatch(texts);

      // Prepare embeddings for storage
      const embeddingsToStore = embeddings
        .map((embedding, idx) => (embedding ? { chunkId: batch[idx].id, embedding } : null))
        .filter((e) => e !== null) as Array<{ chunkId: string; embedding: number[] }>;

      // Store embeddings in database
      for (const item of embeddingsToStore) {
        createEmbeddingInDB({
          chunkId: item.chunkId,
          embedding: item.embedding,
          model: 'nomic-embed-text',
          dimension: 768,
        });
      }

      // Add to vector store
      await addEmbeddingsBatch(projectId, embeddingsToStore);

      // Update progress
      completed += embeddingsToStore.length;
      failed += failedIndices.length;
      updateProgress(documentId, completed, failed, 'processing');

      // Log progress
      const progress = getProgress(documentId);
      if (progress) {
        const percentage = Math.round((completed / progress.total) * 100);
        console.log(`Embedding progress: ${percentage}% (${completed}/${progress.total})`);
      }
    } catch (error) {
      console.error(`Failed to process embedding batch starting at index ${i}:`, error);
      failed += batch.length;
      updateProgress(documentId, completed, failed, 'processing');
    }
  }

  // Save vector index to disk
  try {
    await saveIndex(projectId);
  } catch (error) {
    console.error(`Failed to save vector index for project ${projectId}:`, error);
  }

  return { completed, failed };
}

/**
 * Generate embeddings for all unembedded chunks in a project
 */
export async function generateEmbeddingsForProject(projectId: string): Promise<void> {
  console.log(`Starting embedding generation for all documents in project ${projectId}`);

  try {
    const chunks = getChunksWithoutEmbeddingsByProject(projectId);

    if (chunks.length === 0) {
      console.log(`No chunks to embed in project ${projectId}`);
      return;
    }

    console.log(`Found ${chunks.length} chunks to embed in project ${projectId}`);

    // Process all chunks in batches
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, Math.min(i + BATCH_SIZE, chunks.length));
      const texts = batch.map((c) => c.content);

      try {
        const { embeddings, failedIndices } = await generateEmbeddingsBatch(texts);

        const embeddingsToStore = embeddings
          .map((embedding, idx) => (embedding ? { chunkId: batch[idx].id, embedding } : null))
          .filter((e) => e !== null) as Array<{ chunkId: string; embedding: number[] }>;

        for (const item of embeddingsToStore) {
          createEmbeddingInDB({
            chunkId: item.chunkId,
            embedding: item.embedding,
            model: 'nomic-embed-text',
            dimension: 768,
          });
        }

        await addEmbeddingsBatch(projectId, embeddingsToStore);

        const percentage = Math.round(((i + batch.length) / chunks.length) * 100);
        console.log(`Project embedding progress: ${percentage}% (${i + batch.length}/${chunks.length})`);
      } catch (error) {
        console.error(`Failed to process batch for project ${projectId}:`, error);
      }
    }

    // Save vector index
    await saveIndex(projectId);
    console.log(`✓ Completed embedding generation for project ${projectId}`);
  } catch (error) {
    console.error(`Failed to generate embeddings for project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Rebuild vector index from database embeddings
 */
export async function rebuildVectorIndexFromDB(projectId: string): Promise<void> {
  console.log(`Rebuilding vector index for project ${projectId} from database`);

  try {
    const project = getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Get all embeddings from database
    const embeddings = getAllEmbeddingsByProject(projectId);

    if (embeddings.length === 0) {
      console.log(`No embeddings found for project ${projectId}, skipping rebuild`);
      return;
    }

    console.log(`Rebuilding index with ${embeddings.length} embeddings for project ${projectId}`);

    // Transform embeddings to match rebuildProjectIndex signature: {id, embedding}
    const chunks = embeddings.map(e => ({
      id: e.chunkId,
      embedding: e.embedding,
    }));

    // Rebuild the vector index from existing embeddings
    await rebuildProjectIndex(projectId, chunks);

    console.log(`✓ Successfully rebuilt vector index for project ${projectId}`);
  } catch (error) {
    console.error(`Failed to rebuild vector index for project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Get embedding progress for a document
 */
export function getEmbeddingProgress(documentId: string): {
  progress: ReturnType<typeof getProgress>;
  percentage: number;
} {
  const progress = getProgress(documentId);

  if (!progress) {
    return {
      progress: null,
      percentage: 0,
    };
  }

  const percentage = Math.round((progress.completed / progress.total) * 100);

  return {
    progress,
    percentage,
  };
}

/**
 * Check if document embedding is in progress
 */
export function isDocumentEmbeddingInProgress(documentId: string): boolean {
  return processingDocuments.has(documentId);
}

/**
 * Get all documents with pending embeddings
 */
export function getDocumentsWithPendingEmbeddings(projectId: string): string[] {
  const chunks = getChunksWithoutEmbeddingsByProject(projectId);
  const documentIds = new Set<string>();

  for (const chunk of chunks) {
    documentIds.add(chunk.documentId);
  }

  return Array.from(documentIds);
}
