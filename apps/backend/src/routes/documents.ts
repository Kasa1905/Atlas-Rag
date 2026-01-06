import { Router } from 'express';
import type { Request, Response } from 'express';
import * as documentService from '../services/documentService';
import type { CreateDocumentInput, UpdateDocumentInput } from '@atlas/shared';

const router = Router();

// GET /api/documents?projectId=xxx - List documents by project
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.query.projectId as string;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId is required' });
    }
    const documents = documentService.getDocumentsByProject(projectId);
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch documents' });
  }
});

// GET /api/documents/:id - Get single document
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const document = documentService.getDocumentById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch document' });
  }
});

// POST /api/documents - Create new document
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: CreateDocumentInput = req.body;
    const document = documentService.createNewDocument(input);
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create document' });
  }
});

// PATCH /api/documents/:id - Update document
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const input: UpdateDocumentInput = req.body;
    const document = documentService.updateExistingDocument(req.params.id, input);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update document' });
  }
});

// DELETE /api/documents/:id - Delete document
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = documentService.deleteExistingDocument(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete document' });
  }
});

export default router;
