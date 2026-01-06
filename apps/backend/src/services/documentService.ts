import {
  createDocument,
  getDocument,
  listDocumentsByProject,
  updateDocument,
  deleteDocument,
  listChunksByDocument,
} from '@atlas/database';
import { ingestDocument as processIngestion } from './ingestionService';
import type {
  Document,
    Chunk,
  CreateDocumentInput,
  UpdateDocumentInput,
} from '@atlas/shared';

export function getDocumentsByProject(projectId: string): Document[] {
  return listDocumentsByProject(projectId);
}

export function getDocumentById(id: string): Document | null {
  return getDocument(id);
}

export function createNewDocument(input: CreateDocumentInput): Document {
  return createDocument(input);
}

export function updateExistingDocument(
  id: string,
  input: UpdateDocumentInput
): Document | null {
  return updateDocument(id, input);
}

export function deleteExistingDocument(id: string): boolean {
  return deleteDocument(id);
}

/**
 * Trigger document ingestion asynchronously
 */
export async function ingestDocumentById(id: string): Promise<void> {
  // Run ingestion asynchronously without blocking
  processIngestion(id).catch((error) => {
    console.error(`Ingestion failed for document ${id}:`, error);
  });
}

/**
 * Get all chunks for a document
 */
export function getDocumentChunks(documentId: string): Chunk[] {
  return listChunksByDocument(documentId);
}
