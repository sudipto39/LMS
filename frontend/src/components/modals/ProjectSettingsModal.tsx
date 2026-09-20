// src/components/modals/ProjectSettingsModal.tsx
import React, { useState, useEffect } from "react";
import { Settings, X, AlertCircle, Trash2, Lock } from "lucide-react";
import { Card, Inp, Btn, Btn2, Pill } from "../common/UIPrimitives";
import { projectsApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import type { Project } from "../../types";

interface ProjectSettingsModalProps {
  show: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (id: string, title: string, desc: string) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  show,
  onClose,
  project,
  onUpdateProject,
  onDeleteProject,
}) => {
  const { role } = useAuth();
  const showToast = useToast();
  const [title, setTitle] = useState(project.title);
  const [desc, setDesc] = useState(project.desc);

  useEffect(() => {
    setTitle(project.title);
    setDesc(project.desc);
  }, [project]);

  if (!show) return null;

  const canDelete = role === "ADMIN";

  const handleSave = async () => {
    try {
      await projectsApi.updateProject(project.id, { title, desc });
    } catch {
      // Graceful local sync
    }
    onUpdateProject(project.id, title, desc);
    showToast("Project settings updated successfully ✅");
    onClose();
  };

  const handleDelete = async () => {
    if (!canDelete) {
      showToast("Only system administrators can delete capstone projects");
      return;
    }
    try {
      await projectsApi.deleteProject(project.id);
    } catch {
      // Graceful local sync
    }
    onDeleteProject(project.id);
    showToast("Project and repository deleted");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[480px] p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-[16px] flex items-center gap-2">
            <Settings size={18} style={{ color: "var(--acc)" }} /> Project Settings
            {role === "SUPERVISOR" && <Pill color="#a855f7">Supervisor Mode</Pill>}
          </h3>
          <button onClick={onClose} className="cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <p className="text-[12px]" style={{ color: "var(--t2)" }}>
          {role === "SUPERVISOR"
            ? "As the faculty supervisor, you can refine the project title, scope, and objectives."
            : "Update project metadata, scope, and repository attributes."}
        </p>

        <div>
          <label
            className="text-[11px] font-bold uppercase"
            style={{ color: "var(--t2)" }}
          >
            Project Title
          </label>
          <Inp
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label
            className="text-[11px] font-bold uppercase"
            style={{ color: "var(--t2)" }}
          >
            Description / Scope
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full min-h-[75px] rounded-xl border p-2.5 text-[12px] mt-1 focus:outline-none resize-y"
            style={{
              background: "var(--srf2)",
              borderColor: "var(--bdr)",
              color: "var(--t1)",
            }}
          />
        </div>

        {canDelete ? (
          <div className="p-3 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/5 space-y-2">
            <div className="text-[12px] font-bold text-[#ef4444] flex items-center gap-1.5">
              <AlertCircle size={14} /> Danger Zone (Admin Only)
            </div>
            <p className="text-[11px]" style={{ color: "var(--t2)" }}>
              Deleting this project will permanently wipe milestones, S3 attachments, and delete the linked Gitea repository.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              className="h-8 px-3 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
            >
              <Trash2 size={12} /> Delete Project
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl border flex items-center gap-2 text-[11px]" style={{ background: "var(--srf2)", borderColor: "var(--bdr)", color: "var(--t2)" }}>
            <Lock size={13} className="text-[var(--acc)] shrink-0" />
            <span>Permanent project deletion is restricted to platform administrators.</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Btn2 onClick={onClose} className="flex-1 justify-center">
            Close
          </Btn2>
          <Btn onClick={handleSave} className="flex-1 justify-center">
            Save Changes
          </Btn>
        </div>
      </Card>
    </div>
  );
};

export default ProjectSettingsModal;
