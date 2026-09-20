// src/components/modals/ReviewSupervisorRequestsModal.tsx
import React, { useState, useEffect } from "react";
import { UserCheck, X, CheckCircle2, XCircle, User } from "lucide-react";
import { Card, Btn, Btn2, Pill } from "../common/UIPrimitives";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import type { SupervisorAllocationRequest, User as UserType } from "../../types";

interface ReviewSupervisorRequestsModalProps {
  show: boolean;
  onClose: () => void;
  supervisors: UserType[];
  onUpdated?: () => void;
}

export const ReviewSupervisorRequestsModal: React.FC<ReviewSupervisorRequestsModalProps> = ({
  show,
  onClose,
  supervisors,
  onUpdated,
}) => {
  const showToast = useToast();
  const [requests, setRequests] = useState<SupervisorAllocationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [selectedSupervisors, setSelectedSupervisors] = useState<{ [id: string]: string }>({});
  const [adminNotes, setAdminNotes] = useState<{ [id: string]: string }>({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSupervisorRequests();
      if (res?.data) {
        setRequests(res.data);
        // Pre-fill each request with its requestedSupervisorId
        const initialMap: { [id: string]: string } = {};
        res.data.forEach((r) => {
          if (r.requestedSupervisorId) {
            initialMap[r.id] = r.requestedSupervisorId;
          } else if (supervisors.length > 0) {
            initialMap[r.id] = supervisors[0].id;
          }
        });
        setSelectedSupervisors(initialMap);
      }
    } catch {
      showToast("Could not load supervisor allocation requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchRequests();
    }
  }, [show]);

  if (!show) return null;

  const handleDecision = async (
    projectId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    setActioningId(projectId);
    try {
      const assignedSupId = selectedSupervisors[projectId];
      const note = adminNotes[projectId]?.trim() || undefined;

      await adminApi.reviewSupervisorRequest(projectId, status, assignedSupId, note);
      setRequests((prev) => prev.filter((r) => r.id !== projectId));
      showToast(
        status === "APPROVED"
          ? "Faculty advisor successfully allocated and assigned! ✅"
          : "Supervisor preference request declined."
      );
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to process allocation.");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[740px] max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: "var(--bdr)" }}>
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg grid place-items-center"
              style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--acc)" }}
            >
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="font-bold text-[15px]">Supervisor Allocation Requests Queue</h3>
              <p className="text-[11px]" style={{ color: "var(--t2)" }}>
                Review student supervisor preferences, verify faculty workload balance, and confirm allocations ({requests.length} pending)
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
              Loading supervisor requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 opacity-80" />
              <div className="font-bold text-[14px]">Queue Clear!</div>
              <p className="text-[12px]" style={{ color: "var(--t2)" }}>
                There are no pending supervisor allocation requests. All projects have advisors assigned.
              </p>
            </div>
          ) : (
            requests.map((item) => {
              const isActioning = actioningId === item.id;
              const chosenSupervisorId = selectedSupervisors[item.id] || item.requestedSupervisorId || "";
              const chosenSupervisor = supervisors.find((s) => s.id === chosenSupervisorId);
              const isOverride = item.requestedSupervisorId && chosenSupervisorId !== item.requestedSupervisorId;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border space-y-3"
                  style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {item.problemStatement && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                            Challenge: {item.problemStatement.domain}
                          </span>
                        )}
                        <Pill color="#f59e0b" className="text-[9px]">
                          Pending Allocation
                        </Pill>
                        {item.batch && (
                          <span className="text-[10px]" style={{ color: "var(--t3)" }}>
                            Batch: <strong>{item.batch.name}</strong>
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-[14px]">{item.title}</h4>
                      {item.problemStatement && (
                        <p className="text-[11px] text-[var(--acc)] font-medium">
                          Problem Statement: {item.problemStatement.title}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Student Team Lead */}
                  <div className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--t3)" }}>
                    <User size={12} />
                    <span>Student Team Leader:</span>
                    <strong style={{ color: "var(--t1)" }}>
                      {item.owner.name} ({item.owner.email}) — {item.owner.department || "CSE"}
                    </strong>
                  </div>

                  {/* Student's Reason */}
                  {item.supervisorRequestReason && (
                    <div className="p-2.5 rounded-lg text-[11px] bg-cyan-500/5 border border-cyan-500/20 text-[var(--t2)]">
                      <strong className="text-[var(--acc)]">Student Justification:</strong> "{item.supervisorRequestReason}"
                    </div>
                  )}

                  {/* Supervisor Allocation Selector & Workload */}
                  <div className="p-3 rounded-xl border space-y-2" style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}>
                    <div className="flex justify-between items-center flex-wrap gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: "var(--t2)" }}>Requested Advisor:</span>
                        <strong style={{ color: "var(--t1)" }}>
                          {item.requestedSupervisor?.name || "None specified"}
                        </strong>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          Active Load: {item.supervisorActiveCount} project{item.supervisorActiveCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {isOverride && (
                        <span className="text-[10px] text-amber-400 font-bold">
                          ⚡ Reassigning to different faculty
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t3)" }}>
                        Confirm or Reassign Advisor:
                      </label>
                      <select
                        value={chosenSupervisorId}
                        onChange={(e) =>
                          setSelectedSupervisors({
                            ...selectedSupervisors,
                            [item.id]: e.target.value,
                          })
                        }
                        className="w-full h-9 rounded-lg border px-2.5 text-[12px] outline-none"
                        style={{
                          background: "var(--srf2)",
                          borderColor: "var(--bdr)",
                          color: "var(--t1)",
                        }}
                      >
                        {supervisors.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — {s.dept || "Faculty"} ({s.email}) {s.id === item.requestedSupervisorId ? "★ (Requested by student)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Admin Note Input */}
                  <div>
                    <input
                      type="text"
                      placeholder="Optional administrator note for the student team..."
                      value={adminNotes[item.id] || ""}
                      onChange={(e) =>
                        setAdminNotes({ ...adminNotes, [item.id]: e.target.value })
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
                      onClick={() => handleDecision(item.id, "REJECTED")}
                      className="!h-8 text-[11px] !border-rose-500/30 !text-rose-500 hover:!bg-rose-500/10"
                    >
                      <XCircle size={13} /> Decline Request
                    </Btn2>
                    <Btn
                      disabled={isActioning || !chosenSupervisorId}
                      onClick={() => handleDecision(item.id, "APPROVED")}
                      className="!h-8 text-[11px] !bg-emerald-600 hover:!bg-emerald-500"
                    >
                      {isActioning ? "Allocating..." : (
                        <>
                          <CheckCircle2 size={13} /> Confirm & Assign {chosenSupervisor?.name || "Advisor"}
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

export default ReviewSupervisorRequestsModal;
