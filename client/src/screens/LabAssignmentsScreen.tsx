// src/screens/LabAssignmentsScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  FlaskConical,
  Target,
  Plus,
  CheckCircle2,
  Code2,
  Users,
  Trash2,
  ArrowRight,
  BookOpen,
  Eye,
  RotateCcw,
  Layers,
  Folder,
  FolderOpen,
  FolderPlus,
  ArrowLeft,
  Edit3,
  Power,
  PowerOff,
  AlertTriangle,
  X,
  Clock,
  FileText,
} from "lucide-react";
import { Card, Inp, Btn, Btn2, Pill } from "../components/common/UIPrimitives";
import FillingBeakerLoader from "../components/common/FillingBeakerLoader";
import { StudentLabPdfSubmitModal } from "../components/modals/StudentLabPdfSubmitModal";
import { labsApi, batchesApi } from "../api";
import { downloadFileBlob } from "../utils/fileDownload";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { Batch, LabAssignment, LabSubmission } from "../types";

export const DEMO_LAB_ASSIGNMENTS: LabAssignment[] = [
  {
    id: "demo_lab_1",
    title: "Lab 1: Binary Search Tree In-Order Traversal",
    subject: "Data Structures & Algorithms",
    objective: "Master recursive tree traversals and logarithmic search operations in binary search trees.",
    description: "Given an array of integers, construct a BST and print its sorted in-order traversal followed by the target element search result.",
    language: "all",
    totalPoints: 100,
    timeLimit: 2.0,
    memoryLimit: 128000,
    batchId: "batch_2024",
    batch: { id: "batch_2024", name: "Batch 2024–2028" },
    creatorId: "sup_1",
    creator: { id: "sup_1", name: "Dr. Rajesh Sharma", email: "rajesh.sharma@lms.com" },
    status: "PUBLISHED",
    startDate: new Date().toISOString(),
    allowLate: false,
    testCases: [
      { id: "tc1", input: "5\n4 2 5 1 3", expectedOutput: "1 2 3 4 5", isHidden: false, weight: 50 },
      { id: "tc2", input: "3\n10 5 15", expectedOutput: "5 10 15", isHidden: true, weight: 50 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo_lab_2",
    title: "Lab 2: Dynamic Programming - Longest Increasing Subsequence",
    subject: "Data Structures & Algorithms",
    objective: "Formulate optimal substructure and overlapping subproblems using memoization and DP tables.",
    description: "Given an integer array nums, return the length of the longest strictly increasing subsequence with O(N log N) patience sorting.",
    language: "all",
    totalPoints: 100,
    timeLimit: 2.0,
    memoryLimit: 128000,
    batchId: "batch_2024",
    batch: { id: "batch_2024", name: "Batch 2024–2028" },
    creatorId: "sup_1",
    creator: { id: "sup_1", name: "Dr. Rajesh Sharma", email: "rajesh.sharma@lms.com" },
    status: "PUBLISHED",
    startDate: new Date().toISOString(),
    allowLate: false,
    testCases: [
      { id: "tc1", input: "8\n10 9 2 5 3 7 101 18", expectedOutput: "4", isHidden: false, weight: 50 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo_lab_3",
    title: "Lab 3: Round Robin & Multi-Level Feedback Queue Scheduler",
    subject: "Operating Systems",
    objective: "Simulate preemptive Round-Robin scheduling algorithm with quantum time slice and calculate average turnaround & waiting time.",
    description: "Implement a process scheduler that takes quantum slice Q and process arrival/burst pairs, calculating execution timelines.",
    language: "all",
    totalPoints: 100,
    timeLimit: 2.0,
    memoryLimit: 128000,
    batchId: "batch_2024",
    batch: { id: "batch_2024", name: "Batch 2024–2028" },
    creatorId: "sup_1",
    creator: { id: "sup_1", name: "Dr. Rajesh Sharma", email: "rajesh.sharma@lms.com" },
    status: "PUBLISHED",
    startDate: new Date().toISOString(),
    allowLate: false,
    testCases: [
      { id: "tc1", input: "2\n3\n0 5\n1 3\n2 8", expectedOutput: "Avg Waiting Time: 5.33", isHidden: false, weight: 50 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo_lab_4",
    title: "Lab 4: Strict 2-Phase Locking (2PL) Concurrency Protocol",
    subject: "Database Management Systems (DBMS)",
    objective: "Implement Strict 2-Phase Locking to prevent dirty reads and lost updates across concurrent database transactions.",
    description: "Read transaction sequence operations and grant Shared (S) or Exclusive (X) locks, detecting conflict serializability.",
    language: "all",
    totalPoints: 100,
    timeLimit: 2.0,
    memoryLimit: 128000,
    batchId: "batch_2024",
    batch: { id: "batch_2024", name: "Batch 2024–2028" },
    creatorId: "sup_1",
    creator: { id: "sup_1", name: "Dr. Rajesh Sharma", email: "rajesh.sharma@lms.com" },
    status: "PUBLISHED",
    startDate: new Date().toISOString(),
    allowLate: false,
    testCases: [
      { id: "tc1", input: "T1: R(A), W(A)\nT2: R(A)", expectedOutput: "SERIALIZABLE: TRUE", isHidden: false, weight: 50 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo_lab_5",
    title: "Lab 5: Dijkstra Link-State Shortest Path Routing Protocol",
    subject: "Computer Networks",
    objective: "Implement Link-State Routing algorithm using Dijkstra's shortest path mechanism for packet forward tables.",
    description: "Given an network graph topology of routers and edge costs, compute the routing forwarding table from source node.",
    language: "all",
    totalPoints: 100,
    timeLimit: 2.0,
    memoryLimit: 128000,
    batchId: "batch_2024",
    batch: { id: "batch_2024", name: "Batch 2024–2028" },
    creatorId: "sup_1",
    creator: { id: "sup_1", name: "Dr. Rajesh Sharma", email: "rajesh.sharma@lms.com" },
    status: "PUBLISHED",
    startDate: new Date().toISOString(),
    allowLate: false,
    testCases: [
      { id: "tc1", input: "4\n0 1 1\n0 2 4\n1 2 2\n2 3 1", expectedOutput: "0->1:1 0->2:3 0->3:4", isHidden: false, weight: 50 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface LabAssignmentsScreenProps {
  batches: Batch[];
  onOpenCreateModal: (subjectPreset?: string) => void;
  onOpenRosterModal: (assignmentId: string) => void;
  onOpenSandboxWithAssignment: (assignment: LabAssignment) => void;
  searchQuery?: string;
}

export const LabAssignmentsScreen: React.FC<LabAssignmentsScreenProps> = ({
  batches,
  onOpenCreateModal,
  onOpenRosterModal,
  onOpenSandboxWithAssignment,
  searchQuery = "",
}) => {
  const { role, user } = useAuth();
  const showToast = useToast();

  const [liveBatches, setLiveBatches] = useState<Batch[]>(batches || []);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [assignments, setAssignments] = useState<LabAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Folder Navigation State
  const [selectedSubjectFolder, setSelectedSubjectFolder] = useState<string | null>(null);

  // Student PDF Submission Modal State
  const [pdfSubmitAssignment, setPdfSubmitAssignment] = useState<LabAssignment | null>(null);

  // Folder CRUD Modals State
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [renameOldName, setRenameOldName] = useState("");
  const [renameNewName, setRenameNewName] = useState("");

  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [deleteTargetFolderName, setDeleteTargetFolderName] = useState("");

  const [folderActionLoading, setFolderActionLoading] = useState(false);

  const handlePdfSubmissionSuccess = (newSub: LabSubmission) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === newSub.assignmentId
          ? {
              ...a,
              mySubmission: newSub,
              mySubmissions: [newSub, ...(a.mySubmissions || [])],
              submissionCount: (a.submissionCount || 0) + 1,
            }
          : a
      )
    );
  };

  useEffect(() => {
    if (batches && batches.length > 0) {
      setLiveBatches(batches);
    } else {
      batchesApi
        .getAllBatches()
        .then((res) => {
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            setLiveBatches(res.data);
          }
        })
        .catch(() => {});
    }
  }, [batches]);

  const isSupervisorOrAdmin = role === "SUPERVISOR" || role === "ADMIN";

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const batchParam = isSupervisorOrAdmin && selectedBatchId !== "all" ? selectedBatchId : undefined;
      const res = await labsApi.getLabAssignments(batchParam);
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setAssignments(res.data);
      } else if (!user?.id || user.id.startsWith("demo_") || !res?.data || res.data.length === 0) {
        setAssignments(DEMO_LAB_ASSIGNMENTS);
      } else {
        setAssignments([]);
      }
    } catch {
      setAssignments(DEMO_LAB_ASSIGNMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [selectedBatchId]);

  // ── Lab Status & Deletion Handlers ──────────────────────────────────────────
  const handleToggleLabStatus = async (lab: LabAssignment) => {
    const nextStatus = lab.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED";
    try {
      await labsApi.updateLabAssignment(lab.id, { status: nextStatus });
      showToast(`Lab "${lab.title}" ${nextStatus === "PUBLISHED" ? "Activated (Live)" : "Deactivated (Archived)"}`);
      setAssignments((prev) =>
        prev.map((a) => (a.id === lab.id ? { ...a, status: nextStatus } : a))
      );
    } catch (err: any) {
      showToast(err?.message || "Failed to update lab status");
    }
  };

  const handleDeleteAssignment = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await labsApi.deleteLabAssignment(id);
      showToast(`Lab "${title}" deleted`);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      showToast(err?.message || "Failed to delete lab assignment");
    }
  };

  // ── Subject Folder CRUD Handlers ────────────────────────────────────────────
  const handleCreateNewFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      showToast("Please provide a subject folder name");
      return;
    }
    setShowCreateFolderModal(false);
    setNewFolderName("");
    // Opens assignment modal pre-configured with this subject
    onOpenCreateModal(trimmed);
  };

  const handleRenameFolder = async () => {
    const trimmed = renameNewName.trim();
    if (!trimmed || trimmed === renameOldName) {
      setShowRenameFolderModal(false);
      return;
    }
    setFolderActionLoading(true);
    try {
      await labsApi.renameSubjectFolder(renameOldName, trimmed, selectedBatchId !== "all" ? selectedBatchId : undefined);
      showToast(`Subject folder renamed to "${trimmed}"`);
      setAssignments((prev) =>
        prev.map((a) => {
          const currentSubject = a.subject?.trim() || a.batch?.course?.title?.trim() || "General Programming";
          if (currentSubject === renameOldName) {
            return { ...a, subject: trimmed };
          }
          return a;
        })
      );
      if (selectedSubjectFolder === renameOldName) {
        setSelectedSubjectFolder(trimmed);
      }
      setShowRenameFolderModal(false);
    } catch (err: any) {
      showToast(err?.message || "Failed to rename subject folder");
    } finally {
      setFolderActionLoading(false);
    }
  };

  const handleToggleFolderStatus = async (folderName: string, currentlyActive: boolean) => {
    const nextStatus = currentlyActive ? "ARCHIVED" : "PUBLISHED";
    const actionLabel = currentlyActive ? "Deactivate" : "Activate";
    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel.toLowerCase()} all experiments in "${folderName}"?`
      )
    )
      return;

    setFolderActionLoading(true);
    try {
      await labsApi.toggleSubjectFolderStatus(
        folderName,
        nextStatus,
        selectedBatchId !== "all" ? selectedBatchId : undefined
      );
      showToast(`Folder "${folderName}" ${nextStatus === "PUBLISHED" ? "Activated" : "Deactivated"}`);
      setAssignments((prev) =>
        prev.map((a) => {
          const currentSubject = a.subject?.trim() || a.batch?.course?.title?.trim() || "General Programming";
          if (currentSubject === folderName) {
            return { ...a, status: nextStatus };
          }
          return a;
        })
      );
    } catch (err: any) {
      showToast(err?.message || "Failed to update folder status");
    } finally {
      setFolderActionLoading(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteTargetFolderName) return;
    setFolderActionLoading(true);
    try {
      await labsApi.deleteSubjectFolder(
        deleteTargetFolderName,
        selectedBatchId !== "all" ? selectedBatchId : undefined
      );
      showToast(`Subject folder "${deleteTargetFolderName}" deleted`);
      setAssignments((prev) =>
        prev.filter((a) => {
          const currentSubject = a.subject?.trim() || a.batch?.course?.title?.trim() || "General Programming";
          return currentSubject !== deleteTargetFolderName;
        })
      );
      if (selectedSubjectFolder === deleteTargetFolderName) {
        setSelectedSubjectFolder(null);
      }
      setShowDeleteFolderModal(false);
    } catch (err: any) {
      showToast(err?.message || "Failed to delete subject folder");
    } finally {
      setFolderActionLoading(false);
    }
  };

  // Dynamic subject theme styling
  const getSubjectTheme = (subjectName: string) => {
    const s = (subjectName || "").toLowerCase();
    if (s.includes("data structure") || s.includes("algorithm") || s.includes("dsa")) {
      return { color: "#06b6d4", bg: "rgba(6, 182, 212, 0.1)", border: "rgba(6, 182, 212, 0.3)", tag: "DSA" };
    }
    if (s.includes("operating system") || s.includes("os")) {
      return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)", tag: "OS" };
    }
    if (s.includes("database") || s.includes("dbms") || s.includes("sql")) {
      return { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)", tag: "DBMS" };
    }
    if (s.includes("network") || s.includes("cn") || s.includes("communication")) {
      return { color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)", border: "rgba(139, 92, 246, 0.3)", tag: "CN" };
    }
    if (s.includes("machine learning") || s.includes("ai") || s.includes("intelligence")) {
      return { color: "#ec4899", bg: "rgba(236, 72, 153, 0.1)", border: "rgba(236, 72, 153, 0.3)", tag: "AI/ML" };
    }
    if (s.includes("web") || s.includes("full-stack") || s.includes("frontend") || s.includes("backend")) {
      return { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.3)", tag: "WEB" };
    }
    if (s.includes("security") || s.includes("crypto") || s.includes("cyber")) {
      return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.3)", tag: "SEC" };
    }
    if (s.includes("compiler") || s.includes("automata")) {
      return { color: "#14b8a6", bg: "rgba(20, 184, 166, 0.1)", border: "rgba(20, 184, 166, 0.3)", tag: "COMPILER" };
    }
    if (s.includes("software") || s.includes("architecture")) {
      return { color: "#6366f1", bg: "rgba(99, 102, 241, 0.1)", border: "rgba(99, 102, 241, 0.3)", tag: "SE" };
    }
    return { color: "#a855f7", bg: "rgba(168, 85, 247, 0.1)", border: "rgba(168, 85, 247, 0.3)", tag: "SUBJECT" };
  };

  // Filter assignments by universal search query
  const filteredAssignments = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return assignments;
    const q = searchQuery.toLowerCase().trim();
    return assignments.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.subject && a.subject.toLowerCase().includes(q)) ||
        (a.objective && a.objective.toLowerCase().includes(q)) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.language && a.language.toLowerCase().includes(q))
    );
  }, [assignments, searchQuery]);

  // Group assignments into Subject Folders
  const subjectFolders = useMemo(() => {
    const map = new Map<string, LabAssignment[]>();
    filteredAssignments.forEach((assignment) => {
      const folderName =
        assignment.subject?.trim() ||
        assignment.batch?.course?.title?.trim() ||
        "General Programming";
      if (!map.has(folderName)) {
        map.set(folderName, []);
      }
      map.get(folderName)!.push(assignment);
    });

    return Array.from(map.entries()).map(([folderName, items]) => {
      const totalPoints = items.reduce((sum, item) => sum + (item.totalPoints || 0), 0);
      const totalSubmissions = items.reduce(
        (sum, item) => sum + (item.submissionCount || (item.mySubmission ? 1 : 0)),
        0
      );
      const completedByStudent = items.filter((item) => !!item.mySubmission).length;
      const languages = Array.from(new Set(items.map((i) => i.language)));
      const activeCount = items.filter((i) => i.status === "PUBLISHED").length;
      const isDeactivated = activeCount === 0 && items.length > 0;

      return {
        name: folderName,
        count: items.length,
        activeCount,
        isDeactivated,
        totalPoints,
        totalSubmissions,
        completedByStudent,
        languages,
        items,
      };
    });
  }, [assignments]);

  // Filtered assignments when inside a specific subject folder
  const displayedAssignments = useMemo(() => {
    if (!selectedSubjectFolder) return assignments;
    return assignments.filter(
      (a) =>
        (a.subject?.trim() || a.batch?.course?.title?.trim() || "General Programming") ===
        selectedSubjectFolder
    );
  }, [assignments, selectedSubjectFolder]);

  const activeFolderObj = useMemo(() => {
    if (!selectedSubjectFolder) return null;
    return subjectFolders.find((f) => f.name === selectedSubjectFolder) || null;
  }, [subjectFolders, selectedSubjectFolder]);

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5 pb-12">
      {/* Top Header: Title, Badge & Create Lab Button in ONE LINE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] font-bold flex items-center gap-2">
              <FlaskConical size={22} style={{ color: "var(--acc)" }} />
              Lab Experiments & Subject Folders
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/30">
              📁 Subject-Wise Folders
            </span>
            {isSupervisorOrAdmin && (
              <div className="flex items-center gap-1.5">
                <Btn
                  type="button"
                  onClick={() => onOpenCreateModal(selectedSubjectFolder || undefined)}
                  className="!h-8 text-[12px] !px-3 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus size={14} />
                  {selectedSubjectFolder ? `Add Lab to "${selectedSubjectFolder}"` : "Create Lab Assignment"}
                </Btn>

                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(true)}
                  className="h-8 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: "var(--bdr)", color: "var(--t1)", background: "var(--srf)" }}
                  title="Create New Subject Folder"
                >
                  <FolderPlus size={13} className="text-[#8b5cf6]" /> + New Folder
                </button>
              </div>
            )}
          </div>
          <p className="text-[12px] mt-1" style={{ color: "var(--t2)" }}>
            {isSupervisorOrAdmin
              ? "Organize curriculum experiments under subject folders, set objectives, and evaluate batch test suites"
              : "Explore subject folders and solve programming experiments assigned strictly to your enrolled batch"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Batch Selector Filter: ONLY for Supervisor / Admin */}
          {isSupervisorOrAdmin ? (
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold" style={{ color: "var(--t2)" }}>
                Batch:
              </span>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="h-8.5 px-3 rounded-xl border text-[12px] font-medium outline-none cursor-pointer"
                style={{
                  background: "var(--srf2)",
                  borderColor: "var(--bdr)",
                  color: "var(--t1)",
                }}
              >
                <option value="all" className="bg-neutral-900 text-white">All Batches</option>
                {liveBatches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-neutral-900 text-white">
                    {b.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={fetchAssignments}
                disabled={loading}
                className="h-8.5 w-8.5 rounded-xl border grid place-items-center transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50"
                style={{ borderColor: "var(--bdr)", color: "var(--t2)" }}
                title="Refresh labs"
              >
                <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold"
                style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
              >
                <Layers size={13} className="text-[#06b6d4]" />
                <span style={{ color: "var(--t2)" }}>Enrolled Batch:</span>
                <span className="text-[#06b6d4] font-bold truncate max-w-[240px]">
                  {assignments[0]?.batch?.name || user?.batch || "Enrolled Cohort"}
                </span>
              </div>

              <button
                type="button"
                onClick={fetchAssignments}
                disabled={loading}
                className="h-8.5 w-8.5 rounded-xl border grid place-items-center transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50"
                style={{ borderColor: "var(--bdr)", color: "var(--t2)" }}
                title="Refresh labs"
              >
                <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary KPI Cards: ONLY RENDERED ON MAIN ALL-FOLDERS VIEW ────────── */}
      {selectedSubjectFolder === null && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl grid place-items-center bg-[#8b5cf6]/10 text-[#8b5cf6]">
              <Folder size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-500">
                Subject Folders
              </div>
              <div className="text-[20px] font-extrabold text-purple-500">
                {subjectFolders.length} Subjects
              </div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl grid place-items-center bg-[#06b6d4]/10 text-[#06b6d4]">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-500">
                Total Experiments
              </div>
              <div className="text-[20px] font-extrabold text-cyan-500">{assignments.length} Labs</div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl grid place-items-center bg-[#22c55e]/10 text-[#22c55e]">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
                Active Status
              </div>
              <div className="text-[20px] font-extrabold text-emerald-500">
                {assignments.filter((a) => a.status === "PUBLISHED").length} Live
              </div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl grid place-items-center bg-[#f59e0b]/10 text-[#f59e0b]">
              <Users size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                {isSupervisorOrAdmin ? "Students Submitted" : "My Submissions"}
              </div>
              <div className="text-[20px] font-extrabold text-amber-500">
                {assignments.reduce((acc, a) => acc + (a.submissionCount || (a.mySubmission ? 1 : 0)), 0)}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Subject Filter Pills Bar */}
      {subjectFolders.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[12px] font-medium no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedSubjectFolder(null)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              selectedSubjectFolder === null
                ? "bg-[#06b6d4] text-white font-bold border-[#06b6d4] shadow-sm"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
            style={{
              borderColor: selectedSubjectFolder === null ? "#06b6d4" : "var(--bdr)",
              color: selectedSubjectFolder === null ? "#fff" : "var(--t1)",
              background: selectedSubjectFolder === null ? "#06b6d4" : "var(--srf)",
            }}
          >
            <Folder size={13} /> All Folders ({subjectFolders.length})
          </button>

          {subjectFolders.map((folder) => {
            const theme = getSubjectTheme(folder.name);
            const isSelected = selectedSubjectFolder === folder.name;

            return (
              <button
                key={folder.name}
                type="button"
                onClick={() => setSelectedSubjectFolder(folder.name)}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? "font-bold shadow-md"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                style={{
                  borderColor: isSelected ? theme.color : "var(--bdr)",
                  color: isSelected ? "#fff" : "var(--t1)",
                  background: isSelected ? theme.color : "var(--srf)",
                }}
              >
                <FolderOpen size={13} style={{ color: isSelected ? "#fff" : theme.color }} />
                <span>{folder.name}</span>
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold"
                  style={{
                    background: isSelected ? "rgba(255,255,255,0.25)" : theme.bg,
                    color: isSelected ? "#fff" : theme.color,
                  }}
                >
                  {folder.count}
                </span>
                {folder.isDeactivated && (
                  <span className="text-[9px] px-1 rounded bg-red-500/20 text-red-400 font-bold">OFF</span>
                )}
              </button>
            );
          })}

          {isSupervisorOrAdmin && (
            <button
              type="button"
              onClick={() => setShowCreateFolderModal(true)}
              className="px-2.5 py-1.5 rounded-xl border border-dashed flex items-center gap-1 text-[11px] font-semibold text-[#8b5cf6] hover:bg-[#8b5cf6]/10 transition cursor-pointer whitespace-nowrap"
              style={{ borderColor: "rgba(139, 92, 246, 0.4)" }}
            >
              <Plus size={13} /> Add Folder
            </button>
          )}
        </div>
      )}

      {/* Loading State with Animated Filling Beaker */}
      {loading && assignments.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="flex justify-center">
            <FillingBeakerLoader size={52} />
          </div>
          <p className="text-[13px] font-medium animate-pulse" style={{ color: "var(--t2)" }}>
            Loading subject folders & lab experiments...
          </p>
        </div>
      ) : assignments.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Folder size={40} className="mx-auto" style={{ color: "var(--t3)" }} />
          <h3 className="font-bold text-[17px]">No Lab Experiments Found</h3>
          <p className="text-[12px] max-w-md mx-auto" style={{ color: "var(--t2)" }}>
            {isSupervisorOrAdmin
              ? "Get started by creating a new subject folder and assigning programming experiments to batches."
              : "No lab experiments have been assigned to your batch yet."}
          </p>
          {isSupervisorOrAdmin && (
            <Btn
              type="button"
              onClick={() => onOpenCreateModal()}
              className="!h-8.5 text-[12px] !px-4 mx-auto mt-2"
            >
              + Create First Lab Experiment
            </Btn>
          )}
        </Card>
      ) : selectedSubjectFolder === null ? (
        /* ══════════════════════════════════════════════════════════════════════════
           VIEW 1: CLEAN SUBJECT FOLDER CARDS (SIMPLIFIED & MINIMAL OUTER LAYER)
           ══════════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[12px]" style={{ color: "var(--t2)" }}>
            <span className="font-semibold">
              Showing {subjectFolders.length} Subject {subjectFolders.length === 1 ? "Folder" : "Folders"}
            </span>
            <span>Click any folder to view and solve experiments</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjectFolders.map((folder) => {
              const theme = getSubjectTheme(folder.name);

              return (
                <div
                  key={folder.name}
                  onClick={() => setSelectedSubjectFolder(folder.name)}
                  className="group relative rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between"
                  style={{
                    background: "var(--srf)",
                    borderColor: folder.isDeactivated ? "rgba(239, 68, 68, 0.3)" : "var(--bdr)",
                    opacity: folder.isDeactivated ? 0.75 : 1,
                  }}
                >
                  {/* Folder Tab Top Header Accent */}
                  <div
                    className="absolute top-0 left-6 right-6 h-1 rounded-b-full transition-all group-hover:h-1.5"
                    style={{ background: folder.isDeactivated ? "#ef4444" : theme.color }}
                  />

                  <div className="space-y-3">
                    {/* Top Row: Folder Icon + Subject Tag + Experiments Count Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-10 w-10 rounded-2xl grid place-items-center transition-transform group-hover:scale-110"
                          style={{
                            background: folder.isDeactivated ? "rgba(239, 68, 68, 0.1)" : theme.bg,
                            color: folder.isDeactivated ? "#ef4444" : theme.color,
                          }}
                        >
                          <Folder size={22} />
                        </div>
                        <span
                          className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                          style={{
                            background: theme.bg,
                            borderColor: theme.border,
                            color: theme.color,
                          }}
                        >
                          {theme.tag}
                        </span>
                      </div>

                      <span
                        className="font-mono text-[12px] font-bold px-2.5 py-1 rounded-full border"
                        style={{
                          background: "var(--srf2)",
                          borderColor: "var(--bdr)",
                          color: "var(--t1)",
                        }}
                      >
                        {folder.count} {folder.count === 1 ? "Assignment" : "Assignments"}
                      </span>
                    </div>

                    {/* Subject Folder Title */}
                    <div>
                      <h3 className="font-bold text-[16px] leading-tight group-hover:text-[#06b6d4] transition">
                        {folder.name}
                      </h3>
                    </div>
                  </div>

                  {/* Folder Open Footer Action */}
                  <div
                    className="pt-3 mt-4 border-t flex items-center justify-between"
                    style={{ borderColor: "var(--bdr)" }}
                  >
                    <div className="text-[12px] font-semibold text-[#06b6d4] flex items-center gap-1 group-hover:underline">
                      Open Subject Folder{" "}
                      <ArrowRight
                        size={13}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </div>

                    {folder.isDeactivated ? (
                      <span className="text-[11px] text-red-400 font-bold flex items-center gap-1">
                        <PowerOff size={12} /> Deactivated
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> {folder.activeCount} Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════════
           VIEW 2: DRILL-DOWN VIEW (EXPERIMENTS INSIDE SELECTED SUBJECT FOLDER)
           ══════════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          <div
            className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
            style={{
              background: getSubjectTheme(selectedSubjectFolder).bg,
              borderColor: getSubjectTheme(selectedSubjectFolder).border,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-11 w-11 rounded-2xl grid place-items-center shadow"
                style={{
                  background: getSubjectTheme(selectedSubjectFolder).color,
                  color: "#fff",
                }}
              >
                <FolderOpen size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-[18px] flex items-center gap-2" style={{ color: "var(--t1)" }}>
                    {selectedSubjectFolder}
                  </h2>
                  {activeFolderObj?.isDeactivated && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      Deactivated
                    </span>
                  )}
                </div>
                <p className="text-[12px]" style={{ color: "var(--t2)" }}>
                  Showing {displayedAssignments.length} lab {displayedAssignments.length === 1 ? "experiment" : "experiments"} ({displayedAssignments.filter(a => a.status === "PUBLISHED").length} live / active)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Btn2
                type="button"
                onClick={() => setSelectedSubjectFolder(null)}
                className="!h-8 text-[11px] !px-3 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={13} /> View All Folders
              </Btn2>

              {isSupervisorOrAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRenameOldName(selectedSubjectFolder);
                      setRenameNewName(selectedSubjectFolder);
                      setShowRenameFolderModal(true);
                    }}
                    className="h-8 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: "var(--bdr)", color: "var(--t1)", background: "var(--srf)" }}
                    title="Rename Folder"
                  >
                    <Edit3 size={13} className="text-[#3b82f6]" /> Rename
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleFolderStatus(selectedSubjectFolder, (activeFolderObj?.activeCount || 0) > 0)}
                    disabled={folderActionLoading}
                    className={`h-8 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                      (activeFolderObj?.activeCount || 0) > 0
                        ? "text-amber-500 hover:bg-amber-500/10 border-amber-500/30"
                        : "text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/30"
                    }`}
                    style={{ background: "var(--srf)" }}
                    title={(activeFolderObj?.activeCount || 0) > 0 ? "Deactivate all labs in this folder" : "Activate all labs in this folder"}
                  >
                    {(activeFolderObj?.activeCount || 0) > 0 ? (
                      <>
                        <PowerOff size={13} /> Deactivate Folder
                      </>
                    ) : (
                      <>
                        <Power size={13} /> Activate Folder
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTargetFolderName(selectedSubjectFolder);
                      setShowDeleteFolderModal(true);
                    }}
                    className="h-8 px-2.5 rounded-xl border text-[11px] font-semibold text-red-500 hover:bg-red-500/10 border-red-500/30 flex items-center gap-1 cursor-pointer transition"
                    style={{ background: "var(--srf)" }}
                    title="Delete this entire subject folder"
                  >
                    <Trash2 size={13} /> Delete Folder
                  </button>

                  <Btn
                    type="button"
                    onClick={() => onOpenCreateModal(selectedSubjectFolder)}
                    className="!h-8 text-[11px] !px-3 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={13} /> Add Lab to this Folder
                  </Btn>
                </>
              )}
            </div>
          </div>

          {/* Grid of Lab Experiment Cards */}
          {displayedAssignments.length === 0 ? (
            <Card className="p-10 text-center space-y-2">
              <FlaskConical size={32} className="mx-auto" style={{ color: "var(--t3)" }} />
              <h4 className="font-bold text-[15px]">No experiments in this subject folder</h4>
              <p className="text-[12px]" style={{ color: "var(--t2)" }}>
                Click "+ Add Lab to this Folder" to create the first experiment.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedAssignments.map((assignment) => {
                const rawTests = (assignment.testCases as any[]) || [];
                const mySub = assignment.mySubmission;
                const isDuePassed = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false;
                const itemFolder =
                  assignment.subject?.trim() ||
                  assignment.batch?.course?.title?.trim() ||
                  "General Programming";
                const theme = getSubjectTheme(itemFolder);
                const isDeactivated = assignment.status === "ARCHIVED" || assignment.status === "DRAFT" || assignment.status === "CLOSED";
                const isPDF = assignment.submissionType === "PDF_REPORT" || (!assignment.submissionType && (!assignment.starterCode || rawTests.length === 0));

                return (
                  <Card
                    key={assignment.id}
                    className={`p-5 flex flex-col justify-between space-y-4 hover:shadow-xl transition-all border ${
                      isDeactivated ? "opacity-75 bg-neutral-900/30 border-dashed" : ""
                    }`}
                    style={{ borderColor: isDeactivated ? "rgba(239, 68, 68, 0.3)" : "var(--bdr)" }}
                  >
                    <div className="space-y-3">
                      {/* Card Top Row: Subject Folder Badge + Batch Pill + Language/Format + Status + Points */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md font-extrabold border inline-flex items-center gap-1"
                            style={{
                              background: theme.bg,
                              borderColor: theme.border,
                              color: theme.color,
                            }}
                          >
                            <Folder size={10} /> {itemFolder}
                          </span>

                          <Pill color="#06b6d4">
                            {assignment.batch?.name || "Target Batch"}
                          </Pill>

                          {isPDF ? (
                            <Pill color="#06b6d4" className="font-semibold flex items-center gap-1">
                              📄 PDF Report
                            </Pill>
                          ) : (
                            <Pill color="#8b5cf6" className="capitalize">
                              {assignment.language === "all" || assignment.language === "any"
                                ? "✨ Any Language (Polyglot)"
                                : assignment.language}
                            </Pill>
                          )}

                          {assignment.manualUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadFileBlob(
                                  assignment.manualUrl!,
                                  assignment.manualName || `${assignment.title}_Manual.pdf`,
                                  ".pdf"
                                );
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md font-bold border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#8b5cf6] inline-flex items-center gap-1 hover:bg-[#8b5cf6]/20 transition cursor-pointer"
                              title="Download faculty guidelines manual"
                            >
                              📎 Manual PDF
                            </button>
                          )}

                          {isDeactivated ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                              Inactive
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>

                        <span className="font-mono font-bold text-[12px] px-2.5 py-0.5 rounded-md border text-[#06b6d4] bg-[#06b6d4]/10 border-[#06b6d4]/30" title="Continuous Practical Evaluation (Max 4.0 Marks: Note Book 2.0 + Performance 2.0)">
                          4.0 Marks
                        </span>
                      </div>

                      {/* Title & Creator */}
                      <div>
                        <h3 className="font-bold text-[16px] leading-snug">
                          {assignment.title}
                        </h3>
                        <div className="text-[11px] mt-0.5 flex items-center gap-2" style={{ color: "var(--t3)" }}>
                          <span>By {assignment.creator?.name || "Faculty Supervisor"}</span>
                          {assignment.dueDate && (
                            <span>• Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      {/* 🎯 LAB EXPERIMENT OBJECTIVE (IF DEFINED) */}
                      {assignment.objective?.trim() && (
                        <div
                          className="p-3 rounded-xl border space-y-1"
                          style={{
                            background: "rgba(6, 182, 212, 0.05)",
                            borderColor: "rgba(6, 182, 212, 0.25)",
                          }}
                        >
                          <div className="text-[11px] font-bold flex items-center gap-1 text-[#06b6d4] uppercase tracking-wide">
                            <Target size={13} /> Experiment Objective:
                          </div>
                          <p className="text-[12px] leading-relaxed line-clamp-3" style={{ color: "var(--t1)" }}>
                            {assignment.objective}
                          </p>
                        </div>
                      )}

                      {/* Test Cases or Document Report Specs */}
                      {isPDF ? (
                        <div className="flex items-center gap-3 text-[11px] font-mono" style={{ color: "var(--t2)" }}>
                          <span>📄 Document / PDF Report Format</span>
                          <span>📊 4.0 Max Marks (Note Book: 2.0 + Performance: 2.0)</span>
                          {assignment.manualUrl && <span className="text-[#8b5cf6]">📎 Guide Manual Attached</span>}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-[11px] font-mono flex-wrap" style={{ color: "var(--t2)" }}>
                          <span>🧪 {rawTests.length} Test Cases</span>
                          <span>📄 Report Required (.pdf/.doc/.docx)</span>
                          <span>📊 4.0 Max Marks (NB: 2.0 + Perf: 2.0)</span>
                          <span>⏱ {assignment.timeLimit || 2}s Timeout</span>
                          <span>💾 {Math.round((assignment.memoryLimit || 262144) / 1024)}MB RAM</span>
                        </div>
                      )}

                      {/* Student My Submission Status Banner */}
                      {!isSupervisorOrAdmin && mySub && (() => {
                        const hasNbOrPerf = mySub.notebookScore != null || mySub.performanceScore != null;
                        const nbVal = Number(mySub.notebookScore) || 0;
                        const perfVal = Number(mySub.performanceScore) || 0;
                        const isEvaluated = mySub.status === "EVALUATED" || hasNbOrPerf;
                        const scoreOutOf4 = hasNbOrPerf
                          ? Math.min(4, Math.round((nbVal + perfVal) * 10) / 10)
                          : typeof mySub.score === "number" && mySub.score > 0
                          ? Math.min(4, Math.round(((mySub.score + (mySub.manualScoreAdjust || 0)) / (assignment.totalPoints || 100)) * 4 * 10) / 10)
                          : null;

                        return (
                          <div
                            className={`p-2.5 rounded-lg border flex items-center justify-between text-[11px] ${
                              !isPDF && !mySub.fileUrl
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                                : isEvaluated
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                : "bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#06b6d4]"
                            }`}
                          >
                            <span className="font-semibold flex items-center gap-1.5">
                              {!isPDF && !mySub.fileUrl ? (
                                <>
                                  <Clock size={13} className="text-amber-500" />
                                  Code Submitted • Report Document Pending
                                </>
                              ) : isEvaluated ? (
                                <>
                                  <CheckCircle2 size={13} className="text-emerald-500" />
                                  <span>Faculty Continuous Evaluation Complete</span>
                                  {hasNbOrPerf && (
                                    <span className="text-[10px] font-normal text-[var(--t3)] font-mono">
                                      (NB: {nbVal.toFixed(1)}/2 + Perf: {perfVal.toFixed(1)}/2)
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={13} className="text-[#06b6d4]" />
                                  {(mySub.totalTests ?? 0) > 0
                                    ? `Code Tests Passed (${mySub.testsPassed ?? 0}/${mySub.totalTests}) • Report Submitted`
                                    : "Report Submitted • Pending Faculty Review"}
                                </>
                              )}
                            </span>
                            <span className="font-bold font-mono">
                              {!isPDF && !mySub.fileUrl ? (
                                (mySub.totalTests ?? 0) > 0
                                  ? `Tests: ${mySub.testsPassed ?? 0}/${mySub.totalTests} passed`
                                  : "Upload PDF/DOC Report"
                              ) : isEvaluated && scoreOutOf4 !== null ? (
                                <span className="text-emerald-500 text-[12px]">
                                  Score: {scoreOutOf4.toFixed(1)} / 4.0
                                </span>
                              ) : (
                                <span className="text-amber-500">
                                  Pending Faculty Marks (Max 4.0)
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t flex items-center justify-between gap-2 flex-wrap" style={{ borderColor: "var(--bdr)" }}>
                      {isSupervisorOrAdmin ? (
                        <>
                          <Btn2
                            type="button"
                            onClick={() => onOpenRosterModal(assignment.id)}
                            className="!h-8 text-[11px] !px-3 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Users size={13} className="text-[#06b6d4]" />
                            Students Submitted ({assignment.submissionCount || 0})
                          </Btn2>

                          <div className="flex items-center gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleToggleLabStatus(assignment)}
                              className={`h-8 px-2 rounded-xl border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                                isDeactivated
                                  ? "text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/30"
                                  : "text-amber-500 hover:bg-amber-500/10 border-amber-500/30"
                              }`}
                              style={{ background: "var(--srf2)" }}
                              title={isDeactivated ? "Activate lab for students" : "Deactivate lab"}
                            >
                              {isDeactivated ? (
                                <>
                                  <Power size={12} /> Activate
                                </>
                              ) : (
                                <>
                                  <PowerOff size={12} /> Deactivate
                                </>
                              )}
                            </button>

                            {isPDF ? (
                              <button
                                type="button"
                                onClick={() => setPdfSubmitAssignment(assignment)}
                                className="h-8 px-2.5 rounded-xl border text-[11px] font-medium flex items-center gap-1 cursor-pointer transition hover:bg-black/5 dark:hover:bg-white/5"
                                style={{ borderColor: "var(--bdr)", color: "var(--t1)", background: "var(--srf2)" }}
                                title="View Experiment Details and Guidelines"
                              >
                                <Eye size={13} /> Details
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenSandboxWithAssignment(assignment)}
                                className="h-8 px-2.5 rounded-xl border text-[11px] font-medium flex items-center gap-1 cursor-pointer transition hover:bg-black/5 dark:hover:bg-white/5"
                                style={{ borderColor: "var(--bdr)", color: "var(--t1)", background: "var(--srf2)" }}
                                title="Preview in Sandbox"
                              >
                                <Eye size={13} /> Preview
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                              className="h-8 w-8 rounded-lg grid place-items-center text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                              title="Delete lab"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-[11px]" style={{ color: "var(--t2)" }}>
                            {mySub ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {!isPDF && !mySub.fileUrl ? (
                                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                    <Clock size={12} /> Report Document Pending
                                  </span>
                                ) : (
                                  <span className="text-emerald-500 font-medium">
                                    {mySub.status === "EVALUATED" ? "Grading Completed" : "Submitted"}
                                  </span>
                                )}
                                {mySub.reuploadStatus === "APPROVED" && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                    ✓ Re-upload Allowed
                                  </span>
                                )}
                                {mySub.reuploadStatus === "PENDING" && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                    ⏳ Re-upload Pending
                                  </span>
                                )}
                              </div>
                            ) : isDuePassed ? (
                              <span className="text-red-500 font-medium">Deadline Passed</span>
                            ) : isDeactivated ? (
                              <span className="text-red-400 font-medium">Lab Deactivated by Faculty</span>
                            ) : (
                              <span className="text-amber-500 font-medium">Pending Submission</span>
                            )}
                          </div>

                          {isPDF ? (
                            <Btn
                              type="button"
                              disabled={isDeactivated && !mySub}
                              onClick={() => setPdfSubmitAssignment(assignment)}
                              className="!h-8 text-[11px] !px-3.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <FileText size={13} /> {mySub ? "View My Report" : "Upload PDF Report"} <ArrowRight size={13} />
                            </Btn>
                          ) : mySub && !mySub.fileUrl ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Btn
                                type="button"
                                disabled={isDeactivated}
                                onClick={() => setPdfSubmitAssignment(assignment)}
                                className="!h-8 text-[11px] !px-3.5 flex items-center gap-1.5 cursor-pointer shadow-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold"
                                title="Attach and submit your lab report document (.pdf, .docx, .doc)"
                              >
                                <FileText size={13} /> Submit Report (PDF/DOC) <ArrowRight size={13} />
                              </Btn>
                              <Btn2
                                type="button"
                                disabled={isDeactivated}
                                onClick={() => onOpenSandboxWithAssignment(assignment)}
                                className="!h-8 text-[11px] !px-3 flex items-center gap-1.5 cursor-pointer"
                                title="Open code solution in Sandbox"
                              >
                                <Code2 size={13} /> View Code
                              </Btn2>
                            </div>
                          ) : (
                            <Btn
                              type="button"
                              disabled={isDeactivated && !mySub}
                              onClick={() => onOpenSandboxWithAssignment(assignment)}
                              className="!h-8 text-[11px] !px-3.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <Code2 size={13} /> {mySub ? "Open Solution" : "Solve in Sandbox"} <ArrowRight size={13} />
                            </Btn>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: CREATE NEW SUBJECT FOLDER ─────────────────────────────────── */}
      {showCreateFolderModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl grid place-items-center bg-[#8b5cf6]/10 text-[#8b5cf6]">
                  <FolderPlus size={20} />
                </div>
                <h3 className="font-bold text-[16px]">Create New Subject Folder</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateFolderModal(false)}
                className="h-7 w-7 rounded-lg grid place-items-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                style={{ color: "var(--t3)" }}
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[12px]" style={{ color: "var(--t2)" }}>
              Create a new subject curriculum folder. You can add lab assignments directly into this folder.
            </p>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: "var(--t1)" }}>
                Subject Folder Name
              </label>
              <Inp
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Artificial Intelligence & Deep Learning"
                autoFocus
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--t3)" }}>
                Suggested Presets:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Compiler Design",
                  "Cyber Security & Cryptography",
                  "Cloud Computing & DevOps",
                  "Mobile Application Development",
                  "Computer Graphics & Multimedia",
                  "Software Engineering",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNewFolderName(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                    style={{ borderColor: "var(--bdr)", color: "var(--t1)" }}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: "var(--bdr)" }}>
              <Btn2 type="button" onClick={() => setShowCreateFolderModal(false)}>
                Cancel
              </Btn2>
              <Btn type="button" onClick={handleCreateNewFolder} disabled={!newFolderName.trim()}>
                Create Folder & Add Lab
              </Btn>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: RENAME SUBJECT FOLDER ────────────────────────────────────── */}
      {showRenameFolderModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl grid place-items-center bg-[#3b82f6]/10 text-[#3b82f6]">
                  <Edit3 size={20} />
                </div>
                <h3 className="font-bold text-[16px]">Rename Subject Folder</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRenameFolderModal(false)}
                className="h-7 w-7 rounded-lg grid place-items-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                style={{ color: "var(--t3)" }}
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[12px]" style={{ color: "var(--t2)" }}>
              Renaming will update the subject category for all lab assignments under{" "}
              <b className="text-[var(--t1)] font-semibold">"{renameOldName}"</b>.
            </p>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: "var(--t1)" }}>
                New Folder Name
              </label>
              <Inp
                value={renameNewName}
                onChange={(e) => setRenameNewName(e.target.value)}
                placeholder="Enter new subject folder name"
                autoFocus
              />
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: "var(--bdr)" }}>
              <Btn2 type="button" onClick={() => setShowRenameFolderModal(false)} disabled={folderActionLoading}>
                Cancel
              </Btn2>
              <Btn
                type="button"
                onClick={handleRenameFolder}
                disabled={folderActionLoading || !renameNewName.trim() || renameNewName.trim() === renameOldName}
              >
                {folderActionLoading ? "Renaming..." : "Save New Name"}
              </Btn>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: DELETE SUBJECT FOLDER ────────────────────────────────────── */}
      {showDeleteFolderModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ background: "var(--srf)", borderColor: "rgba(239, 68, 68, 0.4)" }}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl grid place-items-center bg-red-500/10 text-red-500 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="font-bold text-[16px] text-red-500">Delete Subject Folder</h3>
                <p className="text-[12px] font-medium" style={{ color: "var(--t2)" }}>
                  Are you sure you want to delete <b className="text-[var(--t1)] font-semibold">"{deleteTargetFolderName}"</b>?
                </p>
              </div>
            </div>

            <p className="text-[12px] p-3 rounded-xl border bg-red-500/5 border-red-500/20 text-red-400">
              ⚠️ <b>Warning:</b> This action will permanently remove this subject folder along with all its associated programming experiments and batch submissions.
            </p>

            <div className="pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: "var(--bdr)" }}>
              <Btn2 type="button" onClick={() => setShowDeleteFolderModal(false)} disabled={folderActionLoading}>
                Cancel
              </Btn2>
              <button
                type="button"
                onClick={handleDeleteFolder}
                disabled={folderActionLoading}
                className="h-8.5 px-4 rounded-xl font-bold text-[12px] bg-red-600 hover:bg-red-700 text-white transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {folderActionLoading ? "Deleting..." : "Yes, Delete Folder"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Student PDF Report Submission Modal */}
      <StudentLabPdfSubmitModal
        show={!!pdfSubmitAssignment}
        onClose={() => setPdfSubmitAssignment(null)}
        assignment={pdfSubmitAssignment}
        onSubmissionSuccess={handlePdfSubmissionSuccess}
      />
    </div>
  );
};

export default LabAssignmentsScreen;
