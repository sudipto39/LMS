// src/screens/AdminDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Layers,
  BookOpen,
  FileText,
  Settings,
  UserCheck,
  Download,
  Upload,
  GraduationCap,
  ShieldCheck,
  FlaskConical,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, Btn, Btn2, Pill } from "../components/common/UIPrimitives";
import { labsApi } from "../api";
import type { User, Project, Course, Batch, AuditLogItem, LabAssignment } from "../types";

interface AdminDashboardProps {
  users: User[];
  projects: Project[];
  batches: Batch[];
  courses: Course[];
  auditLogs: AuditLogItem[];
  onExportCsv: () => void;
  onOpenCsvModal: () => void;
  onOpenAssignModal: () => void;
  onOpenCreateLab?: () => void;
  onOpenReviewIdeasModal?: () => void;
  onOpenSupervisorRequestsModal?: () => void;
  pendingIdeasCount?: number;
  pendingSupervisorRequestsCount?: number;
  onNavigate: (page: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users = [],
  projects = [],
  batches = [],
  courses = [],
  auditLogs = [],
  onExportCsv,
  onOpenCsvModal,
  onOpenAssignModal,
  onOpenCreateLab,
  onOpenReviewIdeasModal,
  onOpenSupervisorRequestsModal,
  pendingIdeasCount = 0,
  pendingSupervisorRequestsCount = 0,
  onNavigate,
}) => {
  const safeUsers = Array.isArray(users) ? users : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeBatches = Array.isArray(batches) ? batches : [];
  const safeCourses = Array.isArray(courses) ? courses : [];
  const safeAuditLogs = Array.isArray(auditLogs) ? auditLogs : [];

  const [labAssignments, setLabAssignments] = useState<LabAssignment[]>([]);

  useEffect(() => {
    let isMounted = true;
    labsApi
      .getLabAssignments()
      .then((res) => {
        if (isMounted && res?.data && Array.isArray(res.data)) {
          setLabAssignments(res.data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const students = safeUsers.filter(
    (u) => u && (u.role === "STUDENT" || (u as any).role === "student")
  );
  const supervisors = safeUsers.filter(
    (u) => u && (u.role === "SUPERVISOR" || (u as any).role === "supervisor")
  );

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-[24px] font-bold flex items-center gap-2">
            <LayoutDashboard size={22} style={{ color: "var(--acc)" }} /> Admin Governance Dashboard
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--t2)" }}>
            Academic courses, batches, Judge0 lab experiments, Gitea server config, and real-time records
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {onOpenCreateLab && (
            <Btn onClick={onOpenCreateLab} className="!h-9">
              <Plus size={14} /> New Lab Experiment
            </Btn>
          )}
          <Btn onClick={onExportCsv} className="!h-9">
            <Download size={14} /> Export Projects CSV
          </Btn>
          <Btn2 onClick={onOpenCsvModal} className="!h-9">
            <Upload size={14} /> Import Users
          </Btn2>
        </div>
      </div>

      {/* ACTION REQUIRED ALERTS */}
      {(pendingIdeasCount > 0 || pendingSupervisorRequestsCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pendingIdeasCount > 0 && (
            <div
              onClick={() => onNavigate("ideas")}
              className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-between cursor-pointer transition hover:bg-cyan-500/15"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-cyan-500/20 text-cyan-400 grid place-items-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Action Required</div>
                  <div className="font-bold text-[13px]">
                    {pendingIdeasCount} Problem Statement Proposal{pendingIdeasCount > 1 ? "s" : ""} Pending Review
                  </div>
                </div>
              </div>
              <Btn2 className="!h-8 text-[11px] !border-cyan-500/40 !text-cyan-400">
                Review Now <ArrowRight size={12} />
              </Btn2>
            </div>
          )}

          {pendingSupervisorRequestsCount > 0 && (
            <div
              onClick={onOpenSupervisorRequestsModal}
              className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between cursor-pointer transition hover:bg-amber-500/15"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-500 grid place-items-center">
                  <UserCheck size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Action Required</div>
                  <div className="font-bold text-[13px]">
                    {pendingSupervisorRequestsCount} Supervisor Allocation Request{pendingSupervisorRequestsCount > 1 ? "s" : ""} Pending
                  </div>
                </div>
              </div>
              <Btn2 className="!h-8 text-[11px] !border-amber-500/40 !text-amber-400">
                Allocate Now <ArrowRight size={12} />
              </Btn2>
            </div>
          )}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            k: "Total Students",
            v: `${students.length}`,
            Icon: GraduationCap,
            c: "#0891b2",
            sub: `${safeUsers.length} total users`,
          },
          {
            k: "Faculty & Staff",
            v: `${supervisors.length}`,
            Icon: ShieldCheck,
            c: "#f59e0b",
            sub: "Faculty advisors",
          },
          {
            k: "Active Projects",
            v: `${safeProjects.length}`,
            Icon: FolderKanban,
            c: "#3b82f6",
            sub: `${safeBatches.length} batches`,
          },
          {
            k: "Courses & Batches",
            v: `${safeCourses.length}`,
            Icon: BookOpen,
            c: "#22c55e",
            sub: `${safeBatches.length} enrolled batches`,
          },
          {
            k: "Lab Experiments",
            v: `${labAssignments.length}`,
            Icon: FlaskConical,
            c: "#8b5cf6",
            sub: "Judge0 Automated Labs",
          },
        ].map((s) => (
          <Card key={s.k} className="p-4 sm:p-5">
            <div
              className="h-10 w-10 rounded-xl grid place-items-center"
              style={{ background: `${s.c}15`, color: s.c }}
            >
              <s.Icon size={18} />
            </div>
            <div
              className="text-[11px] uppercase font-bold mt-3"
              style={{ color: "var(--t2)" }}
            >
              {s.k}
            </div>
            <div className="text-[24px] sm:text-[26px] font-bold mt-1">{s.v}</div>
            <div className="text-[10px] mt-0.5 truncate" style={{ color: "var(--t3)" }}>
              {s.sub}
            </div>
          </Card>
        ))}
      </div>

      {/* Enrolled Real Students Section */}
      <Card className="p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-[14px] flex items-center gap-2">
              <GraduationCap size={16} style={{ color: "var(--acc)" }} /> Enrolled Students Directory ({students.length})
            </h3>
            <p className="text-[11px]" style={{ color: "var(--t2)" }}>
              Live student records fetched from university database
            </p>
          </div>
          <Btn2 onClick={() => onNavigate("users")} className="text-[11px] !px-3 !h-7">
            Manage All ({safeUsers.length})
          </Btn2>
        </div>

        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--bdr)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ background: "var(--srf2)", color: "var(--t2)" }}>
                  <th className="text-left p-2.5">Student</th>
                  <th className="text-left p-2.5">University ID</th>
                  <th className="text-left p-2.5">Department</th>
                  <th className="text-left p-2.5">Assigned Batch</th>
                  <th className="text-left p-2.5">Email Address</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-6 text-[12px]"
                      style={{ color: "var(--t3)" }}
                    >
                      No students found. Import records or register student accounts.
                    </td>
                  </tr>
                ) : (
                  students.slice(0, 5).map((s, idx) => (
                    <tr
                      key={s.id || idx}
                      className="border-t"
                      style={{ borderColor: "var(--bdr)" }}
                    >
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              s.avatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                s.name || s.email || "Student"
                              )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`
                            }
                            className="h-6 w-6 rounded-full object-cover"
                            alt=""
                          />
                          <span className="font-semibold text-[12px]">{s.name || "Student"}</span>
                        </div>
                      </td>
                      <td className="p-2.5 mono font-medium">
                        {s.idNo || (s as any).universityId || "—"}
                      </td>
                      <td className="p-2.5">{s.dept || (s as any).department || "CSE"}</td>
                      <td className="p-2.5">
                        <span className="font-medium" style={{ color: "var(--acc)" }}>
                          {s.batch || "General Batch"}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-[10px]" style={{ color: "var(--t3)" }}>
                        {s.email || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Lab Experiments & Automated Benchmarks Section */}
      <Card className="p-5 space-y-4 border border-[#8b5cf6]/30 bg-[#8b5cf6]/5">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-[14px] flex items-center gap-2">
              <FlaskConical size={16} className="text-[#8b5cf6]" /> Lab Experiments & Automated Benchmarks ({labAssignments.length})
            </h3>
            <p className="text-[11px]" style={{ color: "var(--t2)" }}>
              Automated Judge0 unit testing suites, pedagogical objectives, and batch submissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenCreateLab && (
              <Btn onClick={onOpenCreateLab} className="text-[11px] !px-3 !h-7 !bg-[#8b5cf6] hover:brightness-110">
                <Plus size={12} /> New Experiment
              </Btn>
            )}
            <Btn2 onClick={() => onNavigate("labs")} className="text-[11px] !px-3 !h-7">
              View All Labs <ArrowRight size={11} />
            </Btn2>
          </div>
        </div>

        {labAssignments.length === 0 ? (
          <div className="p-6 rounded-xl border text-center space-y-2" style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}>
            <FlaskConical size={24} className="mx-auto text-[#8b5cf6] opacity-60" />
            <div className="text-[12px] font-semibold">No lab experiments published yet</div>
            <p className="text-[11px] max-w-[400px] mx-auto" style={{ color: "var(--t2)" }}>
              Create programming assignments with automated test cases, pedagogical objectives, and custom resource limits.
            </p>
            {onOpenCreateLab && (
              <Btn onClick={onOpenCreateLab} className="text-[11px] !h-8 mx-auto mt-2">
                <Plus size={13} /> Create First Experiment
              </Btn>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {labAssignments.slice(0, 3).map((lab) => (
              <div
                key={lab.id}
                className="p-3.5 rounded-xl border space-y-2 flex flex-col justify-between"
                style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#8b5cf6]/15 text-[#8b5cf6] border border-[#8b5cf6]/30 truncate max-w-[120px]">
                        📁 {lab.subject || lab.batch?.course?.title || "General"}
                      </span>
                      <Pill color="#8b5cf6" className="capitalize text-[10px]">
                        {lab.language === "all" || lab.language === "any" ? "✨ Any Language" : lab.language}
                      </Pill>
                    </div>
                    <span className="text-[10px] font-mono font-bold" style={{ color: "var(--t2)" }}>
                      {lab.totalPoints} pts
                    </span>
                  </div>
                  <h4 className="font-bold text-[13px] line-clamp-1">{lab.title}</h4>
                  <p className="text-[11px] line-clamp-2" style={{ color: "var(--t2)" }}>
                    {lab.objective || lab.description}
                  </p>
                </div>
                <div className="pt-2 border-t flex items-center justify-between text-[10px]" style={{ borderColor: "var(--bdr)" }}>
                  <span style={{ color: "var(--t3)" }}>
                    Batch: <b className="text-[var(--t1)]">{lab.batch?.name || "Target Batch"}</b>
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate("labs")}
                    className="text-[#8b5cf6] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Lower Dual Grid: Audit Logs & Quick Governance */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card className="p-5">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-[13px] flex items-center gap-2">
              <FileText size={14} style={{ color: "var(--acc)" }} /> Real-time Audit Logs
            </h3>
            <Btn2 onClick={() => onNavigate("audit")}>View Full Log</Btn2>
          </div>
          <div
            className="mt-4 rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--bdr)" }}
          >
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ background: "var(--srf2)", color: "var(--t2)" }}>
                  <th className="text-left p-2.5">Time</th>
                  <th className="text-left p-2.5">User</th>
                  <th className="text-left p-2.5">Action</th>
                  <th className="text-left p-2.5">Desc</th>
                </tr>
              </thead>
              <tbody>
                {safeAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-[12px]" style={{ color: "var(--t3)" }}>
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  safeAuditLogs.slice(0, 4).map((a, idx) => (
                    <tr
                      key={a.id || idx}
                      className="border-t"
                      style={{ borderColor: "var(--bdr)" }}
                    >
                      <td className="p-2.5 mono">
                        {typeof a.time === "string" ? a.time : "—"}
                      </td>
                      <td className="p-2.5">
                        {typeof a.user === "object" && a.user !== null
                          ? (a.user as any).name || "System"
                          : String(a.user || "System")}
                      </td>
                      <td className="p-2.5">
                        <Pill color="#0891b2">
                          {typeof a.action === "string" ? a.action : "LOG"}
                        </Pill>
                      </td>
                      <td className="p-2.5" style={{ color: "var(--t2)" }}>
                        {typeof a.desc === "string" ? a.desc : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Governance Actions */}
        <Card className="p-5 space-y-2.5">
          <h3 className="font-semibold text-[13px] flex items-center gap-2">
            <Settings size={14} style={{ color: "var(--acc)" }} /> Quick Governance
          </h3>

          <button
            type="button"
            onClick={() => onNavigate("labs")}
            className="w-full h-9 rounded-xl bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30 text-[12px] font-medium flex items-center gap-2 justify-center cursor-pointer transition shadow-sm"
          >
            <FlaskConical size={14} /> Lab Experiments & Benchmarks
          </button>

          <button
            type="button"
            onClick={() => onNavigate("users")}
            className="w-full h-9 rounded-xl bg-[#0f2a33] text-white text-[12px] font-medium flex items-center gap-2 justify-center cursor-pointer hover:opacity-90 transition"
          >
            <Users size={14} /> Manage Users & Assign Roles
          </button>

          <Btn2
            onClick={() => onNavigate("batches")}
            className="w-full justify-center !h-9"
          >
            <Layers size={13} /> Batches & Academic Courses
          </Btn2>

          <Btn2
            onClick={() => onNavigate("gitea")}
            className="w-full justify-center !h-9"
          >
            <Settings size={13} /> Gitea Server Config & Test
          </Btn2>

          <Btn2
            onClick={onOpenAssignModal}
            className="w-full justify-center !h-9"
          >
            <UserCheck size={13} /> Direct Supervisor Assignment
          </Btn2>

          {onOpenReviewIdeasModal && (
            <button
              type="button"
              onClick={onOpenReviewIdeasModal}
              className="w-full h-9 rounded-xl bg-[#06b6d4]/10 hover:bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/30 text-[12px] font-medium flex items-center justify-between px-3 cursor-pointer transition shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} /> Problem Statement Reviews
              </span>
              {pendingIdeasCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#06b6d4] text-black">
                  {pendingIdeasCount}
                </span>
              )}
            </button>
          )}

          {onOpenSupervisorRequestsModal && (
            <button
              type="button"
              onClick={onOpenSupervisorRequestsModal}
              className="w-full h-9 rounded-xl bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 text-[12px] font-medium flex items-center justify-between px-3 cursor-pointer transition shadow-sm"
            >
              <span className="flex items-center gap-2">
                <UserCheck size={14} /> Supervisor Allocation Queue
              </span>
              {pendingSupervisorRequestsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#f59e0b] text-black">
                  {pendingSupervisorRequestsCount}
                </span>
              )}
            </button>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
