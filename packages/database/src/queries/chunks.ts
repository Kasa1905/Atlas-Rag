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

export function getChunksWithoutEmbeddings(documentId: string): Chunk[] {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT c.* FROM chunks c
    LEFT JOIN embeddings e ON c.id = e.chunk_id
    WHERE c.document_id = ? AND e.id IS NULL
    ORDER BY c.chunk_index ASC
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

export function getChunksWithoutEmbeddingsByProject(projectId: string): Chunk[] {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT c.* FROM chunks c
    LEFT JOIN embeddings e ON c.id = e.chunk_id
    LEFT JOIN documents d ON c.document_id = d.id
    WHERE d.project_id = ? AND e.id IS NULL
    ORDER BY c.chunk_index ASC
  `);

  const rows = stmt.all(projectId) as any[];

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

export function countEmbeddingsByDocument(documentId: string): number {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM embeddings e
    LEFT JOIN chunks c ON e.chunk_id = c.id
    WHERE c.document_id = ?
  `);

  const result = stmt.get(documentId) as any;

  return result?.count || 0;
}

export function countEmbeddingsByProject(projectId: string): number {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM embeddings e
    LEFT JOIN chunks c ON e.chunk_id = c.id
    LEFT JOIN documents d ON c.document_id = d.id
    WHERE d.project_id = ?
  `);

  const result = stmt.get(projectId) as any;

  return result?.count || 0;
}

export function countChunksByProject(projectId: string): number {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM chunks c
    LEFT JOIN documents d ON c.document_id = d.id
    WHERE d.project_id = ?
  `);

  const result = stmt.get(projectId) as any;

  return result?.count || 0;
}

export function countChunksWithoutEmbeddingsByProject(projectId: string): number {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM chunks c
    LEFT JOIN embeddings e ON c.id = e.chunk_id
    LEFT JOIN documents d ON c.document_id = d.id
    WHERE d.project_id = ? AND e.id IS NULL
  `);

  const result = stmt.get(projectId) as any;

  return result?.count || 0;
}

export function getAllEmbeddingsByProject(projectId: string): Array<{ chunkId: string; embedding: number[] }> {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT e.chunk_id, e.embedding FROM embeddings e
    LEFT JOIN chunks c ON e.chunk_id = c.id
    LEFT JOIN documents d ON c.document_id = d.id
    WHERE d.project_id = ?
  `);

  const rows = stmt.all(projectId) as any[];

  return rows.map((row) => {
    const buffer = row.embedding as Buffer;
    const embedding = Array.from(new Float32Array(buffer.buffer));

    return {
      chunkId: row.chunk_id,
      embedding,
    };
  });
}

export function deleteEmbeddingsByDocument(documentId: string): boolean {
  const db = getDatabase();

  const stmt = db.prepare(`
    DELETE FROM embeddings WHERE chunk_id IN (
      SELECT id FROM chunks WHERE document_id = ?
    )
  `);

  const result = stmt.run(documentId);

  return result.changes > 0;
}