import React from "react";
import {
  LayoutDashboard,
  Flag,
  BarChart3,
  FileText,
  MessageCircle,
  FileCode,
  Code2,
} from "lucide-react";
import type { ProjectTabKey } from "../types";

interface ProjectTabBarProps {
  activeTab: ProjectTabKey;
  onSelectTab: (tab: ProjectTabKey) => void;
  milestonesCount?: number;
  feedbacksCount?: number;
  filesCount?: number;
}

interface TabDef {
  key: ProjectTabKey;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

export const ProjectTabBar: React.FC<ProjectTabBarProps> = ({
  activeTab,
  onSelectTab,
  milestonesCount,
  feedbacksCount,
  filesCount,
}) => {
  const tabs: TabDef[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "milestones", label: "Milestones", icon: Flag, badge: milestonesCount },
    { key: "progress", label: "Progress", icon: BarChart3 },
    { key: "files", label: "Files", icon: FileText, badge: filesCount },
    { key: "feedback", label: "Feedback", icon: MessageCircle, badge: feedbacksCount },
    { key: "code-review", label: "Code Review", icon: FileCode },
    { key: "sandbox", label: "Codespace", icon: Code2 },
  ];

  return (
    <div
      className="flex gap-1 overflow-x-auto border-b custom-scrollbar"
      style={{ borderColor: "var(--bdr)" }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelectTab(tab.key)}
            className={`px-3.5 py-3 text-[12px] whitespace-nowrap border-b-2 capitalize flex items-center gap-1.5 transition cursor-pointer ${
              isActive
                ? "border-[#06b6d4] font-semibold text-[var(--acc)]"
                : "border-transparent text-[var(--t2)] hover:text-[var(--t1)] hover:border-[var(--bdr)]"
            }`}
          >
            <Icon size={13} />
            <span>{tab.label}</span>
            {typeof tab.badge === "number" && tab.badge > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  isActive
                    ? "bg-[#06b6d4]/20 text-[#06b6d4]"
                    : "bg-[var(--srf2)] text-[var(--t3)]"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ProjectTabBar;
