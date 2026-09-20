// src/components/modals/ProblemStatementDetailModal.tsx
import React from "react";
import {
  Sparkles,
  X,
  User,
  CheckCircle2,
  Lock,
  Layers,
  Calendar,
  ArrowRight,
  Code2,
  FileCheck2,
  Users2,
} from "lucide-react";
import { Card, Btn, Btn2, Pill } from "../common/UIPrimitives";
import { useAuth } from "../../context/AuthContext";
import type { ProblemStatement } from "../../types";

interface ProblemStatementDetailModalProps {
  show: boolean;
  statement: ProblemStatement | null;
  onClose: () => void;
  onSelectForProject?: (statement: ProblemStatement) => void;
  isClaimedByCurrentUser?: boolean;
}

export const ProblemStatementDetailModal: React.FC<ProblemStatementDetailModalProps> = ({
  show,
  statement,
  onClose,
  onSelectForProject,
  isClaimedByCurrentUser = false,
}) => {
  const { role } = useAuth();

  if (!show || !statement) return null;

  const currentCount = statement.currentSelections ?? (statement.projects ? statement.projects.length : 0);
  const maxCount = statement.maxSelections || 3;
  const isFull = currentCount >= maxCount;
  const availableSpots = Math.max(0, maxCount - currentCount);
  const pct = Math.min(100, Math.round((currentCount / maxCount) * 100));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[760px] max-h-[92vh] flex flex-col p-6 sm:p-7 shadow-2xl space-y-5 overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-start gap-4 border-b pb-4" style={{ borderColor: "var(--bdr)" }}>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md border"
                style={{
                  background: "rgba(6, 182, 212, 0.1)",
                  borderColor: "rgba(6, 182, 212, 0.3)",
                  color: "var(--acc)",
                }}
              >
                {statement.domain}
              </span>

              <Pill
                color={
                  statement.difficulty === "ADVANCED"
                    ? "#8b5cf6"
                    : statement.difficulty === "INTERMEDIATE"
                    ? "#0891b2"
                    : "#22c55e"
                }
              >
                {statement.difficulty}
              </Pill>

              <Pill
                color={
                  statement.status === "APPROVED"
                    ? "#22c55e"
                    : statement.status === "REJECTED"
                    ? "#ef4444"
                    : "#f59e0b"
                }
              >
                {statement.status}
              </Pill>
            </div>

            <h2 className="font-bold text-[19px] sm:text-[21px] leading-snug">
              {statement.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1.5 text-[13px]">
          {/* Faculty Advisor Section */}
          <div
            className="p-3.5 rounded-xl border flex items-center justify-between flex-wrap gap-3"
            style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 grid place-items-center shrink-0">
                <User size={18} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--t3)" }}>
                  Faculty Proposal Lead / Advisor
                </div>
                <div className="font-bold text-[14px]">
                  {statement.creator?.name || "Faculty Supervisor"}
                </div>
                <div className="text-[11px]" style={{ color: "var(--t2)" }}>
                  {statement.creator?.email || "Academic Department"}
                </div>
              </div>
            </div>

            <div className="text-right text-[11px]" style={{ color: "var(--t3)" }}>
              <div className="flex items-center gap-1.5 justify-end">
                <Calendar size={13} />
                <span>Proposed: {new Date(statement.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Detailed Problem Scope */}
          <div className="space-y-2">
            <h3 className="font-bold text-[14px] flex items-center gap-2" style={{ color: "var(--t1)" }}>
              <Sparkles size={16} className="text-cyan-400" />
              Challenge Scope & Problem Background
            </h3>
            <div
              className="p-4 rounded-xl border leading-relaxed whitespace-pre-line"
              style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--t2)" }}
            >
              {statement.description}
            </div>
          </div>

          {/* Expected Deliverables & Outcomes */}
          {statement.expectedOutcomes && (
            <div className="space-y-2">
              <h3 className="font-bold text-[14px] flex items-center gap-2" style={{ color: "var(--t1)" }}>
                <FileCheck2 size={16} className="text-emerald-500" />
                Expected Deliverables & Outcomes
              </h3>
              <div
                className="p-4 rounded-xl border leading-relaxed bg-emerald-500/5 border-emerald-500/20 text-[var(--t2)]"
              >
                {statement.expectedOutcomes}
              </div>
            </div>
          )}

          {/* Prerequisites */}
          {statement.prerequisites && (
            <div className="space-y-2">
              <h3 className="font-bold text-[14px] flex items-center gap-2" style={{ color: "var(--t1)" }}>
                <Layers size={16} className="text-amber-500" />
                Prerequisites & Recommended Knowledge
              </h3>
              <div
                className="p-3.5 rounded-xl border bg-amber-500/5 border-amber-500/20 text-[var(--t2)]"
              >
                {statement.prerequisites}
              </div>
            </div>
          )}

          {/* Tech Stack */}
          <div className="space-y-2">
            <h3 className="font-bold text-[13px] flex items-center gap-2" style={{ color: "var(--t1)" }}>
              <Code2 size={15} className="text-purple-400" />
              Recommended Technologies
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(statement.technologies || []).map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 rounded-lg text-[11px] font-semibold border"
                  style={{
                    background: "var(--srf2)",
                    borderColor: "var(--bdr)",
                    color: "var(--t1)",
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Enrollment Quota & Enrolled Teams List */}
          <div
            className="p-4 rounded-xl border space-y-3"
            style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
          >
            <div className="flex justify-between items-center text-[12px] font-bold">
              <span className="flex items-center gap-1.5" style={{ color: "var(--t1)" }}>
                <Users2 size={15} className="text-cyan-400" /> Student Team Quota
              </span>
              <span
                style={{
                  color: isFull ? "#ef4444" : currentCount > 0 ? "#f59e0b" : "#22c55e",
                }}
              >
                {isFull
                  ? "🔒 Full Capacity (3/3 Teams Enrolled)"
                  : `${currentCount} / ${maxCount} Teams Enrolled (${availableSpots} spot${availableSpots > 1 ? "s" : ""} left)`}
              </span>
            </div>

            <div className="h-2 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
              <div
                className={`h-full transition-all duration-300 ${
                  isFull
                    ? "bg-rose-500"
                    : currentCount === 2
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-[#06b6d4] to-[#2563eb]"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Enrolled Teams list */}
            {statement.projects && statement.projects.length > 0 && (
              <div className="pt-2 border-t space-y-1.5" style={{ borderColor: "var(--bdr)" }}>
                <div className="text-[11px] font-bold" style={{ color: "var(--t3)" }}>
                  Enrolled Projects / Student Teams:
                </div>
                <div className="space-y-1">
                  {statement.projects.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="text-[11px] flex items-center justify-between p-2 rounded-lg"
                      style={{ background: "var(--srf)" }}
                    >
                      <span className="font-semibold text-[var(--t1)]">{p.title}</span>
                      <span style={{ color: "var(--t3)" }}>
                        {p.owner?.name ? `Lead: ${p.owner.name}` : "Student Group"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t flex justify-between items-center gap-3" style={{ borderColor: "var(--bdr)" }}>
          <Btn2 onClick={onClose} className="!h-10 text-[12px]">
            Close
          </Btn2>

          {role === "STUDENT" && (
            <div>
              {isClaimedByCurrentUser ? (
                <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[12px] font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Already Selected as Your Capstone Project
                </div>
              ) : isFull ? (
                <div className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[12px] font-bold flex items-center gap-1.5">
                  <Lock size={15} /> Capacity Reached (Max 3 Teams)
                </div>
              ) : (
                <Btn
                  onClick={() => {
                    if (onSelectForProject) onSelectForProject(statement);
                    onClose();
                  }}
                  className="!h-10 text-[13px] px-5"
                >
                  <Sparkles size={15} /> Select as Capstone Project <ArrowRight size={14} />
                </Btn>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProblemStatementDetailModal;
