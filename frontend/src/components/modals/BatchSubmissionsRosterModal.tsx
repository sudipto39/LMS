// src/components/modals/BatchSubmissionsRosterModal.tsx
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Card, Btn, Btn2, Pill } from "../common/UIPrimitives";
import { labsApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import type { LabRosterResponse, LabRosterItem } from "../../types";

import { DEMO_LAB_ASSIGNMENTS } from "../../screens/LabAssignmentsScreen";

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
          score: 85,
          manualScoreAdjust: 0,
          attemptNumber: 1,
          submittedAt: new Date(Date.now() - 3600000 * 26).toISOString(),
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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LabRosterResponse | null>(null);
  const [selectedItem, setSelectedItem] = useState<LabRosterItem | null>(null);

  // Manual Review Form
  const [manualScore, setManualScore] = useState<number | "">("");
  const [feedback, setFeedback] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    if (show && assignmentId) {
      loadRoster();
    }
  }, [show, assignmentId]);

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
      const isPdfReport = !item.latestSubmission.code || Boolean(item.latestSubmission.fileUrl);
      if (isPdfReport) {
        setManualScore(
          typeof item.latestSubmission.score === "number"
            ? item.latestSubmission.score
            : typeof item.latestSubmission.manualScoreAdjust === "number"
            ? item.latestSubmission.manualScoreAdjust
            : ""
        );
      } else {
        setManualScore(
          typeof item.latestSubmission.manualScoreAdjust === "number"
            ? item.latestSubmission.manualScoreAdjust
            : ""
        );
      }
      setFeedback(item.latestSubmission.supervisorFeedback || "");
    } else {
      setManualScore("");
      setFeedback("");
    }
  };

  const handleSaveGrade = async () => {
    if (!selectedItem?.latestSubmission) return;

    try {
      setSavingGrade(true);
      const submissionId = selectedItem.latestSubmission.id;
      const isPdfReport = !selectedItem.latestSubmission.code || Boolean(selectedItem.latestSubmission.fileUrl);

      const res = await labsApi.gradeSubmission(submissionId, {
        score: isPdfReport && manualScore !== "" ? Number(manualScore) : undefined,
        manualScoreAdjust: !isPdfReport && manualScore !== "" ? Number(manualScore) : undefined,
        supervisorFeedback: feedback.trim() || undefined,
      });

      if (res?.data) {
        showToast("Grade and feedback saved successfully! ✅");
        const updatedScore = isPdfReport && manualScore !== "" ? Number(manualScore) : selectedItem.latestSubmission.score;
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
                      score: updatedScore,
                      manualScoreAdjust: !isPdfReport && manualScore !== "" ? Number(manualScore) : undefined,
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
        showToast("Grade and feedback saved successfully! ✅");
        const isPdfReport = !selectedItem.latestSubmission.code || Boolean(selectedItem.latestSubmission.fileUrl);
        const updatedScore = isPdfReport && manualScore !== "" ? Number(manualScore) : selectedItem.latestSubmission.score;
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
                      score: updatedScore,
                      manualScoreAdjust: !isPdfReport && manualScore !== "" ? Number(manualScore) : undefined,
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

  const handleExportRoster = () => {
    if (!data) return;
    const headers = [
      "Student Name",
      "University ID",
      "Email",
      "Status",
      "Tests Passed",
      "Automated Score",
      "Manual Adjust",
      "Total Score",
      "Submitted Date",
      "Supervisor Feedback",
    ];

    const rows = data.roster.map((r) => {
      const sub = r.latestSubmission;
      const autoScore = sub ? sub.score : 0;
      const adjust = sub?.manualScoreAdjust || 0;
      const finalScore = autoScore + adjust;
      return [
        `"${r.student.name}"`,
        `"${r.student.universityId || ""}"`,
        `"${r.student.email}"`,
        `"${r.hasSubmitted ? sub?.status : "NOT_SUBMITTED"}"`,
        `"${sub ? `${sub.testsPassed}/${sub.totalTests}` : "0/0"}"`,
        autoScore,
        adjust,
        finalScore,
        `"${sub?.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "-"}"`,
        `"${(sub?.supervisorFeedback || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${data.assignment.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-batch-roster.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Batch gradebook roster exported to CSV 📊");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[1100px] h-[85vh] flex flex-col p-6 shadow-2xl z-10 overflow-hidden border" style={{ borderColor: "var(--bdr)" }}>
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
                Batch: <span className="font-semibold text-[#06b6d4]">{data?.assignment.batch.name || "Target Batch"}</span> | Total Marks: {data?.assignment.totalPoints || 100} pts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Btn2
              type="button"
              onClick={handleExportRoster}
              className="!h-8 text-[11px] !px-3 flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet size={13} className="text-emerald-500" /> Export CSV
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
          <div className="md:col-span-5 border rounded-xl overflow-y-auto flex flex-col" style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}>
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
                              {sub.fileUrl || !sub.code ? "📄 PDF Report" : `${sub.testsPassed}/${sub.totalTests} tests`}
                            </div>
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

          {/* Right: Submission Inspection & Manual Review */}
          <div className="md:col-span-7 border rounded-xl p-4 overflow-y-auto flex flex-col space-y-4" style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}>
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
                    {/* Check if PDF Report Submission */}
                    {!selectedItem.latestSubmission.code || Boolean(selectedItem.latestSubmission.fileUrl) ? (
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
                                {selectedItem.latestSubmission.fileSize ? `${Math.round(selectedItem.latestSubmission.fileSize / 1024)} KB` : "PDF Report"} • Submitted {new Date(selectedItem.latestSubmission.submittedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          {selectedItem.latestSubmission.fileUrl && (
                            <a
                              href={selectedItem.latestSubmission.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="h-8.5 px-3 rounded-lg font-semibold text-[12px] bg-[#06b6d4] hover:bg-[#0891b2] text-white flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                            >
                              <Download size={13} /> Open / Download PDF
                            </a>
                          )}
                        </div>

                        {selectedItem.latestSubmission.studentNotes && (
                          <div className="p-2.5 rounded-lg border text-[12px] bg-black/5 dark:bg-white/5" style={{ borderColor: "var(--bdr)" }}>
                            <span className="font-bold text-[10px] uppercase tracking-wider text-[#06b6d4] block mb-0.5">Student Notes:</span>
                            <p style={{ color: "var(--t1)" }}>"{selectedItem.latestSubmission.studentNotes}"</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Automated Test Results Breakdown */}
                        <div>
                          <h4 className="text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--t2)" }}>
                            Automated Test Evaluation: {selectedItem.latestSubmission.testsPassed} / {selectedItem.latestSubmission.totalTests} Passed
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

                        {/* Code Viewer */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--t2)" }}>
                              <Code2 size={13} className="text-[#06b6d4]" /> Student Source Code ({selectedItem.latestSubmission.language})
                            </label>
                          </div>
                          <pre className="p-3 rounded-xl border text-[11px] font-mono overflow-x-auto max-h-[160px] bg-[#0d1b22] text-[#38bdf8] leading-relaxed" style={{ borderColor: "var(--bdr)" }}>
                            {selectedItem.latestSubmission.code}
                          </pre>
                        </div>
                      </>
                    )}

                    {/* Supervisor Evaluation & Feedback Form */}
                    <div className="p-3.5 rounded-xl border space-y-3" style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}>
                      <h4 className="text-[12px] font-bold flex items-center gap-1.5" style={{ color: "var(--t1)" }}>
                        <Sparkles size={14} className="text-[#06b6d4]" /> Faculty Evaluation & Grading
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
                            {!selectedItem.latestSubmission.code || Boolean(selectedItem.latestSubmission.fileUrl)
                              ? `Assign Score (0 - ${data?.assignment.totalPoints || 100} pts)`
                              : "Manual Score Adjustment (+/- pts)"}
                          </label>
                          <input
                            type="number"
                            placeholder={
                              !selectedItem.latestSubmission.code || Boolean(selectedItem.latestSubmission.fileUrl)
                                ? `e.g. 95`
                                : "e.g. +5 or -2"
                            }
                            value={manualScore}
                            onChange={(e) => setManualScore(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full h-8 px-2.5 rounded-lg border text-[12px] font-mono outline-none"
                            style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--t1)" }}
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
                            Final Calculated Mark
                          </label>
                          <div className="h-8 px-3 rounded-lg border flex items-center font-bold font-mono text-[13px] text-[#06b6d4]" style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}>
                            {!selectedItem.latestSubmission.code || Boolean(selectedItem.latestSubmission.fileUrl)
                              ? `${Number(manualScore) || 0} / ${data?.assignment.totalPoints || 100}`
                              : `${selectedItem.latestSubmission.score + (Number(manualScore) || 0)} / ${data?.assignment.totalPoints || 100}`}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
                          Qualitative Feedback on Objective Fulfillment
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Excellent recursive tree structure, handled base conditions cleanly..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="w-full p-2 rounded-lg border text-[12px] outline-none resize-none"
                          style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--t1)" }}
                        />
                      </div>

                      <Btn
                        type="button"
                        onClick={handleSaveGrade}
                        disabled={savingGrade}
                        className="!h-8 text-[11px] !px-3 flex items-center gap-1.5 cursor-pointer ml-auto"
                      >
                        <Save size={13} /> {savingGrade ? "Saving..." : "Save Feedback & Grade"}
                      </Btn>
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
