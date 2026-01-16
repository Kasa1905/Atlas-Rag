/**
 * Generate a unique ID
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * Get current timestamp in milliseconds
 */
export function timestamp() {
    return Date.now();
}
/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
/**
 * Format timestamp to date string
 */
export function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString();
}
/**
 * Format timestamp to datetime string
 */
export function formatDateTime(timestamp) {
    return new Date(timestamp).toLocaleString();
}
export * from './chunking';
//# sourceMappingURL=index.js.map