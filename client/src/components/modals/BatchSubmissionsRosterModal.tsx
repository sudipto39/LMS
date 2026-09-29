import React, { useState, useEffect, useRef } from "react";
import { renderAsync } from "docx-preview";
import {
  Users,
  Target,
  CheckCircle2,
  Clock,
  Code2,
  FileSpreadsheet,
  Save,
  Sparkles,
  FileText,
  Download,
  Maximize2,
  Minimize2,
  ExternalLink,
  BookOpen,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Card, Btn, Btn2, Pill } from "../common/UIPrimitives";
import { labsApi, client, tokenStore } from "../../api";
import { evaluationsApi } from "../../api/evaluations";
import {
  exportUniversityPracticalRegisterCsv,
  exportUniversityPracticalRegisterXlsx,
} from "../../utils/excelExport";
import env from "../../config/env";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import type { LabRosterResponse, LabRosterItem, ContinuousEvaluationRow, CourseEvaluationMetadata } from "../../types";

import { DEMO_LAB_ASSIGNMENTS } from "../../screens/LabAssignmentsScreen";

// Helper to resolve clean API endpoint without duplicating "/api"
const getCleanApiEndpoint = (rawUrl: string): string => {
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  if (rawUrl.startsWith("/api/")) {
    return rawUrl.replace(/^\/api/, "");
  }
  if (!rawUrl.startsWith("/")) {
    return `/${rawUrl}`;
  }
  return rawUrl;
};

// Helper for direct authenticated file access (for iframe fallbacks / new tab)
const getDirectFileUrl = (rawUrl: string): string => {
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  const baseUrlWithoutApi = env.API_BASE_URL.replace(/\/api\/?$/, "");
  const cleanPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  const token = tokenStore.get();
  return `${baseUrlWithoutApi}${cleanPath}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
};

interface BatchSubmissionsRosterModalProps {
  show: boolean;
  onClose: () => void;
  assignmentId: string;
}

const getDemoRoster = (assignmentId: string): LabRosterResponse => {
  const lab = DEMO_LAB_ASSIGNMENTS.find((l) => l.id === assignmentId) || DEMO_LAB_ASSIGNMENTS[0];
  return {
    assignment: {
      id: lab?.id || assignmentId,
      title: lab?.title || "Lab 1: Binary Search Tree In-Order Traversal",
      objective: lab?.objective || "Master recursive tree traversals and logarithmic search operations.",
      description: lab?.description || "Construct a BST and print its sorted in-order traversal.",
      language: lab?.language || "python",
      totalPoints: lab?.totalPoints || 100,
      dueDate: lab?.dueDate || new Date(Date.now() + 86400000 * 7).toISOString(),
      batch: { id: lab?.batchId || "batch_2024", name: lab?.batch?.name || "Batch 2024–2028 (Computer Science)" },
    },
    stats: {
      totalStudents: 4,
      submittedCount: 3,
      pendingCount: 1,
      averageScore: 88,
    },
    roster: [
      {
        student: {
          id: "std_1",
          name: "Aarav Sharma",
          email: "aarav.sharma@lms.edu",
          universityId: "CS202401",
          department: "Computer Science",
        },
        hasSubmitted: true,
        submissionCount: 2,
        latestSubmission: {
          id: "sub_1",
          assignmentId: lab?.id || assignmentId,
          studentId: "std_1",
          code: `# BST In-Order Traversal Solution\nclass Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\ndef insert(root, val):\n    if not root: return Node(val)\n    if val < root.val: root.left = insert(root.left, val)\n    else: root.right = insert(root.right, val)\n    return root\n\ndef inorder(root, res):\n    if not root: return\n    inorder(root.left, res)\n    res.append(str(root.val))\n    inorder(root.right, res)\n\ndef solve():\n    import sys\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    nums = [int(x) for x in data[1:n+1]]\n    root = None\n    for x in nums:\n        root = insert(root, x)\n    res = []\n    inorder(root, res)\n    print(" ".join(res))\n\nif __name__ == '__main__':\n    solve()`,
          language: "python",
          status: "EVALUATED",
          score: 100,
          manualScoreAdjust: 0,
          testsPassed: 2,
          totalTests: 2,
          executionTime: 0.08,
          memoryUsed: 14200,
          attemptNumber: 2,
          submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          supervisorFeedback: "Outstanding recursive implementation and clean handling of node traversal.",
        },
      },
      {
        student: {
          id: "std_2",
          name: "Riya Patel",
          email: "riya.patel@lms.edu",
          universityId: "CS202402",
          department: "Computer Science",
        },
        hasSubmitted: true,
        submissionCount: 1,
        latestSubmission: {
          id: "sub_2",
          assignmentId: lab?.id || assignmentId,
          studentId: "std_2",
          code: `# BST Implementation\ndef solve():\n    pass\n`,
          language: "python",
          status: "EVALUATED",
          score: 80,
          manualScoreAdjust: 0,
          testsPassed: 1,
          totalTests: 2,
          executionTime: 0.12,
          memoryUsed: 15400,
          attemptNumber: 1,
          submittedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
          supervisorFeedback: "Passed public test case. Review edge case for duplicate values.",
        },
      },
      {
        student: {
          id: "std_3",
          name: "Vikram Das",
          email: "vikram.das@lms.edu",
          universityId: "CS202403",
          department: "Computer Science",
        },
        hasSubmitted: true,
        submissionCount: 1,
        latestSubmission: {
          id: "sub_3",
          assignmentId: lab?.id || assignmentId,
          studentId: "std_3",
          fileUrl: "https://example.com/reports/vikram_lab_report.pdf",
          fileName: "Lab1_BST_Complexity_Analysis.pdf",
          fileSize: 1048576,
          studentNotes: "Comprehensive asymptotic analysis of binary search trees with experimental benchmarks.",
          status: "EVALUATED",
          score: 88,
          notebookScore: 1.8,
          performanceScore: 1.7,
          manualScoreAdjust: 0,
          attemptNumber: 1,
          submittedAt: new Date(Date.now() - 3600000 * 26).toISOString(),
          supervisorFeedback: "Detailed algorithmic proofs and clean handling of tree balancing operations.",
        },
      },
      {
        student: {
          id: "std_4",
          name: "Ananya Roy",
          email: "ananya.roy@lms.edu",
          universityId: "CS202404",
          department: "Computer Science",
        },
        hasSubmitted: false,
        submissionCount: 0,
        latestSubmission: null,
      },
    ],
  };
};

export const BatchSubmissionsRosterModal: React.FC<BatchSubmissionsRosterModalProps> = ({
  show,
  onClose,
  assignmentId,
}) => {
  const showToast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LabRosterResponse | null>(null);
  const [selectedItem, setSelectedItem] = useState<LabRosterItem | null>(null);

  // Document Preview (.docx / .doc / .pdf) & In-Modal Viewer State
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [rawFileBlob, setRawFileBlob] = useState<Blob | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [docxRendering, setDocxRendering] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);
  const [isPdfExpanded, setIsPdfExpanded] = useState(false);
  const [supervisorDetailTab, setSupervisorDetailTab] = useState<"code" | "document">("code");
  const docxContainerRef = useRef<HTMLDivElement>(null);

  const isWordDoc = Boolean(
    selectedItem?.latestSubmission?.fileName?.toLowerCase().endsWith(".docx") ||
    selectedItem?.latestSubmission?.fileName?.toLowerCase().endsWith(".doc")
  );

  // University Excel Marks Distribution (Sheet 1: PRACTICAL - Note Book: 2, Performance: 2)
  const [notebookScore, setNotebookScore] = useState<number | "">("");
  const [performanceScore, setPerformanceScore] = useState<number | "">("");
  const [manualScoreOverride, setManualScoreOverride] = useState<number | "">("");
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);
  const [reviewingReupload, setReviewingReupload] = useState(false);

  const handleReviewReupload = async (action: "APPROVE" | "REJECT") => {
    if (!selectedItem?.latestSubmission) return;
    try {
      setReviewingReupload(true);
      const subId = selectedItem.latestSubmission.id;
      const res = await labsApi.reviewReuploadPermission(subId, action);
      if (res?.data) {
        const updatedSub = res.data;
        setSelectedItem((prev) =>
          prev
            ? {
                ...prev,
                latestSubmission: updatedSub,
              }
            : null
        );
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            roster: prev.roster.map((r) =>
              r.student.id === selectedItem.student.id
                ? { ...r, latestSubmission: updatedSub }
                : r
            ),
          };
        });
        showToast(
          action === "APPROVE"
            ? "Re-upload permission granted! Student can now submit a revised report. ✅"
            : "Re-upload request denied. ❌"
        );
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to update re-upload permission");
    } finally {
      setReviewingReupload(false);
    }
  };

  useEffect(() => {
    if (show && assignmentId) {
      loadRoster();
    }
  }, [show, assignmentId]);

  // Disable wheel increment/decrement on all number inputs while modal is active
  useEffect(() => {
    if (!show) return;
    const handleWheel = () => {
      const activeEl = document.activeElement;
      if (activeEl && activeEl instanceof HTMLInputElement && activeEl.type === "number") {
        activeEl.blur();
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [show]);

  // Load and cache document blob for instant embedded preview
  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    if (selectedItem?.latestSubmission?.fileUrl) {
      const fetchDocument = async () => {
        try {
          setPdfLoading(true);
          setPdfError(null);
          setDocxError(null);
          const rawUrl = selectedItem.latestSubmission!.fileUrl!;
          let blobData: Blob;
          if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
            const res = await fetch(rawUrl);
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            blobData = await res.blob();
          } else {
            const endpoint = getCleanApiEndpoint(rawUrl);
            const res = await client.get(endpoint, { responseType: "blob" });
            blobData = res.data as Blob;
          }
          if (!active) return;
          setRawFileBlob(blobData);

          const fileName = (selectedItem.latestSubmission?.fileName || "").toLowerCase();
          const isWord = fileName.endsWith(".docx") || fileName.endsWith(".doc");

          if (!isWord) {
            const blob = new Blob([blobData], { type: "application/pdf" });
            createdUrl = URL.createObjectURL(blob);
            setPdfBlobUrl(createdUrl);
          } else {
            setPdfBlobUrl(null);
          }
        } catch (err: any) {
          console.error("Failed to load document preview via blob:", err);
          if (active) {
            const fileName = (selectedItem?.latestSubmission?.fileName || "").toLowerCase();
            const isWord = fileName.endsWith(".docx") || fileName.endsWith(".doc");
            if (isWord) {
              setDocxError("Unable to fetch document from server. Please click Download Document to view.");
            } else {
              const directUrl = getDirectFileUrl(selectedItem.latestSubmission!.fileUrl!);
              setPdfBlobUrl(directUrl);
            }
          }
        } finally {
          if (active) setPdfLoading(false);
        }
      };
      fetchDocument();
    } else {
      setPdfBlobUrl(null);
      setRawFileBlob(null);
      setPdfLoading(false);
      setPdfError(null);
      setDocxError(null);
    }

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [selectedItem?.student.id, selectedItem?.latestSubmission?.fileUrl]);

  // Render Word document (.docx / .doc) via docx-preview directly into in-modal viewer
  useEffect(() => {
    let isCancelled = false;
    const fileName = (selectedItem?.latestSubmission?.fileName || "").toLowerCase();
    const isWord = fileName.endsWith(".docx") || fileName.endsWith(".doc");

    if (!rawFileBlob || !isWord) return;

    // Small delay ensures container div is mounted in the DOM when document tab is selected
    const timer = setTimeout(async () => {
      if (!docxContainerRef.current) return;
      try {
        setDocxRendering(true);
        setDocxError(null);
        docxContainerRef.current.innerHTML = "";
        await renderAsync(rawFileBlob, docxContainerRef.current, undefined, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          experimental: true,
          trimXmlDeclaration: true,
          renderHeaders: true,
          renderFooters: true,
        });
        if (isCancelled) return;
      } catch (err: any) {
        console.error("docx-preview rendering error:", err);
        if (!isCancelled) {
          setDocxError(
            err?.message?.includes("end of central directory")
              ? "This document appears to be in binary Word (.doc) format or protected. Please click Download to view."
              : "Unable to render Word document preview in browser."
          );
        }
      } finally {
        if (!isCancelled) {
          setDocxRendering(false);
        }
      }
    }, 60);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [rawFileBlob, selectedItem?.latestSubmission?.id, supervisorDetailTab]);

  const loadRoster = async () => {
    try {
      setLoading(true);
      if (assignmentId.startsWith("demo_")) {
        const demoData = getDemoRoster(assignmentId);
        setData(demoData);
        if (demoData.roster.length > 0) {
          const firstSubmitted = demoData.roster.find((r) => r.hasSubmitted) || demoData.roster[0];
          if (firstSubmitted) selectStudent(firstSubmitted);
        }
        return;
      }
      const res = await labsApi.getSubmissionsRoster(assignmentId);
      if (res?.data) {
        setData(res.data);
        if (res.data.roster.length > 0) {
          const firstSubmitted = res.data.roster.find((r) => r.hasSubmitted) || res.data.roster[0];
          if (firstSubmitted) {
            selectStudent(firstSubmitted);
          }
        }
      }
    } catch {
      const fallback = getDemoRoster(assignmentId);
      setData(fallback);
      if (fallback.roster.length > 0) {
        const firstSubmitted = fallback.roster.find((r) => r.hasSubmitted) || fallback.roster[0];
        if (firstSubmitted) selectStudent(firstSubmitted);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = (item: LabRosterItem) => {
    setSelectedItem(item);
    if (item.latestSubmission) {
      const sub = item.latestSubmission;
      setNotebookScore(typeof sub.notebookScore === "number" ? sub.notebookScore : "");
      setPerformanceScore(typeof sub.performanceScore === "number" ? sub.performanceScore : "");
      setManualScoreOverride(typeof sub.score === "number" ? sub.score : "");
      setIsManualOverride(false);
      setFeedback(sub.supervisorFeedback || "");

      if (sub.code && !sub.fileUrl) {
        setSupervisorDetailTab("code");
      } else if (!sub.code && sub.fileUrl) {
        setSupervisorDetailTab("document");
      } else {
        setSupervisorDetailTab("code");
      }
    } else {
      setNotebookScore("");
      setPerformanceScore("");
      setManualScoreOverride("");
      setIsManualOverride(false);
      setFeedback("");
    }
  };

  // Calculations for University Practical Experiment Distribution (Note Book 2 + Performance 2 = 4 pts)
  const nbVal = Number(notebookScore) || 0;
  const perfVal = Number(performanceScore) || 0;

  // Experiment Subtotal: Max 4.0 pts (Note Book 2.0 + Performance 2.0)
  const expSubtotal = Math.min(4, Math.round((nbVal + perfVal) * 10) / 10);

  // Scaled Mark out of Assignment Total Points (default 100 pts)
  const totalAssignmentPoints = data?.assignment.totalPoints || 100;
  const computedRubricScore = Math.min(
    totalAssignmentPoints,
    Math.round((expSubtotal / 4) * totalAssignmentPoints)
  );

  const effectiveFinalScore = isManualOverride && manualScoreOverride !== ""
    ? Number(manualScoreOverride)
    : (notebookScore !== "" || performanceScore !== ""
        ? computedRubricScore
        : (selectedItem?.latestSubmission?.score ?? 0));

  // Verified Authenticated PDF Download Handler (eliminates .htm error download)
  const handleDownloadPdf = async () => {
    if (!selectedItem?.latestSubmission?.fileUrl) return;
    try {
      const fileName = selectedItem.latestSubmission.fileName || "Student_Lab_Report.pdf";
      if (pdfBlobUrl && pdfBlobUrl.startsWith("blob:")) {
        const a = document.createElement("a");
        a.href = pdfBlobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(`Downloaded ${fileName} ✅`);
      } else if (rawFileBlob) {
        const url = URL.createObjectURL(rawFileBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        showToast(`Downloaded ${fileName} ✅`);
      } else {
        const endpoint = getCleanApiEndpoint(selectedItem.latestSubmission.fileUrl);
        const res = await client.get(endpoint, { responseType: "blob" });
        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        showToast(`Downloaded ${fileName} ✅`);
      }
    } catch {
      try {
        const directUrl = getDirectFileUrl(selectedItem.latestSubmission.fileUrl);
        const a = document.createElement("a");
        a.href = directUrl.includes("?") ? `${directUrl}&download=true` : `${directUrl}?download=true`;
        a.download = selectedItem.latestSubmission.fileName || "Student_Lab_Report.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(`Downloading ${selectedItem.latestSubmission.fileName || "report"}...`);
      } catch {
        showToast("Failed to download PDF report");
      }
    }
  };

  const handleSaveGrade = async () => {
    if (!selectedItem?.latestSubmission) return;

    try {
      setSavingGrade(true);
      const submissionId = selectedItem.latestSubmission.id;

      const nbNum = notebookScore !== "" ? Number(notebookScore) : undefined;
      const perfNum = performanceScore !== "" ? Number(performanceScore) : undefined;

      const payload = {
        score: effectiveFinalScore,
        notebookScore: nbNum,
        performanceScore: perfNum,
        supervisorFeedback: feedback.trim() || undefined,
      };

      const res = await labsApi.gradeSubmission(submissionId, payload);

      if (res?.data) {
        showToast(`Grade saved! (Note Book: ${nbNum ?? 0}/2, Perf: ${perfNum ?? 0}/2, Total: ${((nbNum ?? 0) + (perfNum ?? 0)).toFixed(1)}/4) ✅`);
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            roster: prev.roster.map((r) =>
              r.student.id === selectedItem.student.id && r.latestSubmission
                ? {
                    ...r,
                    latestSubmission: {
                      ...r.latestSubmission,
                      score: effectiveFinalScore,
                      notebookScore: nbNum,
                      performanceScore: perfNum,
                      supervisorFeedback: feedback.trim(),
                    },
                  }
                : r
            ),
          };
        });
      }
    } catch (err: any) {
      if (selectedItem.latestSubmission.id.startsWith("sub_") || assignmentId.startsWith("demo_")) {
        const nbNum = notebookScore !== "" ? Number(notebookScore) : undefined;
        const perfNum = performanceScore !== "" ? Number(performanceScore) : undefined;
        showToast(`Grade saved locally! (Note Book: ${nbNum ?? 0}/2, Perf: ${perfNum ?? 0}/2, Total: ${((nbNum ?? 0) + (perfNum ?? 0)).toFixed(1)}/4) ✅`);
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            roster: prev.roster.map((r) =>
              r.student.id === selectedItem.student.id && r.latestSubmission
                ? {
                    ...r,
                    latestSubmission: {
                      ...r.latestSubmission,
                      score: effectiveFinalScore,
                      notebookScore: nbNum,
                      performanceScore: perfNum,
                      supervisorFeedback: feedback.trim(),
                    },
                  }
                : r
            ),
          };
        });
      } else {
        showToast(err?.message || "Failed to save grade");
      }
    } finally {
      setSavingGrade(false);
    }
  };

  const getEvaluationsForExport = async (): Promise<{ rows: ContinuousEvaluationRow[]; metadata: CourseEvaluationMetadata }> => {
    if (!data) {
      return { rows: [], metadata: {} as CourseEvaluationMetadata };
    }

    const effectiveCourseCode =
      data.metadata?.courseCode ||
      data.assignment.batch?.course?.code ||
      data.assignment.batch?.name ||
      "";

    let evals: ContinuousEvaluationRow[] = [];
    let backendMeta: Partial<CourseEvaluationMetadata> | null = null;

    if (effectiveCourseCode) {
      try {
        const res = await evaluationsApi.getCourseEvaluations(effectiveCourseCode, data.assignment.batch.id);
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          evals = res.data;
        }
        if (res?.metadata) {
          backendMeta = res.metadata;
        }
      } catch {
        // fallback
      }
    }

    const now = new Date();
    const isEven = now.getMonth() + 1 <= 6;
    const dynamicSession = `${isEven ? "EVEN SEM MAY" : "ODD SEM NOV"} ${now.getFullYear()}`;

    const resolvedMetadata: CourseEvaluationMetadata = {
      programme:
        data.metadata?.programme ||
        backendMeta?.programme ||
        data.assignment.batch?.course?.title ||
        data.assignment.batch?.course?.description ||
        data.assignment.batch?.name ||
        "",
      semester:
        data.metadata?.semester ||
        backendMeta?.semester ||
        "",
      courseName:
        data.metadata?.courseName ||
        backendMeta?.courseName ||
        data.assignment.subject ||
        data.assignment.batch?.course?.title ||
        data.assignment.title ||
        "",
      courseCode:
        data.metadata?.courseCode ||
        backendMeta?.courseCode ||
        effectiveCourseCode,
      instructor:
        data.metadata?.instructor ||
        data.assignment.creator?.name ||
        backendMeta?.instructor ||
        user?.name ||
        "",
      session:
        data.metadata?.session ||
        backendMeta?.session ||
        dynamicSession,
      maxMarks: backendMeta?.maxMarks || {
        experiments: 40,
        internalViva: 10,
        totalInternal: 50,
        endSemLabTest: 30,
        endSemViva: 20,
        totalEndSem: 50,
        finalMarks: 100,
      },
    };

    const expMatch = data.assignment.title.match(/(?:Lab|Exp|Experiment)\s*#?\s*(\d+)/i);
    const currentExpNum = expMatch ? Math.max(1, Math.min(10, parseInt(expMatch[1], 10))) : 1;

    // Merge or construct rows for all students in current roster
    const rows = data.roster.map((r, i) => {
      const existing = evals.find(
        (e) => e.studentId === r.student.id || e.roll === (r.student.universityId || r.student.id)
      );

      const sub = r.latestSubmission;
      const nb = typeof sub?.notebookScore === "number" ? sub.notebookScore : 0;
      const perf = typeof sub?.performanceScore === "number" ? sub.performanceScore : 0;

      const exps = Array.from({ length: 10 }, (_, idx) => {
        const expIndex = idx + 1;
        if (expIndex === currentExpNum && sub) {
          return { exp: expIndex, notebook: nb, performance: perf };
        }
        const found = existing?.experiments?.find((x) => x.exp === expIndex);
        return {
          exp: expIndex,
          notebook: found?.notebook ?? 0,
          performance: found?.performance ?? 0,
        };
      });

      const expTotal = Math.min(
        40,
        exps.reduce((sum, e) => sum + (Number(e.notebook) || 0) + (Number(e.performance) || 0), 0)
      );

      const intViva = existing?.internalViva ?? 0;
      const totalInternal = Math.min(50, expTotal + intViva);
      const endSemLab = existing?.endSemLabTest ?? 0;
      const endSemViva = existing?.endSemViva ?? 0;
      const totalEndSem = Math.min(50, endSemLab + endSemViva);
      const finalMarks = Math.min(100, totalInternal + totalEndSem);

      return {
        id: existing?.id || `eval_${r.student.id}`,
        studentId: r.student.id,
        slNo: i + 1,
        roll: r.student.universityId || r.student.id,
        name: r.student.name,
        programme: existing?.programme || r.student.department || resolvedMetadata.programme,
        courseCode: resolvedMetadata.courseCode,
        courseName: resolvedMetadata.courseName,
        semester: resolvedMetadata.semester,
        experiments: exps,
        experimentsTotal: expTotal,
        internalViva: intViva,
        totalInternal,
        endSemLabTest: endSemLab,
        endSemViva,
        totalEndSem,
        finalMarks,
        remarks: existing?.remarks || sub?.supervisorFeedback || "",
      };
    });

    return { rows, metadata: resolvedMetadata };
  };

  // Export exact Excel (.xlsx) matching shared university workbook with exact colors
  const handleExportExcel = async () => {
    if (!data) return;
    try {
      const { rows, metadata } = await getEvaluationsForExport();
      const safeCourse = (metadata.courseName || "Practical").replace(/[^a-zA-Z0-9_-]/g, "_");
      await exportUniversityPracticalRegisterXlsx(
        rows,
        metadata,
        `${safeCourse}_Practical_Register.xlsx`
      );
      showToast("University Practical Register exported (.xlsx) 📊");
    } catch {
      showToast("Failed to export Excel register");
    }
  };

  // Export exact CSV matching shared university sheet structure
  const handleExportCsv = async () => {
    if (!data) return;
    try {
      const { rows, metadata } = await getEvaluationsForExport();
      const safeCourse = (metadata.courseName || "Practical").replace(/[^a-zA-Z0-9_-]/g, "_");
      exportUniversityPracticalRegisterCsv(
        rows,
        metadata,
        `${safeCourse}_Practical_Register.csv`
      );
      showToast("University Practical Register exported (.csv) 📊");
    } catch {
      showToast("Failed to export CSV register");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[1240px] h-[88vh] flex flex-col p-6 shadow-2xl z-10 overflow-hidden border" style={{ borderColor: "var(--bdr)" }}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--bdr)" }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl grid place-items-center bg-[#06b6d4]/10 text-[#06b6d4]">
              <Users size={22} />
            </div>
            <div>
              <h2 className="font-bold text-[18px] flex items-center gap-2">
                {data?.assignment.title || "Batch Submissions Roster"}
              </h2>
              <p className="text-[12px]" style={{ color: "var(--t2)" }}>
                Batch: <span className="font-semibold text-[#06b6d4]">{data?.assignment.batch.name || "Target Batch"}</span> | Total Marks: {data?.assignment.totalPoints || 100} pts | <span className="text-emerald-500 font-medium">Excel Scheme: Note Book (2) + Performance (2) = 4.0</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Btn
              type="button"
              onClick={handleExportExcel}
              className="!h-8 text-[11px] !px-3 flex items-center gap-1.5 cursor-pointer !bg-emerald-600 hover:!bg-emerald-700 text-white shadow-sm"
              title="Export exact university Excel register (.xlsx)"
            >
              <FileSpreadsheet size={13} /> Export Excel (.xlsx)
            </Btn>
            <Btn2
              type="button"
              onClick={handleExportCsv}
              className="!h-8 text-[11px] !px-3 flex items-center gap-1.5 cursor-pointer"
              title="Export university practical register (.csv)"
            >
              <Download size={13} /> Export CSV
            </Btn2>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg grid place-items-center transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ color: "var(--t2)" }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Experiment Objective Highlight Banner */}
        {data?.assignment.objective && (
          <div className="mt-3 p-3 rounded-xl border flex items-start gap-2.5" style={{ background: "rgba(6, 182, 212, 0.05)", borderColor: "rgba(6, 182, 212, 0.3)" }}>
            <Target size={16} className="text-[#06b6d4] mt-0.5 flex-shrink-0" />
            <div className="text-[12px] leading-relaxed">
              <span className="font-bold text-[#06b6d4] uppercase tracking-wide mr-1.5">Lab Objective:</span>
              <span style={{ color: "var(--t1)" }}>{data.assignment.objective}</span>
            </div>
          </div>
        )}

        {/* Quick Stats Counter */}
        {data?.stats && (
          <div className="grid grid-cols-4 gap-3 my-3">
            <div className="p-3 rounded-xl border" style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--t3)" }}>Enrolled Students</div>
              <div className="text-[18px] font-extrabold mt-0.5">{data.stats.totalStudents}</div>
            </div>
            <div className="p-3 rounded-xl border" style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Submitted</div>
              <div className="text-[18px] font-extrabold text-emerald-500 mt-0.5">{data.stats.submittedCount}</div>
            </div>
            <div className="p-3 rounded-xl border" style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending</div>
              <div className="text-[18px] font-extrabold text-amber-500 mt-0.5">{data.stats.pendingCount}</div>
            </div>
            <div className="p-3 rounded-xl border" style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#06b6d4]">Avg Class Score</div>
              <div className="text-[18px] font-extrabold text-[#06b6d4] mt-0.5">{data.stats.averageScore} / {data.assignment.totalPoints}</div>
            </div>
          </div>
        )}

        {/* Master-Detail Split Screen */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left: Student List */}
          <div className="md:col-span-4 border rounded-xl overflow-y-auto flex flex-col" style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}>
            <div className="p-2.5 border-b font-bold text-[12px] flex items-center justify-between" style={{ borderColor: "var(--bdr)", color: "var(--t2)" }}>
              <span>Batch Roster ({data?.roster.length || 0})</span>
              <span className="text-[11px] font-normal">Select student to inspect</span>
            </div>

            <div className="divide-y overflow-y-auto flex-1" style={{ borderColor: "var(--bdr)" }}>
              {loading ? (
                <div className="p-8 text-center text-[12px]" style={{ color: "var(--t3)" }}>
                  Loading batch roster...
                </div>
              ) : data?.roster.length === 0 ? (
                <div className="p-8 text-center text-[12px]" style={{ color: "var(--t3)" }}>
                  No students enrolled in this batch yet.
                </div>
              ) : (
                data?.roster.map((item) => {
                  const isSelected = selectedItem?.student.id === item.student.id;
                  const sub = item.latestSubmission;
                  return (
                    <div
                      key={item.student.id}
                      onClick={() => selectStudent(item)}
                      className={`p-3 transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-[#06b6d4]/10 border-l-4 border-l-[#06b6d4]"
                          : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-[13px]">{item.student.name}</div>
                        <div className="text-[11px] font-mono" style={{ color: "var(--t3)" }}>
                          {item.student.universityId || item.student.email}
                        </div>
                      </div>

                      <div className="text-right">
                        {item.hasSubmitted && sub ? (
                          <>
                            <div className="font-bold text-[13px] text-emerald-500 font-mono">
                              {sub.score + (sub.manualScoreAdjust || 0)} pts
                            </div>
                            <div className="text-[10px] font-mono" style={{ color: "var(--t3)" }}>
                              {typeof sub.notebookScore === "number" && typeof sub.performanceScore === "number"
                                ? `NB:${sub.notebookScore} P:${sub.performanceScore} (Exp: ${((sub.notebookScore || 0) + (sub.performanceScore || 0)).toFixed(1)}/4)`
                                : sub.code && sub.fileUrl
                                ? "Code + Report"
                                : sub.code && !sub.fileUrl
                                ? "Code (Report Pending)"
                                : sub.fileUrl
                                ? "📄 PDF Report"
                                : `${sub.testsPassed}/${sub.totalTests} tests`}
                            </div>
                            {sub.reuploadStatus === "PENDING" && (
                              <div className="mt-1 flex justify-end">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-0.5">
                                  ⚠️ Re-upload Req
                                </span>
                              </div>
                            )}
                            {sub.reuploadStatus === "APPROVED" && (
                              <div className="mt-1 flex justify-end">
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center gap-0.5">
                                  ✓ Can Re-upload
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <Pill color="#94a3b8">Pending</Pill>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Submission Inspection, In-App PDF Preview & Excel Marks Rubric */}
          <div className="md:col-span-8 border rounded-xl p-4 overflow-y-auto flex flex-col space-y-4" style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}>
            {selectedItem ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--bdr)" }}>
                  <div>
                    <h3 className="font-bold text-[15px]">{selectedItem.student.name}</h3>
                    <p className="text-[11px] font-mono" style={{ color: "var(--t2)" }}>
                      {selectedItem.student.universityId} • {selectedItem.student.email}
                    </p>
                  </div>
                  {selectedItem.hasSubmitted ? (
                    <Pill color="#22c55e">
                      <CheckCircle2 size={11} /> Submitted (Attempt #{selectedItem.latestSubmission?.attemptNumber || 1})
                    </Pill>
                  ) : (
                    <Pill color="#f59e0b">
                      <Clock size={11} /> Not Submitted
                    </Pill>
                  )}
                </div>

                {selectedItem.latestSubmission ? (
                  <div className="space-y-4 flex-1">
                    {/* SUPERVISOR RE-UPLOAD PERMISSION REVIEW CARD */}
                    {selectedItem.latestSubmission.reuploadStatus === "PENDING" ? (
                      <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-[12px]">
                            <RotateCcw size={14} /> Student Requested Re-upload Permission
                          </div>
                          <span className="text-[10px] font-mono text-amber-600/80 dark:text-amber-400/80">
                            {selectedItem.latestSubmission.reuploadRequestedAt
                              ? new Date(selectedItem.latestSubmission.reuploadRequestedAt).toLocaleString()
                              : "Pending Review"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg border border-amber-500/20 bg-black/5 dark:bg-white/5 text-[12px]">
                          <span className="font-semibold text-[11px] text-amber-600 dark:text-amber-400 block mb-0.5">
                            Student Reason:
                          </span>
                          <p className="italic" style={{ color: "var(--t1)" }}>
                            "{selectedItem.latestSubmission.reuploadReason || "No explanation provided"}"
                          </p>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            disabled={reviewingReupload}
                            onClick={() => handleReviewReupload("REJECT")}
                            className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 text-[11px] font-semibold cursor-pointer transition disabled:opacity-50"
                          >
                            Deny Request
                          </button>
                          <Btn
                            type="button"
                            disabled={reviewingReupload}
                            onClick={() => handleReviewReupload("APPROVE")}
                            className="!h-8 text-[11px] !px-3.5 !bg-emerald-600 hover:!bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            <ShieldCheck size={13} /> Grant Re-upload Permission
                          </Btn>
                        </div>
                      </div>
                    ) : selectedItem.latestSubmission.reuploadStatus === "APPROVED" ? (
                      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between flex-wrap gap-2 text-[12px]">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <ShieldCheck size={16} /> Re-upload Permission Granted
                          <span className="text-[11px] font-normal opacity-85">
                            (Student authorized to submit a new version)
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={reviewingReupload}
                          onClick={() => handleReviewReupload("REJECT")}
                          className="text-[11px] text-red-500 hover:underline cursor-pointer bg-transparent border-none font-medium"
                        >
                          Revoke Permission
                        </button>
                      </div>
                    ) : (selectedItem.latestSubmission.code && !selectedItem.latestSubmission.fileUrl) ? (
                      <div className="p-2.5 rounded-xl border flex items-center justify-between text-[11px] border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock size={13} className="text-amber-500 shrink-0" />
                          Report Upload Status: <strong className="font-semibold">Open (Student can upload report document before deadline)</strong>
                        </span>
                        <button
                          type="button"
                          disabled={reviewingReupload}
                          onClick={() => handleReviewReupload("APPROVE")}
                          className="text-[11px] text-[#06b6d4] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none font-medium shrink-0"
                          title="Authorize student to re-submit code solution if needed"
                        >
                          <RotateCcw size={11} /> Grant Code Re-submit
                        </button>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl border flex items-center justify-between text-[11px]" style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}>
                        <span style={{ color: "var(--t2)" }}>
                          Re-upload Status: <span className="font-semibold text-slate-400">Locked (Requires Supervisor Approval to change)</span>
                        </span>
                        <button
                          type="button"
                          disabled={reviewingReupload}
                          onClick={() => handleReviewReupload("APPROVE")}
                          className="text-[11px] text-[#06b6d4] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none font-medium shrink-0"
                          title="Authorize this student to submit a revised report without waiting for a request"
                        >
                          <RotateCcw size={11} /> Grant Re-upload Permission
                        </button>
                      </div>
                    )}

                    {/* Segmented Control when both Code and Report Document exist */}
                    {Boolean(selectedItem.latestSubmission.code) && Boolean(selectedItem.latestSubmission.fileUrl) && (
                      <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-black/5 dark:bg-white/5" style={{ borderColor: "var(--bdr)" }}>
                        <button
                          type="button"
                          onClick={() => setSupervisorDetailTab("code")}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            supervisorDetailTab === "code"
                              ? "bg-[#06b6d4] text-white shadow-sm"
                              : "hover:bg-black/5 dark:hover:bg-white/5 text-[var(--t2)]"
                          }`}
                        >
                          <Code2 size={14} /> Source Code & Automated Tests
                        </button>
                        <button
                          type="button"
                          onClick={() => setSupervisorDetailTab("document")}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            supervisorDetailTab === "document"
                              ? "bg-[#06b6d4] text-white shadow-sm"
                              : "hover:bg-black/5 dark:hover:bg-white/5 text-[var(--t2)]"
                          }`}
                        >
                          <FileText size={14} /> Lab Report Document ({selectedItem.latestSubmission.fileName?.split('.').pop()?.toUpperCase() || "PDF"})
                        </button>
                      </div>
                    )}

                    {/* Report Document Section (when document view is active or only document exists) */}
                    {Boolean(selectedItem.latestSubmission.fileUrl) && (!selectedItem.latestSubmission.code || supervisorDetailTab === "document") && (
                      <div className="p-4 rounded-xl border space-y-3" style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}>
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-xl grid place-items-center bg-[#06b6d4]/10 text-[#06b6d4] shrink-0">
                              <FileText size={22} />
                            </div>
                            <div>
                              <div className="font-semibold text-[13px]" style={{ color: "var(--t1)" }}>
                                {selectedItem.latestSubmission.fileName || "Student_Lab_Report.pdf"}
                              </div>
                              <div className="text-[11px] font-mono" style={{ color: "var(--t3)" }}>
                                {selectedItem.latestSubmission.fileSize ? `${Math.round(selectedItem.latestSubmission.fileSize / 1024)} KB` : "Document Report"} • Submitted {new Date(selectedItem.latestSubmission.submittedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsPdfExpanded((prev) => !prev)}
                              className="h-8.5 px-3 rounded-lg font-semibold text-[12px] border hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1.5 transition cursor-pointer"
                              style={{ borderColor: "var(--bdr)", color: "var(--t1)" }}
                              title={isPdfExpanded ? "Compact preview" : "Expand preview window"}
                            >
                              {isPdfExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                              {isPdfExpanded ? "Compact View" : "Expand Viewer"}
                            </button>

                            {pdfBlobUrl && !isWordDoc && (
                              <button
                                type="button"
                                onClick={() => window.open(pdfBlobUrl, "_blank")}
                                className="h-8.5 px-3 rounded-lg font-semibold text-[12px] border hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1.5 transition cursor-pointer"
                                style={{ borderColor: "var(--bdr)", color: "var(--t1)" }}
                                title="Open document in a new browser tab"
                              >
                                <ExternalLink size={13} /> Open in Tab
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={handleDownloadPdf}
                              className="h-8.5 px-3 rounded-lg font-semibold text-[12px] bg-[#06b6d4] hover:bg-[#0891b2] text-white flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                              title="Download the student submission document"
                            >
                              <Download size={13} /> Download Document
                            </button>
                          </div>
                        </div>

                        {selectedItem.latestSubmission.studentNotes && (
                          <div className="p-2.5 rounded-lg border text-[12px] bg-black/5 dark:bg-white/5" style={{ borderColor: "var(--bdr)" }}>
                            <span className="font-bold text-[10px] uppercase tracking-wider text-[#06b6d4] block mb-0.5">Student Notes:</span>
                            <p style={{ color: "var(--t1)" }}>"{selectedItem.latestSubmission.studentNotes}"</p>
                          </div>
                        )}

                        {/* In-Modal Viewer: Word (.docx/.doc) or PDF Viewer */}
                        {isWordDoc ? (
                          <div className="mt-2 rounded-xl overflow-hidden border shadow-inner transition-all" style={{ borderColor: "var(--bdr)" }}>
                            <div className="flex items-center justify-between px-3 py-1.5 border-b bg-black/5 dark:bg-white/5 text-[11px]" style={{ borderColor: "var(--bdr)", color: "var(--t2)" }}>
                              <span className="font-semibold flex items-center gap-1.5">
                                <FileText size={13} className="text-[#06b6d4]" />
                                Word Document Viewer <span className="text-[10px] font-normal opacity-75">(In-Browser Preview)</span>
                              </span>
                              <span className="text-[10px] font-mono text-[#06b6d4]">DOCX Renderer Active</span>
                            </div>

                            <div
                              className={`w-full overflow-y-auto overflow-x-auto transition-all duration-300 relative ${
                                isPdfExpanded ? "h-[580px]" : "h-[400px]"
                              }`}
                              style={{ background: "var(--srf)" }}
                            >
                              {(docxRendering || pdfLoading) && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-black/5 dark:bg-white/5 backdrop-blur-[1px]">
                                  <div className="h-7 w-7 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
                                  <span className="text-[12px] font-mono" style={{ color: "var(--t2)" }}>
                                    {pdfLoading ? "Fetching Word document..." : "Rendering Word document pages..."}
                                  </span>
                                </div>
                              )}

                              {docxError ? (
                                <div className="p-6 flex flex-col items-center justify-center gap-2.5 text-center min-h-[300px]">
                                  <div className="w-12 h-12 rounded-xl grid place-items-center bg-amber-500/10 text-amber-500">
                                    <FileText size={24} />
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-[13px]" style={{ color: "var(--t1)" }}>
                                      {selectedItem.latestSubmission.fileName}
                                    </h5>
                                    <p className="text-[11px] mt-1 max-w-md text-amber-600 dark:text-amber-400">
                                      {docxError.includes("end of central directory")
                                        ? "This file appears to be in legacy binary Word (.doc) format or protected. Please click below to download and view in Microsoft Word."
                                        : docxError}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleDownloadPdf}
                                    className="h-8 px-4 rounded-lg font-semibold text-xs bg-[#06b6d4] hover:bg-[#0891b2] text-white flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                                  >
                                    <Download size={13} /> Download Document
                                  </button>
                                </div>
                              ) : (
                                <div ref={docxContainerRef} className="docx-preview-container min-h-full" />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 rounded-xl overflow-hidden border shadow-inner transition-all" style={{ borderColor: "var(--bdr)" }}>
                            <div className="flex items-center justify-between px-3 py-1.5 border-b bg-black/5 dark:bg-white/5 text-[11px]" style={{ borderColor: "var(--bdr)", color: "var(--t2)" }}>
                              <span className="font-semibold flex items-center gap-1.5">
                                <FileText size={13} className="text-[#06b6d4]" />
                                Embedded Document Inspection <span className="text-[10px] font-normal opacity-75">(Supervisor Review Mode)</span>
                              </span>
                              <span className="text-[10px] font-mono text-[#06b6d4]">In-App Preview Active</span>
                            </div>

                            {pdfLoading ? (
                              <div className="h-[340px] flex flex-col items-center justify-center gap-2.5 bg-black/5 dark:bg-white/5">
                                <div className="h-7 w-7 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
                                <span className="text-[12px] font-mono" style={{ color: "var(--t2)" }}>
                                  Loading document into embedded viewer...
                                </span>
                              </div>
                            ) : pdfBlobUrl ? (
                              <iframe
                                src={pdfBlobUrl}
                                title="Student Submission PDF Preview"
                                className={`w-full transition-all duration-300 border-none bg-slate-900/5 dark:bg-slate-900/40 ${
                                  isPdfExpanded ? "h-[540px]" : "h-[360px]"
                                }`}
                              />
                            ) : pdfError ? (
                              <div className="p-4 rounded-b-xl border-t border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[12px] flex items-center justify-between">
                                <span>{pdfError}</span>
                                <Btn2 onClick={handleDownloadPdf} className="!h-7 text-[11px]">Download to View</Btn2>
                              </div>
                            ) : (
                              <div className="h-[200px] flex items-center justify-center text-[12px]" style={{ color: "var(--t3)" }}>
                                No document preview available
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Source Code & Automated Tests Section (when code view is active or only code exists) */}
                    {Boolean(selectedItem.latestSubmission.code) && (!selectedItem.latestSubmission.fileUrl || supervisorDetailTab === "code") && (
                      <div className="space-y-3">
                        {Boolean(selectedItem.latestSubmission.code) && !selectedItem.latestSubmission.fileUrl && (
                          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-2 text-[12px]">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                              <Clock size={15} className="text-amber-500 shrink-0" />
                              <span>Student submitted code during lab class. Lab report document (.pdf/.doc) is pending upload before deadline.</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold shrink-0">
                              Report Pending
                            </span>
                          </div>
                        )}

                        {/* Automated Test Results Breakdown */}
                        <div>
                          <h4 className="text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--t2)" }}>
                            Automated Test Evaluation: {selectedItem.latestSubmission.testsPassed || 0} / {selectedItem.latestSubmission.totalTests || 0} Passed
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                            <div className="p-2 rounded-lg border bg-black/5 dark:bg-white/5" style={{ borderColor: "var(--bdr)" }}>
                              <span style={{ color: "var(--t3)" }}>Automated Score:</span> <span className="font-bold">{selectedItem.latestSubmission.score} pts</span>
                            </div>
                            <div className="p-2 rounded-lg border bg-black/5 dark:bg-white/5" style={{ borderColor: "var(--bdr)" }}>
                              <span style={{ color: "var(--t3)" }}>Submitted At:</span> <span className="font-bold">{new Date(selectedItem.latestSubmission.submittedAt).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>

                        {selectedItem.latestSubmission.studentNotes && !selectedItem.latestSubmission.fileUrl && (
                          <div className="p-2.5 rounded-lg border text-[12px] bg-black/5 dark:bg-white/5" style={{ borderColor: "var(--bdr)" }}>
                            <span className="font-bold text-[10px] uppercase tracking-wider text-[#06b6d4] block mb-0.5">Student Notes:</span>
                            <p style={{ color: "var(--t1)" }}>"{selectedItem.latestSubmission.studentNotes}"</p>
                          </div>
                        )}

                        {/* Code Viewer */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--t2)" }}>
                              <Code2 size={13} className="text-[#06b6d4]" /> Student Source Code ({selectedItem.latestSubmission.language || "code"})
                            </label>
                          </div>
                          <pre className="p-3 rounded-xl border text-[11px] font-mono overflow-x-auto max-h-[220px] bg-[#0d1b22] text-[#38bdf8] leading-relaxed" style={{ borderColor: "var(--bdr)" }}>
                            {selectedItem.latestSubmission.code}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Faculty Evaluation & Grading: University Excel Rubric Distribution */}
                    <div className="p-4 rounded-xl border space-y-3.5 shadow-sm" style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-[13px] font-bold flex items-center gap-1.5" style={{ color: "var(--t1)" }}>
                          <Sparkles size={15} className="text-[#06b6d4]" /> University Practical Evaluation & Grading
                        </h4>
                        <div className="flex items-center gap-1.5">
                          <Pill color="#06b6d4">Excel Scheme: Sheet 1 (PRACTICAL)</Pill>
                        </div>
                      </div>

                      {/* Official University Experiment Rubric Input Grid (Max 4.0 pts) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* 1. Note Book (Code & Report) */}
                        <div className="p-3 rounded-xl border bg-black/5 dark:bg-white/5 flex flex-col justify-between" style={{ borderColor: "var(--bdr)" }}>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--t1)" }}>
                                <BookOpen size={12} className="text-[#06b6d4]" /> Note Book (Code & Report)
                              </label>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#06b6d4]/10 text-[#06b6d4]">Max 2.0</span>
                            </div>
                            <p className="text-[10px] mb-2" style={{ color: "var(--t3)" }}>
                              Source code implementation + accompanying laboratory report document.
                            </p>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="2"
                              step="0.1"
                              placeholder="0.0 - 2.0"
                              value={notebookScore}
                              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                              onChange={(e) => setNotebookScore(e.target.value === "" ? "" : Math.max(0, Math.min(2, parseFloat(e.target.value) || 0)))}
                              className="w-full h-8 px-2.5 rounded-lg border text-[13px] font-bold font-mono outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--t1)" }}
                            />
                            <span className="absolute right-2.5 top-2 text-[10px] font-mono pointer-events-none" style={{ color: "var(--t3)" }}>/ 2</span>
                          </div>
                        </div>

                        {/* 2. Practical Performance */}
                        <div className="p-3 rounded-xl border bg-black/5 dark:bg-white/5 flex flex-col justify-between" style={{ borderColor: "var(--bdr)" }}>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--t1)" }}>
                                <Target size={12} className="text-emerald-500" /> Practical Performance
                              </label>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">Max 2.0</span>
                            </div>
                            <p className="text-[10px] mb-2" style={{ color: "var(--t3)" }}>
                              Execution correctness, algorithm logic, and live demonstration.
                            </p>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="2"
                              step="0.1"
                              placeholder="0.0 - 2.0"
                              value={performanceScore}
                              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                              onChange={(e) => setPerformanceScore(e.target.value === "" ? "" : Math.max(0, Math.min(2, parseFloat(e.target.value) || 0)))}
                              className="w-full h-8 px-2.5 rounded-lg border text-[13px] font-bold font-mono outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--t1)" }}
                            />
                            <span className="absolute right-2.5 top-2 text-[10px] font-mono pointer-events-none" style={{ color: "var(--t3)" }}>/ 2</span>
                          </div>
                        </div>
                      </div>

                      {/* Live Calculated Mark Summary Matrix */}
                      <div className="p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3" style={{ background: "rgba(6, 182, 212, 0.04)", borderColor: "rgba(6, 182, 212, 0.25)" }}>
                        <div className="flex items-center gap-4 flex-wrap text-[11px]">
                          <div>
                            <span style={{ color: "var(--t3)" }}>Note Book:</span>{" "}
                            <span className="font-bold font-mono text-[12px] text-[#06b6d4]">{nbVal} / 2.0</span>
                          </div>
                          <div className="h-3 w-[1px] bg-black/10 dark:bg-white/10" />
                          <div>
                            <span style={{ color: "var(--t3)" }}>Performance:</span>{" "}
                            <span className="font-bold font-mono text-[12px] text-emerald-500">{perfVal} / 2.0</span>
                          </div>
                          <div className="h-3 w-[1px] bg-black/10 dark:bg-white/10" />
                          <div>
                            <span style={{ color: "var(--t3)" }}>Experiment Total:</span>{" "}
                            <span className="font-bold font-mono text-[12px]" style={{ color: "var(--t1)" }}>{expSubtotal} / 4.0</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--t3)" }}>
                              Final Calculated Mark:
                            </span>
                            <div className="font-mono font-extrabold text-[15px] text-[#06b6d4]">
                              {effectiveFinalScore} / {data?.assignment.totalPoints || 100} pts
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsManualOverride((prev) => !prev)}
                            className={`h-7 px-2 rounded text-[10px] font-semibold border transition cursor-pointer ${
                              isManualOverride ? "bg-[#06b6d4] text-white border-[#06b6d4]" : "hover:bg-black/5 dark:hover:bg-white/5"
                            }`}
                            style={!isManualOverride ? { borderColor: "var(--bdr)", color: "var(--t2)" } : undefined}
                            title="Fine-tune or directly override final point mark"
                          >
                            {isManualOverride ? "Custom Active" : "Override"}
                          </button>
                        </div>
                      </div>

                      {/* Optional Manual Score Override Input */}
                      {isManualOverride && (
                        <div className="p-2.5 rounded-lg border flex items-center gap-3 bg-black/5 dark:bg-white/5" style={{ borderColor: "var(--bdr)" }}>
                          <label className="text-[11px] font-bold font-mono whitespace-nowrap" style={{ color: "var(--t2)" }}>
                            Direct Score Override:
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={data?.assignment.totalPoints || 100}
                            placeholder={`0 - ${data?.assignment.totalPoints || 100}`}
                            value={manualScoreOverride}
                            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                            onChange={(e) => setManualScoreOverride(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-32 h-7 px-2 rounded border text-[12px] font-mono outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--t1)" }}
                          />
                          <span className="text-[10px]" style={{ color: "var(--t3)" }}>
                            Overriding computed rubric mark with manual points total.
                          </span>
                        </div>
                      )}

                      {/* Qualitative Feedback */}
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
                          Qualitative Feedback on Objective Fulfillment & Code Quality
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Excellent recursive tree structure, handled base conditions cleanly, accurate observations..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="w-full p-2.5 rounded-lg border text-[12px] outline-none resize-none leading-relaxed"
                          style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--t1)" }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--t3)" }}>
                          <HelpCircle size={12} /> Syncs with Continuous Practical Evaluation Register
                        </div>

                        <Btn
                          type="button"
                          onClick={handleSaveGrade}
                          disabled={savingGrade}
                          className="!h-8 text-[11px] !px-4 flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Save size={13} /> {savingGrade ? "Saving Grade..." : "Save Feedback & Grade"}
                        </Btn>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 grid place-items-center text-center p-8">
                    <div className="space-y-2">
                      <div className="h-12 w-12 rounded-full grid place-items-center bg-amber-500/10 text-amber-500 mx-auto">
                        <Clock size={24} />
                      </div>
                      <h4 className="font-bold text-[14px]">No Submission Yet</h4>
                      <p className="text-[12px] max-w-[280px]" style={{ color: "var(--t2)" }}>
                        {selectedItem.student.name} has not submitted their solution for this experiment.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 grid place-items-center text-center p-8" style={{ color: "var(--t3)" }}>
                Select a student from the roster on the left to view details.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BatchSubmissionsRosterModal;
