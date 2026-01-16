export interface Chat {
    id: string;
    projectId: string;
    title?: string;
    createdAt: number;
    updatedAt: number;
}
export interface Message {
    id: string;
    chatId: string;
    role: MessageRole;
    content: string;
    createdAt: number;
    references?: MessageReference[];
}
export type MessageRole = 'user' | 'assistant';
export interface MessageReference {
    id: string;
    messageId: string;
    chunkId: string;
    relevanceScore?: number;
    chunk?: {
        content: string;
        documentId: string;
        documentName?: string;
    };
}
export interface CreateChatInput {
    projectId: string;
    title?: string;
}
export interface CreateMessageInput {
    chatId: string;
    role: MessageRole;
    content: string;
}
export interface CreateMessageReferenceInput {
    messageId: string;
    chunkId: string;
    relevanceScore?: number;
}
export interface UpdateChatInput {
    title?: string;
}
//# sourceMappingURL=chat.d.ts.map