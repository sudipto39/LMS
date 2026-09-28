// src/components/modals/StudentLabPdfSubmitModal.tsx
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Upload,
  Download,
  CheckCircle2,
  FileCheck,
  Target,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Clock,
  Lock,
  ShieldCheck,
  AlertCircle,
  Send,
} from "lucide-react";
import { Btn, Btn2 } from "../common/UIPrimitives";
import { labsApi } from "../../api";
import { downloadFileBlob } from "../../utils/fileDownload";
import { useToast } from "../../context/ToastContext";
import type { LabAssignment, LabSubmission } from "../../types";

interface StudentLabPdfSubmitModalProps {
  show: boolean;
  onClose: () => void;
  assignment: LabAssignment | null;
  onSubmissionSuccess: (newSubmission: LabSubmission) => void;
}

export const StudentLabPdfSubmitModal: React.FC<StudentLabPdfSubmitModalProps> = ({
  show,
  onClose,
  assignment,
  onSubmissionSuccess,
}) => {
  const showToast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [studentNotes, setStudentNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [reuploadMode, setReuploadMode] = useState(false);

  // Local submission state so that re-upload permission requests update instantly
  const [localSub, setLocalSub] = useState<LabSubmission | null>(assignment?.mySubmission || null);
  const [requestReason, setRequestReason] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);

  useEffect(() => {
    setLocalSub(assignment?.mySubmission || null);
    setReuploadMode(false);
    setShowRequestForm(false);
    setRequestReason("");
    setSelectedFile(null);
    setStudentNotes("");
  }, [assignment?.mySubmission, assignment?.id]);

  // Lock background page and main container scrolling while modal is open
  useEffect(() => {
    if (show) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      // Also lock the main scroll container so mousewheel/touch doesn't scroll the page behind the modal
      const mainEl = document.querySelector("main") as HTMLElement | null;
      const prevMainOverflow = mainEl ? mainEl.style.overflow : "";
      if (mainEl) {
        mainEl.style.overflow = "hidden";
      }

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        if (mainEl) {
          mainEl.style.overflow = prevMainOverflow;
        }
      };
    }
  }, [show]);

  if (!show || !assignment) return null;

  const isDuePassed = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false;
  const hasExistingSubmission = Boolean(localSub);
  const isPermissionApproved = localSub?.reuploadStatus === "APPROVED";
  const isPermissionPending = localSub?.reuploadStatus === "PENDING";
  const isPermissionRejected = localSub?.reuploadStatus === "REJECTED";

  // Re-upload is ONLY permitted when supervisor has approved it
  const canUpload = !hasExistingSubmission
    ? (!isDuePassed || assignment.allowLate)
    : (reuploadMode && isPermissionApproved);

  const handleDownloadManual = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!assignment?.manualUrl) return;
    const rawName = assignment.manualName || `${assignment.title}_Manual.pdf`;
    const finalName = rawName.includes(".") ? rawName : `${rawName}.pdf`;

    showToast(`Downloading manual ${finalName}...`);
    const success = await downloadFileBlob(assignment.manualUrl, finalName, ".pdf");
    if (success) {
      showToast(`Downloaded ${finalName} ✅`);
    } else {
      showToast("Failed to download manual. Please check your connection.");
    }
  };

  const handleDownloadSubmission = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!localSub?.fileUrl) return;
    const rawName = localSub.fileName || "Submitted_Report.pdf";
    const finalName = rawName.includes(".") ? rawName : `${rawName}.pdf`;

    showToast(`Downloading report ${finalName}...`);
    const success = await downloadFileBlob(localSub.fileUrl, finalName, ".pdf");
    if (success) {
      showToast(`Downloaded ${finalName} ✅`);
    } else {
      showToast("Failed to download report PDF.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showToast("Only PDF documents (.pdf) are supported");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast("File size must be under 15MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showToast("Only PDF documents (.pdf) are supported");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast("File size must be under 15MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleRequestReupload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestReason.trim()) {
      showToast("Please provide a reason explaining why you need to re-upload.");
      return;
    }

    try {
      setRequestingPermission(true);
      const res = await labsApi.requestReupload(assignment.id, requestReason.trim());
      if (res?.data) {
        setLocalSub(res.data);
        setShowRequestForm(false);
        setRequestReason("");
        showToast("Re-upload permission request sent to supervisor! ⏳");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit re-upload request";
      showToast(msg);
    } finally {
      setRequestingPermission(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast("Please select a PDF report to upload");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (studentNotes.trim()) {
        formData.append("studentNotes", studentNotes.trim());
      }

      const res = await labsApi.submitLabReport(assignment.id, formData);
      if (res?.data) {
        showToast("Lab report PDF submitted successfully! 📄✨");
        setLocalSub(res.data);
        onSubmissionSuccess(res.data);
        setSelectedFile(null);
        setStudentNotes("");
        setReuploadMode(false);
        onClose();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit lab report";
      showToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-hidden"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-[680px] my-auto flex flex-col p-5 sm:p-6 rounded-2xl border shadow-2xl z-10 overflow-hidden"
        style={{
          background: "var(--srf)",
          borderColor: "var(--bdr)",
          maxHeight: "min(90vh, 720px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b shrink-0" style={{ borderColor: "var(--bdr)" }}>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl grid place-items-center bg-[#06b6d4]/10 text-[#06b6d4]">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-[17px] leading-tight">{assignment.title}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/30">
                  📄 PDF Report Experiment
                </span>
              </div>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--t2)" }}>
                {assignment.subject || "General Programming"} • Max Points: {assignment.totalPoints} pts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg grid place-items-center transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ color: "var(--t2)" }}
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 py-4 flex-1">
          {/* Objective Box */}
          <div
            className="p-3.5 rounded-xl border space-y-1"
            style={{ background: "rgba(6, 182, 212, 0.05)", borderColor: "rgba(6, 182, 212, 0.25)" }}
          >
            <div className="text-[11px] font-bold flex items-center gap-1.5 text-[#06b6d4] uppercase tracking-wide">
              <Target size={13} /> Experiment Objective:
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--t1)" }}>
              {assignment.objective}
            </p>
          </div>

          {/* Supervisor Guide / Manual Attachment Download if available */}
          {assignment.manualUrl && (
            <div
              className="p-3 rounded-xl border flex items-center justify-between gap-3"
              style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-8 w-8 rounded-lg grid place-items-center bg-[#8b5cf6]/10 text-[#8b5cf6] shrink-0">
                  <FileCheck size={18} />
                </div>
                <div className="truncate">
                  <div className="text-[12px] font-semibold truncate" style={{ color: "var(--t1)" }}>
                    {assignment.manualName || "Experiment_Manual_Guidelines.pdf"}
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--t3)" }}>
                    Faculty Manual & Guidelines
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadManual}
                className="h-8 px-3 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                style={{ borderColor: "var(--bdr)", color: "var(--acc)", background: "var(--srf)" }}
                title="Download Manual in original format"
              >
                <Download size={13} /> Download Manual
              </button>
            </div>
          )}

          {/* Current Submission Status Card if student already submitted */}
          {localSub && !reuploadMode && (
            <div
              className="p-4 rounded-xl border space-y-3"
              style={{ background: "rgba(34, 197, 94, 0.05)", borderColor: "rgba(34, 197, 94, 0.3)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold text-[13px] flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> Submitted Successfully
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                    Attempt #{localSub.attemptNumber || 1}
                  </span>
                </div>

                <div className="text-right font-mono">
                  {localSub.status === "EVALUATED" ? (
                    <span className="font-bold text-[14px] text-emerald-500">
                      Score: {localSub.score}/{assignment.totalPoints} pts
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-1">
                      <Clock size={12} /> Awaiting Supervisor Review
                    </span>
                  )}
                </div>
              </div>

              {/* Submitted File Info */}
              <div
                className="p-2.5 rounded-lg border flex items-center justify-between text-[11px] font-mono"
                style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText size={14} className="text-[#06b6d4] shrink-0" />
                  <span className="font-semibold truncate" style={{ color: "var(--t1)" }}>
                    {localSub.fileName || "Submitted_Report.pdf"}
                  </span>
                  <span style={{ color: "var(--t3)" }}>({formatFileSize(localSub.fileSize)})</span>
                </div>

                {localSub.fileUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadSubmission}
                    className="text-[#06b6d4] hover:underline flex items-center gap-1 shrink-0 font-medium ml-2 cursor-pointer bg-transparent border-none p-0"
                    title="Download submitted PDF"
                  >
                    View / Download PDF <ExternalLink size={11} />
                  </button>
                )}
              </div>

              {/* Supervisor Feedback if Graded */}
              {localSub.supervisorFeedback && (
                <div
                  className="p-3 rounded-lg border space-y-1"
                  style={{ background: "rgba(6, 182, 212, 0.05)", borderColor: "rgba(6, 182, 212, 0.2)" }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#06b6d4] flex items-center gap-1">
                    <Sparkles size={11} /> Faculty Feedback:
                  </div>
                  <p className="text-[12px] italic" style={{ color: "var(--t1)" }}>
                    "{localSub.supervisorFeedback}"
                  </p>
                </div>
              )}

              {/* SUPERVISOR RE-UPLOAD PERMISSION CONTROL SECTION */}
              <div className="pt-2 border-t" style={{ borderColor: "rgba(34, 197, 94, 0.2)" }}>
                {isPermissionApproved ? (
                  <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck size={16} /> Supervisor Permission Granted
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        Authorized for Re-upload
                      </span>
                    </div>
                    <p className="text-[12px]" style={{ color: "var(--t2)" }}>
                      Your supervisor has authorized you to re-upload a revised report. Click below to select and upload your new PDF.
                    </p>
                    <div className="pt-1 flex justify-end">
                      <Btn
                        type="button"
                        onClick={() => setReuploadMode(true)}
                        className="!h-8.5 text-[11px] !px-3.5 flex items-center gap-1.5 cursor-pointer shadow-sm !bg-emerald-600 hover:!bg-emerald-700 text-white"
                      >
                        <RotateCcw size={13} /> Upload Revised Report Now
                      </Btn>
                    </div>
                  </div>
                ) : isPermissionPending ? (
                  <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Clock size={15} /> Re-upload Permission Pending
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">
                        Awaiting Faculty Review
                      </span>
                    </div>
                    <p className="text-[12px]" style={{ color: "var(--t2)" }}>
                      Your supervisor has not yet reviewed your re-upload request. You will be able to upload once permission is granted.
                    </p>
                    {localSub.reuploadReason && (
                      <div className="text-[11px] italic p-2 rounded-lg border border-amber-500/20 bg-amber-500/5" style={{ color: "var(--t1)" }}>
                        <span className="font-semibold not-italic text-amber-600 dark:text-amber-400 block mb-0.5">Your Stated Reason:</span>
                        "{localSub.reuploadReason}"
                      </div>
                    )}
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowRequestForm(true)}
                        className="text-[11px] text-amber-600 hover:underline cursor-pointer bg-transparent border-none font-medium"
                      >
                        Edit / Update Reason
                      </button>
                    </div>
                  </div>
                ) : isPermissionRejected ? (
                  <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-red-500 flex items-center gap-1.5">
                        <AlertCircle size={15} /> Re-upload Request Declined
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-500 font-semibold">
                        Faculty Declined
                      </span>
                    </div>
                    <p className="text-[12px]" style={{ color: "var(--t2)" }}>
                      Your supervisor declined the previous re-upload request. If you have valid academic grounds or corrections, you can request permission again.
                    </p>
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowRequestForm(true)}
                        className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 text-[11px] font-semibold cursor-pointer transition flex items-center gap-1.5"
                      >
                        <RotateCcw size={12} /> Request Permission Again
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border space-y-2" style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold flex items-center gap-1.5" style={{ color: "var(--t1)" }}>
                        <Lock size={14} className="text-amber-500" /> Need to re-upload your report?
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">
                        Supervisor Permission Required
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: "var(--t3)" }}>
                      Re-uploading an already submitted lab report requires faculty supervisor approval.
                    </p>
                    <div className="pt-1 flex justify-end">
                      <Btn2
                        type="button"
                        onClick={() => setShowRequestForm(true)}
                        className="!h-8 text-[11px] !px-3 flex items-center gap-1.5 cursor-pointer !bg-[#06b6d4]/10 !text-[#06b6d4] hover:!bg-[#06b6d4]/20 border border-[#06b6d4]/30"
                      >
                        <RotateCcw size={12} /> Request Re-upload Permission
                      </Btn2>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INLINE RE-UPLOAD REQUEST REASON FORM */}
          {showRequestForm && localSub && !reuploadMode && (
            <form onSubmit={handleRequestReupload} className="p-4 rounded-xl border border-[#06b6d4]/40 bg-[#06b6d4]/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-bold text-[#06b6d4] flex items-center gap-1.5">
                  <RotateCcw size={14} /> Request Re-upload Permission from Supervisor
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#06b6d4]/20 text-[#06b6d4]">
                  Official Faculty Request
                </span>
              </div>
              <p className="text-[11px]" style={{ color: "var(--t2)" }}>
                Please provide a clear reason explaining why you need to re-upload this lab report (e.g., corrected graph calculations, revised error analysis, updated lab manual answers).
              </p>
              <textarea
                rows={3}
                required
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="State your reason for requesting re-upload..."
                className="w-full rounded-xl p-3 text-[12px] border outline-none resize-none focus:border-[#06b6d4]"
                style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--t1)" }}
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <Btn2
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="!h-8 text-[11px] !px-3"
                  disabled={requestingPermission}
                >
                  Cancel
                </Btn2>
                <Btn
                  type="submit"
                  disabled={!requestReason.trim() || requestingPermission}
                  className="!h-8 text-[11px] !px-4 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send size={12} /> {requestingPermission ? "Submitting..." : "Send Request to Supervisor"}
                </Btn>
              </div>
            </form>
          )}

          {/* Upload Form */}
          {canUpload && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {reuploadMode && (
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-[12px]">
                    <ShieldCheck size={16} /> Authorized Re-upload Session Active
                  </div>
                  <button
                    type="button"
                    onClick={() => setReuploadMode(false)}
                    className="text-[11px] text-red-500 hover:underline cursor-pointer bg-transparent border-none"
                  >
                    Cancel Re-upload
                  </button>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--t2)" }}>
                  {reuploadMode ? "Upload Revised Lab Report PDF" : "Upload Lab Report PDF"} <span className="text-red-500">*</span>
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 ${
                    isDragOver
                      ? "border-[#06b6d4] bg-[#06b6d4]/5"
                      : selectedFile
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "hover:border-[#06b6d4]/50"
                  }`}
                  style={{ borderColor: selectedFile ? "rgba(34, 197, 94, 0.5)" : "var(--bdr)" }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    <>
                      <div className="h-12 w-12 rounded-2xl grid place-items-center bg-emerald-500/10 text-emerald-500">
                        <FileCheck size={26} />
                      </div>
                      <div>
                        <div className="font-semibold text-[13px] text-emerald-500">{selectedFile.name}</div>
                        <div className="text-[11px] font-mono" style={{ color: "var(--t3)" }}>
                          {formatFileSize(selectedFile.size)} • Click or drop another PDF to replace
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-12 w-12 rounded-2xl grid place-items-center bg-[#06b6d4]/10 text-[#06b6d4]">
                        <Upload size={24} />
                      </div>
                      <div>
                        <div className="font-semibold text-[13px]" style={{ color: "var(--t1)" }}>
                          Drag & drop your lab report PDF here
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: "var(--t3)" }}>
                          or click to browse from device (PDF only, up to 15MB)
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Student Notes */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
                  Optional Notes / Remarks for Supervisor
                </label>
                <textarea
                  rows={2}
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="e.g., Included graph analysis on page 4, answered all discussion questions."
                  className="w-full rounded-xl p-3 text-[12px] border outline-none resize-none"
                  style={{ background: "var(--srf2)", borderColor: "var(--bdr)", color: "var(--t1)" }}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-2">
                {reuploadMode ? (
                  <Btn2 type="button" onClick={() => setReuploadMode(false)} className="!h-9 text-[12px]">
                    Cancel Re-upload
                  </Btn2>
                ) : (
                  <div className="text-[11px] font-mono" style={{ color: "var(--t3)" }}>
                    {assignment.dueDate && `Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                  </div>
                )}

                <Btn
                  type="submit"
                  disabled={!selectedFile || submitting}
                  className="!h-9 text-[12px] !px-5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload size={14} />
                  {submitting ? "Submitting Report..." : localSub ? "Submit Revised PDF Report" : "Submit Lab Report"}
                </Btn>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
