// src/components/modals/StudentLabPdfSubmitModal.tsx
import React, { useState, useRef } from "react";
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
} from "lucide-react";
import { Card, Btn, Btn2 } from "../common/UIPrimitives";
import { labsApi } from "../../api";
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

  if (!show || !assignment) return null;

  const mySub = assignment.mySubmission;
  const isDuePassed = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false;
  const canUpload = !mySub || reuploadMode || (!isDuePassed || assignment.allowLate);

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
        onSubmissionSuccess(res.data);
        setSelectedFile(null);
        setStudentNotes("");
        setReuploadMode(false);
        onClose();
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to submit lab report");
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <Card
        className="relative w-full max-w-[680px] max-h-[92vh] flex flex-col p-6 shadow-2xl z-10 overflow-hidden border"
        style={{ borderColor: "var(--bdr)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--bdr)" }}>
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

              <a
                href={assignment.manualUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="h-8 px-3 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                style={{ borderColor: "var(--bdr)", color: "var(--acc)", background: "var(--srf)" }}
              >
                <Download size={13} /> Download Manual
              </a>
            </div>
          )}

          {/* Current Submission Status Card if student already submitted */}
          {mySub && !reuploadMode && (
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
                    Attempt #{mySub.attemptNumber || 1}
                  </span>
                </div>

                <div className="text-right font-mono">
                  {mySub.status === "EVALUATED" ? (
                    <span className="font-bold text-[14px] text-emerald-500">
                      Score: {mySub.score}/{assignment.totalPoints} pts
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
                    {mySub.fileName || "Submitted_Report.pdf"}
                  </span>
                  <span style={{ color: "var(--t3)" }}>({formatFileSize(mySub.fileSize)})</span>
                </div>

                {mySub.fileUrl && (
                  <a
                    href={mySub.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#06b6d4] hover:underline flex items-center gap-1 shrink-0 font-medium ml-2"
                  >
                    View PDF <ExternalLink size={11} />
                  </a>
                )}
              </div>

              {/* Supervisor Feedback if Graded */}
              {mySub.supervisorFeedback && (
                <div
                  className="p-3 rounded-lg border space-y-1"
                  style={{ background: "rgba(6, 182, 212, 0.05)", borderColor: "rgba(6, 182, 212, 0.2)" }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#06b6d4] flex items-center gap-1">
                    <Sparkles size={11} /> Faculty Feedback:
                  </div>
                  <p className="text-[12px] italic" style={{ color: "var(--t1)" }}>
                    "{mySub.supervisorFeedback}"
                  </p>
                </div>
              )}

              {/* Re-upload Option */}
              {(!isDuePassed || assignment.allowLate) && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setReuploadMode(true)}
                    className="text-[11px] text-[#06b6d4] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} /> Re-upload updated report
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Upload Form */}
          {canUpload && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--t2)" }}>
                  Upload Lab Report PDF <span className="text-red-500">*</span>
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
                  {submitting ? "Submitting Report..." : mySub ? "Re-submit PDF Report" : "Submit Lab Report"}
                </Btn>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};
