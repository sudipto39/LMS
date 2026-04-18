// /**
//  * ============================================
//  * API Service - Real Backend Data Only
//  * ============================================
//  * 
//  * This service fetches ALL data from the backend.
//  * NO mock data, NO fallbacks.
//  * 
//  * If the API fails, the error is propagated to the UI
//  * which should display an error state with retry option.
//  * 
//  * Usage:
//  *   import api from '@/services/apiService';
//  *   const projects = await api.projects.getMyProjects();
//  */

// import client from '../api/client';
// import authAPI from '../api/auth';
// import usersAPI from '../api/users';
// import projectsAPI from '../api/projects';
// import adminAPI from '../api/admin';
// import giteaAPI from '../api/gitea';
// import chatAPI from '../api/chat';

// // Re-export types for convenience
// export type { User, LoginResponse, RegisterPayload } from '../api/auth';
// export type { Project, Milestone, FeedbackComment, ProjectFile, ProgressUpdate } from '../api/projects';


// // ============================================
// // AUTH SERVICE
// // ============================================
// export const auth = {
//   /**
//    * Login with email and password
//    * POST /api/v1/auth/login
//    */
//   async login(email: string, password: string) {
//     const response = await authAPI.login({ email, password });
//     const data = response.data;
    
//     // Store tokens
//     if (data.token) {
//       localStorage.setItem('token', data.token);
//     }
//     if (data.refreshToken) {
//       localStorage.setItem('refreshToken', data.refreshToken);
//     }
    
//     // Return user info - handle both response formats
//     return {
//       token: data.token,
//       refreshToken: data.refreshToken,
//       user: data.user || data.data?.user
//     };
//   },

//   /**
//    * Register a new user
//    * POST /api/v1/auth/register
//    */
//   async register(data: {
//     fullName: string;
//     email: string;
//     password: string;
//     passwordConfirm: string;
//     phone: string;
//     university: string;
//     department: string;
//     session: string;
//     rollNumber: string;
//   }) {
//     const response = await authAPI.register(data);
//     return response.data;
//   },

//   /**
//    * Verify email with token/code
//    * POST /api/v1/auth/verify-email
//    */
//   async verifyEmail(token: string) {
//     const response = await authAPI.verifyEmail({ token });
//     return response.data;
//   },

//   /**
//    * Get current logged-in user from token
//    * GET /api/v1/users/me
//    */
//   async getCurrentUser() {
//     const response = await authAPI.getMe();
//     return response.data.data.user;
//   },

//   /**
//    * Logout and clear tokens
//    * POST /api/v1/auth/logout
//    */
//   async logout() {
//     const refreshToken = localStorage.getItem('refresh_token');
//     try {
//       await authAPI.logout(refreshToken || undefined);
//     } finally {
//       localStorage.removeItem('token');
//       localStorage.removeItem('refresh_token');
//     }
//   },

//   /**
//    * Request password reset email
//    * POST /api/v1/auth/forgot-password
//    */
//   async forgotPassword(email: string) {
//     const response = await authAPI.forgotPassword({ email });
//     return response.data;
//   },

//   /**
//    * Reset password with token
//    * PATCH /api/v1/auth/reset-password/:token
//    */
//   async resetPassword(token: string, password: string, passwordConfirm: string) {
//     const response = await authAPI.resetPassword(token, { password, passwordConfirm });
//     return response.data;
//   },

//   /**
//    * Refresh access token
//    * POST /api/v1/auth/refresh
//    */
//   async refreshToken() {
//     const refreshToken = localStorage.getItem('refresh_token');
//     if (!refreshToken) throw new Error('No refresh token');
    
//     const response = await authAPI.refresh(refreshToken);
//     const newToken = response.data.token;
//     localStorage.setItem('token', newToken);
//     return newToken;
//   }
// };

// // ============================================
// // USER SERVICE
// // ============================================
// export const users = {
//   /**
//    * Get current user profile
//    * GET /api/v1/users/me
//    */
//   async getProfile() {
//     const response = await usersAPI.getMe();
//     return response.data.data.user;
//   },

//   /**
//    * Update current user profile
//    * PATCH /api/v1/users/updateMe
//    */
//   async updateProfile(data: { fullName?: string; email?: string; phone?: string; department?: string }) {
//     const response = await usersAPI.updateMe(data);
//     return response.data.data.user;
//   },

//   /**
//    * Change password
//    * PATCH /api/v1/users/change-password
//    */
//   async changePassword(currentPassword: string, newPassword: string, passwordConfirm: string) {
//     const response = await usersAPI.changePassword(currentPassword, newPassword, passwordConfirm);
//     return response.data;
//   },

//   /**
//    * Get all users (admin only)
//    * GET /api/v1/users/getAllUsers
//    */
//   async getAllUsers(filters?: { role?: string; search?: string; page?: number; limit?: number }) {
//     const response = await usersAPI.getAllUsers(filters);
//     return response.data.data; // Array of users
//   },

//   /**
//    * Get user by ID (admin only)
//    * GET /api/v1/users/:id
//    */
//   async getUserById(id: string) {
//     const response = await usersAPI.getById(id);
//     return response.data.data.user;
//   },

//   /**
//    * Create new user (admin only)
//    * POST /api/v1/users
//    */
//   async createUser(data: {
//     fullName: string;
//     email: string;
//     password: string;
//     role: 'student' | 'supervisor' | 'admin';
//     phone?: string;
//     department?: string;
//   }) {
//     const response = await usersAPI.create(data);
//     return response.data.data.user;
//   },

//   /**
//    * Update user by ID (admin only)
//    * PATCH /api/v1/users/:id
//    */
//   async updateUser(id: string, data: { fullName?: string; email?: string; role?: 'student' | 'supervisor' | 'admin'; isActive?: boolean }) {
//     const response = await usersAPI.update(id, data);
//     return response.data.data.user;
//   },

//   /**
//    * Delete user (admin only)
//    * DELETE /api/v1/users/:id
//    */
//   async deleteUser(id: string) {
//     const response = await usersAPI.delete(id);
//     return response.data;
//   },

//   /**
//    * Bulk import users from CSV (admin only)
//    * POST /api/v1/users/bulk-import
//    */
//   async bulkImport(file: File) {
//     const formData = new FormData();
//     formData.append('file', file);
//     const response = await usersAPI.bulkImport(formData);
//     return response.data;
//   },

//   /**
//    * Get list of supervisors (for dropdowns)
//    * GET /api/v1/users/supervisors
//    */
//   async getSupervisors() {
//     const response = await usersAPI.getSupervisors();
//     return response.data.data;
//   },

//   /**
//    * Get list of students (admin only)
//    * GET /api/v1/users/students
//    */
//   async getStudents(filters?: { session?: string; department?: string }) {
//     const response = await usersAPI.getStudents(filters);
//     return response.data.data;
//   }
// };

// // ============================================
// // PROJECT SERVICE
// // ============================================
// export const projects = {
//   /**
//    * Get current student's projects
//    * GET /api/v1/projects/me
//    */
//   async getMyProjects() {
//     const response = await projectsAPI.getMyProjects();
//     return response.data.data; // Array of projects
//   },

//   /**
//    * Get projects supervised by current supervisor
//    * GET /api/v1/projects/supervised
//    */
//   async getSupervisedProjects() {
//     const response = await projectsAPI.getSupervisedProjects();
//     return response.data.data; // Array of projects
//   },

//   /**
//    * Get single project by ID
//    * GET /api/v1/projects/:id
//    */
//   async getById(id: string) {
//     const response = await projectsAPI.getById(id);
//     return response.data.data.project;
//   },

//   /**
//    * Create new project
//    * POST /api/v1/projects
//    */
//   async create(data: {
//     title: string;
//     description: string;
//     batch: string;
//     course: string;
//     supervisorId: string;
//     techStack: string[];
//     teamMemberIds?: string[];
//     repoOption: 'create_new' | 'link_existing';
//     existingRepoUrl?: string;
//   }) {
//     const response = await projectsAPI.create(data);
//     return response.data.data.project;
//   },

//   /**
//    * Update project
//    * PATCH /api/v1/projects/:id
//    */
//   async update(id: string, data: { title?: string; description?: string; techStack?: string[] }) {
//     const response = await projectsAPI.update(id, data);
//     return response.data.data.project;
//   },

//   /**
//    * Update project progress
//    * POST /api/v1/projects/:id/progress
//    */
//   async updateProgress(id: string, percentage: number, note?: string) {
//     const response = await projectsAPI.updateProgress(id, { percentage, note });
//     return response.data;
//   },

//   /**
//    * Submit project for final review
//    * POST /api/v1/projects/:id/submit
//    */
//   async submitForReview(id: string) {
//     const response = await projectsAPI.submitFinal(id);
//     return response.data.data.project;
//   },

//   /**
//    * Approve project (supervisor only)
//    * POST /api/v1/projects/:id/approve
//    */
//   async approve(id: string, grade?: string, comment?: string) {
//     const response = await projectsAPI.approve(id, { grade, comment });
//     return response.data.data.project;
//   },

//   /**
//    * Reject project (supervisor only)
//    * POST /api/v1/projects/:id/reject
//    */
//   async reject(id: string, comment: string) {
//     const response = await projectsAPI.reject(id, comment);
//     return response.data.data.project;
//   },

//   /**
//    * Get progress history
//    * GET /api/v1/projects/:id/progress
//    */
//   async getProgress(id: string) {
//     const response = await projectsAPI.getProgress(id);
//     return response.data.data;
//   },

//   /**
//    * Download project as ZIP
//    * GET /api/v1/projects/:id/download-zip
//    */
//   async downloadZip(id: string) {
//     const response = await projectsAPI.downloadZip(id);
//     return response.data;
//   }
// };

// // ============================================
// // MILESTONE SERVICE
// // ============================================
// export const milestones = {
//   /**
//    * Get milestones for a project
//    * GET /api/v1/projects/:projectId/milestones
//    */
//   async getByProject(projectId: string) {
//     const response = await projectsAPI.getMilestones(projectId);
//     return response.data.data; // Array of milestones
//   },

//   /**
//    * Create new milestone
//    * POST /api/v1/projects/:projectId/milestones
//    */
//   async create(projectId: string, data: { title: string; description?: string; dueDate: string; order?: number }) {
//     const response = await projectsAPI.createMilestone(projectId, data);
//     return response.data.data.milestone;
//   },

//   /**
//    * Submit milestone for approval (student)
//    * PATCH /api/v1/milestones/:id/submit
//    */
//   async submit(milestoneId: string, notes?: string) {
//     const response = await projectsAPI.submitMilestone(milestoneId, notes ? { notes } : undefined);
//     return response.data.data.milestone;
//   },

//   /**
//    * Approve milestone (supervisor)
//    * PATCH /api/v1/milestones/:id/approve
//    */
//   async approve(milestoneId: string, comment?: string) {
//     const response = await projectsAPI.approveMilestone(milestoneId, comment);
//     return response.data.data.milestone;
//   },

//   /**
//    * Reject milestone (supervisor)
//    * PATCH /api/v1/milestones/:id/reject
//    */
//   async reject(milestoneId: string, comment: string) {
//     const response = await projectsAPI.rejectMilestone(milestoneId, comment);
//     return response.data.data.milestone;
//   },

//   /**
//    * Get current user's submissions
//    * GET /api/v1/me/submissions
//    */
//   async getMySubmissions() {
//     const response = await projectsAPI.getMySubmissions();
//     return response.data.data;
//   }
// };

// // ============================================
// // FEEDBACK SERVICE
// // ============================================
// export const feedback = {
//   /**
//    * Get feedback/comments for a project
//    * GET /api/v1/projects/:id/feedback
//    */
//   async getByProject(projectId: string) {
//     const response = await projectsAPI.getFeedback(projectId);
//     return response.data.data; // Array of feedback comments
//   },

//   /**
//    * Add feedback comment
//    * POST /api/v1/projects/:id/feedback
//    */
//   async add(projectId: string, content: string) {
//     const response = await projectsAPI.addFeedback(projectId, content);
//     return response.data.data.feedback;
//   }
// };

// // ============================================
// // FILE SERVICE
// // ============================================
// export const files = {
//   /**
//    * Get files for a project
//    * GET /api/v1/projects/:id/files
//    */
//   async getByProject(projectId: string) {
//     const response = await projectsAPI.getFiles(projectId);
//     return response.data.data; // Array of files
//   },

//   /**
//    * Upload file to project
//    * POST /api/v1/projects/:id/files
//    */
//   async upload(projectId: string, file: File) {
//     const formData = new FormData();
//     formData.append('file', file);
//     const response = await projectsAPI.uploadFile(projectId, formData);
//     return response.data.data.file;
//   },

//   /**
//    * Delete file
//    * DELETE /api/v1/projects/:id/files/:fileId
//    */
//   async delete(projectId: string, fileId: string) {
//     const response = await projectsAPI.deleteFile(projectId, fileId);
//     return response.data;
//   }
// };

// // ============================================
// // ACTIVITY SERVICE
// // ============================================
// export const activity = {
//   /**
//    * Get activity feed for current user
//    * GET /api/v1/activity
//    */
//   async getAll(filters?: { projectId?: string; type?: string; limit?: number }) {
//     const response = await client.get('/v1/activity', { params: filters });
//     return response.data.data; // Array of activities
//   },

//   /**
//    * Get push events / commits for a project
//    * GET /api/v1/projects/:id/push-events
//    */
//   async getPushEvents(projectId: string) {
//     const response = await client.get(`/v1/projects/${projectId}/push-events`);
//     return response.data.data;
//   }
// };

// // ============================================
// // ADMIN SERVICE
// // ============================================
// export const admin = {
//   /**
//    * Get dashboard stats
//    * GET /api/v1/admin/stats
//    */
//   async getStats() {
//     const response = await adminAPI.getDashboardStats();
//     return response.data;
//   },

//   /**
//    * Get all projects (admin view)
//    * GET /api/v1/admin/projects
//    */
//   async getAllProjects() {
//     const response = await adminAPI.getAllProjects();
//     return response.data.data; // Array of projects
//   },

//   /**
//    * Assign supervisor to project
//    * PATCH /api/v1/admin/projects/:id/assign-supervisor
//    */
//   async assignSupervisor(projectId: string, supervisorId: string) {
//     const response = await adminAPI.assignSupervisor(projectId, supervisorId);
//     return response.data;
//   },

//   /**
//    * Get all batches
//    * GET /api/v1/admin/batches
//    */
//   async getBatches() {
//     const response = await adminAPI.getBatches();
//     return response.data; // Array of batches
//   },

//   /**
//    * Create batch
//    * POST /api/v1/admin/batches
//    */
//   async createBatch(data: { name: string; year: number; courseId: string }) {
//     const response = await adminAPI.createBatch(data);
//     return response.data;
//   },

//   /**
//    * Update batch
//    * PATCH /api/v1/admin/batches/:id
//    */
//   async updateBatch(id: string, data: { name?: string; year?: number }) {
//     const response = await adminAPI.updateBatch(id, data);
//     return response.data;
//   },

//   /**
//    * Delete batch
//    * DELETE /api/v1/admin/batches/:id
//    */
//   async deleteBatch(id: string) {
//     const response = await adminAPI.deleteBatch(id);
//     return response.data;
//   },

//   /**
//    * Get courses
//    * GET /api/v1/admin/courses
//    */
//   async getCourses() {
//     const response = await adminAPI.getCourses();
//     return response.data; // Array of courses
//   },

//   /**
//    * Create course
//    * POST /api/v1/admin/courses
//    */
//   async createCourse(data: { name: string; code: string; department: string }) {
//     const response = await adminAPI.createCourse(data);
//     return response.data;
//   },

//   /**
//    * Get audit logs
//    * GET /api/v1/admin/audit-logs
//    */
//   async getAuditLogs(params?: { page?: number; limit?: number; action?: string }) {
//     const response = await adminAPI.getAuditLogs(params);
//     return response.data;
//   }
// };

// // ============================================
// // GITEA SERVICE
// // ============================================
// export const gitea = {
//   /**
//    * Get Gitea settings (admin only)
//    * GET /api/v1/admin/gitea/settings
//    */
//   async getSettings() {
//     const response = await giteaAPI.getSettings();
//     return response.data;
//   },

//   /**
//    * Update Gitea settings (admin only)
//    * PUT /api/v1/admin/gitea/settings
//    */
//   async updateSettings(data: {
//     baseUrl?: string;
//     adminToken?: string;
//     organizationName?: string;
//     webhookSecret?: string;
//   }) {
//     const response = await giteaAPI.updateSettings(data);
//     return response.data;
//   },

//   /**
//    * Test Gitea connection
//    * GET /api/v1/admin/gitea/test-connection
//    */
//   async testConnection() {
//     const response = await giteaAPI.testConnection();
//     return response.data;
//   },

//   /**
//    * Create repository for a project
//    * POST /api/v1/gitea/repos
//    */
//   async createRepo(data: { name: string; description: string; projectId: string }) {
//     const response = await giteaAPI.createRepo(data);
//     return response.data;
//   },

//   /**
//    * Get commits for a project repo
//    * GET /api/v1/gitea/:owner/:repo/commits
//    */
//   async getCommits(owner: string, repo: string, params?: { branch?: string; limit?: number }) {
//     const response = await giteaAPI.getCommits(owner, repo, params);
//     return response.data;
//   },

//   /**
//    * Get branches
//    * GET /api/v1/gitea/:owner/:repo/branches
//    */
//   async getBranches(owner: string, repo: string) {
//     const response = await giteaAPI.getBranches(owner, repo);
//     return response.data;
//   },

//   /**
//    * Setup webhook for a repo
//    * POST /api/v1/gitea/webhook/setup
//    */
//   async setupWebhook() {
//     const response = await giteaAPI.setupWebhook();
//     return response.data;
//   }
// };

// // ============================================
// // CHAT SERVICE
// // ============================================
// export const chat = {
//   /**
//    * Get all conversations for current user
//    * GET /api/v1/chat/conversations
//    */
//   async getConversations() {
//     const response = await chatAPI.getConversations();
//     return response.data; // Array of ChatConversation
//   },

//   /**
//    * Get messages for a conversation
//    * GET /api/v1/chat/conversations/:id/messages
//    */
//   async getMessages(conversationId: string, page = 1, limit = 50) {
//     const response = await chatAPI.getMessages(conversationId, page, limit);
//     return response.data.data; // Array of ChatMessage
//   },

//   /**
//    * Send a message
//    * POST /api/v1/chat/conversations/:id/messages
//    */
//   async sendMessage(conversationId: string, text: string, type: 'text' | 'file' = 'text') {
//     const response = await chatAPI.sendMessage(conversationId, { text, type });
//     return response.data; // ChatMessage
//   },

//   /**
//    * Mark conversation as read
//    * PUT /api/v1/chat/conversations/:id/read
//    */
//   async markAsRead(conversationId: string) {
//     const response = await chatAPI.markRead(conversationId);
//     return response.data;
//   },

//   /**
//    * Upload attachment in chat
//    * POST /api/v1/chat/conversations/:id/attachments
//    */
//   async uploadAttachment(conversationId: string, file: File) {
//     const formData = new FormData();
//     formData.append('file', file);
//     const response = await chatAPI.uploadAttachment(conversationId, formData);
//     return response.data; // ChatMessage
//   },

//   /**
//    * Get unread message count
//    * GET /api/v1/chat/unread-count
//    */
//   async getUnreadCount() {
//     const response = await chatAPI.getUnreadCount();
//     return response.data.count;
//   },

//   /**
//    * Create new conversation for a project
//    * POST /api/v1/chat/conversations
//    */
//   async createConversation(participantId: string, projectId: string) {
//     const response = await chatAPI.createConversation({ participantId, projectId });
//     return response.data; // ChatConversation
//   }
// };

// // ============================================
// // DEFAULT EXPORT
// // ============================================
// const api = {
//   auth,
//   users,
//   projects,
//   milestones,
//   feedback,
//   files,
//   activity,
//   admin,
//   gitea,
//   chat
// };

// export default api;
