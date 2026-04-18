# LMS Client - React + Vite + TypeScript

A comprehensive Learning Management System (LMS) client application built with React 19, Vite, TypeScript, and Tailwind CSS. The application supports multiple user roles (Students, Supervisors, and Admins) with real-time project tracking, code repository integration via Gitea, and collaborative messaging features.

---

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Available Scripts](#available-scripts)
- [Technologies Used](#technologies-used)
- [Key Features by Role](#key-features-by-role)

---

## ✨ Features

### Core Features
- **Multi-Role Authorization**: Support for Students, Supervisors, and Admins with role-based access control
- **Authentication & Security**: JWT-based authentication with secure token management and session timeout
- **Project Management**: Create, track, and manage academic projects with real-time status updates
- **Gitea Integration**: Seamless integration with Gitea for repository management and Git operations
- **Real-time Activity Tracking**: Monitor project activities, Git pushes, milestones, and submissions
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS and dark mode support
- **File Upload**: Support for bulk file uploads and project submissions
- **Messaging System**: In-app messaging and communication between users
- **Grade Management**: Assign and track grades for projects and submissions
- **Audit Logging**: Comprehensive activity logs for admin oversight

### Student Features
- **Project Dashboard**: View all assigned and created projects with status tracking
- **Project Creation**: Create new projects with technology stack selection
- **Gitea Repository Integration**: Link projects to Git repositories (create new or use existing)
- **Milestone Management**: Set and track project milestones
- **Submissions**: Submit project work for supervisor review
- **Progress Tracking**: Visual progress indicators and deadline monitoring
- **Project Details**: Detailed view of project information, milestones, and activities
- **Messages**: Communicate with supervisors and peers
- **User Profile**: Manage personal information and settings

### Supervisor Features
- **Project Review Dashboard**: View all assigned student projects
- **Project Evaluation**: Review and approve/reject projects and submissions
- **Grade Assignment**: Provide grades and feedback on student work
- **Review Comments**: Add detailed comments and feedback on submissions
- **Activity Monitoring**: Track student activities and project progress
- **Batch Management**: Manage student groups and batches
- **User Communication**: Send messages to students
- **User Profile**: Manage personal settings and information

### Admin Features
- **User Management**: Create, edit, and manage user accounts (students, supervisors, admins)
- **Batch Management**: Create and manage student batches
- **Gitea Configuration**: Configure Gitea server settings and integration parameters
- **Audit Logging**: View comprehensive activity logs and system actions
- **System Monitoring**: Monitor overall system health and usage
- **Role Assignment**: Assign and modify user roles
- **User Profile**: Manage admin account settings

---

## 📁 Project Structure

### Root Directory
```
client/
├── public/                    # Static assets
├── src/                       # Source code
│   ├── api/                   # API layer and endpoints
│   │   ├── admin.ts          # Admin API operations
│   │   ├── auth.ts           # Authentication endpoints (login, signup, verify)
│   │   ├── chat.ts           # Chat/messaging API
│   │   ├── client.ts         # Client configuration and utilities
│   │   ├── gitea.ts          # Gitea integration API
│   │   ├── index.ts          # API exports
│   │   ├── projects.ts       # Project management API
│   │   └── users.ts          # User management API
│   │
│   ├── components/            # Reusable React components
│   │   ├── Icons.tsx         # Custom icon components (lucide-react)
│   │   ├── Sidebar.tsx       # Navigation sidebar component
│   │   └── ui.tsx            # Shared UI components (buttons, modals, cards, etc.)
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAPI.ts         # API request hook with loading states
│   │   └── useAuth.ts        # Authentication hook for auth state management
│   │
│   ├── screens/               # Page components
│   │   ├── Dashboards.tsx    # All dashboard screens (Student, Supervisor, Admin)
│   │   ├── Landing.tsx       # Landing/home page
│   │   ├── Login.tsx         # Login screen
│   │   └── Signup.tsx        # User registration screen
│   │
│   ├── services/              # Business logic and utilities
│   │   ├── apiService.ts     # HTTP client (axios wrapper) with interceptors
│   │   └── dataService.ts    # Data processing and transformation utilities
│   │
│   ├── utils/                 # Utility functions
│   │   ├── cn.ts             # Class name utility (clsx/tailwind merge)
│   │   └── security.ts       # Security utilities (clickjacking prevention, session timeout)
│   │
│   ├── types.ts              # TypeScript type definitions
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global styles
│
├── index.html                # HTML entry point
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
├── .env                      # Environment variables (local)
├── .env.example              # Environment variables template
└── README.md                 # This file
```

### Key Directories Explained

#### `/src/api/`
- **Exports**: API endpoints and HTTP methods for backend communication
- **Contains**: Authentication, user management, project operations, Gitea integration, admin operations
- **Pattern**: Each file represents a resource (users, projects, admin, etc.)

#### `/src/components/`
- **Icons.tsx**: Lucide React icon components used throughout the application
- **Sidebar.tsx**: Main navigation sidebar with role-specific menu items
- **ui.tsx**: Reusable UI components including:
  - KPI Cards for metrics display
  - Buttons, modals, and dialogs
  - Tables for data display
  - Progress bars and status indicators
  - Activity timeline component
  - Tech stack tags

#### `/src/hooks/`
- **useAPI.ts**: Custom hook for making API requests with automatic loading/error states
- **useAuth.ts**: Hook for managing authentication state and user information

#### `/src/screens/`
- **Dashboards.tsx**: Contains all dashboard screens (largest component file):
  - Student Dashboard (overview, projects, submissions)
  - Supervisor Dashboard (reviews, grades, assigned projects)
  - Admin Dashboard (users, batches, settings, audit logs)
  - Additional pages: Activity, Settings, Profile
- **Landing.tsx**: Public landing page
- **Login.tsx**: User login form
- **Signup.tsx**: User registration form

#### `/src/services/`
- **apiService.ts**: HTTP client wrapper with interceptors for:
  - Bearer token authentication
  - Error handling
  - Request/response transformation
- **dataService.ts**: Data transformation and business logic utilities

#### `/src/utils/`
- **cn.ts**: Tailwind class name merging utility
- **security.ts**: Security functions for:
  - Clickjacking prevention
  - Session timeout handling
  - Secure local storage management

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Backend API server running (see backend documentation)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Configuration
Create a `.env` file in the root directory (copy from `.env.example`):
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_GITEA_URL=http://localhost:3000
```

### Step 3: Verify Installation
Check that all packages are installed correctly:
```bash
npm audit
```

### Step 4: Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

---

## 📦 Available Scripts

### Development
```bash
npm run dev
```
Starts the development server with hot module reloading

### Build
```bash
npm run build
```
Creates an optimized production build in the `dist/` directory

### Preview
```bash
npm run preview
```
Serves the production build locally for testing

---

## 🛠️ Technologies Used

### Core Framework
- **React** (v19.2.3) - UI library
- **React Router** (v7.14.0) - Client-side routing
- **TypeScript** (v5.9.3) - Type safety
- **Vite** (v7.2.4) - Build tool and dev server

### UI & Styling
- **Tailwind CSS** (v4.1.17) - Utility-first CSS framework
- **Tailwind CSS Vite** (v4.1.17) - Vite integration
- **Lucide React** (v0.563.0) - Icon library
- **clsx** (v2.1.1) - Class name utility
- **tailwind-merge** (v3.4.0) - Merge Tailwind classes

### State Management & Data Fetching
- **TanStack React Query** (v5.99.0) - Server state management
- **Axios** (v1.15.0) - HTTP client

### Build Tools
- **Vite Plugin React** (v5.1.1) - React support in Vite
- **Vite Plugin SingleFile** (v2.3.0) - Bundle to single file
- **Tailwind CSS Vite** - CSS framework integration

### Development Tools
- **TypeScript** - Type checking
- **@types/node** (v22.0.0) - Node.js type definitions
- **@types/react** (v19.2.7) - React type definitions
- **@types/react-dom** (v19.2.3) - React DOM type definitions
- **@types/react-router-dom** (v5.3.3) - React Router type definitions

---

## 🔑 Key Features by Role

### 👨‍🎓 Student Role

**Dashboard Features:**
- Quick stats: Active projects, submissions, milestones completed
- Project list with status, supervisor, and progress tracking
- Recent activity timeline
- Upcoming deadline alerts

**Project Management:**
- Create new projects with:
  - Title and description
  - Technology stack selection
  - New repository creation or link existing Gitea repository
- View detailed project information:
  - Supervisor assignment
  - Tech stack and repository URL
  - Progress indicators
  - Milestone timeline
  - Latest Git activity
  - Comments and feedback

**Submissions & Tracking:**
- Submit completed work for supervisor review
- Track submission status (pending, reviewed, approved, rejected)
- View feedback and grades from supervisors
- Monitor project deadline and progress

**Communication:**
- Send and receive messages with supervisors
- Real-time notifications
- Message history

### 👨‍🏫 Supervisor Role

**Dashboard Features:**
- View all assigned student projects
- Project statistics and overview
- Recent activities and submissions
- Quick actions for review and grading

**Project Review:**
- Access all student projects assigned to you
- Review project details and submissions
- Approve, reject, or request changes
- Add detailed comments and feedback

**Grade Management:**
- Assign grades to projects
- Provide scoring and feedback
- Track grading status
- View grade history

**Batch Management:**
- View assigned batches
- Manage student groups
- Track batch-level progress

**Communication:**
- Send messages to students
- Respond to student inquiries
- View message history

### 🔐 Admin Role

**User Management:**
- Create new user accounts (students, supervisors, admins)
- Edit user information
- Assign and modify user roles
- Delete user accounts (with confirmation)
- Bulk user operations

**Batch Management:**
- Create new student batches
- Edit batch information
- Assign students to batches
- View batch statistics

**Gitea Configuration:**
- Configure Gitea server settings
- Manage repository integration
- Set up webhooks and integrations
- API key and authentication management
- Repository templates and settings

**Audit Logging:**
- View comprehensive activity logs
- Filter by user, action, or timestamp
- Monitor system changes
- Track user login/logout activities
- Project and submission tracking

**System Monitoring:**
- System health overview
- User and project statistics
- Activity metrics

---

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Session Timeout**: Automatic session expiration after inactivity
- **Clickjacking Prevention**: X-Frame-Options headers
- **CORS Support**: Cross-origin request handling
- **Secure Storage**: Encrypted local storage for sensitive data
- **Role-Based Access Control**: Fine-grained permission management
- **Token Refresh**: Automatic token refresh mechanism

---

## 🌐 Integration Points

### Gitea Integration
- Repository creation and linking
- Branch and commit tracking
- Webhook support for push notifications
- Repository clone/pull operations
- Access control and permissions

### Backend API Integration
- RESTful API communication
- Axios interceptors for authentication
- Error handling and retry logic
- Request/response transformation

---

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API endpoint | `http://localhost:3000/api` |
| `VITE_GITEA_URL` | Gitea server URL | `http://localhost:3000` |

---

## 📚 Additional Documentation

- [API Usage Guide](./API_USAGE_GUIDE.md) - Backend API endpoint documentation
- [Backend Integration Guide](./BACKEND_INTEGRATION.md) - Integration instructions
- [Database Blueprint](./DATABASE_BLUEPRINT.md) - Database schema and relationships
- [Setup Guide](./SETUP_GUIDE.md) - Detailed setup instructions
- [Security Guide](./SECURITY.md) - Security best practices and guidelines
- [Backend API Docs](./BACKEND_API_DOCS.md) - Complete API documentation

---

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

---

## 📄 License

This project is private and confidential.

---

## 📞 Support

For issues, questions, or feedback, please contact the development team or create an issue in the repository.

---

## 🎯 Future Enhancements

- Real-time notifications using WebSockets
- Advanced analytics and reporting
- Integration with more Git platforms
- Mobile app version
- Enhanced collaboration tools
- AI-powered code review suggestions
- Automated testing and deployment pipelines

---

**Last Updated**: April 2026  
**Version**: 1.0.0
