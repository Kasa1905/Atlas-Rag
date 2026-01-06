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

export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
  preserveWords?: boolean;
}

export interface TextChunk {
  content: string;
  startChar: number;
  endChar: number;
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
