// /**
//  * Chat API Service
//  * Real-time messaging between students and supervisors
//  * 
//  * BACKEND ROUTE: routes/chat.js
//  * BACKEND MODEL: models/Message.js, models/Conversation.js
//  */

// import client from './client';

// export interface ChatConversation {
//   _id: string;
//   participants: { _id: string; name: string; role: string; avatar?: string }[];
//   project: { _id: string; title: string };
//   lastMessage?: { text: string; sender: string; createdAt: string };
//   unreadCount: number;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface ChatMessage {
//   _id: string;
//   conversationId: string;
//   sender: { _id: string; name: string; role: string };
//   text: string;
//   type: 'text' | 'file' | 'system';
//   fileName?: string;
//   fileSize?: string;
//   fileUrl?: string;
//   read: boolean;
//   createdAt: string;
// }

// const chatAPI = {
//   /** GET /api/v1/chat/conversations */
//   getConversations: () =>
//     client.get<ChatConversation[]>('/v1/chat/conversations'),

//   /** GET /api/v1/chat/conversations/:id/messages?page=1&limit=50 */
//   getMessages: (conversationId: string, page = 1, limit = 50) =>
//     client.get<{ data: ChatMessage[]; total: number }>(
//       `/v1/chat/conversations/${conversationId}/messages`,
//       { params: { page, limit } }
//     ),

//   /** POST /api/v1/chat/conversations/:id/messages */
//   sendMessage: (conversationId: string, data: { text: string; type?: string }) =>
//     client.post<ChatMessage>(`/v1/chat/conversations/${conversationId}/messages`, data),

//   /** POST /api/v1/chat/conversations/:id/attachments (FormData) */
//   sendAttachment: (conversationId: string, formData: FormData) =>
//     client.post<ChatMessage>(`/v1/chat/conversations/${conversationId}/attachments`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     }),

//   /** Alias for sendAttachment */
//   uploadAttachment: (conversationId: string, formData: FormData) =>
//     client.post<ChatMessage>(`/v1/chat/conversations/${conversationId}/attachments`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     }),

//   /** PUT /api/v1/chat/conversations/:id/read */
//   markRead: (conversationId: string) =>
//     client.put(`/v1/chat/conversations/${conversationId}/read`),

//   /** GET /api/v1/chat/unread-count */
//   getUnreadCount: () =>
//     client.get<{ count: number }>('/v1/chat/unread-count'),

//   /** POST /api/v1/chat/conversations — create or get existing conversation */
//   createConversation: (data: { participantId: string; projectId: string }) =>
//     client.post<ChatConversation>('/v1/chat/conversations', data),
// };

// export default chatAPI;

// src/api/chat.ts
// ⚠️ Chat feature is not yet implemented in the backend.
// These are stubs that return empty data so the UI doesn't crash.
// Real implementation will be added in a future release.

const COMING_SOON = { status: "success", data: [], message: "Coming soon" };

const chatAPI = {
  getConversations: () => Promise.resolve({ data: COMING_SOON }),
  getMessages: () => Promise.resolve({ data: { ...COMING_SOON, total: 0 } }),
  sendMessage: () => Promise.resolve({ data: COMING_SOON }),
  sendAttachment: () => Promise.resolve({ data: COMING_SOON }),
  markRead: () => Promise.resolve({ data: COMING_SOON }),
  getUnreadCount: () => Promise.resolve({ data: { count: 0 } }),
  createConversation: () => Promise.resolve({ data: COMING_SOON }),
};

export default chatAPI;