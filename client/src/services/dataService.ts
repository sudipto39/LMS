/**
 * ============================================
 * Data Service Layer
 * ============================================
 * 
 * ⚠️  PRODUCTION MODE - NO MOCK DATA FALLBACKS
 * 
 * All methods call REAL API endpoints.
 * If the backend is not running, errors will be thrown.
 * 
 * To test: Make sure your backend server is running at VITE_API_BASE_URL
 * 
 * Backend URL is configured in .env file:
 *   VITE_API_BASE_URL=http://localhost:5000/api
 * 
 * ============================================
 */

import { projectsAPI, usersAPI, adminAPI, giteaAPI, authAPI } from '@/api';
import chatAPI from '@/api/chat';

// ─────────────────────────────────────────────────────────────
// ❌ MOCK DATA IMPORTS REMOVED - Using real API only
// ─────────────────────────────────────────────────────────────
// import { mockProjects, mockActivities, mockMilestones, mockUsers, mockComments } from '@/data';


// ─────────────────────────────────────────────────────────────
// Helper: Extract error message from API responses
// ─────────────────────────────────────────────────────────────
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    // Axios error with response
    if ('response' in error) {
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }
      if (axiosError.response?.status) {
        return `API Error (Status: ${axiosError.response.status})`;
      }
    }
    // Generic error with message
    if ('message' in error) {
      return (error as { message: string }).message;
    }
  }
  return 'An unexpected error occurred. Please check if the backend server is running.';
}


// ─────────────────────────────────────────────────────────────
// DATA SERVICE - All Real API Calls
// ─────────────────────────────────────────────────────────────
export const dataService = {

  // ═══════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════
  
  login: async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  register: async (data: { 
    fullName: string; 
    email: string; 
    password: string; 
    passwordConfirm: string;
    phone: string;
    university: string;
    department: string;
    session: string;
    rollNumber: string;
    role?: string; 
  }) => {
    try {
      const response = await authAPI.register({ 
        fullName: data.fullName, 
        email: data.email, 
        password: data.password, 
        passwordConfirm: data.passwordConfirm,
        phone: data.phone,
        university: data.university,
        department: data.department,
        session: data.session,
        rollNumber: data.rollNumber,
        role: (data.role || 'student') as 'student' | 'supervisor',
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  verifyEmail: async (token: string) => {
    try {
      const response = await authAPI.verifyEmail({ token });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await authAPI.forgotPassword({ email });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  resetPassword: async (token: string, password: string, passwordConfirm: string) => {
    try {
      const response = await authAPI.resetPassword(token, { password, passwordConfirm });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  logout: async () => {
    try {
      const response = await authAPI.logout();
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await authAPI.getMe();
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },


  // ═══════════════════════════════════════════════════════════
  // PROJECTS
  // ═══════════════════════════════════════════════════════════

  getProjects: async (filters?: { studentId?: string; supervisorId?: string; status?: string }) => {
    try {
      const response = await projectsAPI.getAll(filters);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getMyProjects: async () => {
    try {
      const response = await projectsAPI.getMyProjects();
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getSupervisedProjects: async () => {
    try {
      const response = await projectsAPI.getSupervisedProjects();
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getProject: async (id: string) => {
    try {
      const response = await projectsAPI.getById(id);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  createProject: async (data: { 
    courseId: string;
    title: string; 
    description: string; 
    batch: string; 
    course: string; 
    supervisorId: string; 
    techStack: string[]; 
    repoName?: string;
    repoOption: 'create_new' | 'link_existing'; 
    existingRepoUrl?: string 
  }) => {
    try {
      // Map supervisorId to supervisorId for API compatibility
      const payload = { ...data, supervisorId: data.supervisorId };
      const response = await projectsAPI.create(payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  updateProject: async (id: string, data: Record<string, unknown>) => {
    try {
      const response = await projectsAPI.update(id, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  submitProject: async (id: string) => {
    try {
      const response = await projectsAPI.submitFinal(id);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  approveProject: async (id: string, grade?: string, comment?: string) => {
    try {
      const response = await projectsAPI.approve(id, { grade, comment });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  rejectProject: async (id: string, comment: string) => {
    try {
      const response = await projectsAPI.reject(id, comment);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  updateProgress: async (projectId: string, percentage: number, note?: string) => {
    try {
      const response = await projectsAPI.updateProgress(projectId, { percentage, note });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },


  // ═══════════════════════════════════════════════════════════
  // MILESTONES
  // ═══════════════════════════════════════════════════════════

  getMilestones: async (projectId: string) => {
    try {
      const response = await projectsAPI.getMilestones(projectId);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  createMilestone: async (projectId: string, data: { title: string; description?: string; dueDate: string }) => {
    try {
      const response = await projectsAPI.createMilestone(projectId, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  completeMilestone: async (_projectId: string, milestoneId: string) => {
    try {
      const response = await projectsAPI.submitMilestone(milestoneId);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  approveMilestone: async (_projectId: string, milestoneId: string, comment?: string) => {
    try {
      const response = await projectsAPI.approveMilestone(milestoneId, comment);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  rejectMilestone: async (_projectId: string, milestoneId: string, comment: string) => {
    try {
      const response = await projectsAPI.rejectMilestone(milestoneId, comment);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getMySubmissions: async () => {
    try {
      const response = await projectsAPI.getMySubmissions();
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },


  // ═══════════════════════════════════════════════════════════
  // FEEDBACK
  // ═══════════════════════════════════════════════════════════

  getFeedback: async (projectId: string) => {
    try {
      const response = await projectsAPI.getFeedback(projectId);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  addFeedback: async (projectId: string, content: string) => {
    try {
      const response = await projectsAPI.addFeedback(projectId, content);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },


  // ═══════════════════════════════════════════════════════════
  // FILES
  // ═══════════════════════════════════════════════════════════

  getFiles: async (projectId: string) => {
    try {
      const response = await projectsAPI.getFiles(projectId);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  uploadFile: async (projectId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await projectsAPI.uploadFile(projectId, formData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  deleteFile: async (projectId: string, fileId: string) => {
    try {
      const response = await projectsAPI.deleteFile(projectId, fileId);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },


  // ═══════════════════════════════════════════════════════════
  // ACTIVITY
  // ═══════════════════════════════════════════════════════════

  getActivity: async (filters?: { type?: string; projectId?: string; userId?: string }) => {
    try {
      const response = await giteaAPI.getActivity(filters || {});
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },


  // ═══════════════════════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════════════════════

  getUsers: async (filters?: { role?: string }) => {
    try {
      const response = await usersAPI.getAllUsers(filters);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getUser: async (id: string) => {
    try {
      const response = await usersAPI.getById(id);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  createUser: async (data: { fullName: string; email: string; password: string; role: string; department?: string }) => {
    try {
      const response = await usersAPI.create({ 
        fullName: data.fullName, 
        email: data.email, 
        password: data.password, 
        role: data.role as 'student' | 'supervisor' | 'admin', 
        department: data.department 
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  deleteUser: async (id: string) => {
    try {
      const response = await usersAPI.delete(id);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  updateProfile: async (data: { fullName?: string; email?: string; phone?: string }) => {
    try {
      const response = await usersAPI.updateMe(data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const response = await usersAPI.changePassword(currentPassword, newPassword, newPassword);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getSupervisors: async () => {
    try {
      const response = await usersAPI.getSupervisors();
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },


  // ═══════════════════════════════════════════════════════════
  // ADMIN
  // ═══════════════════════════════════════════════════════════

  getDashboardStats: async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },


  getAllProjects: async () => {
    try {
      const response = await adminAPI.getAllProjects();
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  assignSupervisor: async (projectId: string, supervisorId: string) => {
    try {
      const response = await adminAPI.assignSupervisor(projectId, supervisorId);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getBatches: async () => {
    try {
      const response = await adminAPI.getBatches();
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  createBatch: async (data: { name: string; year: number; courseId: string; supervisorIds: string[] }) => {
    try {
      const response = await adminAPI.createBatch(data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getAuditLogs: async (filters?: { page?: number; limit?: number }) => {
    try {
      const response = await adminAPI.getAuditLogs(filters);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },


  // ═══════════════════════════════════════════════════════════
  // GITEA
  // ═══════════════════════════════════════════════════════════

  getGiteaSettings: async () => {
    try {
      const response = await giteaAPI.getSettings();
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  updateGiteaSettings: async (settings: { baseUrl?: string; adminToken?: string; orgName?: string; webhookSecret?: string }) => {
    try {
      const response = await giteaAPI.updateSettings(settings);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  testGiteaConnection: async () => {
    try {
      const response = await giteaAPI.testConnection();
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getCommits: async (owner: string, repo: string) => {
    try {
      const response = await giteaAPI.getCommits(owner, repo);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getBranches: async (owner: string, repo: string) => {
    try {
      const response = await giteaAPI.getBranches(owner, repo);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  createRepo: async (data: { name: string; description?: string; projectId: string }) => {
    try {
      const response = await giteaAPI.createRepo({ 
        name: data.name, 
        description: data.description || '', 
        projectId: data.projectId 
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },


  // ═══════════════════════════════════════════════════════════
  // CHAT / MESSAGES
  // ═══════════════════════════════════════════════════════════

  getConversations: async () => {
    try {
      const response = await chatAPI.getConversations();
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getMessages: async (conversationId: string) => {
    try {
      const response = await chatAPI.getMessages(conversationId);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  sendMessage: async (conversationId: string, text: string, attachment?: File) => {
    try {
      if (attachment) {
        const formData = new FormData();
        formData.append('text', text);
        formData.append('file', attachment);
        const response = await chatAPI.uploadAttachment(conversationId, formData);
        return response.data;
      } else {
        const response = await chatAPI.sendMessage(conversationId, { text });
        return response.data;
      }
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  markRead: async (conversationId: string) => {
    try {
      const response = await chatAPI.markRead(conversationId);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await chatAPI.getUnreadCount();
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  createConversation: async (projectId: string, participantId: string) => {
    try {
      const response = await chatAPI.createConversation({ projectId, participantId });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default dataService;
