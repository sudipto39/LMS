# GiteaForge Database Blueprint

## Complete MongoDB Schema Design with Relationships

---

## Visual Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              GITEAFORGE DATABASE ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐       1:N        ┌──────────────┐       N:1        ┌──────────────┐
│    USERS     │◄────────────────►│   PROJECTS   │◄────────────────►│   BATCHES    │
│              │  (created_by)    │              │   (batch_id)     │              │
│  - _id (PK)  │                  │  - _id (PK)  │                  │  - _id (PK)  │
│  - email     │                  │  - title     │                  │  - name      │
│  - password  │       1:N        │  - status    │                  │  - year      │
│  - role      │◄────────────────►│  - repo_url  │                  │  - course_id │
│  - profile   │  (supervisor_id) │  - progress  │                  └──────┬───────┘
└──────┬───────┘                  └──────┬───────┘                         │
       │                                 │                                 │ N:1
       │                                 │                                 │
       │ 1:N                             │ 1:N                       ┌─────▼──────┐
       │ (user_id)                       │ (project_id)              │  COURSES   │
       │                                 │                           │            │
       ▼                                 ▼                           │  - _id     │
┌──────────────┐                  ┌──────────────┐                   │  - name    │
│ AUDIT_LOGS   │                  │  MILESTONES  │                   │  - code    │
│              │                  │              │                   └────────────┘
│  - _id       │                  │  - _id (PK)  │
│  - action    │                  │  - title     │
│  - timestamp │                  │  - due_date  │
└──────────────┘                  │  - status    │
                                  └──────────────┘
       
┌──────────────┐       N:1        ┌──────────────┐       N:1        ┌──────────────┐
│   FEEDBACK   │◄────────────────►│   PROJECTS   │◄────────────────►│    FILES     │
│              │  (project_id)    │              │   (project_id)   │              │
│  - _id       │                  │              │                  │  - _id       │
│  - message   │       N:1        │              │       1:N        │  - filename  │
│  - author_id │◄────────────────►│              │◄────────────────►│  - url       │
│  - timestamp │  (author_id)     │              │   (project_id)   │  - size      │
└──────────────┘                  └──────┬───────┘                  └──────────────┘
                                         │
                                         │ 1:N
                                         │ (project_id)
                                         ▼
┌──────────────┐       N:1        ┌──────────────┐       N:1        ┌──────────────┐
│ PUSH_EVENTS  │◄────────────────►│   PROJECTS   │◄────────────────►│   PROGRESS   │
│              │  (project_id)    │              │   (project_id)   │   UPDATES    │
│  - _id       │                  │              │                  │              │
│  - commit_id │                  │              │                  │  - _id       │
│  - message   │                  │              │                  │  - percent   │
│  - branch    │                  │              │                  │  - notes     │
│  - timestamp │                  │              │                  │  - timestamp │
└──────────────┘                  └──────────────┘                  └──────────────┘

┌──────────────┐       N:1        ┌──────────────┐
│   MESSAGES   │◄────────────────►│CONVERSATIONS │
│              │ (conversation_id)│              │
│  - _id       │                  │  - _id       │
│  - content   │       N:1        │  - project_id│◄─────── Links to PROJECT
│  - sender_id │◄─────────────────│  - members[] │◄─────── Array of USER refs
│  - timestamp │  (sender_id)     │  - created_at│
└──────────────┘                  └──────────────┘

┌──────────────────────┐
│    GITEA_SETTINGS    │  (Singleton - only one document)
│                      │
│  - _id               │
│  - base_url          │
│  - admin_token       │
│  - org_name          │
│  - webhook_secret    │
│  - updated_at        │
└──────────────────────┘
```

---

## Relationship Summary Table

| Parent Collection | Child Collection | Relationship | Foreign Key | Description |
|-------------------|------------------|--------------|-------------|-------------|
| Users | Projects | 1:N | `created_by` | One student creates many projects |
| Users | Projects | 1:N | `supervisor_id` | One professor supervises many projects |
| Users | Projects | N:M | `team_members[]` | Many students can be in many projects |
| Projects | Milestones | 1:N | `project_id` | One project has many milestones |
| Projects | Feedback | 1:N | `project_id` | One project has many feedback messages |
| Projects | Files | 1:N | `project_id` | One project has many uploaded files |
| Projects | PushEvents | 1:N | `project_id` | One project has many push events from Gitea |
| Projects | ProgressUpdates | 1:N | `project_id` | One project has many progress updates |
| Projects | Conversations | 1:1 | `project_id` | One project has one conversation thread |
| Users | Feedback | 1:N | `author_id` | One user writes many feedback messages |
| Users | Messages | 1:N | `sender_id` | One user sends many messages |
| Users | AuditLogs | 1:N | `user_id` | One user generates many audit log entries |
| Conversations | Messages | 1:N | `conversation_id` | One conversation has many messages |
| Courses | Batches | 1:N | `course_id` | One course has many batches |
| Batches | Projects | 1:N | `batch_id` | One batch has many projects |
| Batches | Users | N:M | `students[]` | Many students in many batches |

---

## Complete Collection Schemas

### 1. Users Collection

```javascript
// Collection: users
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  
  // Authentication
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8                    // Store bcrypt hashed, never plain text
  },
  
  // Role & Permissions
  role: {
    type: String,
    enum: ['student', 'professor', 'admin'],
    required: true,
    default: 'student'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive'],
    default: 'pending'              // Admin must approve new accounts
  },
  
  // Personal Information
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    trim: true,
    match: /^[+]?[\d\s-]{10,15}$/
  },
  avatar: {
    type: String,                   // URL to profile picture
    default: null
  },
  
  // Academic Information (for students)
  university: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    enum: ['Computer Science', 'Information Technology', 'Electronics', 
           'Mechanical', 'Civil', 'Electrical', 'Other'],
    required: function() { return this.role === 'student'; }
  },
  session: {
    type: String,                   // e.g., "2024-25"
    trim: true
  },
  rollNumber: {
    type: String,
    trim: true,
    sparse: true                    // Unique but allows nulls
  },
  enrollmentNumber: {
    type: String,
    trim: true,
    sparse: true
  },
  
  // Gitea Integration
  giteaUsername: {
    type: String,
    sparse: true,
    unique: true
  },
  giteaToken: {
    type: String,                   // Encrypted personal access token
    select: false                   // Never return in queries by default
  },
  giteaLinkedAt: Date,
  
  // Notification Preferences
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    feedbackAlerts: { type: Boolean, default: true },
    deadlineReminders: { type: Boolean, default: true }
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLoginAt: Date,
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date
}

// Indexes
users.createIndex({ email: 1 }, { unique: true });
users.createIndex({ role: 1 });
users.createIndex({ status: 1 });
users.createIndex({ department: 1 });
users.createIndex({ rollNumber: 1 }, { sparse: true });
users.createIndex({ giteaUsername: 1 }, { sparse: true });
```

### 2. Projects Collection

```javascript
// Collection: projects
{
  _id: ObjectId,
  
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  
  // Status Workflow
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'submitted', 'under_review', 
           'changes_requested', 'approved', 'rejected', 'completed'],
    default: 'draft'
  },
  
  // Progress Tracking
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Relationships
  createdBy: {
    type: ObjectId,
    ref: 'Users',
    required: true,
    index: true
  },
  supervisorId: {
    type: ObjectId,
    ref: 'Users',
    required: true,
    index: true
  },
  teamMembers: [{
    type: ObjectId,
    ref: 'Users'
  }],
  batchId: {
    type: ObjectId,
    ref: 'Batches',
    index: true
  },
  
  // Gitea Repository Information
  repoUrl: {
    type: String,
    trim: true
  },
  repoName: {
    type: String,
    trim: true
  },
  repoOwner: {
    type: String,                   // Gitea username or org name
    trim: true
  },
  defaultBranch: {
    type: String,
    default: 'main'
  },
  cloneUrl: String,                 // Git clone URL
  
  // Activity Tracking
  lastPushAt: Date,
  lastActivityAt: { type: Date, default: Date.now },
  totalCommits: { type: Number, default: 0 },
  
  // Tech Stack Tags
  techStack: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Deadlines
  startDate: Date,
  dueDate: Date,
  submittedAt: Date,
  approvedAt: Date,
  
  // Grading
  grade: {
    score: { type: Number, min: 0, max: 100 },
    letter: { type: String, enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 
                                    'C+', 'C', 'C-', 'D', 'F', null] },
    gradedBy: { type: ObjectId, ref: 'Users' },
    gradedAt: Date,
    rubric: {
      codeQuality: { type: Number, min: 0, max: 25 },
      documentation: { type: Number, min: 0, max: 25 },
      functionality: { type: Number, min: 0, max: 25 },
      presentation: { type: Number, min: 0, max: 25 }
    },
    comments: String
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
projects.createIndex({ createdBy: 1 });
projects.createIndex({ supervisorId: 1 });
projects.createIndex({ status: 1 });
projects.createIndex({ batchId: 1 });
projects.createIndex({ dueDate: 1 });
projects.createIndex({ lastActivityAt: -1 });
projects.createIndex({ createdAt: -1 });
// Text index for search
projects.createIndex({ title: 'text', description: 'text' });
```

### 3. Milestones Collection

```javascript
// Collection: milestones
{
  _id: ObjectId,
  
  // Parent Reference
  projectId: {
    type: ObjectId,
    ref: 'Projects',
    required: true,
    index: true
  },
  
  // Milestone Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Dates
  dueDate: {
    type: Date,
    required: true
  },
  completedAt: Date,
  approvedAt: Date,
  
  // Review
  reviewedBy: {
    type: ObjectId,
    ref: 'Users'
  },
  reviewComment: String,
  reviewedAt: Date,
  
  // Ordering
  order: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
milestones.createIndex({ projectId: 1, order: 1 });
milestones.createIndex({ dueDate: 1 });
milestones.createIndex({ status: 1 });
```

### 4. Feedback Collection

```javascript
// Collection: feedback
{
  _id: ObjectId,
  
  // Parent Reference
  projectId: {
    type: ObjectId,
    ref: 'Projects',
    required: true,
    index: true
  },
  
  // Author
  authorId: {
    type: ObjectId,
    ref: 'Users',
    required: true
  },
  
  // Content
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000
  },
  
  // Type of feedback
  type: {
    type: String,
    enum: ['comment', 'review', 'request_changes', 'approval', 'system'],
    default: 'comment'
  },
  
  // Optional: Link to specific milestone
  milestoneId: {
    type: ObjectId,
    ref: 'Milestones'
  },
  
  // Optional: Link to specific file
  fileId: {
    type: ObjectId,
    ref: 'Files'
  },
  
  // Optional: Link to specific commit
  commitSha: String,
  
  // Read status
  readBy: [{
    userId: { type: ObjectId, ref: 'Users' },
    readAt: Date
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
feedback.createIndex({ projectId: 1, createdAt: -1 });
feedback.createIndex({ authorId: 1 });
feedback.createIndex({ type: 1 });
```

### 5. Files Collection

```javascript
// Collection: files
{
  _id: ObjectId,
  
  // Parent Reference
  projectId: {
    type: ObjectId,
    ref: 'Projects',
    required: true,
    index: true
  },
  
  // Uploader
  uploadedBy: {
    type: ObjectId,
    ref: 'Users',
    required: true
  },
  
  // File Information
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  storedName: {
    type: String,
    required: true                  // UUID or hashed filename on disk
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,                   // Size in bytes
    required: true
  },
  
  // Storage Location
  path: {
    type: String,
    required: true                  // Relative path on server
  },
  url: {
    type: String                    // Public URL if applicable
  },
  
  // File Category
  category: {
    type: String,
    enum: ['document', 'presentation', 'archive', 'image', 'other'],
    default: 'other'
  },
  
  // Version tracking
  version: {
    type: Number,
    default: 1
  },
  previousVersionId: {
    type: ObjectId,
    ref: 'Files'
  },
  
  // Timestamps
  uploadedAt: { type: Date, default: Date.now }
}

// Indexes
files.createIndex({ projectId: 1 });
files.createIndex({ uploadedBy: 1 });
files.createIndex({ uploadedAt: -1 });
```

### 6. Push Events Collection (Gitea Webhook Data)

```javascript
// Collection: push_events
{
  _id: ObjectId,
  
  // Parent Reference
  projectId: {
    type: ObjectId,
    ref: 'Projects',
    required: true,
    index: true
  },
  
  // Commit Information
  commitSha: {
    type: String,
    required: true
  },
  commitMessage: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  commitUrl: String,
  
  // Author (from Git, may differ from Gitea user)
  authorName: String,
  authorEmail: String,
  authorUsername: String,           // Gitea username if available
  
  // Branch Information
  branch: {
    type: String,
    required: true
  },
  ref: String,                      // Full ref like "refs/heads/main"
  
  // Push Details
  pushedAt: {
    type: Date,
    default: Date.now
  },
  
  // Files Changed (optional, for stats)
  filesAdded: [String],
  filesModified: [String],
  filesRemoved: [String],
  
  // Stats
  additions: Number,
  deletions: Number,
  
  // Raw Webhook Payload (for debugging)
  rawPayload: {
    type: Object,
    select: false                   // Don't include in normal queries
  }
}

// Indexes
push_events.createIndex({ projectId: 1, pushedAt: -1 });
push_events.createIndex({ commitSha: 1 });
push_events.createIndex({ pushedAt: -1 });
push_events.createIndex({ branch: 1 });
```

### 7. Progress Updates Collection

```javascript
// Collection: progress_updates
{
  _id: ObjectId,
  
  // Parent Reference
  projectId: {
    type: ObjectId,
    ref: 'Projects',
    required: true,
    index: true
  },
  
  // Progress Value
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  previousPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Optional Notes
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  
  // Who updated
  updatedBy: {
    type: ObjectId,
    ref: 'Users',
    required: true
  },
  
  // Timestamp
  createdAt: { type: Date, default: Date.now }
}

// Indexes
progress_updates.createIndex({ projectId: 1, createdAt: -1 });
```

### 8. Conversations Collection (Chat)

```javascript
// Collection: conversations
{
  _id: ObjectId,
  
  // Link to Project (one conversation per project)
  projectId: {
    type: ObjectId,
    ref: 'Projects',
    required: true,
    unique: true                    // Only one conversation per project
  },
  
  // Participants
  members: [{
    type: ObjectId,
    ref: 'Users',
    required: true
  }],
  
  // Last Activity
  lastMessageAt: Date,
  lastMessagePreview: {
    type: String,
    maxlength: 100
  },
  lastMessageBy: {
    type: ObjectId,
    ref: 'Users'
  },
  
  // Unread Tracking
  unreadCount: {
    type: Map,
    of: Number,                     // Map<UserId, UnreadCount>
    default: {}
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
conversations.createIndex({ projectId: 1 }, { unique: true });
conversations.createIndex({ members: 1 });
conversations.createIndex({ lastMessageAt: -1 });
```

### 9. Messages Collection (Chat Messages)

```javascript
// Collection: messages
{
  _id: ObjectId,
  
  // Parent Conversation
  conversationId: {
    type: ObjectId,
    ref: 'Conversations',
    required: true,
    index: true
  },
  
  // Sender
  senderId: {
    type: ObjectId,
    ref: 'Users',
    required: true
  },
  
  // Content
  content: {
    type: String,
    trim: true,
    maxlength: 10000
  },
  
  // Message Type
  type: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  
  // File Attachment (if type === 'file')
  attachment: {
    fileId: { type: ObjectId, ref: 'Files' },
    fileName: String,
    fileSize: Number,
    fileType: String,
    url: String
  },
  
  // Delivery Status
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Read Receipts
  readBy: [{
    userId: { type: ObjectId, ref: 'Users' },
    readAt: Date
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now }
}

// Indexes
messages.createIndex({ conversationId: 1, createdAt: 1 });
messages.createIndex({ senderId: 1 });
messages.createIndex({ createdAt: -1 });
```

### 10. Batches Collection

```javascript
// Collection: batches
{
  _id: ObjectId,
  
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Academic Year/Session
  year: {
    type: String,                   // e.g., "2024-25"
    required: true
  },
  semester: {
    type: Number,
    enum: [1, 2, 3, 4, 5, 6, 7, 8]
  },
  
  // Parent Course
  courseId: {
    type: ObjectId,
    ref: 'Courses',
    required: true,
    index: true
  },
  
  // Assigned Professor(s)
  supervisors: [{
    type: ObjectId,
    ref: 'Users'
  }],
  
  // Students in this batch
  students: [{
    type: ObjectId,
    ref: 'Users'
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
batches.createIndex({ courseId: 1 });
batches.createIndex({ year: 1 });
batches.createIndex({ status: 1 });
batches.createIndex({ supervisors: 1 });
```

### 11. Courses Collection

```javascript
// Collection: courses
{
  _id: ObjectId,
  
  // Course Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  
  // Department
  department: {
    type: String,
    required: true
  },
  
  // Credits/Duration
  credits: Number,
  durationWeeks: Number,
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
courses.createIndex({ code: 1 }, { unique: true });
courses.createIndex({ department: 1 });
courses.createIndex({ status: 1 });
```

### 12. Audit Logs Collection

```javascript
// Collection: audit_logs
{
  _id: ObjectId,
  
  // Who performed the action
  userId: {
    type: ObjectId,
    ref: 'Users',
    index: true
  },
  userEmail: String,                // Denormalized for quick display
  userRole: String,
  
  // What action was performed
  action: {
    type: String,
    required: true,
    enum: [
      // Auth
      'login', 'logout', 'login_failed', 'password_reset',
      // Users
      'user_created', 'user_updated', 'user_deleted', 'user_activated', 'user_suspended',
      // Projects
      'project_created', 'project_updated', 'project_deleted',
      'project_submitted', 'project_approved', 'project_rejected',
      // Milestones
      'milestone_created', 'milestone_completed', 'milestone_approved', 'milestone_rejected',
      // Gitea
      'repo_created', 'repo_linked', 'webhook_received', 'push_event',
      // Files
      'file_uploaded', 'file_deleted',
      // Admin
      'settings_updated', 'batch_created', 'course_created'
    ]
  },
  
  // Target of the action
  targetType: {
    type: String,
    enum: ['user', 'project', 'milestone', 'file', 'batch', 'course', 'settings']
  },
  targetId: ObjectId,
  targetName: String,               // Denormalized for display
  
  // Additional Details
  details: {
    type: Object,                   // Flexible schema for action-specific data
    default: {}
  },
  
  // Request Info
  ipAddress: String,
  userAgent: String,
  
  // Timestamp
  createdAt: { type: Date, default: Date.now }
}

// Indexes
audit_logs.createIndex({ createdAt: -1 });
audit_logs.createIndex({ userId: 1, createdAt: -1 });
audit_logs.createIndex({ action: 1 });
audit_logs.createIndex({ targetType: 1, targetId: 1 });

// TTL Index - Auto-delete logs older than 1 year
audit_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 31536000 });
```

### 13. Gitea Settings Collection (Singleton)

```javascript
// Collection: gitea_settings
{
  _id: ObjectId,
  
  // There should only be one document in this collection
  // Use findOneAndUpdate with upsert to ensure singleton
  
  // Gitea Server Configuration
  baseUrl: {
    type: String,
    required: true,
    trim: true                      // e.g., "https://git.yourschool.edu"
  },
  
  // Admin Access Token (encrypted)
  adminToken: {
    type: String,
    required: true
  },
  
  // Organization Settings
  organizationName: {
    type: String,
    trim: true                      // e.g., "student-projects"
  },
  defaultTeam: {
    type: String,
    default: 'Students'
  },
  
  // Repository Defaults
  defaultVisibility: {
    type: String,
    enum: ['private', 'public'],
    default: 'private'
  },
  repoNameTemplate: {
    type: String,
    default: '{year}-{rollno}-{title}'
  },
  
  // Webhook Configuration
  webhookSecret: {
    type: String,
    required: true
  },
  webhookUrl: String,               // Auto-generated callback URL
  
  // Connection Status
  lastConnectionTest: Date,
  connectionStatus: {
    type: String,
    enum: ['connected', 'error', 'unknown'],
    default: 'unknown'
  },
  connectionError: String,
  
  // Feature Toggles
  features: {
    allowStudentRepoCreation: { type: Boolean, default: true },
    allowBrowserEditing: { type: Boolean, default: false },
    requireBranchProtection: { type: Boolean, default: true },
    autoCreateWebhooks: { type: Boolean, default: true }
  },
  
  // Timestamps
  updatedAt: { type: Date, default: Date.now },
  updatedBy: {
    type: ObjectId,
    ref: 'Users'
  }
}
```

---

## Data Flow Examples

### Example 1: Student Creates a Project

```
1. Student submits form
   └─► POST /api/projects
       {
         title: "E-commerce Website",
         description: "...",
         supervisorId: "prof123",
         techStack: ["react", "node", "mongodb"]
       }

2. Backend creates project document
   └─► Insert into `projects` collection
       └─► Status: "draft"
       └─► Progress: 0

3. Backend creates Gitea repository (if requested)
   └─► POST to Gitea API: /api/v1/org/{org}/repos
   └─► Update project with repoUrl, cloneUrl

4. Backend creates conversation for chat
   └─► Insert into `conversations` collection
       └─► members: [studentId, professorId]
       └─► projectId: newProjectId

5. Backend creates audit log
   └─► Insert into `audit_logs`
       └─► action: "project_created"

6. Return new project to frontend
```

### Example 2: Gitea Webhook Push Event

```
1. Student pushes code to Gitea
   └─► Gitea sends webhook to /api/webhooks/gitea

2. Backend verifies HMAC signature
   └─► Compare X-Gitea-Signature header with computed hash

3. Backend finds project by repo URL
   └─► Query `projects` where repoUrl matches

4. Backend creates push_event document
   └─► Insert into `push_events` collection
       {
         projectId: "...",
         commitSha: "abc123",
         commitMessage: "Add login feature",
         branch: "main",
         pushedAt: new Date()
       }

5. Backend updates project
   └─► Update `projects` set lastPushAt, lastActivityAt, increment totalCommits

6. Backend sends real-time notification
   └─► WebSocket emit to professor: "New push from student"

7. Return 200 OK to Gitea
```

### Example 3: Professor Grades a Project

```
1. Professor submits grade form
   └─► PUT /api/projects/:id/grade
       {
         score: 85,
         rubric: { codeQuality: 22, documentation: 20, ... },
         comments: "Good work!"
       }

2. Backend updates project
   └─► Update `projects` set grade object
       └─► grade.score: 85
       └─► grade.letter: "B+" (calculated)
       └─► grade.gradedBy: professorId
       └─► grade.gradedAt: new Date()

3. Backend creates feedback entry
   └─► Insert into `feedback`
       └─► type: "review"
       └─► message: "Good work!"

4. Backend creates audit log
   └─► Insert into `audit_logs`
       └─► action: "project_graded"

5. Backend sends notification
   └─► WebSocket emit to student: "Your project has been graded"
   └─► Optional: Send email notification

6. Return updated project to frontend
```

---

## MongoDB Aggregation Pipeline Examples

### Get Professor Dashboard Data

```javascript
// Get all projects for a professor with student info and activity stats
db.projects.aggregate([
  // Match projects supervised by this professor
  { $match: { supervisorId: ObjectId("prof123") } },
  
  // Lookup student info
  { $lookup: {
      from: "users",
      localField: "createdBy",
      foreignField: "_id",
      as: "student"
  }},
  { $unwind: "$student" },
  
  // Lookup recent push events
  { $lookup: {
      from: "push_events",
      let: { projectId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$projectId", "$$projectId"] } } },
        { $sort: { pushedAt: -1 } },
        { $limit: 5 }
      ],
      as: "recentPushes"
  }},
  
  // Lookup milestone counts
  { $lookup: {
      from: "milestones",
      let: { projectId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$projectId", "$$projectId"] } } },
        { $group: {
            _id: "$status",
            count: { $sum: 1 }
        }}
      ],
      as: "milestoneCounts"
  }},
  
  // Calculate inactivity
  { $addFields: {
      daysSinceActivity: {
        $divide: [
          { $subtract: [new Date(), "$lastActivityAt"] },
          1000 * 60 * 60 * 24
        ]
      },
      isInactive: {
        $gt: [
          { $subtract: [new Date(), "$lastActivityAt"] },
          1000 * 60 * 60 * 24 * 7  // 7 days
        ]
      }
  }},
  
  // Project final shape
  { $project: {
      title: 1,
      status: 1,
      progress: 1,
      dueDate: 1,
      lastActivityAt: 1,
      daysSinceActivity: 1,
      isInactive: 1,
      repoUrl: 1,
      student: {
        _id: 1,
        fullName: 1,
        email: 1,
        rollNumber: 1
      },
      recentPushes: 1,
      milestoneCounts: 1
  }},
  
  // Sort by status priority then due date
  { $sort: { isInactive: -1, dueDate: 1 } }
]);
```

### Get Unread Message Counts for User

```javascript
db.conversations.aggregate([
  // Match conversations where user is a member
  { $match: { members: ObjectId("user123") } },
  
  // Get unread count for this specific user
  { $project: {
      projectId: 1,
      unreadCount: {
        $ifNull: [
          { $getField: { field: "user123", input: "$unreadCount" } },
          0
        ]
      }
  }},
  
  // Sum total unread
  { $group: {
      _id: null,
      totalUnread: { $sum: "$unreadCount" },
      conversations: { $push: { projectId: "$projectId", unread: "$unreadCount" } }
  }}
]);
```

---

## Quick Reference: Collection Sizes & Indexes

| Collection | Expected Size | Key Indexes | Sharding Key (if needed) |
|------------|---------------|-------------|--------------------------|
| users | 1K-10K docs | email, role | - |
| projects | 1K-50K docs | createdBy, supervisorId, status, batchId | createdBy |
| milestones | 5K-200K docs | projectId, status, dueDate | projectId |
| feedback | 10K-500K docs | projectId, authorId | projectId |
| files | 5K-100K docs | projectId, uploadedBy | projectId |
| push_events | 50K-1M docs | projectId, pushedAt | projectId |
| progress_updates | 10K-200K docs | projectId | projectId |
| conversations | 1K-50K docs | projectId (unique), members | - |
| messages | 100K-5M docs | conversationId, createdAt | conversationId |
| batches | 100-1K docs | courseId, year | - |
| courses | 50-500 docs | code (unique) | - |
| audit_logs | 100K-10M docs | createdAt (TTL), userId, action | createdAt |
| gitea_settings | 1 doc | - | - |

---

## Backend Implementation Checklist

```
[ ] Set up MongoDB connection with connection pooling
[ ] Create all 13 Mongoose models with schemas above
[ ] Create indexes (run once on startup or via migration)
[ ] Implement JWT authentication middleware
[ ] Implement role-based authorization middleware
[ ] Create CRUD routes for each collection
[ ] Implement Gitea API proxy service
[ ] Set up webhook endpoint with HMAC verification
[ ] Implement WebSocket server for real-time chat
[ ] Set up file upload with Multer + size/type validation
[ ] Create aggregation pipelines for dashboard stats
[ ] Implement audit logging middleware
[ ] Set up email notifications (optional)
[ ] Configure TTL index for audit log cleanup
[ ] Write API tests for each endpoint
```

---

## Environment Variables for MongoDB

```bash
# .env file

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/giteaforge
# Or for replica set:
# MONGODB_URI=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/giteaforge?replicaSet=rs0

# Connection Pool
MONGODB_POOL_SIZE=10
MONGODB_MAX_IDLE_TIME_MS=30000

# Database Name
MONGODB_DB_NAME=giteaforge

# For production with authentication:
# MONGODB_URI=mongodb://username:password@host:27017/giteaforge?authSource=admin
```

---

This database blueprint provides everything your backend developer needs to implement the complete data layer for GiteaForge.
