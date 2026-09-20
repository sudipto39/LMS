// src/components/modals/CreateProjectModal.tsx
import React, { useState, useMemo } from "react";
import { Plus, X, CheckCircle2, ArrowRight, ExternalLink, Terminal, Flag, Trash2, Lock, Sparkles } from "lucide-react";
import { Card, Card2, Inp, Btn, Btn2 } from "../common/UIPrimitives";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { projectsApi } from "../../api";
import { env } from "../../config/env";
import type { Course, Batch, Project, User, ProblemStatement } from "../../types";

interface CreateProjectModalProps {
  show: boolean;
  onClose: () => void;
  courses: Course[];
  batches: Batch[];
  projects: Project[];
  supervisors: User[];
  onCreateProject: (project: Project) => void;
  selectedProblemStatement?: ProblemStatement | null;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  show,
  onClose,
  courses,
  batches,
  projects,
  supervisors,
  onCreateProject,
  selectedProblemStatement,
}) => {
  const { user, role } = useAuth();
  const showToast = useToast();
  const [supervisorReason, setSupervisorReason] = useState("");

  const studentBatch = useMemo(() => {
    if (!user) return batches[0];
    const userBatchName = (user.batch || "").toLowerCase().trim();
    return (
      batches.find(
        (b) =>
          b.name.toLowerCase().trim() === userBatchName ||
          b.id === (user as any).batchId
      ) || batches[0]
    );
  }, [batches, user]);

  const studentCourse = useMemo(() => {
    if (studentBatch?.courseId) {
      const matched = courses.find((c) => c.id === studentBatch.courseId);
      if (matched) return matched;
    }
    if ((user as any)?.courseId) {
      const matched = courses.find((c) => c.id === (user as any).courseId);
      if (matched) return matched;
    }
    return courses[0];
  }, [courses, studentBatch, user]);

  const [createStep, setCreateStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [newProj, setNewProj] = useState({
    extend: "no",
    title: "",
    desc: "",
    course: studentCourse?.id || courses[0]?.id || "",
    batch: studentBatch?.id || batches[0]?.id || "",
    supervisor: supervisors[0]?.id || "",
    techs: ["React", "Node.js", "PostgreSQL"] as string[],
    repoMode: "new" as "new" | "existing",
    repoName: "",
    milestones: [
      { title: "Project Proposal & Architecture", due: "2026-09-15" },
      { title: "Core Features Implementation", due: "2026-10-15" },
      { title: "Testing & Documentation", due: "2026-11-15" },
      { title: "Final Capstone Submission", due: "2026-12-15" },
    ],
  });

  React.useEffect(() => {
    setNewProj((prev) => ({
      ...prev,
      title: selectedProblemStatement?.title || prev.title,
      desc: selectedProblemStatement?.description || prev.desc,
      techs: (selectedProblemStatement?.technologies && selectedProblemStatement.technologies.length > 0)
        ? selectedProblemStatement.technologies
        : prev.techs,
      course: studentCourse?.id || prev.course || courses[0]?.id || "",
      batch: studentBatch?.id || prev.batch || batches[0]?.id || "",
      supervisor: (selectedProblemStatement?.creatorId && supervisors.some((s) => s.id === selectedProblemStatement.creatorId))
        ? selectedProblemStatement.creatorId
        : prev.supervisor || supervisors[0]?.id || "",
    }));
  }, [courses, batches, supervisors, studentBatch, studentCourse, selectedProblemStatement]);

  const techOptions = [
    "React",
    "Node.js",
    "PostgreSQL",
    "MongoDB",
    "Express",
    "Python",
    "FastAPI",
    "PyTorch",
    "TensorFlow",
    "Docker",
    "AWS S3",
    "Go",
    "Rust",
    "C++",
    "Java",
    "Tailwind",
    "GraphQL",
  ];

  if (!show) return null;

  const handleFinish = async () => {
    if (!newProj.title) {
      showToast("Please enter a project title");
      return;
    }
    setLoading(true);
    const supervisorObj = supervisors.find((u) => u.id === newProj.supervisor);

    const isStudent = role === "STUDENT";

    let createdP: Project = {
      id: `p${Date.now()}`,
      title: newProj.title,
      status: "IN_PROGRESS",
      desc: newProj.desc || "Academic capstone project on GiteaForge",
      techs: newProj.techs,
      progress: 25,
      team: [user || supervisors[0]],
      supervisor: isStudent ? "Pending Admin Allocation" : supervisorObj?.name || "Dr. Eleanor Davis",
      supervisorId: isStudent ? "" : newProj.supervisor,
      requestedSupervisorId: newProj.supervisor,
      supervisorRequestStatus: isStudent ? "PENDING" : "APPROVED",
      supervisorRequestReason: supervisorReason.trim() || undefined,
      problemStatementId: selectedProblemStatement?.id,
      repoUrl: `${env.GITEA_URL}/${user?.giteaUsername || user?.name?.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") || "student"}/${newProj.repoName || "capstone"}.git`,
      repoName: newProj.repoName || "capstone",
      batchId: newProj.batch,
      phase: newProj.extend !== "no" ? 2 : 1,
    };

    try {
      if (newProj.extend !== "no") {
        const res = await projectsApi.extendProject(newProj.extend, {
          title: newProj.title,
          description: newProj.desc,
          technologies: newProj.techs,
          batchId: newProj.batch,
          supervisorId: isStudent ? undefined : newProj.supervisor,
        });
        if (res.data) {
          createdP = {
            ...createdP,
            ...res.data,
            team: res.data.team || createdP.team,
          };
        }
      } else {
        const res = await projectsApi.createProject({
          title: newProj.title,
          description: newProj.desc,
          technologies: newProj.techs,
          batchId: newProj.batch,
          courseId: newProj.course,
          supervisorId: isStudent ? undefined : newProj.supervisor,
          problemStatementId: selectedProblemStatement?.id,
          requestedSupervisorId: newProj.supervisor,
          supervisorRequestReason: supervisorReason.trim() || undefined,
          repoMode: newProj.repoMode,
          repoName: newProj.repoName,
          milestones: newProj.milestones,
        });
        if (res.data) {
          createdP = {
            ...createdP,
            ...res.data,
            team: res.data.team || createdP.team,
          };
        }
      }
    } catch {
      // Graceful local sync
    }

    onCreateProject(createdP);
    setLoading(false);
    setCreateStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[720px] max-h-[92vh] overflow-y-auto shadow-2xl my-auto">
        <div
          className="sticky top-0 z-10 p-5 sm:p-6 border-b"
          style={{ borderColor: "var(--bdr)", background: "var(--srf)" }}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-[18px] sm:text-[20px] font-bold flex items-center gap-2">
              <Plus size={18} style={{ color: "var(--acc)" }} /> Create New Project
            </h2>
            <button onClick={onClose} className="cursor-pointer">
              <X size={18} />
            </button>
          </div>
          <p className="text-[12px] mt-1" style={{ color: "var(--t2)" }}>
            Set up your capstone project and connect a Git repository
          </p>
          <div className="mt-4 flex items-center gap-0">
            {[
              { s: 1, l: "Details" },
              { s: 2, l: "Repository" },
              { s: 3, l: "Milestones" },
            ].map((step, i) => (
              <div
                key={step.s}
                className="flex items-center flex-1 last:flex-none"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-7 w-7 rounded-full grid place-items-center text-[11px] font-bold transition-all ${
                      createStep >= step.s
                        ? "bg-gradient-to-r from-[#06b6d4] to-[#2563eb] text-white shadow-[0_0_10px_rgba(6,182,214,0.3)]"
                        : ""
                    }`}
                    style={
                      createStep < step.s
                        ? {
                            background: "var(--srf2)",
                            border: "1px solid var(--bdr)",
                            color: "var(--t3)",
                          }
                        : {}
                    }
                  >
                    {createStep > step.s ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      step.s
                    )}
                  </div>
                  <span
                    className="text-[12px] font-semibold"
                    style={{
                      color:
                        createStep >= step.s ? "var(--t1)" : "var(--t3)",
                    }}
                  >
                    {step.l}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className="flex-1 h-0.5 mx-3 rounded-full"
                    style={{
                      background:
                        createStep > step.s ? "var(--acc)" : "var(--bdr)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Step 1 */}
        {createStep === 1 && (
          <div className="p-5 sm:p-6 space-y-4">
            {selectedProblemStatement && (
              <div
                className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
                style={{
                  background: "rgba(6, 182, 212, 0.08)",
                  borderColor: "rgba(6, 182, 212, 0.3)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg grid place-items-center bg-cyan-500/20 text-cyan-400">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      Chosen Challenge from Idea Bank
                    </div>
                    <div className="font-bold text-[13px]">{selectedProblemStatement.title}</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md border border-cyan-500/30 text-cyan-400 font-bold whitespace-nowrap">
                  {selectedProblemStatement.domain}
                </span>
              </div>
            )}
            <Card2 className="p-4 space-y-4">
              <div>
                <label
                  className="text-[12px] font-bold flex items-center gap-1.5"
                  style={{ color: "var(--t1)" }}
                >
                  Extend previous project?
                </label>
                <select
                  value={newProj.extend}
                  onChange={(e) =>
                    setNewProj({ ...newProj, extend: e.target.value })
                  }
                  className="mt-2 w-full h-11 rounded-xl border px-3 text-[13px] focus:outline-none"
                  style={{
                    background: "var(--srf)",
                    borderColor: "var(--bdr)",
                    color: "var(--t1)",
                  }}
                >
                  <option value="no">No, this is a fresh project (Phase 1)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      Extend: {p.title} (Phase {p.phase + 1})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="text-[12px] font-bold"
                  style={{ color: "var(--t1)" }}
                >
                  Project Title <span className="text-[#ef4444]">*</span>
                </label>
                <Inp
                  placeholder="Enter project title"
                  value={newProj.title}
                  onChange={(e) =>
                    setNewProj({ ...newProj, title: e.target.value })
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <label
                  className="text-[12px] font-bold"
                  style={{ color: "var(--t1)" }}
                >
                  Description <span className="text-[#ef4444]">*</span>
                </label>
                <textarea
                  placeholder="Describe your project architecture..."
                  value={newProj.desc}
                  onChange={(e) =>
                    setNewProj({ ...newProj, desc: e.target.value })
                  }
                  className="mt-2 w-full min-h-[80px] rounded-xl border p-3 text-[13px] focus:outline-none resize-y"
                  style={{
                    background: "var(--srf)",
                    borderColor: "var(--bdr)",
                    color: "var(--t1)",
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className="text-[12px] font-bold"
                      style={{ color: "var(--t1)" }}
                    >
                      Course
                    </label>
                    <span className="text-[10px] text-[#06b6d4] font-medium flex items-center gap-1">
                      <Lock size={10} /> Enrolled Course
                    </span>
                  </div>
                  <div
                    className="w-full h-11 rounded-xl border px-3 flex items-center text-[13px] font-semibold truncate cursor-not-allowed select-none shadow-sm"
                    style={{
                      background: "var(--srf2)",
                      borderColor: "var(--bdr)",
                      color: "var(--t1)",
                    }}
                    title="Fixed to your enrolled student course"
                  >
                    {studentCourse?.title || courses.find((c) => c.id === newProj.course)?.title || "Computer Science Capstone"}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className="text-[12px] font-bold"
                      style={{ color: "var(--t1)" }}
                    >
                      Enrolled Batch
                    </label>
                    <span className="text-[10px] text-[#06b6d4] font-medium flex items-center gap-1">
                      <Lock size={10} /> Enrolled Batch
                    </span>
                  </div>
                  <div
                    className="w-full h-11 rounded-xl border px-3 flex items-center text-[13px] font-semibold truncate cursor-not-allowed select-none shadow-sm"
                    style={{
                      background: "var(--srf2)",
                      borderColor: "var(--bdr)",
                      color: "var(--t1)",
                    }}
                    title="Fixed to your student academic batch"
                  >
                    {studentBatch?.name || batches.find((b) => b.id === newProj.batch)?.name || user?.batch || "Batch 2026"}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label
                    className="text-[12px] font-bold"
                    style={{ color: "var(--t1)" }}
                  >
                    {role === "STUDENT" ? "Request Preferred Faculty Advisor" : "Faculty Supervisor"}
                  </label>
                  {role === "STUDENT" && (
                    <span className="text-[10px] text-amber-500 font-medium">
                      Subject to Academic Admin Approval
                    </span>
                  )}
                </div>
                <select
                  value={newProj.supervisor}
                  onChange={(e) =>
                    setNewProj({ ...newProj, supervisor: e.target.value })
                  }
                  className="mt-2 w-full h-11 rounded-xl border px-3 text-[13px]"
                  style={{
                    background: "var(--srf)",
                    borderColor: "var(--bdr)",
                    color: "var(--t1)",
                  }}
                >
                  {supervisors.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.dept || "Faculty"} ({u.email})
                    </option>
                  ))}
                </select>
                {role === "STUDENT" && (
                  <div className="mt-2">
                    <label className="text-[11px] font-medium" style={{ color: "var(--t2)" }}>
                      Reason / Justification for Preferred Advisor (Optional note for Admin)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Professor specializes in our chosen problem domain..."
                      value={supervisorReason}
                      onChange={(e) => setSupervisorReason(e.target.value)}
                      className="mt-1 w-full rounded-xl border p-2.5 text-[12px] outline-none resize-none"
                      style={{
                        background: "var(--srf)",
                        borderColor: "var(--bdr)",
                        color: "var(--t1)",
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label
                  className="text-[12px] font-bold"
                  style={{ color: "var(--t1)" }}
                >
                  Tech Stack
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {techOptions.map((tech) => {
                    const selected = newProj.techs.includes(tech);
                    return (
                      <button
                        key={tech}
                        type="button"
                        onClick={() =>
                          setNewProj({
                            ...newProj,
                            techs: selected
                              ? newProj.techs.filter((t2) => t2 !== tech)
                              : [...newProj.techs, tech],
                          })
                        }
                        className={`h-8 px-3 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                          selected
                            ? "bg-gradient-to-r from-[#06b6d4] to-[#2563eb] text-white border-transparent shadow-sm"
                            : ""
                        }`}
                        style={
                          !selected
                            ? {
                                background: "var(--srf)",
                                borderColor: "var(--bdr)",
                                color: "var(--t2)",
                              }
                            : {}
                        }
                      >
                        {tech}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card2>
          </div>
        )}

        {/* Wizard Step 2 */}
        {createStep === 2 && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNewProj({ ...newProj, repoMode: "new" })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  newProj.repoMode === "new"
                    ? "border-[#06b6d4] shadow-[0_0_0_1px_#06b6d4,0_4px_16px_rgba(6,182,214,0.15)]"
                    : ""
                }`}
                style={{
                  borderColor:
                    newProj.repoMode === "new" ? "#06b6d4" : "var(--bdr)",
                  background: "var(--srf)",
                }}
              >
                <div className="flex items-center gap-2 font-bold text-[13px]">
                  <Plus size={15} style={{ color: "var(--acc)" }} /> Create Gitea
                  Repository
                </div>
                <div
                  className="text-[11px] mt-1"
                  style={{ color: "var(--t2)" }}
                >
                  Auto-provisions a private repo on university Gitea instance
                </div>
              </button>
              <button
                type="button"
                onClick={() => setNewProj({ ...newProj, repoMode: "existing" })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  newProj.repoMode === "existing"
                    ? "border-[#06b6d4] shadow-[0_0_0_1px_#06b6d4,0_4px_16px_rgba(6,182,214,0.15)]"
                    : ""
                }`}
                style={{
                  borderColor:
                    newProj.repoMode === "existing" ? "#06b6d4" : "var(--bdr)",
                  background: "var(--srf)",
                }}
              >
                <div className="flex items-center gap-2 font-bold text-[13px]">
                  <ExternalLink size={15} style={{ color: "var(--acc)" }} /> Link
                  Existing Gitea Repo
                </div>
                <div
                  className="text-[11px] mt-1"
                  style={{ color: "var(--t2)" }}
                >
                  Connect a repository already created in your Gitea account
                </div>
              </button>
            </div>

            <Card2 className="p-4 space-y-3">
              <div>
                <label
                  className="text-[12px] font-bold"
                  style={{ color: "var(--t1)" }}
                >
                  Repository Slug / Name
                </label>
                <Inp
                  placeholder="e.g. distributed-lms"
                  value={newProj.repoName}
                  onChange={(e) =>
                    setNewProj({ ...newProj, repoName: e.target.value })
                  }
                  className="mt-2"
                />
              </div>
              <div
                className="flex items-center gap-2 text-[11px]"
                style={{ color: "var(--t2)" }}
              >
                <Terminal size={13} style={{ color: "var(--acc)" }} /> Repository
                URL:{" "}
                <span className="mono" style={{ color: "var(--t1)" }}>
                  gitea.univ.edu/cs2026/{newProj.repoName || "project-repo"}.git
                </span>
              </div>
            </Card2>
          </div>
        )}

        {/* Wizard Step 3 */}
        {createStep === 3 && (
          <div className="p-5 sm:p-6 space-y-4">
            <div
              className="text-[13px] font-bold flex items-center gap-2"
              style={{ color: "var(--t1)" }}
            >
              <Flag size={15} style={{ color: "var(--acc)" }} /> Project Milestone
              Roadmap
            </div>
            <div className="space-y-2.5">
              {newProj.milestones.map((ms, i) => (
                <Card2 key={i} className="p-3 flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full grid place-items-center text-[11px] font-bold flex-shrink-0 bg-gradient-to-r from-[#06b6d4] to-[#2563eb] text-white shadow-sm">
                    {i + 1}
                  </div>
                  <input
                    value={ms.title}
                    onChange={(e) => {
                      const m = [...newProj.milestones];
                      m[i] = { ...m[i], title: e.target.value };
                      setNewProj({ ...newProj, milestones: m });
                    }}
                    className="flex-1 bg-transparent font-medium text-[13px] focus:outline-none min-w-0"
                    style={{ color: "var(--t1)" }}
                  />
                  <input
                    type="date"
                    value={ms.due}
                    onChange={(e) => {
                      const m = [...newProj.milestones];
                      m[i] = { ...m[i], due: e.target.value };
                      setNewProj({ ...newProj, milestones: m });
                    }}
                    className="h-9 px-2 rounded-lg border text-[11px] flex-shrink-0 w-[140px]"
                    style={{
                      background: "var(--srf)",
                      borderColor: "var(--bdr)",
                      color: "var(--t2)",
                    }}
                  />
                  {newProj.milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setNewProj({
                          ...newProj,
                          milestones: newProj.milestones.filter(
                            (_, j) => j !== i
                          ),
                        })
                      }
                      className="cursor-pointer"
                      style={{ color: "var(--t3)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </Card2>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setNewProj({
                  ...newProj,
                  milestones: [
                    ...newProj.milestones,
                    { title: "New Milestone", due: "2026-12-01" },
                  ],
                })
              }
              className="flex items-center gap-1.5 text-[12px] font-medium cursor-pointer"
              style={{ color: "var(--acc)" }}
            >
              <Plus size={14} /> Add Milestone
            </button>
          </div>
        )}

        {/* Wizard Footer */}
        <div
          className="sticky bottom-0 p-4 sm:p-5 border-t flex justify-between items-center"
          style={{ borderColor: "var(--bdr)", background: "var(--srf)" }}
        >
          <Btn2
            onClick={() =>
              createStep > 1 ? setCreateStep((s) => s - 1) : onClose()
            }
          >
            Back
          </Btn2>
          <Btn
            disabled={loading}
            onClick={() => {
              if (createStep < 3) {
                setCreateStep((s) => s + 1);
              } else {
                handleFinish();
              }
            }}
          >
            {createStep === 1 ? (
              <>
                Next: Repository <ArrowRight size={14} />
              </>
            ) : createStep === 2 ? (
              <>
                Next: Milestones <ArrowRight size={14} />
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> {loading ? "Initializing..." : newProj.extend !== "no" ? "Extend into Phase 2" : "Create Project"}
              </>
            )}
          </Btn>
        </div>
      </Card>
    </div>
  );
};

export default CreateProjectModal;
