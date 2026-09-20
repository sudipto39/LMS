// src/screens/ProblemStatementsScreen.tsx
import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
  Plus,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  XCircle,
  Check,
  User,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Card, Btn, Btn2, Pill } from "../components/common/UIPrimitives";
import { problemStatementsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { ProblemStatement, Project } from "../types";
import ProblemStatementDetailModal from "../components/modals/ProblemStatementDetailModal";
import { Eye } from "lucide-react";

interface ProblemStatementsScreenProps {
  onSelectStatementForProject: (statement: ProblemStatement) => void;
  onOpenProposeModal: () => void;
  lastCreatedStatement?: ProblemStatement | null;
  userProjects?: Project[];
  catalogRefreshKey?: number;
  externalSearchQuery?: string;
}

const DOMAINS = [
  "All",
  "AI / Machine Learning",
  "Web3 & Blockchain",
  "Cybersecurity",
  "Cloud & DevOps",
  "Full Stack & SaaS",
  "FinTech",
  "HealthTech & Bio",
  "IoT & Embedded Systems",
  "Mobile & Cross-Platform",
];

export const ProblemStatementsScreen: React.FC<ProblemStatementsScreenProps> = ({
  onSelectStatementForProject,
  onOpenProposeModal,
  lastCreatedStatement,
  userProjects = [],
  catalogRefreshKey = 0,
  externalSearchQuery,
}) => {
  const { role } = useAuth();
  const showToast = useToast();
  const [selectedDetailStatement, setSelectedDetailStatement] = useState<ProblemStatement | null>(null);

  const isSupervisor = role === "SUPERVISOR";
  const isAdmin = role === "ADMIN";

  const [activeTab, setActiveTab] = useState<"catalog" | "mine" | "pending">(
    isAdmin ? "pending" : "catalog"
  );
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || "");

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  const [catalog, setCatalog] = useState<ProblemStatement[]>([]);
  const [myProposals, setMyProposals] = useState<ProblemStatement[]>([]);
  const [pendingAdminIdeas, setPendingAdminIdeas] = useState<ProblemStatement[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedDescId, setExpandedDescId] = useState<string | null>(null);

  // Admin inline review states
  const [adminFeedback, setAdminFeedback] = useState<{ [id: string]: string }>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // 1. Fetch Approved Catalog
  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const res = await problemStatementsApi.getCatalog(
        selectedDomain === "All" ? undefined : selectedDomain,
        searchQuery || undefined
      );
      if (res?.data) {
        setCatalog(res.data);
      }
    } catch {
      showToast("Could not fetch problem statements catalog.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch My Proposals (Supervisor)
  const fetchMyProposals = async () => {
    if (!isSupervisor) return;
    setLoading(true);
    try {
      const res = await problemStatementsApi.getMyProposals();
      if (res?.data) {
        setMyProposals(res.data);
      }
    } catch {
      showToast("Could not load your proposed challenges.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch Pending Proposals Queue (Admin)
  const fetchPendingAdmin = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await problemStatementsApi.getPendingAdmin();
      if (res?.data) {
        setPendingAdminIdeas(res.data);
      }
    } catch {
      showToast("Could not load pending review queue.");
    } finally {
      setLoading(false);
    }
  };

  // Initial Data Load
  useEffect(() => {
    fetchCatalog();
    if (isSupervisor) fetchMyProposals();
    if (isAdmin) fetchPendingAdmin();
  }, [role, catalogRefreshKey]);

  // Handle Tab Switch
  useEffect(() => {
    if (activeTab === "mine" && isSupervisor) {
      fetchMyProposals();
    } else if (activeTab === "pending" && isAdmin) {
      fetchPendingAdmin();
    } else if (activeTab === "catalog") {
      fetchCatalog();
    }
  }, [activeTab]);

  // Filter Catalog on Domain Change
  useEffect(() => {
    if (activeTab === "catalog") {
      fetchCatalog();
    }
  }, [selectedDomain]);

  // React to newly created statement prop
  useEffect(() => {
    if (lastCreatedStatement && isSupervisor) {
      setMyProposals((prev) => [lastCreatedStatement, ...prev]);
      setActiveTab("mine");
      fetchMyProposals();
    }
  }, [lastCreatedStatement]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalog();
  };

  // Admin Review Action
  const handleAdminReview = async (id: string, status: "APPROVED" | "REJECTED") => {
    setReviewingId(id);
    try {
      const feedback = adminFeedback[id]?.trim() || undefined;
      await problemStatementsApi.review(id, status, feedback);
      setPendingAdminIdeas((prev) => prev.filter((item) => item.id !== id));
      showToast(
        status === "APPROVED"
          ? "Problem statement approved and published to Idea Bank! ✅"
          : "Problem statement rejected with feedback."
      );
      // Re-sync catalog so it's instantly in the approved tab
      fetchCatalog();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to process review.");
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg grid place-items-center"
              style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--acc)" }}
            >
              <Sparkles size={18} />
            </div>
            <h1 className="text-[22px] font-bold">Hackathon Idea Bank & Problem Statements</h1>
          </div>
          <p className="text-[12px] mt-1" style={{ color: "var(--t2)" }}>
            Curated industry & academic challenges. Students claim approved problems (max 3 teams capacity per statement) and request their preferred advisor.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isSupervisor && (
            <Btn onClick={onOpenProposeModal} className="!h-9">
              <Plus size={14} /> Propose Problem Statement
            </Btn>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b text-[13px] font-medium" style={{ borderColor: "var(--bdr)" }}>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-2.5 px-4 cursor-pointer transition border-b-2 font-bold flex items-center gap-2 ${
              activeTab === "pending"
                ? "border-[var(--acc)] text-[var(--acc)]"
                : "border-transparent text-[var(--t2)] hover:text-[var(--t1)]"
            }`}
          >
            <span>Pending Review Queue</span>
            {pendingAdminIdeas.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-black">
                {pendingAdminIdeas.length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab("catalog")}
          className={`pb-2.5 px-4 cursor-pointer transition border-b-2 font-bold ${
            activeTab === "catalog"
              ? "border-[var(--acc)] text-[var(--acc)]"
              : "border-transparent text-[var(--t2)] hover:text-[var(--t1)]"
          }`}
        >
          Approved Idea Bank ({catalog.length})
        </button>

        {isSupervisor && (
          <button
            onClick={() => setActiveTab("mine")}
            className={`pb-2.5 px-4 cursor-pointer transition border-b-2 font-bold flex items-center gap-2 ${
              activeTab === "mine"
                ? "border-[var(--acc)] text-[var(--acc)]"
                : "border-transparent text-[var(--t2)] hover:text-[var(--t1)]"
            }`}
          >
            <span>My Proposed Challenges</span>
            {myProposals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/40">
                {myProposals.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ── ADMIN: PENDING REVIEW QUEUE TAB ──────────────────────────────────── */}
      {isAdmin && activeTab === "pending" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[14px] font-bold flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              Faculty Challenge Proposals Awaiting Academic Approval
            </h3>
            <Btn2 onClick={fetchPendingAdmin} className="text-[11px] !h-7">
              <RotateCcw size={12} className={loading ? "animate-spin" : ""} /> Refresh Queue
            </Btn2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[12px]" style={{ color: "var(--t2)" }}>
              Loading pending proposals...
            </div>
          ) : pendingAdminIdeas.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 opacity-80" />
              <h4 className="font-bold text-[15px]">All Caught Up!</h4>
              <p className="text-[12px] max-w-md mx-auto" style={{ color: "var(--t2)" }}>
                There are no pending problem statements awaiting academic approval. Check the "Approved Idea Bank" tab to inspect live challenges.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingAdminIdeas.map((idea) => {
                const isActioning = reviewingId === idea.id;
                return (
                  <Card key={idea.id} className="p-5 space-y-3.5 border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className="text-[9px] uppercase font-bold px-2 py-0.5 rounded border"
                            style={{
                              background: "rgba(6, 182, 212, 0.1)",
                              borderColor: "rgba(6, 182, 212, 0.3)",
                              color: "var(--acc)",
                            }}
                          >
                            {idea.domain}
                          </span>
                          <Pill color="#f59e0b" className="text-[9px]">
                            Pending Review
                          </Pill>
                          <span className="text-[10px]" style={{ color: "var(--t3)" }}>
                            Max: <strong>{idea.maxSelections || 3} teams</strong>
                          </span>
                        </div>
                        <h4 className="font-bold text-[15px]">{idea.title}</h4>
                      </div>
                    </div>

                    {/* Proposer Info */}
                    <div className="text-[11px] flex items-center gap-1.5 p-2 rounded-lg bg-black/5 dark:bg-white/5" style={{ color: "var(--t2)" }}>
                      <User size={13} className="text-cyan-400" />
                      <span>Proposed by:</span>
                      <strong className="text-[var(--t1)]">
                        {idea.creator?.name || "Supervisor"} ({idea.creator?.email})
                      </strong>
                    </div>

                    <p className="text-[12px] leading-relaxed" style={{ color: "var(--t2)" }}>
                      {idea.description}
                    </p>

                    {idea.expectedOutcomes && (
                      <div className="p-2.5 rounded-lg text-[11px] bg-black/5 dark:bg-white/5 space-y-1">
                        <strong className="text-[var(--t1)]">Deliverables & Expected Scope:</strong>
                        <p style={{ color: "var(--t2)" }}>{idea.expectedOutcomes}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {(idea.technologies || []).map((t) => (
                        <span
                          key={t}
                          className="text-[9px] px-2 py-0.5 rounded border"
                          style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Admin Feedback Field */}
                    <div className="space-y-1 pt-1">
                      <input
                        type="text"
                        placeholder="Optional remarks or guidance for the supervisor..."
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

                    {/* Approval Actions */}
                    <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--bdr)" }}>
                      <Btn2
                        disabled={isActioning}
                        onClick={() => handleAdminReview(idea.id, "REJECTED")}
                        className="!h-8 text-[11px] !border-rose-500/30 !text-rose-500 hover:!bg-rose-500/10"
                      >
                        <XCircle size={13} /> Reject Proposal
                      </Btn2>
                      <Btn
                        disabled={isActioning}
                        onClick={() => handleAdminReview(idea.id, "APPROVED")}
                        className="!h-8 text-[11px] !bg-emerald-600 hover:!bg-emerald-500"
                      >
                        {isActioning ? (
                          "Publishing..."
                        ) : (
                          <>
                            <Check size={13} /> Approve & Publish to Idea Bank
                          </>
                        )}
                      </Btn>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SUPERVISOR: MY PROPOSALS TAB ─────────────────────────────────────── */}
      {isSupervisor && activeTab === "mine" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[14px] font-bold">My Submitted Challenges & Review Status</h3>
            <Btn2 onClick={fetchMyProposals} className="text-[11px] !h-7">
              <RotateCcw size={12} className={loading ? "animate-spin" : ""} /> Refresh
            </Btn2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[12px]" style={{ color: "var(--t2)" }}>
              Loading your proposals...
            </div>
          ) : myProposals.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <Sparkles size={28} className="mx-auto text-[#8b5cf6] opacity-50" />
              <h4 className="font-bold text-[15px]">No proposals submitted yet</h4>
              <p className="text-[12px] max-w-md mx-auto" style={{ color: "var(--t2)" }}>
                Submit project challenges from your research or industry focus to guide capstone student cohorts.
              </p>
              <Btn onClick={onOpenProposeModal} className="mt-2 mx-auto">
                <Plus size={14} /> Propose Your First Challenge
              </Btn>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myProposals.map((item) => (
                <Card key={item.id} className="p-5 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span
                        className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border"
                        style={{
                          background: "var(--srf2)",
                          borderColor: "var(--bdr)",
                          color: "var(--acc)",
                        }}
                      >
                        {item.domain}
                      </span>
                      <h4 className="font-bold text-[14px] mt-1.5">{item.title}</h4>
                    </div>
                    <Pill
                      color={
                        item.status === "APPROVED"
                          ? "#22c55e"
                          : item.status === "REJECTED"
                          ? "#ef4444"
                          : "#f59e0b"
                      }
                    >
                      {item.status}
                    </Pill>
                  </div>

                  <p className="text-[12px] line-clamp-3" style={{ color: "var(--t2)" }}>
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {(item.technologies || []).map((t) => (
                      <span
                        key={t}
                        className="text-[9px] px-2 py-0.5 rounded border"
                        style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {item.adminFeedback && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-500 flex items-start gap-2">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <div>
                        <strong>Admin Feedback:</strong> {item.adminFeedback}
                      </div>
                    </div>
                  )}

                  <div
                    className="pt-3 border-t flex justify-between items-center text-[11px]"
                    style={{ borderColor: "var(--bdr)" }}
                  >
                    <span style={{ color: "var(--t3)" }}>
                      Enrolled Teams:{" "}
                      <strong style={{ color: "var(--t1)" }}>
                        {(item.projects || []).length} / {item.maxSelections || 3}
                      </strong>
                    </span>
                    <span className="text-[10px] mono" style={{ color: "var(--t3)" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ALL ROLES: APPROVED CATALOG TAB ──────────────────────────────────── */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--t3)" }}
                />
                <input
                  type="text"
                  placeholder="Search challenges by keywords or technologies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 rounded-xl border pl-9 pr-3 text-[12px] outline-none transition"
                  style={{
                    background: "var(--srf2)",
                    borderColor: "var(--bdr)",
                    color: "var(--t1)",
                  }}
                />
              </div>
              <Btn2 type="submit" className="!h-10 text-[12px]">
                Search
              </Btn2>
            </form>
          </div>

          {/* Domain Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {DOMAINS.map((domain) => {
              const active = selectedDomain === domain;
              return (
                <button
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-medium border cursor-pointer transition"
                  style={{
                    borderColor: active ? "var(--acc)" : "var(--bdr)",
                    background: active ? "rgba(6, 182, 212, 0.15)" : "var(--srf)",
                    color: active ? "var(--acc)" : "var(--t2)",
                  }}
                >
                  {domain}
                </button>
              );
            })}
          </div>

          {/* Catalog Cards Grid */}
          {loading ? (
            <div className="py-16 text-center text-[13px]" style={{ color: "var(--t2)" }}>
              Loading problem statements...
            </div>
          ) : catalog.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <HelpCircle size={28} className="mx-auto opacity-50" style={{ color: "var(--t3)" }} />
              <h3 className="font-bold text-[15px]">No Approved Problem Statements Found</h3>
              <p className="text-[12px] max-w-md mx-auto" style={{ color: "var(--t2)" }}>
                {selectedDomain !== "All"
                  ? `No approved challenges in category "${selectedDomain}". Try selecting "All" or searching different keywords.`
                  : "No approved problem statements published yet. Proposed challenges appear here once approved by the administrator."}
              </p>
              {isSupervisor && (
                <Btn onClick={onOpenProposeModal} className="mt-2 mx-auto">
                  <Plus size={14} /> Propose a Problem Statement
                </Btn>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalog.map((item) => {
                const currentCount = item.currentSelections || 0;
                const maxCount = item.maxSelections || 3;
                const isFull = currentCount >= maxCount;
                const availableSpots = Math.max(0, maxCount - currentCount);
                const isExpanded = expandedDescId === item.id;
                const pct = Math.min(100, Math.round((currentCount / maxCount) * 100));

                return (
                  <Card
                    key={item.id}
                    className={`p-5 flex flex-col justify-between transition-all duration-200 ${
                      isFull ? "opacity-80 border-dashed" : "hover:shadow-lg"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex justify-between items-start gap-2">
                        <span
                          className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border"
                          style={{
                            background: "rgba(6, 182, 212, 0.1)",
                            borderColor: "rgba(6, 182, 212, 0.3)",
                            color: "var(--acc)",
                          }}
                        >
                          {item.domain}
                        </span>

                        <Pill
                          color={
                            item.difficulty === "ADVANCED"
                              ? "#8b5cf6"
                              : item.difficulty === "INTERMEDIATE"
                              ? "#0891b2"
                              : "#22c55e"
                          }
                          className="text-[10px]"
                        >
                          {item.difficulty}
                        </Pill>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-[14px] leading-snug line-clamp-2">
                        {item.title}
                      </h3>

                      {/* Supervisor Author */}
                      <div className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--t3)" }}>
                        <span>Faculty Advisor:</span>
                        <strong style={{ color: "var(--t1)" }}>
                          {item.creator?.name || "Academic Supervisor"}
                        </strong>
                      </div>

                      {/* Description */}
                      <div className="text-[11px] leading-relaxed" style={{ color: "var(--t2)" }}>
                        <p className={isExpanded ? "" : "line-clamp-3"}>
                          {item.description}
                        </p>
                        {item.description.length > 150 && (
                          <button
                            type="button"
                            onClick={() => setExpandedDescId(isExpanded ? null : item.id)}
                            className="text-[10px] font-bold mt-1 flex items-center gap-0.5 text-[var(--acc)] cursor-pointer hover:underline"
                          >
                            {isExpanded ? (
                              <>
                                Show Less <ChevronUp size={12} />
                              </>
                            ) : (
                              <>
                                Read More <ChevronDown size={12} />
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Expected Outcomes */}
                      {item.expectedOutcomes && isExpanded && (
                        <div className="p-2 rounded-lg text-[10px] space-y-1" style={{ background: "var(--srf2)" }}>
                          <strong className="text-[var(--t1)]">Deliverables:</strong>
                          <p style={{ color: "var(--t2)" }}>{item.expectedOutcomes}</p>
                        </div>
                      )}

                      {/* Technologies */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(item.technologies || []).map((tech) => (
                          <span
                            key={tech}
                            className="text-[9px] px-2 py-0.5 rounded-full border"
                            style={{
                              background: "var(--srf2)",
                              borderColor: "var(--bdr)",
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer: Quota Counter & Action */}
                    <div className="pt-4 mt-4 border-t space-y-3" style={{ borderColor: "var(--bdr)" }}>
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                          <span style={{ color: "var(--t3)" }}>Enrollment Quota</span>
                          <span
                            style={{
                              color: isFull ? "#ef4444" : currentCount > 0 ? "#f59e0b" : "#22c55e",
                            }}
                          >
                            {isFull ? (
                              <span className="flex items-center gap-1">
                                <Lock size={10} /> 3/3 Full (Capacity Reached)
                              </span>
                            ) : (
                              `${currentCount}/${maxCount} Teams (${availableSpots} spot${availableSpots > 1 ? "s" : ""} left)`
                            )}
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--bg2)" }}
                        >
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
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Btn2
                          type="button"
                          onClick={() => setSelectedDetailStatement(item)}
                          className="w-full justify-center !h-8 text-[11px]"
                        >
                          <Eye size={12} /> View Full Scope & Details
                        </Btn2>

                        {role === "STUDENT" ? (
                          (() => {
                            const isClaimedByCurrentUser = userProjects.some(
                              (p) =>
                                (p.problemStatementId === item.id || p.problemStatement?.id === item.id) &&
                                p.status !== "ARCHIVED"
                            );

                            if (isClaimedByCurrentUser) {
                              return (
                                <div className="w-full text-center py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold text-[11px] flex items-center justify-center gap-1.5">
                                  <CheckCircle2 size={13} /> Already Selected by You
                                </div>
                              );
                            }

                            return (
                              <Btn
                                disabled={isFull}
                                onClick={() => onSelectStatementForProject(item)}
                                className={`w-full justify-center !h-9 text-[12px] ${
                                  isFull ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                {isFull ? (
                                  <>
                                    <Lock size={13} /> Capacity Full (3/3)
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={13} /> Select as Project <ArrowRight size={12} />
                                  </>
                                )}
                              </Btn>
                            );
                          })()
                        ) : (
                          <div className="text-[11px] text-center font-medium" style={{ color: "var(--t3)" }}>
                            {isFull ? "Challenge closed (Capacity filled)" : "Open for student enrollment"}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PROBLEM STATEMENT DETAILS MODAL */}
      <ProblemStatementDetailModal
        show={!!selectedDetailStatement}
        statement={selectedDetailStatement}
        onClose={() => setSelectedDetailStatement(null)}
        onSelectForProject={onSelectStatementForProject}
        isClaimedByCurrentUser={
          selectedDetailStatement
            ? userProjects.some(
                (p) =>
                  (p.problemStatementId === selectedDetailStatement.id ||
                    p.problemStatement?.id === selectedDetailStatement.id) &&
                  p.status !== "ARCHIVED"
              )
            : false
        }
      />
    </div>
  );
};

export default ProblemStatementsScreen;
