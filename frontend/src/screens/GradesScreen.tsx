// src/screens/GradesScreen.tsx
import React from "react";
import { Star, Download } from "lucide-react";
import { Card, Pill, Btn2 } from "../components/common/UIPrimitives";
import type { Project } from "../types";

interface GradesScreenProps {
  projects: Project[];
  onOpenGradeModal: (project: Project) => void;
  onExportGradesExcel: () => void;
}

export const GradesScreen: React.FC<GradesScreenProps> = ({
  projects,
  onOpenGradeModal,
  onExportGradesExcel,
}) => {
  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold flex items-center gap-2">
            <Star size={22} style={{ color: "#f59e0b" }} /> Grades & Capstone
            Evaluation
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--t2)" }}>
            Academic scorecards, supervisor rubric remarks, and official grading records
          </p>
        </div>
        <Btn2 onClick={onExportGradesExcel}>
          <Download size={13} /> Export Grades Spreadsheet (.xls)
        </Btn2>
      </div>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--srf2)", color: "var(--t2)" }}>
                <th className="text-left p-3">Project Title</th>
                <th className="text-left p-3">Student Lead</th>
                <th className="text-left p-3">Phase</th>
                <th className="text-left p-3">Grade</th>
                <th className="text-left p-3">Evaluation Remarks</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr
                  key={p.id}
                  className="border-t"
                  style={{ borderColor: "var(--bdr)" }}
                >
                  <td className="p-3 font-semibold">{p.title}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          p.team?.[0]?.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            p.team?.[0]?.name || p.title || "Student"
                          )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`
                        }
                        className="h-6 w-6 rounded-full object-cover"
                        alt=""
                      />
                      <span>{p.team[0]?.name || "Student"}</span>
                    </div>
                  </td>
                  <td className="p-3">Phase {p.phase}</td>
                  <td className="p-3">
                    {p.grade ? (
                      <Pill color="#22c55e">Grade {p.grade}</Pill>
                    ) : (
                      <Pill color="#f59e0b">Ungraded</Pill>
                    )}
                  </td>
                  <td className="p-3" style={{ color: "var(--t2)" }}>
                    {p.feedback || "Pending final evaluation remarks."}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => onOpenGradeModal(p)}
                      className="h-7 px-3 rounded-full bg-[#0e4a5e] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Star size={11} /> {p.grade ? "Re-grade" : "Grade"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default GradesScreen;
