import { getDatabase } from '../db';
import { generateId, timestamp } from '@atlas/shared';
export function createProject(input) {
    const db = getDatabase();
    const id = generateId();
    const now = timestamp();
    const defaultSettings = {
        chunkSize: 1000,
        chunkOverlap: 200,
        embeddingModel: 'nomic-embed-text',
        chatModel: 'llama2',
    };
    const settings = { ...defaultSettings, ...input.settings };
    const stmt = db.prepare(`
    INSERT INTO projects (id, name, description, created_at, updated_at, settings)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    stmt.run(id, input.name, input.description || null, now, now, JSON.stringify(settings));
    return {
        id,
        name: input.name,
        description: input.description,
        createdAt: now,
        updatedAt: now,
        settings,
    };
}
export function getProject(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
    SELECT * FROM projects WHERE id = ?
  `);
    const row = stmt.get(id);
    if (!row) {
        return null;
    }
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        settings: row.settings ? JSON.parse(row.settings) : undefined,
    };
}
export function listProjects() {
    const db = getDatabase();
    const stmt = db.prepare(`
    SELECT * FROM projects ORDER BY updated_at DESC
  `);
    const rows = stmt.all();
    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        settings: row.settings ? JSON.parse(row.settings) : undefined,
    }));
}
export function updateProject(id, input) {
    const db = getDatabase();
    const now = timestamp();
    const project = getProject(id);
    if (!project) {
        return null;
    }
    const updates = [];
    const values = [];
    if (input.name !== undefined) {
        updates.push('name = ?');
        values.push(input.name);
    }
    if (input.description !== undefined) {
        updates.push('description = ?');
        values.push(input.description);
    }
    if (input.settings !== undefined) {
        const newSettings = { ...project.settings, ...input.settings };
        updates.push('settings = ?');
        values.push(JSON.stringify(newSettings));
    }
    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);
    const stmt = db.prepare(`
    UPDATE projects SET ${updates.join(', ')} WHERE id = ?
  `);
    stmt.run(...values);
    return getProject(id);
}
export function deleteProject(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
    DELETE FROM projects WHERE id = ?
  `);
    const result = stmt.run(id);
    return result.changes > 0;
}
//# sourceMappingURL=projects.js.map