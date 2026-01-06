import { readFile } from 'fs/promises';
import { extname } from 'path';
import pdf from 'pdf-parse';
import type { DocumentFileType } from '@atlas/shared';

export interface PDFParseResult {
  text: string;
  pageCount: number;
}

/**
 * Parse a PDF file and extract text content
 */
export async function parsePDF(filePath: string): Promise<PDFParseResult> {
  try {
    const dataBuffer = await readFile(filePath);
    const data = await pdf(dataBuffer);

    return {
      text: data.text,
      pageCount: data.numpages,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse a code/text file and return its content
 */
export async function parseCodeFile(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(
      `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Detect file type based on extension
 */
export function detectFileType(filePath: string): DocumentFileType {
  const ext = extname(filePath).toLowerCase();

  const typeMap: Record<string, DocumentFileType> = {
    '.pdf': 'pdf',
    '.ts': 'code',
    '.tsx': 'code',
    '.js': 'code',
    '.jsx': 'code',
    '.py': 'code',
    '.java': 'code',
    '.cpp': 'code',
    '.c': 'code',
    '.h': 'code',
    '.hpp': 'code',
    '.go': 'code',
    '.rs': 'code',
    '.md': 'markdown',
    '.txt': 'text',
    '.json': 'code',
    '.yaml': 'code',
    '.yml': 'code',
    '.xml': 'code',
    '.html': 'code',
    '.css': 'code',
    '.scss': 'code',
  };

  return typeMap[ext] || 'text';
}

/**
 * Supported file extensions for upload
 */
export const SUPPORTED_EXTENSIONS = [
  '.pdf',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.java',
  '.cpp',
  '.c',
  '.h',
  '.hpp',
  '.go',
  '.rs',
  '.md',
  '.txt',
  '.json',
  '.yaml',
  '.yml',
  '.xml',
  '.html',
  '.css',
  '.scss',
];

/**
 * Check if file type is supported
 */
export function isFileSupported(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}
