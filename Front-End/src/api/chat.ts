/**
 * Chat API Service
 * Real-time messaging between students and professors
 * 
 * BACKEND ROUTE: routes/chat.js
 * BACKEND MODEL: models/Message.js, models/Conversation.js
 */

import client from './client';

export interface ChatConversation {
  _id: string;
  participants: { _id: string; name: string; role: string; avatar?: string }[];
  project: { _id: string; title: string };
  lastMessage?: { text: string; sender: string; createdAt: string };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  sender: { _id: string; name: string; role: string };
  text: string;
  type: 'text' | 'file' | 'system';
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  read: boolean;
  createdAt: string;
}

const chatAPI = {
  /** GET /api/chat/conversations */
  getConversations: () =>
    client.get<ChatConversation[]>('/chat/conversations'),

  /** GET /api/chat/conversations/:id/messages?page=1&limit=50 */
  getMessages: (conversationId: string, page = 1, limit = 50) =>
    client.get<{ data: ChatMessage[]; total: number }>(
      `/chat/conversations/${conversationId}/messages`,
      { params: { page, limit } }
    ),

  /** POST /api/chat/conversations/:id/messages */
  sendMessage: (conversationId: string, data: { text: string; type?: string }) =>
    client.post<ChatMessage>(`/chat/conversations/${conversationId}/messages`, data),

  /** POST /api/chat/conversations/:id/attachments (FormData) */
  sendAttachment: (conversationId: string, formData: FormData) =>
    client.post<ChatMessage>(`/chat/conversations/${conversationId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** PUT /api/chat/conversations/:id/read */
  markRead: (conversationId: string) =>
    client.put(`/chat/conversations/${conversationId}/read`),

  /** GET /api/chat/unread-count */
  getUnreadCount: () =>
    client.get<{ count: number }>('/chat/unread-count'),

  /** POST /api/chat/conversations — create or get existing conversation */
  createConversation: (data: { participantId: string; projectId: string }) =>
    client.post<ChatConversation>('/chat/conversations', data),
};

export default chatAPI;
