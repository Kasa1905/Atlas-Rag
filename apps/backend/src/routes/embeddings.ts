import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  generateEmbeddingsForDocument,
  generateEmbeddingsForProject,
  rebuildVectorIndexFromDB,
  getEmbeddingProgress,
  isDocumentEmbeddingInProgress,
  getDocumentsWithPendingEmbeddings,
} from '../services/embeddingService';
import { getProjectIndexStats } from '../services/vectorStoreService';
import { getDocument, getProject } from '@atlas/database';
import { 
  countEmbeddingsByDocument, 
  countEmbeddingsByProject,
  countChunksByProject,
  countChunksWithoutEmbeddingsByProject 
} from '@atlas/database';

const router = Router();

// POST /api/embeddings/generate/:documentId - Manually trigger embedding generation
router.post('/generate/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const document = getDocument(documentId);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (isDocumentEmbeddingInProgress(documentId)) {
      return res.status(409).json({
        success: false,
        error: 'Embedding generation is already in progress for this document',
      });
    }

    // Trigger embedding generation (async, non-blocking)
    generateEmbeddingsForDocument(documentId).catch((error) => {
      console.error(`Embedding generation failed for document ${documentId}:`, error);
    });

    res.json({
      success: true,
      data: {
        documentId,
        message: 'Embedding generation started',
      },
    });
  } catch (error) {
    console.error('Error triggering embedding generation:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger embedding generation' });
  }
});

// GET /api/embeddings/status/:documentId - Get embedding progress for a document
router.get('/status/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const document = getDocument(documentId);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const { progress, percentage } = getEmbeddingProgress(documentId);
    const embeddedCount = countEmbeddingsByDocument(documentId);

    res.json({
      success: true,
      data: {
        documentId,
        inProgress: isDocumentEmbeddingInProgress(documentId),
        progress,
        percentage,
        embeddedCount,
      },
    });
  } catch (error) {
    console.error('Error fetching embedding status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch embedding status' });
  }
});

// POST /api/embeddings/rebuild/:projectId - Rebuild vector index for entire project
router.post('/rebuild/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = getProject(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Rebuild vector index from existing embeddings (async, non-blocking)
    rebuildVectorIndexFromDB(projectId).catch((error) => {
      console.error(`Vector index rebuild failed for project ${projectId}:`, error);
    });

    res.json({
      success: true,
      data: {
        projectId,
        message: 'Vector index rebuild started',
      },
    });
  } catch (error) {
    console.error('Error triggering index rebuild:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger index rebuild' });
  }
});

// GET /api/embeddings/stats/:projectId - Get embedding statistics
router.get('/stats/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = getProject(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const totalChunks = countChunksByProject(projectId);
    const embeddedChunks = countEmbeddingsByProject(projectId);
    const pendingChunks = countChunksWithoutEmbeddingsByProject(projectId);
    const pendingDocuments = getDocumentsWithPendingEmbeddings(projectId);

    let indexStats = null;
    try {
      indexStats = await getProjectIndexStats(projectId);
    } catch (error) {
      console.warn(`Failed to get index stats for project ${projectId}:`, error);
    }

    res.json({
      success: true,
      data: {
        projectId,
        totalChunks,
        embeddedChunks,
        pendingChunks,
        documentsWithPendingEmbeddings: pendingDocuments.length,
        indexSize: indexStats?.elementCount || 0,
        lastUpdated: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error fetching embedding stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch embedding stats' });
  }
});

export default router;
