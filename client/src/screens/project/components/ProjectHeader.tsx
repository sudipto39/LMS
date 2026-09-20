import React from "react";
import {
  FolderKanban,
  ChevronRight,
  Users,
  Star,
  Send,
  Settings,
} from "lucide-react";
import { Card, Btn, Btn2, Pill } from "../../../components/common/UIPrimitives";
import { useAuth } from "../../../context/AuthContext";
import type { Project } from "../../../types";

interface ProjectHeaderProps {
  project: Project;
  onBack: () => void;
  onOpenTeamModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenGradeModal: () => void;
  onSubmitFinal: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onBack,
  onOpenTeamModal,
  onOpenSettingsModal,
  onOpenGradeModal,
  onSubmitFinal,
}) => {
  const { role } = useAuth();

  return (
    <Card className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="space-y-2 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className="h-8 w-8 rounded-lg grid place-items-center border transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex-shrink-0"
            style={{ borderColor: "var(--bdr)" }}
            aria-label="Back to projects"
          >
            <ChevronRight size={14} className="rotate-180" />
          </button>
          <div
            className="h-8 w-8 rounded-lg grid place-items-center flex-shrink-0 border"
            style={{
              background: "#06b6d415",
              borderColor: "#06b6d430",
              color: "#06b6d4",
            }}
          >
            <FolderKanban size={16} />
          </div>
          <h2 className="font-bold text-[17px] sm:text-[19px] truncate">
            {project.title}
          </h2>
          <Pill color={project.status === "APPROVED" ? "#22c55e" : "#0891b2"}>
            {project.status}
          </Pill>
          <Pill color="#a855f7">Phase {project.phase}</Pill>
          {project.grade && <Pill color="#22c55e">Grade {project.grade}</Pill>}
        </div>

        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono truncate max-w-full select-all cursor-pointer"
            style={{ background: "#0a2228", color: "#5eead4" }}
            title="Click to select repository URL"
          >
            {project.repoUrl}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Btn2 onClick={onOpenTeamModal} className="text-[12px] !px-3 !h-9">
          <Users size={14} /> Team ({(project.team || []).length})
        </Btn2>
        <Btn2 onClick={onOpenSettingsModal} className="text-[12px] !px-3 !h-9">
          <Settings size={14} /> Settings
        </Btn2>
        {role === "SUPERVISOR" && (
          <Btn onClick={onOpenGradeModal} className="text-[12px] !px-4 !h-9">
            <Star size={14} /> Grade Project
          </Btn>
        )}
        {role === "STUDENT" && (
          <button
            type="button"
            onClick={onSubmitFinal}
            className="h-9 px-4 rounded-xl font-bold text-[12px] text-white flex items-center gap-1.5 shadow-md transition hover:brightness-110 active:scale-95 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)",
            }}
          >
            <Send size={13} /> Submit Final
          </button>
        )}
      </div>
    </Card>
  );
};

export default ProjectHeader;
