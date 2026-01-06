import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Chat, Message } from '@atlas/shared';

interface ChatStore {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  setChats: (chats: Chat[]) => void;
  setCurrentChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  addChat: (chat: Chat) => void;
  updateChat: (id: string, updates: Partial<Chat>) => void;
  removeChat: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatStore>()(
  devtools(
    (set) => ({
      chats: [],
      currentChat: null,
      messages: [],
      isLoading: false,
      error: null,

      setChats: (chats) => set({ chats }),
      
      setCurrentChat: (chat) => set({ currentChat: chat, messages: [] }),
      
      setMessages: (messages) => set({ messages }),
      
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      
      addChat: (chat) =>
        set((state) => ({ chats: [chat, ...state.chats] })),
      
      updateChat: (id, updates) =>
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
          currentChat:
            state.currentChat?.id === id
              ? { ...state.currentChat, ...updates }
              : state.currentChat,
        })),
      
      removeChat: (id) =>
        set((state) => ({
          chats: state.chats.filter((c) => c.id !== id),
          currentChat:
            state.currentChat?.id === id ? null : state.currentChat,
        })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
    }),
    { name: 'chat-store' }
  )
);
