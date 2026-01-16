import { getDatabase } from '../db';
import { generateId, timestamp } from '@atlas/shared';
export function createChat(input) {
    const db = getDatabase();
    const id = generateId();
    const now = timestamp();
    const stmt = db.prepare(`
    INSERT INTO chats (id, project_id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
    stmt.run(id, input.projectId, input.title || null, now, now);
    return {
        id,
        projectId: input.projectId,
        title: input.title,
        createdAt: now,
        updatedAt: now,
    };
}
export function getChat(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
    SELECT * FROM chats WHERE id = ?
  `);
    const row = stmt.get(id);
    if (!row) {
        return null;
    }
    return {
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export function listChatsByProject(projectId) {
    const db = getDatabase();
    const stmt = db.prepare(`
    SELECT * FROM chats WHERE project_id = ? ORDER BY updated_at DESC
  `);
    const rows = stmt.all(projectId);
    return rows.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}
export function updateChat(id, input) {
    const db = getDatabase();
    const now = timestamp();
    const stmt = db.prepare(`
    UPDATE chats SET title = ?, updated_at = ? WHERE id = ?
  `);
    stmt.run(input.title, now, id);
    return getChat(id);
}
export function deleteChat(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
    DELETE FROM chats WHERE id = ?
  `);
    const result = stmt.run(id);
    return result.changes > 0;
}
export function createMessage(input) {
    const db = getDatabase();
    const id = generateId();
    const now = timestamp();
    const stmt = db.prepare(`
    INSERT INTO messages (id, chat_id, role, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
    stmt.run(id, input.chatId, input.role, input.content, now);
    // Update chat's updated_at timestamp
    const updateChatStmt = db.prepare(`
    UPDATE chats SET updated_at = ? WHERE id = ?
  `);
    updateChatStmt.run(now, input.chatId);
    return {
        id,
        chatId: input.chatId,
        role: input.role,
        content: input.content,
        createdAt: now,
    };
}
export function getMessage(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
    SELECT * FROM messages WHERE id = ?
  `);
    const row = stmt.get(id);
    if (!row) {
        return null;
    }
    return {
        id: row.id,
        chatId: row.chat_id,
        role: row.role,
        content: row.content,
        createdAt: row.created_at,
    };
}
export function listMessagesByChat(chatId) {
    const db = getDatabase();
    const stmt = db.prepare(`
    SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC
  `);
    const rows = stmt.all(chatId);
    return rows.map((row) => ({
        id: row.id,
        chatId: row.chat_id,
        role: row.role,
        content: row.content,
        createdAt: row.created_at,
    }));
}
export function createMessageReference(input) {
    const db = getDatabase();
    const id = generateId();
    const stmt = db.prepare(`
    INSERT INTO message_references (id, message_id, chunk_id, relevance_score)
    VALUES (?, ?, ?, ?)
  `);
    stmt.run(id, input.messageId, input.chunkId, input.relevanceScore || null);
    return {
        id,
        messageId: input.messageId,
        chunkId: input.chunkId,
        relevanceScore: input.relevanceScore,
    };
}
export function getMessageReferences(messageId) {
    const db = getDatabase();
    const stmt = db.prepare(`
    SELECT mr.*, c.content, c.document_id, d.name as document_name
    FROM message_references mr
    JOIN chunks c ON mr.chunk_id = c.id
    JOIN documents d ON c.document_id = d.id
    WHERE mr.message_id = ?
    ORDER BY mr.relevance_score DESC
  `);
    const rows = stmt.all(messageId);
    return rows.map((row) => ({
        id: row.id,
        messageId: row.message_id,
        chunkId: row.chunk_id,
        relevanceScore: row.relevance_score,
        chunk: {
            content: row.content,
            documentId: row.document_id,
            documentName: row.document_name,
        },
    }));
}
//# sourceMappingURL=chats.js.map