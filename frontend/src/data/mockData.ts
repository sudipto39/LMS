// src/data/mockData.ts
import type {
  Course,
  Batch,
  Project,
  Milestone,
  Feedback,
  ProjectFile,
  ActivityItem,
  AuditLogItem,
  ProblemStatement,
} from "../types";

export const initialCourses: Course[] = [];
export const initialBatches: Batch[] = [];
export const initialProjects: Project[] = [];
export const initialMilestones: Milestone[] = [];
export const initialFeedbacks: Feedback[] = [];
export const initialFiles: ProjectFile[] = [];
export const initialActivities: ActivityItem[] = [];
export const initialAuditLogs: AuditLogItem[] = [];

export const DEFAULT_PROBLEM_STATEMENTS: ProblemStatement[] = [
  {
    id: "ps_1",
    title: "Decentralized Electronic Health Records & Medical Consent System",
    description: "Zero-knowledge proofs and IPFS storage on Ethereum for privacy-preserving clinical EHR records.",
    domain: "Web3 & Blockchain",
    technologies: ["Solidity", "IPFS", "Next.js", "Ethereum"],
    difficulty: "ADVANCED",
    status: "APPROVED",
    maxSelections: 3,
    creatorId: "sup_1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ps_2",
    title: "Autonomous Micro-Drone Indoor Navigation in GPS-Denied Arenas",
    description: "Visual SLAM and edge neural network inference for autonomous obstacle avoidance.",
    domain: "AI / Machine Learning",
    technologies: ["Python", "PyTorch", "ROS2", "OpenCV"],
    difficulty: "ADVANCED",
    status: "APPROVED",
    maxSelections: 2,
    creatorId: "sup_1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ps_3",
    title: "Cloud-Native Microservices CI/CD Pipeline with Predictive Anomaly Detection",
    description: "Automated canary deployments with real-time log ingestion and Prometheus/Grafana anomaly detection algorithms.",
    domain: "Cloud & DevOps",
    technologies: ["Kubernetes", "Docker", "Go", "Prometheus"],
    difficulty: "INTERMEDIATE",
    status: "APPROVED",
    maxSelections: 3,
    creatorId: "sup_1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ps_4",
    title: "High-Frequency Algorithmic Trading & Ultra-Low-Latency Order Matching Engine",
    description: "Low-latency order matching engine implementing FIX protocol and limit order book with sub-millisecond execution.",
    domain: "FinTech",
    technologies: ["C++20", "Rust", "WebSocket", "Redis"],
    difficulty: "ADVANCED",
    status: "APPROVED",
    maxSelections: 2,
    creatorId: "sup_1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
