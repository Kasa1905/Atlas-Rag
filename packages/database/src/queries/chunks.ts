import { getDatabase } from '../db';
import type {
  Chunk,
  Embedding,
  CreateChunkInput,
  CreateEmbeddingInput,
} from '@atlas/shared';
import { generateId, timestamp } from '@atlas/shared';

export function createChunk(input: CreateChunkInput): Chunk {
  const db = getDatabase();
  const id = generateId();
  const now = timestamp();

  const stmt = db.prepare(`
    INSERT INTO chunks (id, document_id, content, chunk_index, start_char, end_char, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    input.documentId,
    input.content,
    input.chunkIndex,
    input.startChar || null,
    input.endChar || null,
    input.metadata ? JSON.stringify(input.metadata) : null,
    now
  );

  return {
    id,
    documentId: input.documentId,
    content: input.content,
    chunkIndex: input.chunkIndex,
    startChar: input.startChar,
    endChar: input.endChar,
    metadata: input.metadata,
    createdAt: now,
  };
}

export function getChunk(id: string): Chunk | null {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM chunks WHERE id = ?
  `);

  const row = stmt.get(id) as any;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    documentId: row.document_id,
    content: row.content,
    chunkIndex: row.chunk_index,
    startChar: row.start_char,
    endChar: row.end_char,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    createdAt: row.created_at,
  };
}

export function listChunksByDocument(documentId: string): Chunk[] {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM chunks WHERE document_id = ? ORDER BY chunk_index ASC
  `);

  const rows = stmt.all(documentId) as any[];

  return rows.map((row) => ({
    id: row.id,
    documentId: row.document_id,
    content: row.content,
    chunkIndex: row.chunk_index,
    startChar: row.start_char,
    endChar: row.end_char,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    createdAt: row.created_at,
  }));
}

export function createEmbedding(input: CreateEmbeddingInput): Embedding {
  const db = getDatabase();
  const id = generateId();
  const now = timestamp();

  // Serialize embedding as binary blob
  const buffer = Buffer.from(new Float32Array(input.embedding).buffer);

  const stmt = db.prepare(`
    INSERT INTO embeddings (id, chunk_id, embedding, model, dimension, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, input.chunkId, buffer, input.model, input.dimension, now);

  return {
    id,
    chunkId: input.chunkId,
    embedding: input.embedding,
    model: input.model,
    dimension: input.dimension,
    createdAt: now,
  };
}

export function getEmbeddingByChunk(chunkId: string): Embedding | null {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM embeddings WHERE chunk_id = ?
  `);

  const row = stmt.get(chunkId) as any;

  if (!row) {
    return null;
  }

  // Deserialize embedding from blob
  const buffer = row.embedding as Buffer;
  const embedding = Array.from(new Float32Array(buffer.buffer));

  return {
    id: row.id,
    chunkId: row.chunk_id,
    embedding,
    model: row.model,
    dimension: row.dimension,
    createdAt: row.created_at,
  };
}

export function deleteChunk(id: string): boolean {
  const db = getDatabase();

  const stmt = db.prepare(`
    DELETE FROM chunks WHERE id = ?
  `);

  const result = stmt.run(id);

  return result.changes > 0;
}

export function deleteChunksByDocument(documentId: string): boolean {
  const db = getDatabase();

  const stmt = db.prepare(`
    DELETE FROM chunks WHERE document_id = ?
  `);

  const result = stmt.run(documentId);

  return result.changes > 0;
}
