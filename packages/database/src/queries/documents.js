import { getDatabase } from '../db';
import { generateId, timestamp } from '@atlas/shared';
export function createDocument(input) {
    const db = getDatabase();
    const id = generateId();
    const now = timestamp();
    const stmt = db.prepare(`
    INSERT INTO documents (id, project_id, name, file_path, file_type, file_size, status, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(id, input.projectId, input.name, input.filePath, input.fileType, input.fileSize || null, 'pending', now, now, input.metadata ? JSON.stringify(input.metadata) : null);
    return {
        id,
        projectId: input.projectId,
        name: input.name,
        filePath: input.filePath,
        fileType: input.fileType,
        fileSize: input.fileSize,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        metadata: input.metadata,
    };
}
export function getDocument(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
    SELECT * FROM documents WHERE id = ?
  `);
    const row = stmt.get(id);
    if (!row) {
        return null;
    }
    return {
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        filePath: row.file_path,
        fileType: row.file_type,
        fileSize: row.file_size,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        errorMessage: row.error_message || undefined,
    };
}
export function listDocumentsByProject(projectId) {
    const db = getDatabase();
    const stmt = db.prepare(`
    SELECT * FROM documents WHERE project_id = ? ORDER BY created_at DESC
  `);
    const rows = stmt.all(projectId);
    return rows.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        filePath: row.file_path,
        fileType: row.file_type,
        fileSize: row.file_size,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        errorMessage: row.error_message || undefined,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}
export function updateDocument(id, input) {
    const db = getDatabase();
    const now = timestamp();
    const updates = [];
    const values = [];
    if (input.name !== undefined) {
        updates.push('name = ?');
        values.push(input.name);
    }
    if (input.status !== undefined) {
        updates.push('status = ?');
        values.push(input.status);
        if (input.metadata !== undefined) {
            updates.push('metadata = ?');
            values.push(JSON.stringify(input.metadata));
        }
        if (input.errorMessage !== undefined) {
            updates.push('error_message = ?');
            values.push(input.errorMessage);
        }
    }
    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);
    const stmt = db.prepare(`
    UPDATE documents SET ${updates.join(', ')} WHERE id = ?
  `);
    stmt.run(...values);
    return getDocument(id);
}
export function deleteDocument(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
    DELETE FROM documents WHERE id = ?
  `);
    const result = stmt.run(id);
    return result.changes > 0;
}
//# sourceMappingURL=documents.js.map