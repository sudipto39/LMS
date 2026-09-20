// src/components/modals/AssignSupervisorModal.tsx
import React, { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle2, UserCheck } from "lucide-react";
import { Card, Btn } from "../common/UIPrimitives";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import type { Project, User } from "../../types";

interface AssignSupervisorModalProps {
  show: boolean;
  onClose: () => void;
  projects: Project[];
  supervisors: User[];
  onAssigned: (projectId: string, supervisor: User) => Promise<void> | void;
}

export const AssignSupervisorModal: React.FC<AssignSupervisorModalProps> = ({
  show,
  onClose,
  projects = [],
  supervisors = [],
  onAssigned,
}) => {
  const showToast = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state whenever modal opens or list props update
  useEffect(() => {
    if (show) {
      setError(null);
      if (projects.length > 0) {
        // Keep existing valid selection or pick first project
        const validProj = projects.some((p) => p.id === selectedProjectId);
        const projId = validProj ? selectedProjectId : projects[0].id;
        setSelectedProjectId(projId);

        // Pre-select project's existing supervisor if found in supervisors list
        const proj = projects.find((p) => p.id === projId);
        if (proj?.supervisorId && supervisors.some((s) => s.id === proj.supervisorId)) {
          setSelectedSupervisorId(proj.supervisorId);
        } else if (supervisors.length > 0 && (!selectedSupervisorId || !supervisors.some((s) => s.id === selectedSupervisorId))) {
          setSelectedSupervisorId(supervisors[0].id);
        }
      } else {
        setSelectedProjectId("");
      }

      if (supervisors.length > 0 && !selectedSupervisorId) {
        setSelectedSupervisorId(supervisors[0].id);
      }
    }
  }, [show, projects, supervisors]);

  // When selected project changes in dropdown, pre-select that project's current supervisor if available
  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    setError(null);
    const proj = projects.find((p) => p.id === projId);
    if (proj?.supervisorId && supervisors.some((s) => s.id === proj.supervisorId)) {
      setSelectedSupervisorId(proj.supervisorId);
    }
  };

  if (!show) return null;

  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const currentSupervisorName = currentProject?.supervisor || "Unassigned";

  const handleConfirm = async () => {
    if (!selectedProjectId) {
      setError("Please select a project.");
      return;
    }
    const targetSup = supervisors.find((u) => u.id === selectedSupervisorId);
    if (!targetSup) {
      setError("Please select a faculty supervisor.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Authoritative backend assignment mutation
      await adminApi.assignSupervisor(selectedProjectId, selectedSupervisorId);

      // 2. Synchronize parent React state and live store
      await onAssigned(selectedProjectId, targetSup);

      // 3. User feedback and modal close
      showToast(`Assigned ${targetSup.name} to "${currentProject?.title || 'project'}" successfully!`);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to assign supervisor to project. Please verify server connection.";
      setError(msg);
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const hasNoProjects = projects.length === 0;
  const hasNoSupervisors = supervisors.length === 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[460px] p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <UserCheck size={18} style={{ color: "var(--acc)" }} /> Assign Project Supervisor
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[12px]">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Project Selector */}
          <div>
            <div className="flex justify-between items-center">
              <label
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--t2)" }}
              >
                Select Project
              </label>
              {currentProject && (
                <span className="text-[11px]" style={{ color: "var(--t3)" }}>
                  Current: <strong style={{ color: "var(--t1)" }}>{currentSupervisorName}</strong>
                </span>
              )}
            </div>

            {hasNoProjects ? (
              <div className="mt-1 p-3 rounded-xl border text-[12px] text-amber-500 bg-amber-500/10 border-amber-500/20">
                No active projects found to assign.
              </div>
            ) : (
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="mt-1 w-full h-10 rounded-xl border px-3 text-[12px] outline-none transition"
                style={{
                  background: "var(--srf2)",
                  borderColor: "var(--bdr)",
                  color: "var(--t1)",
                }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (Phase {p.phase})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Supervisor Selector */}
          <div>
            <label
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "var(--t2)" }}
            >
              Select Faculty Supervisor
            </label>

            {hasNoSupervisors ? (
              <div className="mt-1 p-3 rounded-xl border text-[12px] text-amber-500 bg-amber-500/10 border-amber-500/20">
                No users with SUPERVISOR role found in the directory.
              </div>
            ) : (
              <select
                value={selectedSupervisorId}
                onChange={(e) => {
                  setSelectedSupervisorId(e.target.value);
                  setError(null);
                }}
                className="mt-1 w-full h-10 rounded-xl border px-3 text-[12px] outline-none transition"
                style={{
                  background: "var(--srf2)",
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
            )}
          </div>

          <div className="pt-2">
            <Btn
              disabled={loading || hasNoProjects || hasNoSupervisors || !selectedProjectId || !selectedSupervisorId}
              onClick={handleConfirm}
              className="w-full justify-center !h-10"
            >
              {loading ? (
                "Saving Assignment..."
              ) : (
                <>
                  <CheckCircle2 size={14} /> Confirm Assignment
                </>
              )}
            </Btn>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AssignSupervisorModal;
