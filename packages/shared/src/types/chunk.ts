export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  startChar?: number;
  endChar?: number;
  metadata?: ChunkMetadata;
  createdAt: number;
}

export interface ChunkMetadata {
  pageNumber?: number;
  section?: string;
  [key: string]: any;
}

export interface Embedding {
  id: string;
  chunkId: string;
  embedding: number[];
  model: string;
  dimension: number;
  createdAt: number;
}

export interface CreateChunkInput {
  documentId: string;
  content: string;
  chunkIndex: number;
  startChar?: number;
  endChar?: number;
  metadata?: ChunkMetadata;
}

export interface CreateEmbeddingInput {
  chunkId: string;
  embedding: number[];
  model: string;
  dimension: number;
}
export interface EmbeddingProgress {
  total: number;
  completed: number;
  failed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
}

export interface EmbeddingStats {
  projectId: string;
  totalChunks: number;
  embeddedChunks: number;
  pendingChunks: number;
  indexSize: number;
  lastUpdated: number;
}