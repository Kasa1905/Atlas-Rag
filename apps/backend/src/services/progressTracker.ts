interface ProgressData {
  total: number;
  completed: number;
  failed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
}

const progressMap = new Map<string, ProgressData>();
const CLEANUP_DELAY = 5 * 60 * 1000; // 5 minutes

/**
 * Start tracking progress for a document
 */
export function startTracking(documentId: string, totalChunks: number): void {
  progressMap.set(documentId, {
    total: totalChunks,
    completed: 0,
    failed: 0,
    status: 'pending',
    startTime: Date.now(),
  });

  console.log(`Progress tracking started for document ${documentId} (${totalChunks} chunks)`);
}

/**
 * Update progress
 */
export function updateProgress(
  documentId: string,
  completed?: number,
  failed?: number,
  status?: 'pending' | 'processing' | 'completed' | 'failed'
): void {
  const progress = progressMap.get(documentId);

  if (!progress) {
    console.warn(`No tracking data found for document ${documentId}`);
    return;
  }

  if (completed !== undefined) progress.completed = completed;
  if (failed !== undefined) progress.failed = failed;
  if (status) progress.status = status;

  // Mark as complete if all chunks processed
  if (progress.completed + progress.failed >= progress.total) {
    progress.status = progress.failed > 0 ? 'completed' : 'completed';
    progress.endTime = Date.now();

    // Schedule cleanup
    setTimeout(() => completeTracking(documentId), CLEANUP_DELAY);
  }
}

/**
 * Get current progress
 */
export function getProgress(documentId: string): ProgressData | null {
  return progressMap.get(documentId) || null;
}

/**
 * Complete tracking and cleanup
 */
export function completeTracking(documentId: string): void {
  progressMap.delete(documentId);
  console.log(`Progress tracking completed and cleaned up for document ${documentId}`);
}

/**
 * Get all active tracking documents
 */
export function getActiveDocuments(): string[] {
  return Array.from(progressMap.keys());
}

/**
 * Clear all tracking data
 */
export function clearAll(): void {
  progressMap.clear();
  console.log('All progress tracking data cleared');
}
