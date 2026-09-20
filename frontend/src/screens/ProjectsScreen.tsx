// src/screens/ProjectsScreen.tsx
import React from "react";
import { FolderKanban, Download, Star, Plus, UserCheck, Sparkles } from "lucide-react";
import { Card, Btn, Btn2, Pill } from "../components/common/UIPrimitives";
import { useAuth } from "../context/AuthContext";
import type { Project } from "../types";

interface ProjectsScreenProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onOpenCreateModal: () => void;
  onExportStudentsExcel: () => void;
  onExportGroupsExcel: () => void;
  onExportGradesExcel: () => void;
  onExportCsv: () => void;
  onOpenSupervisorRequestsModal?: () => void;
  searchQuery?: string;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  projects,
  onSelectProject,
  onOpenCreateModal,
  onExportStudentsExcel,
  onExportGroupsExcel,
  onExportGradesExcel,
  onExportCsv,
  onOpenSupervisorRequestsModal,
  searchQuery = "",
}) => {
  const { role } = useAuth();

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery || !searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.desc && p.desc.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.repoName && p.repoName.toLowerCase().includes(q)) ||
      (p.techs && p.techs.some((t) => t.toLowerCase().includes(q))) ||
      (p.technologies && p.technologies.some((t) => t.toLowerCase().includes(q))) ||
      (p.supervisor && typeof p.supervisor === "string" && p.supervisor.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-bold flex items-center gap-2">
            <FolderKanban size={20} style={{ color: "var(--acc)" }} />{" "}
            {role === "STUDENT"
              ? "My Projects"
              : role === "SUPERVISOR"
              ? "Supervised Projects"
              : "All Platform Projects"}
          </h2>
          <p className="text-[12px] mt-1" style={{ color: "var(--t2)" }}>
            Manage project repositories, milestones, progress charts, and supervisor feedback
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {role === "ADMIN" && (
            <>
              <Btn2 onClick={onExportStudentsExcel} className="text-[11px]">
                <Download size={13} /> Export Students (.xls)
              </Btn2>
              <Btn2 onClick={onExportGroupsExcel} className="text-[11px]">
                <Download size={13} /> Export by Group (.xls)
              </Btn2>
              <Btn2 onClick={onExportCsv} className="text-[11px]">
                <Download size={13} /> Export CSV
              </Btn2>
            </>
          )}
          {role === "SUPERVISOR" && (
            <>
              <Btn2 onClick={onExportStudentsExcel} className="text-[11px]">
                <Download size={13} /> Export Supervised (.xls)
              </Btn2>
              <Btn2 onClick={onExportGradesExcel} className="text-[11px]">
                <Star size={13} style={{ color: "#f59e0b" }} /> Export Grades (.xls)
              </Btn2>
            </>
          )}
          <Btn onClick={onOpenCreateModal}>
            <Plus size={14} /> New Project
          </Btn>
        </div>
      </div>

      {/* ADMIN PENDING SUPERVISOR ALLOCATIONS BANNER */}
      {role === "ADMIN" &&
        projects.some(
          (p) => p.supervisorRequestStatus === "PENDING" && !p.supervisorId
        ) &&
        onOpenSupervisorRequestsModal && (
          <div
            onClick={onOpenSupervisorRequestsModal}
            className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between cursor-pointer transition hover:bg-amber-500/15"
          >
            <div className="flex items-center gap-2.5">
              <UserCheck size={18} className="text-amber-500" />
              <span className="text-[12px] font-bold text-amber-400">
                Pending Supervisor Requests: Student teams are awaiting supervisor allocation.
              </span>
            </div>
            <Btn2 className="!h-7 text-[11px] !border-amber-500/40 !text-amber-400">
              Review Allocation Queue →
            </Btn2>
          </div>
        )}

      {projects.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="h-12 w-12 rounded-full grid place-items-center bg-[#06b6d4]/10 text-[#06b6d4]">
            <FolderKanban size={24} />
          </div>
          <h3 className="font-bold text-[16px]">No Projects Found</h3>
          <p className="text-[12px] max-w-md" style={{ color: "var(--t2)" }}>
            You haven't created any capstone projects yet. Click "New Project" to create your Gitea repository and set milestone goals.
          </p>
          <Btn onClick={onOpenCreateModal} className="mt-2">
            <Plus size={14} /> Create Your First Project
          </Btn>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card className="p-10 text-center flex flex-col items-center justify-center space-y-2">
          <FolderKanban size={24} className="opacity-40 text-[var(--acc)]" />
          <h3 className="font-bold text-[15px]">No matching projects</h3>
          <p className="text-[12px]" style={{ color: "var(--t2)" }}>
            No projects matched &ldquo;{searchQuery}&rdquo;. Try clearing or refining your search.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <Card
              key={p.id}
              className="p-5 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => onSelectProject(p.id)}
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-[13px]">{p.title}</span>
                <div className="flex items-center gap-1.5">
                  {p.grade && <Pill color="#22c55e">Grade {p.grade}</Pill>}
                  <Pill
                    color={
                      p.status === "APPROVED"
                        ? "#22c55e"
                        : p.status === "IN_PROGRESS"
                        ? "#0891b2"
                        : "#f59e0b"
                    }
                  >
                    {p.status}
                  </Pill>
                </div>
              </div>
              {p.problemStatement && (
                <div className="text-[10px] font-bold text-cyan-400 mt-1 flex items-center gap-1">
                  <Sparkles size={11} /> Challenge: {p.problemStatement.title}
                </div>
              )}
              <div
                className="text-[11px] mt-2 line-clamp-2"
                style={{ color: "var(--t2)" }}
              >
                {p.desc || p.description || "No description provided."}
              </div>
              <div className="mt-3 flex gap-1 flex-wrap">
                {(p.techs || p.technologies || []).map((tech) => (
                  <span
                    key={tech}
                    className="text-[9px] px-2 py-0.5 rounded-full border"
                    style={{
                      borderColor: "var(--bdr)",
                      background: "var(--srf2)",
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t" style={{ borderColor: "var(--bdr)" }}>
                <span style={{ color: "var(--t3)" }}>Supervisor:</span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span
                    className="font-semibold truncate max-w-[180px]"
                    style={{
                      color:
                        p.supervisor &&
                        !p.supervisor.includes("Unassigned") &&
                        !p.supervisor.includes("Pending")
                          ? "var(--acc)"
                          : "#f59e0b",
                    }}
                  >
                    {p.supervisor || "Pending Allocation"}
                  </span>
                  {p.supervisorRequestStatus === "PENDING" && !p.supervisorId && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      Pending Approval
                    </span>
                  )}
                  {role === "ADMIN" &&
                    p.supervisorRequestStatus === "PENDING" &&
                    !p.supervisorId &&
                    onOpenSupervisorRequestsModal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSupervisorRequestsModal();
                        }}
                        className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500 text-black cursor-pointer hover:bg-amber-400 transition"
                      >
                        Allocate
                      </button>
                    )}
                </div>
              </div>
              <div className="mt-2.5">
                <div
                  className="flex justify-between text-[10px] font-bold mb-1"
                  style={{ color: "var(--t3)" }}
                >
                  <span>Progress</span>
                  <span>{p.progress || 0}%</span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--bg2)" }}
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#06b6d4] to-[#2563eb]"
                    style={{ width: `${p.progress || 0}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsScreen;
