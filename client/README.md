# GiteaForge LMS — Frontend Client Documentation

The GiteaForge LMS frontend is a modern Single Page Application (SPA) built with **React 19**, **Vite 7**, **Tailwind CSS v4**, and **TypeScript 5.9**. It delivers an institutional-grade user experience for students, faculty supervisors, and university administrators.

---

## 1. Core Capabilities

- **Role-Based Experience**: Dedicated portals and permissions for `STUDENT`, `SUPERVISOR`, and `ADMIN` users enforced via `RoleGuard` and backend authorization.
- **In-Browser Code Sandbox & IDE**: Integrated Monaco editor for multi-language source code authoring, standard input testing, and live execution telemetry against Judge0 CE.
- **Continuous Practical Evaluation Register**: Full 100-mark statutory evaluation grid supporting 10 continuous experiments (notebook & performance), internal viva, end-sem lab test, and end-sem viva with real-time class averages and automated one-click Excel (`.xlsx`) report generation via ExcelJS.
- **Git Provenance & Telemetry**: Visual commit streak counters, branch inspection, line-by-line code review commenting, and milestone phase progression.
- **Lab Curriculum Portal**: Scoped experiment assignments by degree course and batch cohort, with automated test-case runner (public vs hidden) and PDF report previewing using Mammoth and docx-preview.
- **Problem Statement Bank**: Curated repository of departmental capstone ideas classified by domain, difficulty, and prerequisites.
- **Enterprise UI Design**: Polished dark/light themes, Framer Motion animations (`motion`), Lucide React icons, and celebratory canvas confetti.

---

## 2. Directory Architecture

```
client/
├── public/                 # Static assets and favicons
├── src/
│   ├── main.tsx            # React application entry point
│   ├── App.tsx             # Main routing orchestrator, layout shell, and navigation
│   ├── index.css           # Global Tailwind CSS styles and theme variable definitions
│   ├── api/                # Modular Axios API service modules
│   │   ├── client.ts       # Central Axios instance with credentials & CSRF interceptors
│   │   ├── auth.ts         # Authentication & password management API
│   │   ├── projects.ts     # Capstone project CRUD & collaborator services
│   │   ├── milestones.ts   # Milestone submissions, attachments & approvals
│   │   ├── labs.ts         # Lab experiments, code running, and report submissions
│   │   ├── evaluations.ts  # 100-mark Continuous Evaluation Register API
│   │   ├── problems.ts     # Problem Statement Bank API
│   │   ├── batches.ts      # Degree courses, batches, and enrollment rosters
│   │   ├── gitea.ts        # Gitea repository and branch proxy calls
│   │   ├── users.ts        # User directory and supervisor list
│   │   └── admin.ts        # Admin telemetry and audit log retrieval
│   ├── components/
│   │   ├── auth/           # Login, registration, and OTP verification modals
│   │   ├── common/         # Navbar, Sidebar, ErrorBoundary, UIPrimitives (Card, Button, Modal)
│   │   ├── landing/        # Public hero, workflow, feature showcase, and role comparison
│   │   └── modals/         # Action modals (Create Project, Assign Supervisor, CSV Import, etc.)
│   ├── context/
│   │   ├── AuthContext.tsx # User session, token lifecycle, and role state
│   │   ├── ThemeContext.tsx# Dark/Light theme switching
│   │   └── ToastContext.tsx# Transient notification engine
│   ├── screens/            # Full-page role and feature screens
│   │   ├── StudentDashboard.tsx
│   │   ├── SupervisorDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── ProjectsScreen.tsx
│   │   ├── ProjectDetailScreen.tsx
│   │   ├── MilestonesScreen.tsx
│   │   ├── SubmissionsScreen.tsx
│   │   ├── PendingReviewsScreen.tsx
│   │   ├── GradesScreen.tsx
│   │   ├── LabAssignmentsScreen.tsx
│   │   ├── CodeSandboxScreen.tsx
│   │   ├── ProblemStatementsScreen.tsx
│   │   ├── BatchesScreen.tsx
│   │   ├── UsersScreen.tsx
│   │   ├── GiteaConfigScreen.tsx
│   │   ├── ActivityScreen.tsx
│   │   ├── AuditLogsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── types/              # Domain TypeScript interfaces (Project, User, Milestone, LabAssignment, etc.)
│   └── utils/
│       ├── excelExport.ts  # ExcelJS marksheet and roster generation engine
│       └── security.ts     # CSV formula injection sanitizer (sanitizeCsvCell)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Key Modules & Screens

### 1. In-Browser Code Sandbox (`screens/CodeSandboxScreen.tsx`)
- Supports Python, C++, Java, Go, JavaScript, TypeScript, Rust, and C#.
- Custom standard input (stdin) console, execution runtime telemetry, and starter boilerplate templates.
- Connected directly to backend `/api/v1/execute` (Judge0 CE / sandbox container).

### 2. University Evaluation Register (`screens/GradesScreen.tsx`)
- Aligned with university practical examination regulations:
  - **Continuous Internal Evaluation (50 Marks)**: 10 Experiments $\times$ 4 marks (2 marks Notebook + 2 marks Performance) = 40 Marks + 10 Marks Internal Viva.
  - **End-Semester Examination (50 Marks)**: 30 Marks Lab Test + 20 Marks Viva.
  - **Total**: 100 Marks with automatic grade tiering (A+, A, B, etc.).
- Real-time cell editing, validation boundaries, and one-click export to official Controller of Examinations formatted Excel files (`.xlsx`).

### 3. Lab Curriculum & Autograding (`screens/LabAssignmentsScreen.tsx`)
- Batch-scoped experiments with difficulty badges and due dates.
- Interactive coding challenge submission with live test-case runner.
- Document report submission (PDF) with in-browser preview.
- Student re-upload permission workflow with supervisor approval.

### 4. Capstone Governance & Code Review (`screens/project/`)
- Consolidated tabs: Overview, Progress Analytics, Milestones, Deliverable Files, and Code Sandbox.
- Integrated Gitea repository branch selector and inline code review commenting.

---

## 4. Client Security & Data Protection

1. **CSRF Protection**:
   - Axios client automatically includes `withCredentials: true` and attaches the `X-CSRF-Token` header read from the server's signed CSRF cookie.
2. **CSV Formula Sanitization**:
   - All exported and imported spreadsheet cells are filtered via `sanitizeCsvCell()` in `src/utils/security.ts`, stripping malicious formula prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`) to protect faculty spreadsheet software against CSV injection attacks.
3. **Anti-Flash Auth State Preservation**:
   - `App.tsx` implements an anti-flash transition overlay that preserves interface continuity across token refresh and navigation events.

---

## 5. Local Setup & Commands

### Prerequisites
- Node.js v20 or v22
- Backend server running on `http://localhost:5000`

### Installation
```bash
cd client
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_GITEA_URL=http://localhost:3000
```

### Development Server
```bash
npm run dev
# Starts Vite dev server on http://localhost:5173
```

### Production Build
```bash
npm run build
# Compiles optimized production bundle to client/dist/
```

### Preview Production Build
```bash
npm run preview
# Serves the compiled production bundle locally
```

