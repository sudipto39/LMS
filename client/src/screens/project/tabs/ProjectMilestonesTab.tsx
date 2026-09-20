import React, { useState } from "react";
import {
  CloudUpload,
  Star,
  Paperclip,
  FileText,
  Download,
  Play,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { Card, Btn, Btn2, Pill, Inp } from "../../../components/common/UIPrimitives";
import { useAuth } from "../../../context/AuthContext";
import type { Milestone } from "../../../types";

interface ProjectMilestonesTabProps {
  liveMilestones: Milestone[];
  onStartMilestone: (id: string) => void;
  onApproveMilestone: (id: string) => void;
  onRejectMilestone: (id: string, feedback: string) => void;
  onOpenGradeModal: () => void;
  onNavigate: (dest: string) => void;
}

export const ProjectMilestonesTab: React.FC<ProjectMilestonesTabProps> = ({
  liveMilestones,
  onStartMilestone,
  onApproveMilestone,
  onRejectMilestone,
  onOpenGradeModal,
  onNavigate,
}) => {
  const { role } = useAuth();
  const [rejectingMilestoneId, setRejectingMilestoneId] = useState<string | null>(null);
  const [rejectFeedbackText, setRejectFeedbackText] = useState("");

  const handleConfirmReject = (id: string) => {
    onRejectMilestone(
      id,
      rejectFeedbackText.trim() || "Please revise milestone deliverables and resubmit."
    );
    setRejectingMilestoneId(null);
    setRejectFeedbackText("");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-[15px]">Project Milestones</h3>
          <p className="text-[12px]" style={{ color: "var(--t2)" }}>
            {role === "SUPERVISOR" || role === "ADMIN"
              ? "Review deliverables, inspect submissions, and evaluate milestone completion"
              : "Track deliverables and submit files for supervisor review"}
          </p>
        </div>
        {role === "STUDENT" ? (
          <Btn onClick={() => onNavigate("milestones")}>
            <CloudUpload size={14} /> Upload Attachments
          </Btn>
        ) : (
          <Btn onClick={onOpenGradeModal}>
            <Star size={14} /> Grade Project
          </Btn>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveMilestones.map((m) => (
          <Card key={m.id} className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <span className="font-semibold text-[13px]">{m.title}</span>
              <Pill
                color={
                  m.status === "APPROVED"
                    ? "#22c55e"
                    : m.status === "SUBMITTED"
                    ? "#06b6d4"
                    : m.status === "IN_PROGRESS"
                    ? "#f59e0b"
                    : m.status === "REJECTED"
                    ? "#ef4444"
                    : undefined
                }
              >
                {m.status}
              </Pill>
            </div>
            <div className="text-[12px]" style={{ color: "var(--t2)" }}>
              Due Date: <b>{m.due}</b> • {m.files || m.attachments?.length || 0} files attached
            </div>

            {/* Show uploaded deliverable attachments if present */}
            {m.attachments && m.attachments.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="text-[10px] font-bold uppercase text-[var(--t3)] flex items-center gap-1">
                  <Paperclip size={10} /> Submitted Deliverables:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {m.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px]"
                      style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                    >
                      <FileText size={12} className="text-[#06b6d4]" />
                      <span className="font-mono truncate max-w-[160px]">{att.name}</span>
                      {att.url ? (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#06b6d4] hover:underline font-semibold flex items-center gap-0.5 ml-1"
                          title="Download Attachment"
                        >
                          <Download size={10} /> Get
                        </a>
                      ) : (
                        <span className="text-[9px] text-[#22c55e] font-semibold">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {m.note && (
              <div
                className="text-[11px] p-2 rounded-lg"
                style={{ background: "var(--srf2)", color: "var(--t2)" }}
              >
                {m.note}
              </div>
            )}

            <div className="flex gap-2 pt-2 items-center flex-wrap">
              {/* STUDENT ACTIONS */}
              {role === "STUDENT" && (
                <>
                  {m.status === "PENDING" && (
                    <Btn2 onClick={() => onStartMilestone(m.id)}>
                      <Play size={12} /> Start Milestone
                    </Btn2>
                  )}
                  {(m.status === "IN_PROGRESS" || m.status === "REJECTED") && (
                    <Btn
                      onClick={() => onNavigate("milestones")}
                      className="h-8 text-[11px]"
                    >
                      <Send size={12} />{" "}
                      {m.status === "REJECTED"
                        ? "Resubmit Deliverables"
                        : "Submit Deliverables"}
                    </Btn>
                  )}
                  {m.status === "SUBMITTED" && (
                    <span className="text-[11px] text-[#06b6d4] font-medium flex items-center gap-1.5 py-1">
                      <Clock size={13} /> Awaiting Supervisor Review
                    </span>
                  )}
                  {m.status === "APPROVED" && (
                    <span className="text-[11px] text-[#22c55e] font-semibold flex items-center gap-1.5 py-1">
                      <CheckCircle2 size={13} /> Approved by Supervisor
                    </span>
                  )}
                </>
              )}

              {/* SUPERVISOR / ADMIN ACTIONS */}
              {(role === "SUPERVISOR" || role === "ADMIN") && (
                <>
                  {m.status === "PENDING" && (
                    <span className="text-[11px] text-[var(--t3)] italic flex items-center gap-1.5 py-1">
                      <Clock size={13} /> Pending Student Team Start
                    </span>
                  )}
                  {m.status === "IN_PROGRESS" && (
                    <span className="text-[11px] text-[#f59e0b] font-medium flex items-center gap-1.5 py-1">
                      <Clock size={13} /> In Progress by Student Team
                    </span>
                  )}
                  {m.status === "REJECTED" && (
                    <span className="text-[11px] text-[#ef4444] font-medium flex items-center gap-1.5 py-1">
                      <AlertCircle size={13} /> Changes Requested (Awaiting Student Resubmission)
                    </span>
                  )}
                  {m.status === "APPROVED" && (
                    <span className="text-[11px] text-[#22c55e] font-semibold flex items-center gap-1.5 py-1">
                      <CheckCircle2 size={13} /> Milestone Approved ✓
                    </span>
                  )}
                  {m.status === "SUBMITTED" && (
                    <div className="w-full space-y-2">
                      {rejectingMilestoneId === m.id ? (
                        <div className="p-2.5 rounded-xl border border-red-500/30 bg-red-500/5 space-y-2">
                          <label className="text-[11px] font-bold text-red-400">
                            Reason for requesting changes:
                          </label>
                          <Inp
                            autoFocus
                            placeholder="Describe required revisions..."
                            value={rejectFeedbackText}
                            onChange={(e) => setRejectFeedbackText(e.target.value)}
                            className="text-xs"
                          />
                          <div className="flex gap-2 justify-end">
                            <Btn2
                              onClick={() => {
                                setRejectingMilestoneId(null);
                                setRejectFeedbackText("");
                              }}
                              className="h-7 text-[11px]"
                            >
                              Cancel
                            </Btn2>
                            <button
                              type="button"
                              onClick={() => handleConfirmReject(m.id)}
                              className="h-7 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition cursor-pointer"
                            >
                              Confirm Request
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => onApproveMilestone(m.id)}
                            className="flex-1 h-8 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition"
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectingMilestoneId(m.id)}
                            className="flex-1 h-8 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition"
                          >
                            <X size={13} /> Request Changes
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectMilestonesTab;
