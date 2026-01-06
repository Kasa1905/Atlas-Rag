import {
  createChat,
  getChat,
  listChatsByProject,
  updateChat,
  deleteChat,
  createMessage,
  listMessagesByChat,
  getMessageReferences,
} from '@atlas/database';
import type {
  Chat,
  Message,
  CreateChatInput,
  CreateMessageInput,
  UpdateChatInput,
} from '@atlas/shared';

export function getChatsByProject(projectId: string): Chat[] {
  return listChatsByProject(projectId);
}

export function getChatById(id: string): Chat | null {
  return getChat(id);
}

export function createNewChat(input: CreateChatInput): Chat {
  return createChat(input);
}

export function updateExistingChat(
  id: string,
  input: UpdateChatInput
): Chat | null {
  return updateChat(id, input);
}

export function deleteExistingChat(id: string): boolean {
  return deleteChat(id);
}

export function getMessagesByChatId(chatId: string): Message[] {
  const messages = listMessagesByChat(chatId);
  
  // Attach references to assistant messages
  return messages.map((message) => {
    if (message.role === 'assistant') {
      const references = getMessageReferences(message.id);
      return { ...message, references };
    }
    return message;
  });
}

export function createNewMessage(input: CreateMessageInput): Message {
  return createMessage(input);
}
