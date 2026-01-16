import { HierarchicalNSW } from 'hnswlib-node';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getEmbeddingDimension } from './ollamaService';

interface ChunkIdMapping {
  [key: string]: number; // chunkId -> hnswlib internal ID
}

interface VectorStoreIndex {
  projectId: string;
  dimension: number;
  space: string;
  M: number;
  efConstruction: number;
  elementCount: number;
}

const VECTOR_INDEX_PATH = process.env.VECTOR_INDEX_PATH || './data/vector_index';
const M = 16; // number of connections
const EF_CONSTRUCTION = 200; // construction time/quality tradeoff
const INITIAL_MAX_ELEMENTS = parseInt(process.env.INITIAL_MAX_ELEMENTS || '10000', 10);
const RESIZE_THRESHOLD = 0.9; // Resize when 90% full

// In-memory store of active indexes
const activeIndexes = new Map<string, HierarchicalNSW>();
const chunkIdMappings = new Map<string, ChunkIdMapping>();
const processingLocks = new Set<string>(); // Projects currently being processed

/**
 * Initialize or load vector index for a project
 */
export async function initializeProjectIndex(projectId: string): Promise<HierarchicalNSW> {
  // Return existing index if loaded
  if (activeIndexes.has(projectId)) {
    return activeIndexes.get(projectId)!;
  }

  const dimension = getEmbeddingDimension();
  const indexPath = getIndexPath(projectId);
  const mappingPath = getMappingPath(projectId);

  // Create index directory if it doesn't exist
  if (!existsSync(VECTOR_INDEX_PATH)) {
    mkdirSync(VECTOR_INDEX_PATH, { recursive: true });
  }

  let index: HierarchicalNSW;

  // Load existing index if available
  if (existsSync(indexPath)) {
    try {
      console.log(`Loading existing vector index for project ${projectId}`);
      index = new HierarchicalNSW('cosine', dimension);
      index.readIndex(indexPath);

      // Load mapping
      const mapping = JSON.parse(readFileSync(mappingPath, 'utf-8'));
      chunkIdMappings.set(projectId, mapping);

      const stats = getIndexStats(index);
      console.log(`✓ Loaded index for project ${projectId}: ${stats.elementCount} vectors`);
    } catch (error) {
      console.error(`Failed to load existing index for project ${projectId}, creating new:`, error);
      index = new HierarchicalNSW('cosine', dimension);
      index.initIndex(INITIAL_MAX_ELEMENTS, M, EF_CONSTRUCTION);
      chunkIdMappings.set(projectId, {});
    }
  } else {
    // Create new index
    console.log(`Creating new vector index for project ${projectId}`);
    index = new HierarchicalNSW('cosine', dimension);
    index.initIndex(INITIAL_MAX_ELEMENTS, M, EF_CONSTRUCTION);
    chunkIdMappings.set(projectId, {});
  }

  activeIndexes.set(projectId, index);
  return index;
}

/**
 * Add single embedding to vector store
 */
export async function addEmbedding(
  projectId: string,
  chunkId: string,
  embedding: number[]
): Promise<void> {
  const index = await initializeProjectIndex(projectId);
  const mapping = chunkIdMappings.get(projectId) || {};

  if (mapping[chunkId] !== undefined) {
    console.warn(`Chunk ${chunkId} already exists in index, skipping`);
    return;
  }

  // Check if resize is needed
  const currentCount = index.getCurrentCount();
  const maxElements = index.getMaxElements();
  if (currentCount >= maxElements * RESIZE_THRESHOLD) {
    const newMaxElements = Math.max(maxElements * 2, currentCount + 1000);
    console.log(`Resizing index for project ${projectId} from ${maxElements} to ${newMaxElements}`);
    index.resizeIndex(newMaxElements);
  }

  const elementId = index.getCurrentCount();
  index.addPoint(embedding, elementId);

  mapping[chunkId] = elementId;
  chunkIdMappings.set(projectId, mapping);
}

/**
 * Add multiple embeddings to vector store in batch
 */
export async function addEmbeddingsBatch(
  projectId: string,
  items: Array<{ chunkId: string; embedding: number[] }>
): Promise<{ addedCount: number; skippedCount: number }> {
  if (!items || items.length === 0) {
    return { addedCount: 0, skippedCount: 0 };
  }

  const index = await initializeProjectIndex(projectId);
  const mapping = chunkIdMappings.get(projectId) || {};

  // Check if resize is needed upfront
  const currentCount = index.getCurrentCount();
  const maxElements = index.getMaxElements();
  const itemsToAdd = items.filter(item => mapping[item.chunkId] === undefined).length;
  if (currentCount + itemsToAdd > maxElements * RESIZE_THRESHOLD) {
    const newMaxElements = Math.max(maxElements * 2, currentCount + itemsToAdd + 1000);
    console.log(`Resizing index for project ${projectId} from ${maxElements} to ${newMaxElements}`);
    index.resizeIndex(newMaxElements);
  }

  let addedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    if (mapping[item.chunkId] !== undefined) {
      skippedCount++;
      continue;
    }

    const elementId = index.getCurrentCount();
    index.addPoint(item.embedding, elementId);
    mapping[item.chunkId] = elementId;
    addedCount++;
  }

  chunkIdMappings.set(projectId, mapping);

  if (addedCount > 0) {
    console.log(`Added ${addedCount} embeddings to vector index for project ${projectId}`);
  }

  return { addedCount, skippedCount };
}

/**
 * Search vector store for k nearest neighbors
 */
export async function search(
  projectId: string,
  queryEmbedding: number[],
  k: number = 5
): Promise<Array<{ chunkId: string; distance: number }>> {
  const index = await initializeProjectIndex(projectId);
  const mapping = chunkIdMappings.get(projectId) || {};
  const reverseMapping = Object.entries(mapping).reduce(
    (acc, [chunkId, elementId]) => {
      acc[elementId] = chunkId;
      return acc;
    },
    {} as Record<number, string>
  );

  // Ensure k doesn't exceed number of elements
  const searchK = Math.min(k, index.getCurrentCount());

  if (searchK === 0) {
    return [];
  }

  try {
    const result = index.searchKnn(queryEmbedding, searchK);

    return result.neighbors.map((elementId: number, idx: number) => ({
      chunkId: reverseMapping[elementId] || `unknown-${elementId}`,
      distance: result.distances[idx],
    }));
  } catch (error) {
    console.error(`Search failed for project ${projectId}:`, error);
    return [];
  }
}

/**
 * Save vector index to disk
 */
export async function saveIndex(projectId: string): Promise<void> {
  const index = activeIndexes.get(projectId);
  if (!index) {
    console.warn(`No active index found for project ${projectId}`);
    return;
  }

  const indexPath = getIndexPath(projectId);
  const mappingPath = getMappingPath(projectId);

  try {
    // Ensure directory exists
    if (!existsSync(VECTOR_INDEX_PATH)) {
      mkdirSync(VECTOR_INDEX_PATH, { recursive: true });
    }

    // Save index
    index.writeIndex(indexPath);

    // Save mapping
    const mapping = chunkIdMappings.get(projectId) || {};
    writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));

    console.log(`✓ Saved vector index for project ${projectId} to ${indexPath}`);
  } catch (error) {
    console.error(`Failed to save vector index for project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Load vector index from disk
 */
export async function loadIndex(projectId: string): Promise<HierarchicalNSW | null> {
  return initializeProjectIndex(projectId);
}

/**
 * Get index statistics
 */
export function getIndexStats(index: HierarchicalNSW): VectorStoreIndex {
  return {
    projectId: 'unknown',
    dimension: getEmbeddingDimension(),
    space: 'cosine',
    M,
    efConstruction: EF_CONSTRUCTION,
    elementCount: index.getCurrentCount(),
  };
}

/**
 * Get statistics for a project's index
 */
export async function getProjectIndexStats(projectId: string): Promise<VectorStoreIndex> {
  const index = await initializeProjectIndex(projectId);
  return {
    projectId,
    dimension: getEmbeddingDimension(),
    space: 'cosine',
    M,
    efConstruction: EF_CONSTRUCTION,
    elementCount: index.getCurrentCount(),
  };
}

/**
 * Rebuild entire vector index for a project from chunks
 */
export async function rebuildProjectIndex(projectId: string, chunks: Array<{ id: string; embedding: number[] }>): Promise<void> {
  // Prevent concurrent rebuilds
  if (processingLocks.has(projectId)) {
    throw new Error(`Index rebuild already in progress for project ${projectId}`);
  }

  processingLocks.add(projectId);

  try {
    // Remove old index
    activeIndexes.delete(projectId);
    chunkIdMappings.delete(projectId);

    // Create new index
    const index = await initializeProjectIndex(projectId);

    // Add all chunks
    for (const chunk of chunks) {
      await addEmbedding(projectId, chunk.id, chunk.embedding);
    }

    // Save to disk
    await saveIndex(projectId);

    console.log(`✓ Rebuilt vector index for project ${projectId} with ${chunks.length} vectors`);
  } finally {
    processingLocks.delete(projectId);
  }
}

/**
 * Check if index rebuild is in progress
 */
export function isIndexRebuildInProgress(projectId: string): boolean {
  return processingLocks.has(projectId);
}

/**
 * Clear all indexes from memory (use before shutdown)
 */
export async function clearAllIndexes(): Promise<void> {
  console.log('Clearing all vector indexes from memory...');

  // Save all indexes first
  for (const projectId of activeIndexes.keys()) {
    try {
      await saveIndex(projectId);
    } catch (error) {
      console.error(`Failed to save index for project ${projectId}:`, error);
    }
  }

  activeIndexes.clear();
  chunkIdMappings.clear();
  processingLocks.clear();

  console.log('✓ All vector indexes cleared and saved');
}

/**
 * Get path for project index file
 */
function getIndexPath(projectId: string): string {
  return join(VECTOR_INDEX_PATH, `project-${projectId}.hnsw`);
}

/**
 * Get path for project mapping file
 */
function getMappingPath(projectId: string): string {
  return join(VECTOR_INDEX_PATH, `project-${projectId}.mapping.json`);
}
