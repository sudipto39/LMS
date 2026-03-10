export type Role = 'student' | 'supervisor' | 'admin';

export type ProjectStatus = 'draft' | 'in-progress' | 'submitted' | 'approved' | 'rejected';

export type MilestoneStatus = 'pending' | 'in-progress' | 'completed' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  batch?: string;
  department?: string;
}

export interface repoStatus{
  id: string;
  tittle: string;
  type: string;
  description: string;
  techStack: string[];
  repoOption: "create_new" | "set_existing";
  repoUrl?: string;
}

export interface Project {
  _id: string;
  repo: repoStatus;
  title: string;
  description: string;
  status: ProjectStatus;
  supervisor: string;
  supervisorId: string;
  studentName: string;
  studentId: string;
  batch: string;
  techStack: string[];
  repoUrl?: string;
  repoLinked: boolean;
  progress: number;
  lastPush: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  status: MilestoneStatus;
  completedAt?: string;
}

export interface ActivityItem {
  id: string;
  type: 'push' | 'milestone' | 'comment' | 'submission' | 'review' | 'grade' | 'repo' | 'login';
  user: string;
  project?: string;
  message: string;
  timestamp: string;
  branch?: string;
  commitHash?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  user: string;
  userRole: Role;
  message: string;
  timestamp: string;
  avatar?: string;
};

export type Page =
  | 'landing'
  | 'login'
  | 'signup'
  | 'student-dashboard'
  | 'student-projects'
  | 'student-create-project'
  | 'student-project-detail'
  | 'student-submissions'
  | 'student-messages'
  | 'student-profile'
  | 'supervisor-dashboard'
  | 'supervisor-projects'
  | 'supervisor-project-detail'
  | 'supervisor-reviews'
  | 'supervisor-grades'
  | 'supervisor-messages'
  | 'supervisor-profile'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-batches'
  | 'admin-gitea-settings'
  | 'admin-audit-logs'
  | 'admin-profile'
  | 'activity'
  | 'settings';


// export  interface ChatMessage {
//   id: string;
//   sender: 'me' | 'other';
//   senderName: string;
//   text: string;
//   time: string;
//   read: boolean;
//   type: 'text' | 'file' | 'system';
//   fileName?: string;
//   fileSize?: string;
// }

