import { getDocument, updateDocument } from '@atlas/database';
import { getProject } from '@atlas/database';
import { createChunk, deleteChunksByDocument, deleteEmbeddingsByDocument } from '@atlas/database';
import { parsePDF, parseCodeFile } from './parserService';
import { chunkText, chunkCode } from '@atlas/shared';
import { generateEmbeddingsForDocument } from './embeddingService';
import type { ProjectSettings } from '@atlas/shared';

/**
 * Main entry point for document ingestion
 */
export async function ingestDocument(documentId: string): Promise<void> {
  try {
    console.log(`Starting ingestion for document: ${documentId}`);

    // Fetch document from database
    const document = getDocument(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Update status to processing
    updateDocument(documentId, { status: 'processing', errorMessage: undefined });

    // Fetch project settings
    const project = getProject(document.projectId);
    if (!project) {
      throw new Error(`Project not found: ${document.projectId}`);
    }

    const settings: ProjectSettings = project.settings || {
      chunkSize: 1000,
      chunkOverlap: 200,
      embeddingModel: 'nomic-embed-text',
      chatModel: 'llama2',
    };

    // Parse the file based on file type
    let textContent: string;
    let metadata: Record<string, any> = {};

    if (document.fileType === 'pdf') {
      console.log(`Parsing PDF: ${document.filePath}`);
      const pdfResult = await parsePDF(document.filePath);
      textContent = pdfResult.text;
      metadata.pageCount = pdfResult.pageCount;
    } else {
      console.log(`Parsing code/text file: ${document.filePath}`);
      textContent = await parseCodeFile(document.filePath);
    }

    if (!textContent || textContent.trim().length === 0) {
      throw new Error('No text content extracted from file');
    }

    console.log(`Extracted ${textContent.length} characters`);

    // Chunk the text
    const chunkOptions = {
      chunkSize: settings.chunkSize,
      chunkOverlap: settings.chunkOverlap,
      preserveWords: true,
    };

    const chunks =
      document.fileType === 'code'
        ? chunkCode(textContent, chunkOptions)
        : chunkText(textContent, chunkOptions);

    console.log(`Created ${chunks.length} chunks`);

    // Delete existing chunks and embeddings to avoid duplicates on re-ingestion
    const deletedCount = deleteChunksByDocument(document.id);
    deleteEmbeddingsByDocument(document.id);
    if (deletedCount) {
      console.log(`Deleted ${deletedCount} existing chunks for document ${document.id}`);
    }

    // Store chunks in database
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      createChunk({
        documentId: document.id,
        content: chunk.content,
        chunkIndex: i,
        startChar: chunk.startChar,
        endChar: chunk.endChar,
        metadata: {
          ...metadata,
          chunkSize: chunk.content.length,
        },
      });
    }

    // Update document status to completed
    metadata.chunkCount = chunks.length;
    updateDocument(documentId, { status: 'completed', metadata });

    console.log(`Successfully ingested document: ${documentId}`);

    // Trigger embedding generation asynchronously (non-blocking)
    console.log(`Triggering embedding generation for document: ${documentId}`);
    generateEmbeddingsForDocument(documentId).catch((error) => {
      console.error(`Embedding generation failed for document ${documentId}:`, error);
    });
  } catch (error) {
    console.error(`Failed to ingest document ${documentId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';


    // Update document status to failed
    updateDocument(documentId, { status: 'failed', errorMessage });

    throw error;
  }
}
