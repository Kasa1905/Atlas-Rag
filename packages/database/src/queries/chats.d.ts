import type { Chat, Message, MessageReference, CreateChatInput, CreateMessageInput, CreateMessageReferenceInput, UpdateChatInput } from '@atlas/shared';
export declare function createChat(input: CreateChatInput): Chat;
export declare function getChat(id: string): Chat | null;
export declare function listChatsByProject(projectId: string): Chat[];
export declare function updateChat(id: string, input: UpdateChatInput): Chat | null;
export declare function deleteChat(id: string): boolean;
export declare function createMessage(input: CreateMessageInput): Message;
export declare function getMessage(id: string): Message | null;
export declare function listMessagesByChat(chatId: string): Message[];
export declare function createMessageReference(input: CreateMessageReferenceInput): MessageReference;
export declare function getMessageReferences(messageId: string): MessageReference[];
//# sourceMappingURL=chats.d.ts.map