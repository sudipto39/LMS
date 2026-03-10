import type { Project, Milestone, ActivityItem, Comment, User } from './types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Rahul Sharma', email: 'rahul@ignou.ac.in', role: 'student', batch: 'BCA-2024', department: 'Computer Science' },
  { id: 'u2', name: 'Priya Patel', email: 'priya@ignou.ac.in', role: 'student', batch: 'BCA-2024', department: 'Computer Science' },
  { id: 'u3', name: 'Amit Kumar', email: 'amit@ignou.ac.in', role: 'student', batch: 'MCA-2024', department: 'Computer Science' },
  { id: 'u4', name: 'Dr. Anita Desai', email: 'anita.desai@ignou.ac.in', role: 'professor', department: 'Computer Science' },
  { id: 'u5', name: 'Dr. Vikram Singh', email: 'vikram.singh@ignou.ac.in', role: 'professor', department: 'Information Technology' },
  { id: 'u6', name: 'Admin User', email: 'admin@ignou.ac.in', role: 'admin', department: 'Administration' },
  { id: 'u7', name: 'Sneha Gupta', email: 'sneha@ignou.ac.in', role: 'student', batch: 'MCA-2024', department: 'Computer Science' },
  { id: 'u8', name: 'Karan Mehta', email: 'karan@ignou.ac.in', role: 'student', batch: 'BCA-2024', department: 'Computer Science' },
];

export const mockProjects: Project[] = [
  {
    id: 'p1', title: 'E-Commerce Platform', description: 'A full-stack e-commerce application with payment gateway integration, inventory management, and user authentication.', status: 'in-progress',
    professor: 'Dr. Anita Desai', professorId: 'u4', studentName: 'Rahul Sharma', studentId: 'u1', batch: 'BCA-2024',
    techStack: ['React', 'Node.js', 'MongoDB', 'Express'], repoUrl: 'https://gitea.ignou.local/rahul/ecommerce-platform', repoLinked: true,
    progress: 65, lastPush: '2 hours ago', deadline: '2025-03-15', createdAt: '2024-11-01', updatedAt: '2025-01-10',
  },
  {
    id: 'p2', title: 'Library Management System', description: 'Digital library system with book tracking, member management, fine calculation, and report generation capabilities.', status: 'submitted',
    professor: 'Dr. Anita Desai', professorId: 'u4', studentName: 'Priya Patel', studentId: 'u2', batch: 'BCA-2024',
    techStack: ['React', 'Python', 'PostgreSQL'], repoUrl: 'https://gitea.ignou.local/priya/library-mgmt', repoLinked: true,
    progress: 100, lastPush: '1 day ago', deadline: '2025-02-28', createdAt: '2024-10-15', updatedAt: '2025-01-09',
  },
  {
    id: 'p3', title: 'Chat Application', description: 'Real-time messaging application with group chat, file sharing, and end-to-end encryption features.', status: 'draft',
    professor: 'Dr. Vikram Singh', professorId: 'u5', studentName: 'Amit Kumar', studentId: 'u3', batch: 'MCA-2024',
    techStack: ['React', 'Socket.io', 'Node.js'], repoUrl: '', repoLinked: false,
    progress: 10, lastPush: 'Never', deadline: '2025-04-30', createdAt: '2025-01-05', updatedAt: '2025-01-05',
  },
  {
    id: 'p4', title: 'Student Portal', description: 'Complete student information system with attendance, grades, timetable, and notification modules.', status: 'approved',
    professor: 'Dr. Vikram Singh', professorId: 'u5', studentName: 'Sneha Gupta', studentId: 'u7', batch: 'MCA-2024',
    techStack: ['Angular', 'Spring Boot', 'MySQL'], repoUrl: 'https://gitea.ignou.local/sneha/student-portal', repoLinked: true,
    progress: 100, lastPush: '5 days ago', deadline: '2025-01-01', createdAt: '2024-08-01', updatedAt: '2025-01-01',
  },
  {
    id: 'p5', title: 'Weather Dashboard', description: 'Weather monitoring dashboard with API integration, forecasting, and location-based alerts.', status: 'in-progress',
    professor: 'Dr. Anita Desai', professorId: 'u4', studentName: 'Karan Mehta', studentId: 'u8', batch: 'BCA-2024',
    techStack: ['Vue.js', 'Node.js', 'MongoDB'], repoUrl: 'https://gitea.ignou.local/karan/weather-app', repoLinked: true,
    progress: 40, lastPush: '12 days ago', deadline: '2025-03-20', createdAt: '2024-11-15', updatedAt: '2024-12-29',
  },
];

export const mockMilestones: Milestone[] = [
  { id: 'm1', projectId: 'p1', title: 'Project Setup & Database Design', description: 'Initialize project, set up MongoDB schemas, and create base API structure.', dueDate: '2024-11-30', status: 'approved', completedAt: '2024-11-28' },
  { id: 'm2', projectId: 'p1', title: 'User Authentication & Authorization', description: 'Implement JWT-based auth with role management.', dueDate: '2024-12-15', status: 'approved', completedAt: '2024-12-14' },
  { id: 'm3', projectId: 'p1', title: 'Product Catalog & Cart', description: 'Build product listing, search, filtering, and shopping cart features.', dueDate: '2025-01-15', status: 'in-progress' },
  { id: 'm4', projectId: 'p1', title: 'Payment Integration', description: 'Integrate Razorpay/Stripe payment gateway.', dueDate: '2025-02-15', status: 'pending' },
  { id: 'm5', projectId: 'p1', title: 'Testing & Deployment', description: 'Write tests, fix bugs, and deploy to production.', dueDate: '2025-03-10', status: 'pending' },
  { id: 'm6', projectId: 'p2', title: 'Complete System', description: 'All modules implemented and tested.', dueDate: '2025-02-20', status: 'completed', completedAt: '2025-02-18' },
];

export const mockActivities: ActivityItem[] = [
  { id: 'a1', type: 'push', user: 'Rahul Sharma', project: 'E-Commerce Platform', message: 'Pushed 3 commits to main', timestamp: '2 hours ago', branch: 'main', commitHash: 'a3f8c2d' },
  { id: 'a2', type: 'comment', user: 'Dr. Anita Desai', project: 'E-Commerce Platform', message: 'Left feedback on milestone "Product Catalog"', timestamp: '5 hours ago' },
  { id: 'a3', type: 'submission', user: 'Priya Patel', project: 'Library Management System', message: 'Submitted project for final review', timestamp: '1 day ago' },
  { id: 'a4', type: 'milestone', user: 'Rahul Sharma', project: 'E-Commerce Platform', message: 'Marked "User Authentication" as completed', timestamp: '2 days ago' },
  { id: 'a5', type: 'review', user: 'Dr. Vikram Singh', project: 'Student Portal', message: 'Approved final submission with grade A', timestamp: '3 days ago' },
  { id: 'a6', type: 'push', user: 'Sneha Gupta', project: 'Student Portal', message: 'Pushed final documentation updates', timestamp: '5 days ago', branch: 'main', commitHash: 'b7e1f4a' },
  { id: 'a7', type: 'repo', user: 'Amit Kumar', project: 'Chat Application', message: 'Created project without linking repository', timestamp: '6 days ago' },
  { id: 'a8', type: 'grade', user: 'Dr. Vikram Singh', project: 'Student Portal', message: 'Graded project: A (92/100)', timestamp: '3 days ago' },
  { id: 'a9', type: 'push', user: 'Karan Mehta', project: 'Weather Dashboard', message: 'Pushed 1 commit to feature/alerts', timestamp: '12 days ago', branch: 'feature/alerts', commitHash: 'c9d3e5f' },
  { id: 'a10', type: 'login', user: 'Admin User', message: 'Admin login from 192.168.1.100', timestamp: '1 hour ago' },
];

export const mockComments: Comment[] = [
  { id: 'c1', user: 'Dr. Anita Desai', userRole: 'professor', message: 'Good progress on the authentication module. Make sure to add proper input validation and rate limiting for the login endpoint.', timestamp: '5 hours ago' },
  { id: 'c2', user: 'Rahul Sharma', userRole: 'student', message: 'Thank you! I\'ve added express-validator for input sanitization. Working on rate limiting next.', timestamp: '3 hours ago' },
  { id: 'c3', user: 'Dr. Anita Desai', userRole: 'professor', message: 'The product catalog looks promising. Consider adding pagination for better performance with large datasets. Also, the search functionality needs fuzzy matching.', timestamp: '1 day ago' },
  { id: 'c4', user: 'Rahul Sharma', userRole: 'student', message: 'I\'ll implement cursor-based pagination and integrate Fuse.js for fuzzy search. Will push the changes by tomorrow.', timestamp: '20 hours ago' },
];
