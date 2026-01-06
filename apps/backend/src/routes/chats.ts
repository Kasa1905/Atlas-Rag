import { Router } from 'express';
import type { Request, Response } from 'express';
import * as chatService from '../services/chatService';
import type {
  CreateChatInput,
  CreateMessageInput,
  UpdateChatInput,
} from '@atlas/shared';

const router = Router();

// GET /api/chats?projectId=xxx - List chats by project
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.query.projectId as string;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId is required' });
    }
    const chats = chatService.getChatsByProject(projectId);
    res.json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch chats' });
  }
});

// GET /api/chats/:id - Get single chat
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const chat = chatService.getChatById(req.params.id);
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    res.json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch chat' });
  }
});

// POST /api/chats - Create new chat
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: CreateChatInput = req.body;
    const chat = chatService.createNewChat(input);
    res.status(201).json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create chat' });
  }
});

// PATCH /api/chats/:id - Update chat
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const input: UpdateChatInput = req.body;
    const chat = chatService.updateExistingChat(req.params.id, input);
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    res.json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update chat' });
  }
});

// DELETE /api/chats/:id - Delete chat
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = chatService.deleteExistingChat(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete chat' });
  }
});

// GET /api/chats/:id/messages - Get messages for a chat
router.get('/:id/messages', async (req: Request, res: Response) => {
  try {
    const messages = chatService.getMessagesByChatId(req.params.id);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// POST /api/chats/:id/messages - Add message to chat
router.post('/:id/messages', async (req: Request, res: Response) => {
  try {
    const input: CreateMessageInput = {
      ...req.body,
      chatId: req.params.id,
    };
    const message = chatService.createNewMessage(input);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create message' });
  }
});

export default router;
