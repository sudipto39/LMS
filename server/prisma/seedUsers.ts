// prisma/seedUsers.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { prisma, disconnectDB } from "../src/config/db.js";
import bcrypt from "bcrypt";

async function main() {
  console.log("🌱 Seeding demo users, supervisors, projects, and group collaborations...\n");

  // 1. Get or create an active batch
  let batch = await prisma.batch.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  if (!batch) {
    console.log("⚠️ No active batch found. Creating default Course and Batch...");
    const course = await prisma.course.upsert({
      where: { code: "BTCSE" },
      update: {},
      create: {
        title: "B.Tech Computer Science & Engineering",
        code: "BTCSE",
        school: "School of Engineering & Technology",
        durationYears: 4,
      },
    });

    batch = await prisma.batch.upsert({
      where: { name: "B.Tech CSE (2023–2027)" },
      update: {},
      create: {
        name: "B.Tech CSE (2023–2027)",
        courseId: course.id,
        startYear: 2023,
        endYear: 2027,
        isActive: true,
      },
      select: { id: true, name: true },
    });
  }

  console.log(`📦 Using Batch: ${batch.name} (ID: ${batch.id})\n`);

  // Password hashes - strictly sourced from environment or secure defaults
  const studentPw = process.env.SEED_STUDENT_PASSWORD || process.env.SEED_DEFAULT_PASSWORD || "StudentPass123!";
  const supervisorPw = process.env.SEED_SUPERVISOR_PASSWORD || process.env.SEED_DEFAULT_PASSWORD || "SupervisorPass123!";
  const adminPw = process.env.SEED_ADMIN_PASSWORD || process.env.SEED_DEFAULT_PASSWORD || "AdminPass123!";

  const studentPasswordHash = await bcrypt.hash(studentPw, 12);
  const supervisorPasswordHash = await bcrypt.hash(supervisorPw, 12);
  const adminPasswordHash = await bcrypt.hash(adminPw, 12);

  // ─── 2. Supervisors (2 Users) ───────────────────────────────────────────────
  const supervisorsData = [
    {
      name: "Dr. Rajesh Sharma",
      email: "rajesh.sharma@lms.com",
      universityId: "SUP2024CS01",
      giteaUsername: "rajesh-sharma",
      phoneNumber: "9876543201",
      department: "Computer Science & Engineering",
      role: "SUPERVISOR" as const,
    },
    {
      name: "Prof. Ananya Roy",
      email: "ananya.roy@lms.com",
      universityId: "SUP2024CS02",
      giteaUsername: "ananya-roy",
      phoneNumber: "9876543202",
      department: "AI & Machine Learning",
      role: "SUPERVISOR" as const,
    },
  ];

  const supervisors: Record<string, { id: string; name: string; email: string }> = {};

  for (const s of supervisorsData) {
    const supervisor = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        name: s.name,
        universityId: s.universityId,
        giteaUsername: s.giteaUsername,
        phoneNumber: s.phoneNumber,
        department: s.department,
        role: s.role,
        isEmailVerified: true,
        password: supervisorPasswordHash,
      },
      create: {
        name: s.name,
        email: s.email,
        universityId: s.universityId,
        giteaUsername: s.giteaUsername,
        password: supervisorPasswordHash,
        phoneNumber: s.phoneNumber,
        department: s.department,
        role: s.role,
        isEmailVerified: true,
      },
    });
    supervisors[s.email] = supervisor;
    console.log(`👨‍🏫 Supervisor created/updated: ${supervisor.name} (${supervisor.email})`);
  }

  // Also retain legacy demo supervisor if needed
  await prisma.user.upsert({
    where: { email: "supervisor@lms.com" },
    update: { password: supervisorPasswordHash },
    create: {
      name: "Demo Supervisor",
      email: "supervisor@lms.com",
      universityId: "LMS2024SUPERVISOR01",
      giteaUsername: "supervisor",
      password: supervisorPasswordHash,
      phoneNumber: "9000000002",
      department: "Computer Science",
      role: "SUPERVISOR",
      isEmailVerified: true,
    },
  });

  // Admin user
  await prisma.user.upsert({
    where: { email: "admin@lms.com" },
    update: { password: adminPasswordHash },
    create: {
      name: "Demo Admin",
      email: "admin@lms.com",
      universityId: "LMS2024ADMIN01",
      giteaUsername: "admin-lms",
      password: adminPasswordHash,
      phoneNumber: "9000000003",
      department: "Administration",
      role: "ADMIN",
      isEmailVerified: true,
    },
  });

  console.log();

  // ─── 3. Students (8 Users) ──────────────────────────────────────────────────
  const studentsData = [
    {
      name: "Rahul Verma",
      email: "rahul.verma@lms.com",
      universityId: "STU2024CS001",
      giteaUsername: "rahul-verma",
      phoneNumber: "9123456001",
      department: "Computer Science",
    },
    {
      name: "Priya Patel",
      email: "priya.patel@lms.com",
      universityId: "STU2024CS002",
      giteaUsername: "priya-patel",
      phoneNumber: "9123456002",
      department: "Computer Science",
    },
    {
      name: "Amit Kumar",
      email: "amit.kumar@lms.com",
      universityId: "STU2024CS003",
      giteaUsername: "amit-kumar",
      phoneNumber: "9123456003",
      department: "Computer Science",
    },
    {
      name: "Sneha Das",
      email: "sneha.das@lms.com",
      universityId: "STU2024CS004",
      giteaUsername: "sneha-das",
      phoneNumber: "9123456004",
      department: "Computer Science",
    },
    {
      name: "Vikram Singh",
      email: "vikram.singh@lms.com",
      universityId: "STU2024CS005",
      giteaUsername: "vikram-singh",
      phoneNumber: "9123456005",
      department: "Computer Science",
    },
    {
      name: "Neha Gupta",
      email: "neha.gupta@lms.com",
      universityId: "STU2024CS006",
      giteaUsername: "neha-gupta",
      phoneNumber: "9123456006",
      department: "Computer Science",
    },
    {
      name: "Rohan Mehta",
      email: "rohan.mehta@lms.com",
      universityId: "STU2024CS007",
      giteaUsername: "rohan-mehta",
      phoneNumber: "9123456007",
      department: "Computer Science",
    },
    {
      name: "Tanvi Sharma",
      email: "tanvi.sharma@lms.com",
      universityId: "STU2024CS008",
      giteaUsername: "tanvi-sharma",
      phoneNumber: "9123456008",
      department: "Computer Science",
    },
  ];

  const students: Record<string, { id: string; name: string; email: string; giteaUsername: string | null }> = {};

  for (const s of studentsData) {
    const student = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        name: s.name,
        universityId: s.universityId,
        giteaUsername: s.giteaUsername,
        phoneNumber: s.phoneNumber,
        department: s.department,
        role: "STUDENT",
        isEmailVerified: true,
        password: studentPasswordHash,
      },
      create: {
        name: s.name,
        email: s.email,
        universityId: s.universityId,
        giteaUsername: s.giteaUsername,
        password: studentPasswordHash,
        phoneNumber: s.phoneNumber,
        department: s.department,
        role: "STUDENT",
        isEmailVerified: true,
      },
    });

    // Ensure batch enrollment
    await prisma.batchEnrollment.upsert({
      where: {
        userId_batchId: {
          userId: student.id,
          batchId: batch.id,
        },
      },
      update: {},
      create: {
        userId: student.id,
        batchId: batch.id,
      },
    });

    students[s.email] = student;
    console.log(`🎓 Student created/enrolled: ${student.name} (${student.email})`);
  }

  // Also retain legacy student@lms.com
  await prisma.user.upsert({
    where: { email: "student@lms.com" },
    update: { password: studentPasswordHash },
    create: {
      name: "Demo Student",
      email: "student@lms.com",
      universityId: "LMS2024STUDENT01",
      giteaUsername: "student",
      password: studentPasswordHash,
      phoneNumber: "9000000001",
      department: "Computer Science",
      role: "STUDENT",
      isEmailVerified: true,
      enrollments: {
        create: { batchId: batch.id },
      },
    },
  });

  console.log("\n📁 4. Seeding Projects & Group Projects...\n");

  const supRajesh = supervisors["rajesh.sharma@lms.com"]!;
  const supAnanya = supervisors["ananya.roy@lms.com"]!;

  const stuRahul = students["rahul.verma@lms.com"]!;
  const stuPriya = students["priya.patel@lms.com"]!;
  const stuAmit = students["amit.kumar@lms.com"]!;
  const stuSneha = students["sneha.das@lms.com"]!;
  const stuVikram = students["vikram.singh@lms.com"]!;
  const stuNeha = students["neha.gupta@lms.com"]!;
  const stuRohan = students["rohan.mehta@lms.com"]!;
  const stuTanvi = students["tanvi.sharma@lms.com"]!;

  // ─── Project definitions ─────────────────────────────────────────────────────
  const projectsList = [
    // 👥 GROUP PROJECT 1 (Owner: Rahul, Members: Priya, Amit, Sneha = 4 students)
    {
      title: "Automated Campus Navigation & Smart Parking System",
      description: "An IoT-enabled real-time campus navigation, slot booking, and smart parking guidance system.",
      repoName: "smart-campus-navigation",
      ownerId: stuRahul.id,
      supervisorId: supRajesh.id,
      technologies: ["React Native", "Node.js", "PostgreSQL", "IoT", "MQTT", "Docker"],
      status: "IN_PROGRESS" as const,
      groupMembers: [stuPriya.id, stuAmit.id, stuSneha.id],
      milestones: [
        {
          title: "System Architecture & SRS Documentation",
          description: "Define hardware sensor requirements, API contracts, and database schema.",
          status: "APPROVED" as const,
          order: 1,
          feedback: "Great initial architecture and clear ER diagram.",
          studentNotes: "Completed schema and sensor spec documentation.",
        },
        {
          title: "IoT Sensor Node & MQTT Gateway Integration",
          description: "Establish hardware telemetry communication with backend broker.",
          status: "IN_PROGRESS" as const,
          order: 2,
          studentNotes: "Connected ESP32 sensors to Mosquitto MQTT broker.",
        },
        {
          title: "Mobile App Navigation UI & Real-Time Map View",
          description: "Build interactive indoor map and parking occupancy visualization.",
          status: "PENDING" as const,
          order: 3,
        },
        {
          title: "Final Security Testing & Cloud Deployment",
          description: "End-to-end integration, load testing, and deployment to staging.",
          status: "PENDING" as const,
          order: 4,
        },
      ],
    },

    // 👥 GROUP PROJECT 2 (Owner: Priya, Members: Rahul, Amit, Sneha = 4 students)
    {
      title: "AI-Powered Academic Plagiarism & Code Integrity Detector",
      description: "Deep learning system utilizing AST analysis and CodeBERT embeddings to detect source code duplication.",
      repoName: "ai-code-integrity-detector",
      ownerId: stuPriya.id,
      supervisorId: supAnanya.id,
      technologies: ["Python", "FastAPI", "Transformers", "CodeBERT", "React", "PostgreSQL"],
      status: "IN_PROGRESS" as const,
      groupMembers: [stuRahul.id, stuAmit.id, stuSneha.id],
      milestones: [
        {
          title: "Dataset Collection & AST Parser Construction",
          description: "Build tree-sitter based AST parser for Python, Java, and C++ source code.",
          status: "APPROVED" as const,
          order: 1,
          feedback: "Robust AST extraction pipeline verified across languages.",
          studentNotes: "Parsed over 1,000 code repositories.",
        },
        {
          title: "CodeBERT Feature Embedding & Cosine Similarity Engine",
          description: "Vectorize code blocks and index in FAISS vector database.",
          status: "APPROVED" as const,
          order: 2,
          feedback: "Vector search latency is under 50ms. Excellent work.",
        },
        {
          title: "Supervisor Dashboard & Gitea Webhook Triggers",
          description: "Trigger automated integrity checks upon push events via Gitea webhooks.",
          status: "IN_PROGRESS" as const,
          order: 3,
          studentNotes: "Webhook receiver integrated and tested with mock payloads.",
        },
        {
          title: "Defense Presentation & Accuracy Benchmark Report",
          description: "Compile precision/recall benchmark against existing plagiarism detectors.",
          status: "PENDING" as const,
          order: 4,
        },
      ],
    },

    // 💻 Amit Kumar (Project 2)
    {
      title: "Decentralized Credential Verification on Blockchain",
      description: "Tamper-proof academic diploma and transcript verification protocol using Ethereum smart contracts.",
      repoName: "blockchain-credential-verifier",
      ownerId: stuAmit.id,
      supervisorId: supRajesh.id,
      technologies: ["Solidity", "Hardhat", "Ethers.js", "React", "IPFS"],
      status: "IN_PROGRESS" as const,
      groupMembers: [],
      milestones: [
        {
          title: "Smart Contract Design & Gas Optimization",
          description: "Write and test ERC-721 Soulbound token contracts for academic credentials.",
          status: "APPROVED" as const,
          order: 1,
          feedback: "Solid contract security and low gas footprint.",
        },
        {
          title: "IPFS Metadata Pinning & Issuer Portal",
          description: "University issuer dashboard to batch mint verified credentials.",
          status: "IN_PROGRESS" as const,
          order: 2,
        },
        {
          title: "Student Verification QR & Wallet Integration",
          description: "Public verification page with instant cryptographic proof validation.",
          status: "PENDING" as const,
          order: 3,
        },
      ],
    },

    // 💻 Sneha Das (Project 2)
    {
      title: "Healthcare Remote Patient Monitoring Dashboard",
      description: "Real-time vital signs monitoring and alert dispatch for hospital ICU & remote care wards.",
      repoName: "patient-vital-sentinel",
      ownerId: stuSneha.id,
      supervisorId: supAnanya.id,
      technologies: ["Next.js", "TailwindCSS", "Node.js", "WebSockets", "TimescaleDB"],
      status: "SUBMITTED" as const,
      groupMembers: [],
      milestones: [
        {
          title: "Telemetry Ingestion & Time-Series DB Setup",
          description: "High-throughput ingestion pipeline for heart rate, SpO2, and temperature.",
          status: "APPROVED" as const,
          order: 1,
        },
        {
          title: "Doctor Alerting System & WebSocket Streaming",
          description: "Real-time dynamic line charts and threshold-based SMS/Email alerts.",
          status: "APPROVED" as const,
          order: 2,
        },
        {
          title: "Final Security Audit & HIPAA Compliance Review",
          description: "End-to-end data encryption in transit and at rest.",
          status: "SUBMITTED" as const,
          order: 3,
          studentNotes: "Submitted final security audit documentation for supervisor sign-off.",
        },
      ],
    },

    // 💻 Rahul Verma (Project 2 - Solo)
    {
      title: "Cloud Cost Optimization & Anomaly Sentinel",
      description: "FinOps dashboard that detects infrastructure budget spikes and recommends right-sizing actions.",
      repoName: "cloud-cost-sentinel",
      ownerId: stuRahul.id,
      supervisorId: supRajesh.id,
      technologies: ["Python", "AWS SDK", "Grafana", "Terraform", "PostgreSQL"],
      status: "APPROVED" as const,
      groupMembers: [],
      milestones: [
        {
          title: "Cloud Cost Exporter & Metrics Scraper",
          description: "Extract AWS Cost Explorer and CloudWatch utilization metrics.",
          status: "APPROVED" as const,
          order: 1,
        },
        {
          title: "Anomaly Detection ML Model",
          description: "Isolation Forest model to identify unexpected egress and compute spikes.",
          status: "APPROVED" as const,
          order: 2,
        },
        {
          title: "Production Deployment & Automated Remediation",
          description: "Lambda triggers for stopping idle dev/staging instances.",
          status: "APPROVED" as const,
          order: 3,
        },
      ],
    },

    // 💻 Priya Patel (Project 2 - Solo)
    {
      title: "Real-Time Collaborative Code Editor",
      description: "Browser-based multiplayer code editing with Monaco editor, WebSockets, and CRDT synchronization.",
      repoName: "collaborative-code-editor",
      ownerId: stuPriya.id,
      supervisorId: supAnanya.id,
      technologies: ["React", "Monaco Editor", "Yjs", "WebSockets", "Node.js", "Redis"],
      status: "IN_PROGRESS" as const,
      groupMembers: [],
      milestones: [
        {
          title: "CRDT Integration with Monaco Editor",
          description: "Implement Yjs conflict-free replicated data types for multi-cursor sync.",
          status: "APPROVED" as const,
          order: 1,
        },
        {
          title: "Room Authorization & WebRTC Voice Chat",
          description: "Private room codes and peer-to-peer audio channels.",
          status: "IN_PROGRESS" as const,
          order: 2,
        },
        {
          title: "Integrated Code Execution Sandbox",
          description: "Isolated docker container runner for Python/JavaScript code snippets.",
          status: "PENDING" as const,
          order: 3,
        },
      ],
    },

    // 💻 Vikram Singh (Project 1)
    {
      title: "Autonomous Drone Flight Controller & Collision Avoidance",
      description: "Computer vision based flight stabilization and dynamic obstacle avoidance for quadcopters.",
      repoName: "drone-collision-avoidance",
      ownerId: stuVikram.id,
      supervisorId: supRajesh.id,
      technologies: ["C++", "ROS2", "OpenCV", "YOLOv8", "Gazebo Simulator"],
      status: "IN_PROGRESS" as const,
      groupMembers: [stuRahul.id, stuAmit.id],
      milestones: [
        {
          title: "Gazebo Simulation Environment & PID Tuning",
          description: "Setup quadcopter physics model and tune pitch/roll/yaw PID loops.",
          status: "APPROVED" as const,
          order: 1,
        },
        {
          title: "YOLOv8 Real-Time Obstacle Detection Node",
          description: "Depth camera sensor processing and obstacle bounding box pipeline.",
          status: "IN_PROGRESS" as const,
          order: 2,
        },
        {
          title: "Hardware Bench Flight Testing",
          description: "Real flight test with Raspberry Pi 4 companion computer.",
          status: "PENDING" as const,
          order: 3,
        },
      ],
    },

    // 💻 Vikram Singh (Project 2)
    {
      title: "Edge-AI Smart Surveillance & Intrusion Detection",
      description: "Low-power embedded vision system for automated perimeter security and license plate recognition.",
      repoName: "edge-ai-surveillance",
      ownerId: stuVikram.id,
      supervisorId: supAnanya.id,
      technologies: ["Python", "TensorRT", "NVIDIA Jetson", "FastAPI", "PostgreSQL"],
      status: "APPROVED" as const,
      groupMembers: [stuSneha.id],
      milestones: [
        {
          title: "TensorRT Model Quantization (FP16/INT8)",
          description: "Quantize detection models for 60fps inference on Jetson Nano.",
          status: "APPROVED" as const,
          order: 1,
        },
        {
          title: "Alert Pipeline & RTSP Stream Ingestion",
          description: "Multi-camera RTSP decoding and immediate push notification dispatcher.",
          status: "APPROVED" as const,
          order: 2,
        },
        {
          title: "Final Security Review & Field Deployment",
          description: "Installed on perimeter cameras with 99.4% uptime.",
          status: "APPROVED" as const,
          order: 3,
        },
      ],
    },

    // 💻 Neha Gupta (Project 1)
    {
      title: "NLP-Driven Resume Parser & Candidate Matching Engine",
      description: "Semantic skill extraction and candidate scoring platform using fine-tuned transformer models.",
      repoName: "nlp-resume-matcher",
      ownerId: stuNeha.id,
      supervisorId: supAnanya.id,
      technologies: ["Python", "Spacy", "Transformers", "React", "FastAPI", "MongoDB"],
      status: "SUBMITTED" as const,
      groupMembers: [stuPriya.id],
      milestones: [
        {
          title: "PDF & DOCX Named Entity Recognition (NER) Pipeline",
          description: "Custom NER model to extract education, experience, and tech stacks.",
          status: "APPROVED" as const,
          order: 1,
        },
        {
          title: "Job Description Semantic Relevance Scorer",
          description: "Cosine similarity engine comparing candidate embeddings with job posts.",
          status: "APPROVED" as const,
          order: 2,
        },
        {
          title: "Recruiter Web App & Export Tooling",
          description: "Comprehensive UI for filtering and ranking candidates with one-click export.",
          status: "SUBMITTED" as const,
          order: 3,
        },
      ],
    },

    // 💻 Neha Gupta (Project 2)
    {
      title: "Microservices-Based E-Commerce Order Pipeline",
      description: "Resilient event-driven microservices architecture using RabbitMQ, Redis, and PostgreSQL.",
      repoName: "ecommerce-order-pipeline",
      ownerId: stuNeha.id,
      supervisorId: supRajesh.id,
      technologies: ["Node.js", "TypeScript", "RabbitMQ", "PostgreSQL", "Docker", "Jest"],
      status: "IN_PROGRESS" as const,
      groupMembers: [stuVikram.id, stuRohan.id],
      milestones: [
        {
          title: "Saga Pattern Implementation for Distributed Transactions",
          description: "Ensure consistency across Inventory, Payment, and Shipping services.",
          status: "APPROVED" as const,
          order: 1,
        },
        {
          title: "Dead Letter Queue & Auto-Retry Mechanism",
          description: "Handle transient third-party payment gateway failures gracefully.",
          status: "IN_PROGRESS" as const,
          order: 2,
        },
        {
          title: "Chaos Engineering & Load Benchmark",
          description: "Stress test system up to 5,000 orders/sec under simulated network faults.",
          status: "PENDING" as const,
          order: 3,
        },
      ],
    },

    // 💻 Rohan Mehta (Project 1)
    {
      title: "Distributed Key-Value Store with Raft Consensus",
      description: "Fault-tolerant, high-performance distributed key-value storage engine implementing the Raft protocol.",
      repoName: "raft-distributed-kv",
      ownerId: stuRohan.id,
      supervisorId: supRajesh.id,
      technologies: ["Go", "gRPC", "Raft Consensus", "Protobuf", "Docker"],
      status: "IN_PROGRESS" as const,
      groupMembers: [stuVikram.id],
      milestones: [
        {
          title: "Leader Election & Heartbeat Protocol",
          description: "Implement term elections, randomized election timers, and append entries RPC.",
          status: "APPROVED" as const,
          order: 1,
        },
        {
          title: "Log Replication & State Machine Commitment",
          description: "Replicate key-value mutations and commit to local LSM-tree state store.",
          status: "IN_PROGRESS" as const,
          order: 2,
        },
        {
          title: "Dynamic Cluster Membership & Snapshotting",
          description: "Support node addition/removal and Raft log compaction with snapshots.",
          status: "PENDING" as const,
          order: 3,
        },
      ],
    },

    // 💻 Rohan Mehta (Project 2)
    {
      title: "Kubernetes Cluster Auto-Scaling Metric Analyzer",
      description: "Custom Kubernetes metrics adapter providing predictive pod autoscaling based on queue depth.",
      repoName: "k8s-predictive-autoscaler",
      ownerId: stuRohan.id,
      supervisorId: supAnanya.id,
      technologies: ["Go", "Kubernetes API", "Prometheus", "Helm", "Docker"],
      status: "DRAFT" as const,
      groupMembers: [],
      milestones: [
        {
          title: "Prometheus Metric Collector Operator",
          description: "K8s Custom Resource Definition (CRD) to monitor queue latency.",
          status: "IN_PROGRESS" as const,
          order: 1,
        },
        {
          title: "Custom Metrics API Implementation",
          description: "Expose external metrics to Kubernetes Horizontal Pod Autoscaler (HPA).",
          status: "PENDING" as const,
          order: 2,
        },
      ],
    },

    // 💻 Tanvi Sharma (Project 1)
    {
      title: "Federated Learning for Privacy-Preserving Medical Imaging",
      description: "Distributed collaborative model training across decentralized healthcare nodes without raw data sharing.",
      repoName: "federated-medical-imaging",
      ownerId: stuTanvi.id,
      supervisorId: supAnanya.id,
      technologies: ["Python", "PyTorch", "PySyft", "FastAPI", "Docker"],
      status: "IN_PROGRESS" as const,
      groupMembers: [stuNeha.id, stuRohan.id],
      milestones: [
        {
          title: "Local Node X-Ray Classification Model",
          description: "DenseNet-121 backbone trained on chest X-ray abnormalities.",
          status: "APPROVED" as const,
          order: 1,
        },
        {
          title: "FedAvg Weight Aggregator & Differential Privacy",
          description: "Federated averaging server with gradient clipping and Laplace noise addition.",
          status: "IN_PROGRESS" as const,
          order: 2,
        },
        {
          title: "Byzantine-Robust Defense against Malicious Updates",
          description: "Detect and reject poisoned model weight updates from compromised client nodes.",
          status: "PENDING" as const,
          order: 3,
        },
      ],
    },

    // 💻 Tanvi Sharma (Project 2)
    {
      title: "Secure Zero-Trust Identity & Access Management Gateway",
      description: "Context-aware API gateway enforcing mTLS, continuous token verification, and device posture checks.",
      repoName: "zero-trust-iam-gateway",
      ownerId: stuTanvi.id,
      supervisorId: supRajesh.id,
      technologies: ["Go", "Open Policy Agent (OPA)", "OAuth2/OIDC", "Redis", "Envoy Proxy"],
      status: "APPROVED" as const,
      groupMembers: [stuPriya.id, stuAmit.id],
      milestones: [
        {
          title: "mTLS Certificate Authority & Envoy Config",
          description: "Automated client certificate issuance and bidirectional TLS termination.",
          status: "APPROVED" as const,
          order: 1,
        },
        {
          title: "OPA Rego Authorization Policy Engine",
          description: "Attribute-based access control (ABAC) evaluating location, time, and role.",
          status: "APPROVED" as const,
          order: 2,
        },
        {
          title: "Single Sign-On (SSO) Portal & Audit Trail",
          description: "OIDC compliant SSO interface with immutable audit logging.",
          status: "APPROVED" as const,
          order: 3,
        },
      ],
    },
  ];

  for (const p of projectsList) {
    // Check if project with same title and owner already exists
    let project = await prisma.project.findFirst({
      where: {
        title: p.title,
        ownerId: p.ownerId,
      },
    });

    const giteaRoot = (process.env["GITEA_BASE_URL"] || "http://localhost:3000").replace("/api/v1", "");
    const repoUrl = `${giteaRoot}/${(await prisma.user.findUnique({ where: { id: p.ownerId } }))?.giteaUsername || "user"}/${p.repoName}.git`;

    if (!project) {
      project = await prisma.project.create({
        data: {
          title: p.title,
          description: p.description,
          repoName: p.repoName,
          repoUrl,
          ownerId: p.ownerId,
          supervisorId: p.supervisorId,
          batchId: batch.id,
          technologies: p.technologies,
          status: p.status,
          phase: 1,
        },
      });
      console.log(`📌 Created Project: "${project.title}" (Status: ${project.status})`);
    } else {
      project = await prisma.project.update({
        where: { id: project.id },
        data: {
          description: p.description,
          repoName: p.repoName,
          repoUrl,
          supervisorId: p.supervisorId,
          batchId: batch.id,
          technologies: p.technologies,
          status: p.status,
        },
      });
      console.log(`🔄 Updated Project: "${project.title}" (Status: ${project.status})`);
    }

    // ─── Project Members (Group Collaboration) ────────────────────────────────
    if (p.groupMembers && p.groupMembers.length > 0) {
      for (const memberId of p.groupMembers) {
        await prisma.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: project.id,
              userId: memberId,
            },
          },
          update: {},
          create: {
            projectId: project.id,
            userId: memberId,
          },
        });
      }
      console.log(`   👥 Linked ${p.groupMembers.length} group members to "${project.title}"`);
    }

    // ─── Milestones ───────────────────────────────────────────────────────────
    if (p.milestones && p.milestones.length > 0) {
      for (const m of p.milestones) {
        const existingMilestone = await prisma.milestone.findFirst({
          where: {
            projectId: project.id,
            title: m.title,
          },
        });

        const isApproved = m.status === "APPROVED";
        const isSubmitted = m.status === "SUBMITTED" || isApproved;
        const feedbackVal = (m as any).feedback || (isApproved ? "Approved by supervisor. Quality standards met." : null);
        const notesVal = (m as any).studentNotes || (isSubmitted ? "Submitted artifacts and code repository links." : null);

        if (!existingMilestone) {
          await prisma.milestone.create({
            data: {
              title: m.title,
              description: m.description,
              status: m.status,
              order: m.order,
              projectId: project.id,
              feedback: feedbackVal,
              studentNotes: notesVal,
              reviewedById: isApproved ? p.supervisorId : null,
              submittedById: isSubmitted ? p.ownerId : null,
              submittedAt: isSubmitted ? new Date(Date.now() - 86400000 * 3) : null,
              reviewedAt: isApproved ? new Date(Date.now() - 86400000 * 1) : null,
              dueDate: new Date(Date.now() + 86400000 * 14 * m.order),
            },
          });
        } else {
          await prisma.milestone.update({
            where: { id: existingMilestone.id },
            data: {
              description: m.description,
              status: m.status,
              order: m.order,
              feedback: feedbackVal,
              studentNotes: notesVal,
              reviewedById: isApproved ? p.supervisorId : null,
              submittedById: isSubmitted ? p.ownerId : null,
            },
          });
        }
      }
      console.log(`   🎯 Seeded ${p.milestones.length} milestones for "${project.title}"`);
    }
  }

  console.log("\n=================================================================");
  console.log("🎉 Seeding Complete! Summary of Demo Accounts & Projects:");
  console.log("=================================================================");
  console.log("\n👨‍🏫 SUPERVISORS (Accounts Provisioned):");
  console.log("  1. rajesh.sharma@lms.com   (Dr. Rajesh Sharma, ID: SUP2024CS01, Gitea: rajesh-sharma)");
  console.log("  2. ananya.roy@lms.com      (Prof. Ananya Roy,  ID: SUP2024CS02, Gitea: ananya-roy)");
  console.log("\n🎓 STUDENTS (Accounts Provisioned):");
  console.log("  1. rahul.verma@lms.com     (Rahul Verma,  ID: STU2024CS001, Gitea: rahul-verma) [GROUP ALPHA LEAD]");
  console.log("  2. priya.patel@lms.com     (Priya Patel,  ID: STU2024CS002, Gitea: priya-patel) [GROUP ALPHA LEAD]");
  console.log("  3. amit.kumar@lms.com      (Amit Kumar,   ID: STU2024CS003, Gitea: amit-kumar)  [GROUP ALPHA MEMBER]");
  console.log("  4. sneha.das@lms.com       (Sneha Das,    ID: STU2024CS004, Gitea: sneha-das)   [GROUP ALPHA MEMBER]");
  console.log("  5. vikram.singh@lms.com    (Vikram Singh, ID: STU2024CS005, Gitea: vikram-singh)");
  console.log("  6. neha.gupta@lms.com      (Neha Gupta,   ID: STU2024CS006, Gitea: neha-gupta)");
  console.log("  7. rohan.mehta@lms.com     (Rohan Mehta,  ID: STU2024CS007, Gitea: rohan-mehta)");
  console.log("  8. tanvi.sharma@lms.com    (Tanvi Sharma, ID: STU2024CS008, Gitea: tanvi-sharma)");
  console.log("\n👥 GROUP COLLABORATIONS (4 Members in each group):");
  console.log("  • Automated Campus Navigation: Owner = Rahul Verma | Members = Priya, Amit, Sneha");
  console.log("  • AI Plagiarism & Code Integrity: Owner = Priya Patel | Members = Rahul, Amit, Sneha");
  console.log("\n📊 TOTAL PROJECTS: 14 projects seeded with active milestones & statuses.");
  console.log("=================================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });