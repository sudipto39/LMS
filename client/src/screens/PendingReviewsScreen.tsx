// src/screens/PendingReviewsScreen.tsx
import React from "react";
import { ClipboardCheck, CheckCircle2, X, Download, Star } from "lucide-react";
import { Card, Pill } from "../components/common/UIPrimitives";
import { useToast } from "../context/ToastContext";
import type { Milestone, Project } from "../types";

interface PendingReviewsScreenProps {
  milestones: Milestone[];
  projects: Project[];
  onApproveMilestone: (id: string) => void;
  onRejectMilestone: (id: string, reason: string) => void;
  onOpenGradeModal: (project: Project) => void;
}

export const PendingReviewsScreen: React.FC<PendingReviewsScreenProps> = ({
  milestones,
  projects,
  onApproveMilestone,
  onRejectMilestone,
  onOpenGradeModal,
}) => {
  const showToast = useToast();
  const pending = milestones.filter((m) => m.status === "SUBMITTED");

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      <div>
        <h1 className="text-[24px] font-bold flex items-center gap-2">
          <ClipboardCheck size={22} style={{ color: "var(--acc)" }} /> Pending
          Review Queue
        </h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--t2)" }}>
          Evaluate submitted milestone files and defense deliverables
        </p>
      </div>

      {pending.length === 0 ? (
        <Card className="p-12 text-center space-y-2">
          <CheckCircle2 size={36} className="text-[#22c55e] mx-auto" />
          <h3 className="font-bold text-[16px]">Review Queue Clean!</h3>
          <p className="text-[12px]" style={{ color: "var(--t2)" }}>
            All submitted deliverables have been evaluated.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((m) => {
            const proj = projects.find((p) => p.id === m.projectId);
            return (
              <Card key={m.id} className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-[14px]">{m.title}</div>
                    <div
                      className="text-[11px] mt-0.5"
                      style={{ color: "var(--t2)" }}
                    >
                      Project: <b>{proj?.title || "Capstone Project"}</b> • Lead:{" "}
                      {proj?.team?.[0]?.name || "Student"}
                    </div>
                  </div>
                  <Pill color="#f59e0b">Awaiting Evaluation</Pill>
                </div>

                <div
                  className="p-3 rounded-xl border text-[12px]"
                  style={{
                    background: "var(--srf2)",
                    borderColor: "var(--bdr)",
                  }}
                >
                  <span className="font-semibold">Student Notes:</span>{" "}
                  {m.note || "Deliverables uploaded for milestone review."}
                </div>

                <div className="flex flex-wrap gap-2 items-center justify-between pt-2 border-t" style={{ borderColor: "var(--bdr)" }}>
                  <button
                    type="button"
                    onClick={() =>
                      showToast("Downloading deliverable package...")
                    }
                    className="h-8 px-3 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
                    style={{ borderColor: "var(--bdr)" }}
                  >
                    <Download size={12} /> Download Package ({m.files} files)
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onApproveMilestone(m.id)}
                      className="h-8 px-4 rounded-full bg-[#22c55e] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 size={12} /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onRejectMilestone(
                          m.id,
                          "Please fix the formatting in the report."
                        )
                      }
                      className="h-8 px-4 rounded-full bg-[#ef4444] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <X size={12} /> Reject
                    </button>
                    {proj && (
                      <button
                        type="button"
                        onClick={() => onOpenGradeModal(proj)}
                        className="h-8 px-4 rounded-full bg-gradient-to-r from-[#06b6d4] to-[#2563eb] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Star size={12} /> Grade Final
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingReviewsScreen;
