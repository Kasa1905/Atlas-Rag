import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { mkdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { generateId } from '@atlas/shared';
import { createNewDocument, ingestDocumentById } from '../services/documentService';
import { detectFileType } from '../services/parserService';
import { validateFileUpload } from '../middleware/validation';
import type { CreateDocumentInput } from '@atlas/shared';

const router = Router();

// Configure multer for file uploads
const UPLOAD_DIR = process.env.UPLOAD_DIR || './data/uploads';

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueId = generateId();
    const ext = extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// POST /api/upload - Upload a file
router.post(
  '/',
  upload.single('file'),
  validateFileUpload,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.body;
      const file = req.file;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'projectId is required',
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      // Create document record
      const filePath = join(UPLOAD_DIR, file.filename);
      const fileType = detectFileType(file.originalname);

      const documentInput: CreateDocumentInput = {
        projectId,
        name: file.originalname,
        filePath,
        fileType,
        fileSize: file.size,
      };

      const document = createNewDocument(documentInput);

      // Trigger ingestion asynchronously (don't await)
      ingestDocumentById(document.id);

      res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload file',
      });
    }
  }
);

export default router;
