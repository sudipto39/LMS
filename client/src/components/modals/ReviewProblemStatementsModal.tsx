// src/components/modals/ReviewProblemStatementsModal.tsx
import React, { useState, useEffect } from "react";
import { Sparkles, X, CheckCircle2, XCircle, Check, User } from "lucide-react";
import { Card, Btn, Btn2, Pill } from "../common/UIPrimitives";
import { problemStatementsApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import type { ProblemStatement } from "../../types";

interface ReviewProblemStatementsModalProps {
  show: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const ReviewProblemStatementsModal: React.FC<ReviewProblemStatementsModalProps> = ({
  show,
  onClose,
  onUpdated,
}) => {
  const showToast = useToast();
  const [pendingIdeas, setPendingIdeas] = useState<ProblemStatement[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [adminFeedback, setAdminFeedback] = useState<{ [id: string]: string }>({});

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await problemStatementsApi.getPendingAdmin();
      if (res?.data) {
        setPendingIdeas(res.data);
      }
    } catch {
      showToast("Could not load pending problem statements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchPending();
    }
  }, [show]);

  if (!show) return null;

  const handleReview = async (id: string, status: "APPROVED" | "REJECTED") => {
    setReviewingId(id);
    try {
      const feedback = adminFeedback[id]?.trim() || undefined;
      await problemStatementsApi.review(id, status, feedback);
      setPendingIdeas((prev) => prev.filter((item) => item.id !== id));
      showToast(
        status === "APPROVED"
          ? "Problem statement approved and published to Idea Bank! ✅"
          : "Problem statement proposal rejected with remarks."
      );
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to process review.");
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[700px] max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: "var(--bdr)" }}>
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg grid place-items-center"
              style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-[15px]">Problem Statement Approval Queue</h3>
              <p className="text-[11px]" style={{ color: "var(--t2)" }}>
                Review, vet, and approve faculty-proposed capstone hackathon challenges ({pendingIdeas.length} pending)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="py-12 text-center text-[12px]" style={{ color: "var(--t2)" }}>
              Loading pending proposals...
            </div>
          ) : pendingIdeas.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 opacity-80" />
              <div className="font-bold text-[14px]">All Caught Up!</div>
              <p className="text-[12px]" style={{ color: "var(--t2)" }}>
                There are no pending problem statement proposals awaiting academic review.
              </p>
            </div>
          ) : (
            pendingIdeas.map((idea) => {
              const isActioning = reviewingId === idea.id;
              return (
                <div
                  key={idea.id}
                  className="p-4 rounded-xl border space-y-3"
                  style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                          {idea.domain}
                        </span>
                        <Pill color="#f59e0b" className="text-[9px]">
                          Pending Review
                        </Pill>
                        <span className="text-[10px]" style={{ color: "var(--t3)" }}>
                          Max Teams: <strong>{idea.maxSelections || 3}</strong>
                        </span>
                      </div>
                      <h4 className="font-bold text-[14px]">{idea.title}</h4>
                    </div>
                  </div>

                  <div className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--t3)" }}>
                    <User size={12} />
                    <span>Proposed by Faculty:</span>
                    <strong style={{ color: "var(--t1)" }}>
                      {idea.creator?.name || "Supervisor"} ({idea.creator?.email})
                    </strong>
                  </div>

                  <p className="text-[12px] leading-relaxed" style={{ color: "var(--t2)" }}>
                    {idea.description}
                  </p>

                  {idea.expectedOutcomes && (
                    <div className="p-2.5 rounded-lg text-[11px] bg-black/5 dark:bg-white/5">
                      <strong className="text-[var(--t1)]">Expected Outcomes:</strong> {idea.expectedOutcomes}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {(idea.technologies || []).map((tech) => (
                      <span
                        key={tech}
                        className="text-[9px] px-2 py-0.5 rounded border"
                        style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Admin Feedback Box */}
                  <div className="space-y-1 pt-1">
                    <input
                      type="text"
                      placeholder="Optional feedback / remarks for supervisor..."
                      value={adminFeedback[idea.id] || ""}
                      onChange={(e) =>
                        setAdminFeedback({ ...adminFeedback, [idea.id]: e.target.value })
                      }
                      className="w-full h-8 rounded-lg border px-2.5 text-[11px] outline-none"
                      style={{
                        background: "var(--srf)",
                        borderColor: "var(--bdr)",
                        color: "var(--t1)",
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--bdr)" }}>
                    <Btn2
                      disabled={isActioning}
                      onClick={() => handleReview(idea.id, "REJECTED")}
                      className="!h-8 text-[11px] !border-rose-500/30 !text-rose-500 hover:!bg-rose-500/10"
                    >
                      <XCircle size={13} /> Reject Proposal
                    </Btn2>
                    <Btn
                      disabled={isActioning}
                      onClick={() => handleReview(idea.id, "APPROVED")}
                      className="!h-8 text-[11px] !bg-emerald-600 hover:!bg-emerald-500"
                    >
                      {isActioning ? "Processing..." : (
                        <>
                          <Check size={13} /> Approve & Publish to Idea Bank
                        </>
                      )}
                    </Btn>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReviewProblemStatementsModal;
