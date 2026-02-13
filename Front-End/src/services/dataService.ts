/**
 * ============================================
 * Data Service Layer
 * ============================================
 * Tries the real API first, falls back to mock data if API is unreachable.
 * When backend is running → uses real API
 * When no backend → uses mock data from data.ts
 */

import { projectsAPI, usersAPI, adminAPI, giteaAPI, authAPI } from '@/api';
import chatAPI from '@/api/chat';
import type { AxiosResponse } from 'axios';
import { mockProjects, mockActivities, mockMilestones, mockUsers, mockComments } from '@/data';

let apiAvailable: boolean | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tryAPI<T>(apiCall: () => Promise<AxiosResponse<T>>, fallback: any): Promise<T> {
  if (apiAvailable === false) return fallback as T;
  try {
    const res = await apiCall();
    apiAvailable = true;
    return res.data;
  } catch {
    apiAvailable = false;
    setTimeout(() => { apiAvailable = null; }, 30000);
    return fallback as T;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptProject(p: (typeof mockProjects)[0]): any {
  return {
    ...p,
    _id: p.id,
    student: { _id: p.studentId, name: p.studentName, email: '' },
    professor: { _id: p.professorId, name: p.professor, email: '' },
    course: p.batch,
    status: p.status.replace('-', '_'),
  };
}

export const dataService = {
  // ─── Auth ───
  login: async (email: string, password: string) => {
    return tryAPI(
      () => authAPI.login({ email, password }),
      { token: 'demo-token', refreshToken: 'demo-refresh', user: { _id: 'u1', name: 'Rahul Sharma', email, role: 'student', giteaLinked: true, giteaUsername: 'rahul' } }
    );
  },

  register: async (data: { name: string; email: string; password: string; role: string; enrollmentId?: string; department?: string; batch?: string }) => {
    return tryAPI(
      () => authAPI.register({ name: data.name, email: data.email, password: data.password, role: data.role as 'student' | 'professor', enrollmentId: data.enrollmentId, department: data.department, batch: data.batch }),
      { message: 'Registration submitted (demo mode)', user: { _id: 'new', name: data.name } }
    );
  },

  // ─── Projects ───
  getProjects: async (filters?: { studentId?: string; professorId?: string; status?: string }) => {
    return tryAPI(
      () => projectsAPI.getAll(filters),
      { data: mockProjects.filter(p => { if (filters?.studentId) return p.studentId === filters.studentId; if (filters?.professorId) return p.professorId === filters.professorId; return true; }).map(adaptProject), total: mockProjects.length, page: 1, limit: 20, totalPages: 1 }
    );
  },

  getProject: async (id: string) => {
    const p = mockProjects.find(x => x.id === id) || mockProjects[0];
    return tryAPI(() => projectsAPI.getById(id), adaptProject(p));
  },

  createProject: async (data: { title: string; description: string; batch: string; course: string; professorId: string; techStack: string[]; repoOption: 'create_new' | 'link_existing'; existingRepoUrl?: string }) => {
    return tryAPI(() => projectsAPI.create(data), adaptProject({ ...mockProjects[0], id: 'new-' + Date.now(), title: data.title, description: data.description, status: 'draft' as const, progress: 0 }));
  },

  submitProject: async (id: string) => {
    return tryAPI(() => projectsAPI.submitFinal(id), adaptProject({ ...mockProjects[0], status: 'submitted' as const }));
  },

  approveProject: async (id: string, grade?: string, comment?: string) => {
    return tryAPI(() => projectsAPI.approve(id, { grade, comment }), adaptProject({ ...mockProjects[0], status: 'approved' as const }));
  },

  rejectProject: async (id: string, comment: string) => {
    return tryAPI(() => projectsAPI.reject(id, comment), adaptProject({ ...mockProjects[0], status: 'rejected' as const }));
  },

  updateProgress: async (projectId: string, percentage: number, note?: string) => {
    return tryAPI(() => projectsAPI.updateProgress(projectId, { percentage, note }), { _id: 'pu1', projectId, percentage, note, createdAt: new Date().toISOString(), weekStart: '' });
  },

  // ─── Milestones ───
  getMilestones: async (projectId: string) => {
    return tryAPI(
      () => projectsAPI.getMilestones(projectId),
      mockMilestones.filter(m => m.projectId === projectId).map(m => ({ ...m, _id: m.id, order: 0, status: m.status.replace('-', '_') }))
    );
  },

  completeMilestone: async (projectId: string, milestoneId: string) => {
    return tryAPI(() => projectsAPI.completeMilestone(projectId, milestoneId), { success: true });
  },

  approveMilestone: async (projectId: string, milestoneId: string, comment?: string) => {
    return tryAPI(() => projectsAPI.approveMilestone(projectId, milestoneId, comment), { success: true });
  },

  rejectMilestone: async (projectId: string, milestoneId: string, comment: string) => {
    return tryAPI(() => projectsAPI.rejectMilestone(projectId, milestoneId, comment), { success: true });
  },

  // ─── Feedback ───
  getFeedback: async (projectId: string) => {
    return tryAPI(
      () => projectsAPI.getFeedback(projectId),
      mockComments.map(c => ({ _id: c.id, projectId, author: { _id: 'u1', name: c.user, role: c.userRole }, content: c.message, createdAt: c.timestamp }))
    );
  },

  addFeedback: async (projectId: string, content: string) => {
    return tryAPI(() => projectsAPI.addFeedback(projectId, content), { _id: 'new', projectId, author: { _id: 'u1', name: 'You', role: 'student' }, content, createdAt: 'Just now' });
  },

  // ─── Files ───
  getFiles: async (projectId: string) => {
    return tryAPI(
      () => projectsAPI.getFiles(projectId),
      [
        { _id: 'f1', projectId, filename: 'uuid1.pdf', originalName: 'Project_Proposal.pdf', mimeType: 'application/pdf', size: 2516582, uploadedBy: { _id: 'u1', name: 'Rahul Sharma' }, uploadedAt: 'Nov 5, 2024', url: '#' },
        { _id: 'f2', projectId, filename: 'uuid2.pdf', originalName: 'Database_Schema.pdf', mimeType: 'application/pdf', size: 1153434, uploadedBy: { _id: 'u1', name: 'Rahul Sharma' }, uploadedAt: 'Dec 10, 2024', url: '#' },
        { _id: 'f3', projectId, filename: 'uuid3.zip', originalName: 'UI_Mockups.zip', mimeType: 'application/zip', size: 9122611, uploadedBy: { _id: 'u1', name: 'Rahul Sharma' }, uploadedAt: 'Dec 22, 2024', url: '#' },
      ]
    );
  },

  uploadFile: async (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return tryAPI(() => projectsAPI.uploadFile(projectId, formData), { _id: 'new', projectId, filename: file.name, originalName: file.name, mimeType: file.type, size: file.size, uploadedBy: { _id: 'u1', name: 'You' }, uploadedAt: 'Just now', url: '#' });
  },

  // ─── Activity ───
  getActivity: async (filters?: { type?: string }) => {
    return tryAPI(
      () => giteaAPI.getActivity({}),
      mockActivities.filter(a => { if (filters?.type && filters.type !== 'All' && a.type !== filters.type.toLowerCase()) return false; return true; })
    );
  },

  // ─── Users ───
  getUsers: async (filters?: { role?: string }) => {
    return tryAPI(
      () => usersAPI.getAll(filters),
      { data: mockUsers.filter(u => { if (filters?.role && u.role !== filters.role) return false; return true; }).map(u => ({ ...u, _id: u.id, giteaLinked: false, isActive: true, createdAt: '2024-01-01' })), total: mockUsers.length, page: 1, limit: 20, totalPages: 1 }
    );
  },

  createUser: async (data: { name: string; email: string; password: string; role: string; department?: string }) => {
    return tryAPI(() => usersAPI.create({ name: data.name, email: data.email, password: data.password, role: data.role as 'student' | 'professor' | 'admin', department: data.department }), { _id: 'new', ...data, giteaLinked: false, isActive: true, createdAt: new Date().toISOString() });
  },

  deleteUser: async (id: string) => {
    return tryAPI(() => usersAPI.delete(id), { success: true });
  },

  updateProfile: async (data: { name?: string; email?: string }) => {
    return tryAPI(() => usersAPI.updateProfile(data), { success: true });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return tryAPI(() => usersAPI.changePassword(currentPassword, newPassword), { success: true });
  },

  getProfessors: async () => {
    return tryAPI(() => usersAPI.getProfessors(), mockUsers.filter(u => u.role === 'professor').map(u => ({ ...u, _id: u.id, giteaLinked: false, isActive: true, createdAt: '2024-01-01' })));
  },

  // ─── Admin ───
  getDashboardStats: async () => {
    return tryAPI(() => adminAPI.getDashboardStats(), {
      totalStudents: mockUsers.filter(u => u.role === 'student').length,
      totalProfessors: mockUsers.filter(u => u.role === 'professor').length,
      totalProjects: mockProjects.length,
      activeProjects: mockProjects.filter(p => p.status === 'in-progress').length,
      submittedProjects: mockProjects.filter(p => p.status === 'submitted').length,
      approvedProjects: mockProjects.filter(p => p.status === 'approved').length,
      reposCreated: mockProjects.filter(p => p.repoLinked).length,
      giteaStatus: 'connected',
    });
  },

  getBatches: async () => {
    return tryAPI(() => adminAPI.getBatches(), [
      { _id: 'b1', name: 'BCA-2024', year: 2024, course: 'BCA', department: 'CS', studentCount: 4, professors: [{ _id: 'u4', name: 'Dr. Anita Desai' }], isActive: true, createdAt: '2024-01-01' },
      { _id: 'b2', name: 'MCA-2024', year: 2024, course: 'MCA', department: 'CS', studentCount: 2, professors: [{ _id: 'u5', name: 'Dr. Vikram Singh' }], isActive: true, createdAt: '2024-01-01' },
      { _id: 'b3', name: 'BCA-2023', year: 2023, course: 'BCA', department: 'CS', studentCount: 15, professors: [{ _id: 'u4', name: 'Dr. Anita Desai' }], isActive: false, createdAt: '2023-01-01' },
    ]);
  },

  getAuditLogs: async () => {
    return tryAPI(() => adminAPI.getAuditLogs(), {
      data: mockActivities.map(a => ({ _id: a.id, action: a.type, userId: { _id: 'u1', name: a.user, role: 'student' }, details: a.message, timestamp: a.timestamp })),
      total: mockActivities.length,
    });
  },

  // ─── Gitea ───
  getGiteaSettings: async () => {
    return tryAPI(() => giteaAPI.getSettings(), { _id: 'gs1', baseUrl: 'https://gitea.ignou.local', adminToken: '***', orgName: 'ignou-projects', defaultTeamPermission: 'write', webhookSecret: '***', webhookConfigured: true, connectionStatus: 'connected', lastConnectionTest: new Date().toISOString() });
  },

  testGiteaConnection: async () => {
    return tryAPI(() => giteaAPI.testConnection(), { success: true, version: '1.21.0', message: 'Connected (demo)' });
  },

  getCommits: async (owner: string, repo: string) => {
    return tryAPI(() => giteaAPI.getCommits(owner, repo), [
      { sha: 'a3f8c2d', message: 'Add product search with Fuse.js', author: { name: 'Rahul Sharma', email: 'rahul@ignou.ac.in', date: '2 hours ago' }, html_url: '#' },
      { sha: 'b1d4e5f', message: 'Fix cart total calculation', author: { name: 'Rahul Sharma', email: 'rahul@ignou.ac.in', date: '5 hours ago' }, html_url: '#' },
      { sha: 'c7a2b3d', message: 'Add pagination component', author: { name: 'Rahul Sharma', email: 'rahul@ignou.ac.in', date: '1 day ago' }, html_url: '#' },
    ]);
  },

  // ─── Chat ───
  getConversations: async () => {
    return tryAPI(() => chatAPI.getConversations(), []);
  },

  getMessages: async (conversationId: string) => {
    return tryAPI(() => chatAPI.getMessages(conversationId), { data: [], total: 0 });
  },

  sendMessage: async (conversationId: string, text: string) => {
    return tryAPI(() => chatAPI.sendMessage(conversationId, { text }), { _id: `m${Date.now()}`, conversationId, sender: { _id: 'u1', name: 'You', role: 'student' }, text, type: 'text', read: false, createdAt: new Date().toISOString() });
  },

  markRead: async (conversationId: string) => {
    return tryAPI(() => chatAPI.markRead(conversationId), { success: true });
  },

  // ─── Utility ───
  isAPIAvailable: () => apiAvailable === true,
  resetAPIStatus: () => { apiAvailable = null; },
};

export default dataService;
