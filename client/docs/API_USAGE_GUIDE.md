# API Usage Guide — GiteaForge Frontend

## Overview

This project now has **two service files** for data:

| File | Purpose | When to Use |
|------|---------|-------------|
| `src/data.ts` | **Mock data** for UI development/testing | When backend is not available |
| `src/services/apiService.ts` | **Real API calls** to backend | For production |

---

## How to Switch from Mock Data to Real API

### Current State

The UI components in `src/screens/Dashboards.tsx` currently import mock data directly:

```typescript
// ❌ Current: Using mock data
import { mockProjects, mockActivities, mockUsers } from '../data';
```

### To Use Real API

Replace the mock imports with the apiService:

```typescript
// ✅ Correct: Using real API
import api from '../services/apiService';

// In component:
const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  api.projects.getMyProjects()
    .then(data => setProjects(data))
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, []);
```

---

## API Service Reference

### Import

```typescript
import api from '@/services/apiService';

// Or import specific services:
import { auth, users, projects, milestones, feedback, files, activity, admin, gitea, chat } from '@/services/apiService';
```

---

### Auth Service

```typescript
// Login
const { token, user } = await api.auth.login('email@example.com', 'password');
// Token is automatically stored in localStorage

// Register
await api.auth.register({
  fullName: 'John Doe',
  email: 'john@example.com',
  password: 'Password123!',
  passwordConfirm: 'Password123!',
  phone: '9876543210',
  university: 'IGNOU',
  department: 'Computer Science',
  session: '2024-25',
  rollNumber: 'CS2024001'
});

// Get current user (from token)
const user = await api.auth.getCurrentUser();

// Logout
await api.auth.logout();

// Forgot password
await api.auth.forgotPassword('email@example.com');

// Reset password
await api.auth.resetPassword('reset-token', 'newPassword', 'newPassword');
```

---

### User Service

```typescript
// Get own profile
const profile = await api.users.getProfile();

// Update profile
const updated = await api.users.updateProfile({ fullName: 'New Name' });

// Change password
await api.users.changePassword('oldPassword', 'newPassword', 'newPassword');

// Admin: Get all users
const users = await api.users.getAllUsers({ role: 'student', page: 1, limit: 20 });

// Admin: Create user
const newUser = await api.users.createUser({
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  password: 'Password123!',
  role: 'student'
});

// Admin: Bulk import from CSV
await api.users.bulkImport(csvFile);

// Get professors list (for dropdowns)
const professors = await api.users.getProfessors();
```

---

### Project Service

```typescript
// Student: Get my projects
const projects = await api.projects.getMyProjects();

// Professor: Get supervised projects
const supervised = await api.projects.getSupervisedProjects();

// Get project by ID
const project = await api.projects.getById('project-id');

// Create project
const newProject = await api.projects.create({
  title: 'My Final Year Project',
  description: 'A web application for...',
  batch: 'batch-id',
  course: 'course-id',
  supervisorId: 'prof-id',
  techStack: ['React', 'Node.js', 'MongoDB'],
  repoOption: 'create_new' // or 'link_existing'
});

// Update progress
await api.projects.updateProgress('project-id', 45, 'Completed API integration');

// Submit for review
await api.projects.submitForReview('project-id');

// Professor: Approve
await api.projects.approve('project-id', 'A', 'Excellent work!');

// Professor: Reject
await api.projects.reject('project-id', 'Please fix the issues mentioned');
```

---

### Milestone Service

```typescript
// Get milestones for a project
const milestones = await api.milestones.getByProject('project-id');

// Create milestone
const milestone = await api.milestones.create('project-id', {
  title: 'Backend API Complete',
  description: 'All REST endpoints implemented',
  dueDate: '2024-03-15'
});

// Student: Submit milestone
await api.milestones.submit('milestone-id', 'Completed all tasks');

// Professor: Approve
await api.milestones.approve('milestone-id', 'Good progress!');

// Professor: Reject
await api.milestones.reject('milestone-id', 'Please add unit tests');
```

---

### Feedback Service

```typescript
// Get feedback for a project
const comments = await api.feedback.getByProject('project-id');

// Add feedback comment
const comment = await api.feedback.add('project-id', 'Great implementation of the auth module!');
```

---

### File Service

```typescript
// Get files for a project
const files = await api.files.getByProject('project-id');

// Upload file
const uploaded = await api.files.upload('project-id', fileObject);

// Delete file
await api.files.delete('project-id', 'file-id');
```

---

### Activity Service

```typescript
// Get activity feed
const activities = await api.activity.getAll({ limit: 20 });

// Get push events for a project
const pushEvents = await api.activity.getPushEvents('project-id');
```

---

### Admin Service

```typescript
// Get dashboard stats
const stats = await api.admin.getStats();

// Get all projects
const allProjects = await api.admin.getAllProjects();

// Assign supervisor
await api.admin.assignSupervisor('project-id', 'supervisor-id');

// Batch management
const batches = await api.admin.getBatches();
await api.admin.createBatch({ name: 'BCA 2024', year: 2024, courseId: 'course-id' });

// Course management
const courses = await api.admin.getCourses();
await api.admin.createCourse({ name: 'BCA', code: 'BCA101', department: 'Computer Science' });

// Audit logs
const logs = await api.admin.getAuditLogs({ page: 1, limit: 50 });
```

---

### Gitea Service

```typescript
// Admin: Get settings
const settings = await api.gitea.getSettings();

// Admin: Update settings
await api.gitea.updateSettings({
  baseUrl: 'https://gitea.yourschool.edu',
  adminToken: 'gitea-admin-token',
  organizationName: 'student-projects'
});

// Test connection
const result = await api.gitea.testConnection();

// Create repo
const repo = await api.gitea.createRepo({
  name: 'my-project',
  description: 'Final year project',
  projectId: 'project-id'
});

// Get commits
const commits = await api.gitea.getCommits('owner', 'repo-name', { limit: 20 });

// Get branches
const branches = await api.gitea.getBranches('owner', 'repo-name');
```

---

### Chat Service

```typescript
// Get all conversations
const conversations = await api.chat.getConversations();

// Get messages
const messages = await api.chat.getMessages('conversation-id', 1, 50);

// Send message
const message = await api.chat.sendMessage('conversation-id', 'Hello professor!');

// Mark as read
await api.chat.markAsRead('conversation-id');

// Upload attachment
const attachment = await api.chat.uploadAttachment('conversation-id', fileObject);

// Get unread count
const count = await api.chat.getUnreadCount();

// Create conversation
const convo = await api.chat.createConversation('participant-id', 'project-id');
```

---

## Error Handling

All API calls throw errors if they fail. Handle them like this:

```typescript
try {
  const projects = await api.projects.getMyProjects();
  setProjects(projects);
} catch (error) {
  if (error.response?.status === 401) {
    // Token expired, redirect to login
    navigate('/login');
  } else if (error.response?.status === 403) {
    // Not authorized
    setError('You do not have permission to view this');
  } else {
    // Other error
    setError(error.message || 'Something went wrong');
  }
}
```

---

## Environment Variables

Set these in `.env`:

```env
# Backend API URL (required)
VITE_API_BASE_URL=http://localhost:5000/api

# WebSocket URL for real-time chat
VITE_WS_URL=ws://localhost:5000

# Gitea server URL
VITE_GITEA_URL=http://localhost:3000

# App name (optional)
VITE_APP_NAME=GiteaForge
```

---

## Backend API Endpoints Summary

The frontend expects these endpoints to be implemented:

### Auth (`/api/v1/auth`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/register` | Register new user |
| POST | `/verify-email` | Verify email |
| POST | `/login` | Login |
| POST | `/forgot-password` | Request password reset |
| PATCH | `/reset-password/:token` | Reset password |
| POST | `/logout` | Logout |
| POST | `/refresh` | Refresh token |

### Users (`/api/v1/users`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/me` | Get current user |
| PATCH | `/updateMe` | Update profile |
| PATCH | `/change-password` | Change password |
| GET | `/getAllUsers` | Get all users (admin) |
| GET | `/:id` | Get user by ID (admin) |
| POST | `/` | Create user (admin) |
| PATCH | `/:id` | Update user (admin) |
| DELETE | `/:id` | Delete user (admin) |
| POST | `/bulk-import` | CSV import (admin) |
| GET | `/professors` | List professors |
| GET | `/students` | List students |

### Projects (`/api/v1/projects`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/me` | Get student's projects |
| GET | `/supervised` | Get supervised projects |
| GET | `/:id` | Get project by ID |
| POST | `/` | Create project |
| PATCH | `/:id` | Update project |
| POST | `/:id/submit` | Submit for review |
| POST | `/:id/approve` | Approve project |
| POST | `/:id/reject` | Reject project |
| GET | `/:id/progress` | Get progress history |
| POST | `/:id/progress` | Update progress |
| GET | `/:id/feedback` | Get feedback |
| POST | `/:id/feedback` | Add feedback |
| GET | `/:id/files` | Get files |
| POST | `/:id/files` | Upload file |
| DELETE | `/:id/files/:fileId` | Delete file |

### Milestones (`/api/v1/milestones`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/projects/:id/milestones` | Get milestones |
| POST | `/projects/:id/milestones` | Create milestone |
| PATCH | `/:id/submit` | Submit milestone |
| PATCH | `/:id/approve` | Approve milestone |
| PATCH | `/:id/reject` | Reject milestone |

### Chat (`/api/v1/chat`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/conversations` | Get conversations |
| POST | `/conversations` | Create conversation |
| GET | `/conversations/:id/messages` | Get messages |
| POST | `/conversations/:id/messages` | Send message |
| POST | `/conversations/:id/attachments` | Upload attachment |
| PUT | `/conversations/:id/read` | Mark as read |
| GET | `/unread-count` | Get unread count |

### Admin (`/api/v1/admin`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/stats` | Dashboard stats |
| GET | `/projects` | All projects |
| PATCH | `/projects/:id/assign-supervisor` | Assign supervisor |
| GET | `/batches` | Get batches |
| POST | `/batches` | Create batch |
| PATCH | `/batches/:id` | Update batch |
| DELETE | `/batches/:id` | Delete batch |
| GET | `/courses` | Get courses |
| POST | `/courses` | Create course |
| GET | `/audit-logs` | Get audit logs |
| GET | `/gitea/settings` | Get Gitea settings |
| PUT | `/gitea/settings` | Update Gitea settings |
| GET | `/gitea/test-connection` | Test Gitea |

---

## File Structure

```
src/
├── api/                    # Low-level API modules
│   ├── client.ts           # Axios instance with interceptors
│   ├── auth.ts             # Auth endpoints
│   ├── users.ts            # User endpoints
│   ├── projects.ts         # Project endpoints
│   ├── admin.ts            # Admin endpoints
│   ├── gitea.ts            # Gitea endpoints
│   ├── chat.ts             # Chat endpoints
│   └── index.ts            # Barrel export
│
├── services/
│   ├── apiService.ts       # ← USE THIS - clean API wrapper
│   └── dataService.ts      # Old service (for reference)
│
├── data.ts                 # Mock data (keep for testing)
│
├── hooks/
│   ├── useAuth.ts          # Auth state hook
│   └── useAPI.ts           # Generic API hook
│
└── screens/
    └── Dashboards.tsx      # Update imports to use apiService
```

---

## Quick Migration Checklist

- [ ] Set `VITE_API_BASE_URL` in `.env`
- [ ] Backend implements all endpoints listed above
- [ ] Replace mock data imports with `api` service calls
- [ ] Add loading states to components
- [ ] Add error handling to components
- [ ] Add empty states for when data is empty
- [ ] Test login flow
- [ ] Test CRUD operations
- [ ] Test file uploads
- [ ] Test real-time chat (WebSocket)
