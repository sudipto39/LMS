import React from "react";
import { TrendingUp, BarChart3 } from "lucide-react";
import { Card, Pill } from "../../../components/common/UIPrimitives";

interface ProjectProgressTabProps {
  totalMilestonesCount: number;
  approvedMilestonesCount: number;
  liveFilesCount: number;
  dynamicVelocity: number;
}

export const ProjectProgressTab: React.FC<ProjectProgressTabProps> = ({
  totalMilestonesCount,
  approvedMilestonesCount,
  liveFilesCount,
  dynamicVelocity,
}) => {
  const commitActivity = [
    { w: "W1", c: 12 },
    { w: "W2", c: 18 },
    { w: "W3", c: 8 },
    { w: "W4", c: 24 },
    { w: "W5", c: 15 },
    { w: "W6", c: 30 },
    { w: "W7", c: 22 },
    { w: "W8", c: 19 },
    { w: "W9", c: 28 },
    { w: "W10", c: 35 },
    { w: "W11", c: 42 },
    { w: "W12", c: 27 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div
            className="text-[11px] uppercase font-bold"
            style={{ color: "var(--t2)" }}
          >
            Total Milestones
          </div>
          <div className="text-[22px] font-bold mt-1 text-[#06b6d4]">
            {totalMilestonesCount}
          </div>
          <div className="text-[10px] text-[#22c55e] mt-1 flex items-center gap-1">
            <TrendingUp size={11} /> {approvedMilestonesCount} approved
          </div>
        </Card>
        <Card className="p-4">
          <div
            className="text-[11px] uppercase font-bold"
            style={{ color: "var(--t2)" }}
          >
            Lines Added
          </div>
          <div className="text-[22px] font-bold mt-1 text-[#22c55e]">
            +1,420
          </div>
          <div className="text-[10px]" style={{ color: "var(--t3)" }}>
            Across {liveFilesCount} repository files
          </div>
        </Card>
        <Card className="p-4">
          <div
            className="text-[11px] uppercase font-bold"
            style={{ color: "var(--t2)" }}
          >
            Lines Removed
          </div>
          <div className="text-[22px] font-bold mt-1 text-[#ef4444]">
            −210
          </div>
          <div className="text-[10px]" style={{ color: "var(--t3)" }}>
            Refactoring churn
          </div>
        </Card>
        <Card className="p-4">
          <div
            className="text-[11px] uppercase font-bold"
            style={{ color: "var(--t2)" }}
          >
            Milestone Velocity
          </div>
          <div className="text-[22px] font-bold mt-1 text-[#a855f7]">
            {dynamicVelocity}%
          </div>
          <div className="text-[10px]" style={{ color: "var(--t3)" }}>
            {dynamicVelocity >= 70 ? "On track" : "In active development"}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="font-semibold text-[13px] flex items-center gap-2">
              <BarChart3 size={15} style={{ color: "var(--acc)" }} /> Weekly
              Commit Activity
            </h4>
            <p className="text-[11px]" style={{ color: "var(--t2)" }}>
              Aggregated from Gitea repository branch history
            </p>
          </div>
          <Pill color="#06b6d4">12 Weeks Active</Pill>
        </div>
        <div
          className="h-44 flex items-end justify-between gap-2 pt-4 px-2 border-b custom-scrollbar overflow-x-auto"
          style={{ borderColor: "var(--bdr)" }}
        >
          {commitActivity.map((bar) => (
            <div
              key={bar.w}
              className="flex-1 min-w-[24px] flex flex-col items-center gap-2 group"
            >
              <div
                className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--acc)" }}
              >
                {bar.c}
              </div>
              <div
                className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-[#0891b2] to-[#22d3ee] transition-all hover:scale-105"
                style={{ height: `${(bar.c / 45) * 120}px` }}
              />
              <span
                className="text-[10px] font-bold"
                style={{ color: "var(--t3)" }}
              >
                {bar.w}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ProjectProgressTab;
