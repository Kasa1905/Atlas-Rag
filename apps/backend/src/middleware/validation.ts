import type { Request, Response, NextFunction } from 'express';
import { extname } from 'path';
import { SUPPORTED_EXTENSIONS } from '../services/parserService';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const file = req.file;

  if (!file) {
    res.status(400).json({
      success: false,
      error: 'No file uploaded',
    });
    return;
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    res.status(400).json({
      success: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    });
    return;
  }

  // Validate file extension
  const ext = extname(file.originalname).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    res.status(400).json({
      success: false,
      error: `Unsupported file type. Supported types: ${SUPPORTED_EXTENSIONS.join(', ')}`,
    });
    return;
  }

  next();
}

/**
 * Validate chunk settings
 */
export function validateChunkSettings(
  chunkSize: number,
  chunkOverlap: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (chunkSize < 100 || chunkSize > 5000) {
    errors.push({
      field: 'chunkSize',
      message: 'Chunk size must be between 100 and 5000 characters',
    });
  }

  if (chunkOverlap < 0) {
    errors.push({
      field: 'chunkOverlap',
      message: 'Chunk overlap must be non-negative',
    });
  }

  if (chunkOverlap >= chunkSize) {
    errors.push({
      field: 'chunkOverlap',
      message: 'Chunk overlap must be less than chunk size',
    });
  }

  return errors;
}

/**
 * Validate project settings update
 */
export function validateProjectSettings(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { settings } = req.body;

  if (!settings) {
    next();
    return;
  }

  const errors: ValidationError[] = [];

  if (settings.chunkSize !== undefined || settings.chunkOverlap !== undefined) {
    const chunkSize = settings.chunkSize || 1000;
    const chunkOverlap = settings.chunkOverlap || 200;
    errors.push(...validateChunkSettings(chunkSize, chunkOverlap));
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors,
    });
    return;
  }

  next();
}
