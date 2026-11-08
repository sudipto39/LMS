# GiteaForge LMS

### Sovereign Academic Project Governance, Sandboxed Code Execution & Continuous Practical Evaluation

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%20%7C%20v22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express 5](https://img.shields.io/badge/Express-v5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React 19](https://img.shields.io/badge/React-v19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-v7.7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Gitea](https://img.shields.io/badge/Gitea-Self--Hosted-609926?logo=gitea&logoColor=white)](https://gitea.io/)
[![Judge0](https://img.shields.io/badge/Judge0%20CE-Isolated%20Worker-4B5563)](https://judge0.com/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.1-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

---

## Executive Summary

Higher education institutions face a systemic crisis in evaluating student computing projects. Fragmented workflows across public code repositories, email chains, and paper marksheet registers create severe vulnerabilities:

1. **Purchased & Outsourced Projects**: Students submit code written off-campus with zero verifiable development history.
2. **"It Worked on My Machine" Laboratory Disputes**: Discrepancies between student laptops and departmental computers disrupt practical exams.
3. **Loss of University Intellectual Property**: Student research, code, and project deliverables are leaked to third-party commercial platforms.
4. **Error-Prone Manual Registers**: Faculty spend hundreds of hours re-tallying continuous assessment marks across physical registers and unstructured spreadsheets.

**GiteaForge LMS** solves this end-to-end. It is a sovereign, institutional-grade Learning Management System that unifies **self-hosted Git repository governance (Gitea)**, **kernel-sandboxed online multi-language code execution (Judge0 CE)**, **phased capstone milestone defenses**, and a **statutory 100-mark Continuous Practical Evaluation Register** with automated one-click export to official Controller of Examinations Excel spreadsheets.

---

## Key Capability Pillars

### 1. Sovereign Git Infrastructure & Telemetry (Gitea Integration)
- Autonomous private Git repository provisioning the moment a project is approved.
- Real-time Git push telemetry captured via HMAC-SHA256 signed webhooks.
- Visual commit streaks, branch inspections, diff views, and line-by-line in-app code reviews.
- Zero dependency on public commercial Git services; 100% student IP remains on institutional servers.

### 2. In-Browser Sandboxed Code Execution & IDE (Monaco + Judge0 CE)
- Browser-based development environment powered by the Monaco Editor with zero local machine installation.
- Containerized execution supporting Python, C++, Java, Go, JavaScript, TypeScript, Rust, and C#.
- Dual test evaluation: instant execution against public test cases; rigorous grading against hidden test cases with memory and CPU time telemetry.

### 3. Statutory University Continuous Evaluation Register (100 Marks)
- Fully aligned with university practical examination regulations:
  $$\text{Continuous Internal (50 Marks)} = \left(\sum_{i=1}^{10} [\text{Notebook}_i (2) + \text{Performance}_i (2)] = 40\right) + \text{Internal Viva} (10)$$
  $$\text{End-Semester Examination (50 Marks)} = \text{Lab Test} (30) + \text{End-Sem Viva} (20)$$
  $$\textbf{Total Final Marks} = \text{Continuous Internal} + \text{End-Semester} = \mathbf{100\text{ Marks}}$$
- Automatic arithmetic aggregation, class average tracking, and one-click export to official `.xlsx` marksheets via ExcelJS.

### 4. Phased Capstone Lifecycle & Milestone Defense
- Four-phase progression model: Problem Selection $\rightarrow$ Autonomous Repository Provisioning $\rightarrow$ Phased Milestone Reviews $\rightarrow$ Final Viva & Grade Registration.
- Enforced hard gates: students cannot advance to subsequent project milestones without supervisor sign-off.
- Deliverable uploads protected with binary magic-byte inspection, UUID disk isolation, and student notes.

### 5. Multi-Tier Academic Role Governance
- **Student**: Manages capstone repositories, tracks commit streaks, runs sandboxed code, and submits lab assignments.
- **Supervisor**: Mentors assigned cohorts, approves milestone gates, reviews line-by-line diffs, and grades practical evaluations.
- **Administrator**: Governs degree courses, academic batches, CSV roster imports (with CSV formula sanitization), and inspects tamper-evident audit logs.

---

## System Architecture

```mermaid
flowchart TB
    subgraph Browser ["Client Application (React 19 SPA)"]
        SPA["Vite 7 + React 19 UI"]
        Monaco["Monaco Editor (IDE)"]
        Excel["ExcelJS Export Engine"]
    end

    subgraph Gateway ["Express 5.2 API Gateway"]
        AuthMW["Signed CSRF & Helmet & CORS"]
        JWTRTR["Dual-Token JWT & Redis RTR Guard"]
        Router["API Route Controllers"]
        UploadGuard["Magic-Byte & Traversal Validator"]
    end

    subgraph CoreServices ["Application Services"]
        AuthService["Auth & OTP Service"]
        ProjectService["Capstone Milestone Engine"]
        GradingService["Automated Lab Test Runner"]
        EvalService["100-Mark Continuous Assessment"]
        GiteaClient["Gitea API & Webhook Service"]
        RunnerService["Judge0 Execution Router"]
    end

    subgraph DataPlane ["Persistence & Infrastructure"]
        Postgres[("PostgreSQL 15 (Prisma ORM)")]
        RedisDB[("Redis 7 (Tokens, RTR, Cache)")]
        GiteaServer["Self-Hosted Gitea Server"]
        Judge0Worker["Judge0 CE Isolated Container (cgroups / seccomp)"]
        FileStore["Storage (Local Disk / AWS S3)"]
    end

    SPA -->|"HTTPS / REST"| Gateway
    Gateway --> CoreServices
    AuthService --> Postgres
    AuthService --> RedisDB
    ProjectService --> Postgres
    GradingService --> Postgres
    EvalService --> Postgres
    RunnerService --> Judge0Worker
    GiteaClient --> GiteaServer
    UploadGuard --> FileStore
    GiteaServer -.->|"HMAC-SHA256 Webhook"| Gateway
```

---

## Visual Platform Tour

### 1. Landing & Academic Project Lifecycle
The public landing page outlines the complete four-phase capstone lifecycle and platform pillars for university deans, department heads, and students.

![Platform Landing Page](screenshots/01_landing_page.png)

| Workflow & Features | Capability Highlights |
|---|---|
| ![Platform Features](screenshots/01b_landing_features.png) | **Six Core Pillars**: Sovereign Git hosting, milestone governance, in-browser code execution, continuous practical evaluation, RBAC, and tamper-evident audit logging. |
| ![Capstone Workflow](screenshots/01c_landing_workflow.png) | **Hard-Gated Lifecycle**: Problem selection $\rightarrow$ Autonomous repository provisioning $\rightarrow$ Milestone defense $\rightarrow$ Final viva mark registration. |

---

### 2. Student Dashboard & Project Workspace
The daily command center for enrolled students, showing live commit counters, upcoming milestone deadlines, and active capstones.

![Student Dashboard](screenshots/02_student_dashboard.png)

| View | Description |
|---|---|
| ![Student Projects](screenshots/03_student_projects.png) | **Project Portfolio**: Multi-project oversight with status tags, supervisor badges, and quick links to the project command center. |
| ![Project Detail View](screenshots/04_project_detail_view.png) | **Project Command Center**: Consolidated tabs for repository overview, progress telemetry, milestones, files, and sandboxed code. |
| ![Milestones Screen](screenshots/05_project_milestones.png) | **Phase-Gated Milestones**: Due dates, deliverable uploads, commit references, and supervisor feedback history. |

---

### 3. Laboratory Curriculum & In-Browser Code Sandbox
Departmental lab portal organizing experiments by degree course and batch, coupled with an in-browser development IDE.

![Code Sandbox IDE](screenshots/07_code_sandbox_ide.png)

| Screen | Description |
|---|---|
| ![Lab Assignments](screenshots/06_lab_assignments.png) | **Curriculum Portal**: Batch-scoped practical experiments with mark allocations, faculty manual downloads, and coding submissions. |
| ![Problem Statement Bank](screenshots/08_problem_statements.png) | **Problem Statement Bank**: Curated catalogue classified by domain (AI/ML, Cyber Security, Cloud, Web3), difficulty, and prerequisites. |

---

### 4. Continuous Practical Evaluation & Faculty Governance
Faculty control center for reviewing pending submissions, grading rubrics, and managing the official 100-mark statutory practical evaluation register.

![Continuous Evaluation Register](screenshots/10_grades_evaluation_register.png)

| Screen | Description |
|---|---|
| ![Supervisor Dashboard](screenshots/09_supervisor_dashboard.png) | **Faculty Dashboard**: Assigned project roster, pending-review queues, upcoming defenses, and recent student activities. |
| ![Pending Reviews Queue](screenshots/10b_pending_reviews.png) | **Review Queue**: Batch inspection of milestone deliverables, code commit references, inline feedback, and approvals. |

---

### 5. Institutional Administration & Infrastructure Health
University administrator governance dashboard with telemetry across users, degree courses, academic cohorts, and self-hosted Gitea clusters.

![Admin Governance Dashboard](screenshots/11_admin_governance_dashboard.png)

| Screen | Description |
|---|---|
| ![Batches & Courses](screenshots/12_batches_and_courses.png) | **Degree Courses & Cohorts**: Academic batch lifecycle management, course codes, and enrollment rosters. |
| ![Users & Roles](screenshots/12b_users_and_roles.png) | **User Management**: Multi-tier role governance (`STUDENT`, `SUPERVISOR`, `ADMIN`) with CSV roster import. |
| ![Gitea Config](screenshots/13_gitea_infrastructure_config.png) | **Infrastructure Health**: Live connection status, webhook latency, and repository provisioning controls. |
| ![Audit Logs](screenshots/14_audit_security_logs.png) | **Security Audit Logs**: Tamper-evident record of grading events, milestone rejections, and administrative updates. |

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend SPA** | React 19.2, TypeScript 5.9, Vite 7.3, Tailwind CSS v4, Lucide React, Framer Motion (`motion`) |
| **Document & Excel Engine** | ExcelJS, SheetJS (`xlsx`), Mammoth, docx-preview, Canvas Confetti |
| **Backend API Gateway** | Node.js (v20+), Express 5.2, TypeScript 5.9 (ESM), Helmet 8, CORS, Compression, Morgan |
| **Data & ORM** | PostgreSQL 15, Prisma ORM 7.7 (`@prisma/adapter-pg`, `pg`), Connection Pooling |
| **In-Memory Cache & Sessions** | Redis 7 (`ioredis`) for Refresh Token Rotation (RTR) and Rate Limiting |
| **Version Control Service** | Self-Hosted Gitea Server, Gitea REST API v1, HMAC-SHA256 Webhooks |
| **Code Execution Sandbox** | Judge0 CE (Containerized with cgroups & seccomp) + Fallback `LocalRunnerService` |
| **Storage & Uploads** | Multer, UUID disk storage, binary magic-byte validation, AWS SDK v3 (`@aws-sdk/client-s3`) |
| **Email & Notifications** | Nodemailer (SMTP / Gmail App Passwords), Resend API |
| **Documentation & Quality** | OpenAPI 3.0 / Swagger UI (`/api-docs`), Jest, ts-jest, Supertest, ESLint 10, Autocannon |

---

## Repository Structure

```
LMS/
├── client/                     # React 19 + Vite 7 + Tailwind CSS v4 SPA
│   ├── src/
│   │   ├── api/                # Modular Axios API services (auth, projects, labs, evaluations)
│   │   ├── components/         # Common UI, Auth containers, Modals, Landing views
│   │   ├── context/            # AuthContext, ThemeContext, ToastContext
│   │   ├── screens/            # Full-page screens (Dashboards, Grades, Sandbox, Labs, Batches)
│   │   │   └── project/        # Capstone command center (Overview, Progress, Milestones, Sandbox)
│   │   └── utils/              # Excel export engine & CSV formula injection sanitizer
│   ├── README.md               # Frontend developer guide
│   └── vite.config.ts
├── server/                     # Express 5 + TypeScript + Prisma ORM + PostgreSQL Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma data model definitions
│   │   └── seed.ts             # University, course, batch, and user seed scripts
│   ├── src/
│   │   ├── config/             # DB, Redis, Gitea, and Zod env configuration
│   │   ├── controllers/        # Express route handlers
│   │   ├── middlewares/        # Auth, CSRF, Multer magic-byte, and error handling
│   │   ├── routes/             # REST API endpoint definitions
│   │   ├── services/           # Gitea client, Judge0 runner, grading engine, email service
│   │   └── __tests__/          # Jest unit and integration test suites
│   ├── docs/
│   │   ├── API.md              # Complete REST API specification
│   │   └── Readme.md           # Backend developer documentation
│   └── Dockerfile              # Production container build definition
├── docs/
│   ├── ARCHITECTURE.md         # In-depth architectural specifications & threat model
│   └── DEPLOYMENT.md           # Production deployment guide (Docker Compose, Nginx, SSL)
├── screenshots/                # High-resolution platform UI captures
├── docker-compose.self-hosted.yml # Full on-premise production stack (PG, Redis, Gitea, Judge0)
├── docker-compose.gcp-vm.yml   # Hybrid cloud VM stack (Gitea + Judge0)
└── Readme.md                   # Project master README
```

---

## Quickstart & Local Setup

### Prerequisites
- **Node.js**: v20 or v22
- **npm**: v10+
- **Docker & Docker Compose**: (Required for PostgreSQL, Redis, Gitea, Judge0)

### 1. Clone the Repository
```bash
git clone https://github.com/sudipto39/LMS.git
cd LMS
```

### 2. Start Supporting Infrastructure (Docker)
Start PostgreSQL and Redis locally:
```bash
docker compose -f docker-compose.self-hosted.yml up -d lms-postgres lms-redis
```

### 3. Setup and Run the Backend Server
```bash
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials, JWT secrets, etc.

# Initialize database schema and generate Prisma client
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```
The API server will run on `http://localhost:5000` (API documentation accessible at `http://localhost:5000/api-docs`).

### 4. Setup and Run the Frontend Client
Open a second terminal:
```bash
cd client

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Configuration Reference

### Backend Environment Variables (`server/.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` |
| `PORT` | HTTP server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/lms_db` |
| `REDIS_URL` | Redis connection string for session & token tracking | `redis://localhost:6379` |
| `STORAGE_TYPE` | Storage engine (`local` for on-premise disk, `s3` for AWS) | `local` |
| `UPLOAD_DIR` | Local disk upload directory (zero cloud cost) | `uploads` |
| `JWT_ACCESS_SECRET` | Secret key for signing 15-minute access JWTs (min 32 chars) | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | Secret key for signing 7-day refresh JWTs (min 32 chars) | `openssl rand -base64 48` |
| `CLIENT_URL` | Allowed frontend origins for CORS | `http://localhost:5173` |
| `GITEA_BASE_URL` | Self-hosted Gitea API gateway URL | `http://localhost:3000/api/v1` |
| `GITEA_WEBHOOK_SECRET` | Secret key for verifying inbound Gitea webhooks | `your-webhook-secret` |
| `GITEA_ADMIN_TOKEN` | Administrative API token for provisioning repos/users | `your-gitea-token` |
| `JUDGE0_URL` | Judge0 CE code execution gateway | `http://localhost:2358` |
| `EMAIL_VERIFICATION` | Enforce 6-digit OTP verification upon registration | `false` |
| `SMTP_HOST` / `SMTP_USER` | SMTP server credentials for free email dispatch | `smtp.gmail.com` |

---

## Production Deployment

### On-Premise University Server (Ubuntu)
GiteaForge is fully packaged for single-node on-premise deployment via `docker-compose.self-hosted.yml`, orchestrating:
1. `lms-postgres` (PostgreSQL 15)
2. `lms-redis` (Redis 7)
3. `lms-gitea` (Gitea Server)
4. `judge0-server` (Judge0 API Gateway)
5. `judge0-worker` (Privileged execution container with cgroups)
6. `judge0-redis` & `judge0-postgres`

```bash
# Start all infrastructure containers
docker compose -f docker-compose.self-hosted.yml up -d

# Build and start server via PM2
cd server && npm ci && npm run db:migrate:prod && npm run build
pm2 start dist/index.js --name "giteaforge-api"

# Build client
cd ../client && npm ci && npm run build
```

For complete step-by-step reverse proxy, SSL, and backup guides, refer to [DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Security & Regulatory Compliance

GiteaForge LMS incorporates defense-in-depth security standards:

- **Double-Submit Signed CSRF**: Cryptographically signed HMAC-SHA256 tokens validating all mutating HTTP requests.
- **Refresh Token Rotation (RTR)**: Single-use refresh tokens with Redis revocation lists to prevent token theft and replay attacks.
- **Sandboxed Code Execution**: Kernel-level cgroup and seccomp containerization isolating untrusted student code from the host system.
- **Upload Hardening**: Randomized UUID filenames, binary magic-byte inspection, strict MIME allowlisting, and traversal guards (`path.basename()`).
- **CSV Formula Injection Sanitization**: Client and server-side filtering (`sanitizeCsvCell`) protecting faculty spreadsheets from malicious formula injection (`=cmd|'...'`).
- **Accreditation Ready**: Comprehensive audit logs and tamper-evident grade records meeting **NAAC**, **NBA**, and **ABET** continuous assessment documentation standards.

For full threat modeling and vulnerability review, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Testing & Quality Assurance

```bash
# Execute Jest unit and integration tests
cd server
npm run test

# Run HTTP endpoint smoke tests
npm run test:smoke

# Run Autocannon concurrency & throughput stress test
npm run test:stress

# Run realistic academic session simulation
npm run test:realistic

# Validate TypeScript type safety
npm run type-check
```

---

## Documentation Links

- [Complete REST API Specification](server/docs/API.md)
- [System Architecture & Threat Model](docs/ARCHITECTURE.md)
- [Production Deployment Guide](docs/DEPLOYMENT.md)
- [Backend Engineering Guide](server/docs/Readme.md)
- [Frontend Client Documentation](client/README.md)

---

## License

This project is licensed under the [ISC License](LICENSE).  
Developed by **Sudipto Gayen** and contributors.
