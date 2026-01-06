import chokidar from 'chokidar';
import { join, basename } from 'path';
import { stat } from 'fs/promises';
import { generateId } from '@atlas/shared';
import {
  createNewDocument,
  getDocumentsByProject,
  updateExistingDocument,
  ingestDocumentById,
} from './documentService';
import { detectFileType, isFileSupported } from './parserService';
import type { FSWatcher } from 'chokidar';

interface WatcherState {
  watcher: FSWatcher;
  projectId: string;
  directoryPath: string;
}

// Map of active watchers by projectId
const activeWatchers = new Map<string, WatcherState>();

// Debounce timers for file changes, keyed by projectId + filePath for proper cleanup
const debounceTimers = new Map<string, Map<string, NodeJS.Timeout>>();

const DEBOUNCE_DELAY = 1000; // 1 second

/**
 * Start watching a directory for a project
 */
export function watchProjectDirectory(
  projectId: string,
  directoryPath: string
): void {
  // Stop existing watcher if any
  stopWatching(projectId);

  console.log(`Starting watcher for project ${projectId} at ${directoryPath}`);

  const watcher = chokidar.watch(directoryPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: false,
    depth: 10,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  });

  watcher
    .on('add', (filePath) => handleFileAdd(projectId, filePath))
    .on('change', (filePath) => handleFileChange(projectId, filePath))
    .on('error', (error) => {
      console.error(`Watcher error for project ${projectId}:`, error);
    });

  activeWatchers.set(projectId, {
    watcher,
    projectId,
    directoryPath,
  });
}

/**
 * Stop watching a project directory
 */
export async function stopWatching(projectId: string): Promise<void> {
  const state = activeWatchers.get(projectId);

  if (state) {
    console.log(`Stopping watcher for project ${projectId}`);
    await state.watcher.close();
    activeWatchers.delete(projectId);
  }

  // Clear all debounce timers for this project
  const projectTimers = debounceTimers.get(projectId);
  if (projectTimers) {
    projectTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    debounceTimers.delete(projectId);
  }
}

/**
 * Handle file addition
 */
async function handleFileAdd(projectId: string, filePath: string): Promise<void> {
  if (!isFileSupported(filePath)) {
    return;
  }

  debounce(projectId, filePath, async () => {
    try {
      console.log(`File added: ${filePath}`);

      const fileName = basename(filePath);
      const fileType = detectFileType(filePath);
      const stats = await stat(filePath);

      // Check if document already exists
      const existingDocs = getDocumentsByProject(projectId);
      const existingDoc = existingDocs.find((doc) => doc.filePath === filePath);

      if (existingDoc) {
        console.log(`Document already exists: ${existingDoc.id}`);
        return;
      }

      // Create new document
      const document = createNewDocument({
        projectId,
        name: fileName,
        filePath,
        fileType,
        fileSize: stats.size,
      });

      console.log(`Created document ${document.id} for ${fileName}`);

      // Trigger ingestion
      await ingestDocumentById(document.id);
    } catch (error) {
      console.error(`Error handling file add for ${filePath}:`, error);
    }
  });
}

/**
 * Handle file change
 */
async function handleFileChange(projectId: string, filePath: string): Promise<void> {
  if (!isFileSupported(filePath)) {
    return;
  }

  debounce(projectId, filePath, async () => {
    try {
      console.log(`File changed: ${filePath}`);

      const existingDocs = getDocumentsByProject(projectId);
      const existingDoc = existingDocs.find((doc) => doc.filePath === filePath);

      if (!existingDoc) {
        // File not tracked, treat as new file
        await handleFileAdd(projectId, filePath);
        return;
      }

      // Update document status and re-ingest
      updateExistingDocument(existingDoc.id, { status: 'pending' });

      console.log(`Re-ingesting document ${existingDoc.id}`);
      await ingestDocumentById(existingDoc.id);
    } catch (error) {
      console.error(`Error handling file change for ${filePath}:`, error);
    }
  });
}

/**
 * Debounce function calls to avoid processing rapid changes
 */
function debounce(
  projectId: string,
  filePath: string,
  fn: () => Promise<void>
): void {
  // Get or create the timer map for this project
  let projectTimers = debounceTimers.get(projectId);
  if (!projectTimers) {
    projectTimers = new Map();
    debounceTimers.set(projectId, projectTimers);
  }

  // Clear existing timer for this file path
  const existingTimer = projectTimers.get(filePath);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Set new debounce timer
  const timer = setTimeout(() => {
    fn();
    projectTimers?.delete(filePath);
  }, DEBOUNCE_DELAY);

  projectTimers.set(filePath, timer);
}

/**
 * Get all active watchers
 */
export function getActiveWatchers(): Map<string, WatcherState> {
  return activeWatchers;
}
