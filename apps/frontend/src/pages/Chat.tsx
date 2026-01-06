import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Chat } from '@atlas/shared';

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { currentChat, messages, setCurrentChat, setMessages, setLoading, isLoading } =
    useChatStore();

  useEffect(() => {
    if (id) {
      loadChat(id);
      loadMessages(id);
    }
  }, [id]);

  const loadChat = async (chatId: string) => {
    setLoading(true);
    const response = await api.get<Chat>(`/api/chats/${chatId}`);
    if (response.success && response.data) {
      setCurrentChat(response.data);
    }
    setLoading(false);
  };

  const loadMessages = async (chatId: string) => {
    const response = await api.get<any[]>(`/api/chats/${chatId}/messages`);
    if (response.success && response.data) {
      setMessages(response.data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  if (!currentChat) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chat not found</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div className="mb-4">
        <Link to="/projects" className="text-blue-600 hover:underline">
          ← Back to Projects
        </Link>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle>
            {currentChat.title || 'Chat'}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.references && message.references.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <p className="text-xs opacity-75">
                        {message.references.length} source(s)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>

        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
            />
            <Button size="icon">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
