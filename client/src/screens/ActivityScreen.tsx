// src/screens/ActivityScreen.tsx
import React, { useState } from "react";
import {
  Activity,
  GitCommitHorizontal,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, Pill } from "../components/common/UIPrimitives";
import type { ActivityItem } from "../types";

interface ActivityScreenProps {
  activities: ActivityItem[];
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  activities,
}) => {
  const [filterType, setFilterType] = useState<string>("ALL");

  const filtered = activities.filter((a) => {
    if (filterType === "ALL") return true;
    const t = (a.type || "").toLowerCase();
    if (filterType === "COMMIT") return t.includes("commit");
    if (filterType === "FEEDBACK") return t.includes("feedback");
    if (filterType === "MILESTONE")
      return t.includes("milestone") || t.includes("submission") || t.includes("lab");
    return t === filterType.toLowerCase();
  });

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold flex items-center gap-2">
            <Activity size={22} style={{ color: "var(--acc)" }} /> Real-Time
            Activity Stream
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--t2)" }}>
            Live stream of your project events, commit syncs, and lab submissions
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["ALL", "COMMIT", "FEEDBACK", "MILESTONE"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                filterType === t
                  ? "bg-[#0e4a5e] text-white border-transparent"
                  : ""
              }`}
              style={
                filterType !== t
                  ? {
                      background: "var(--srf2)",
                      borderColor: "var(--bdr)",
                      color: "var(--t2)",
                    }
                  : {}
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-5 space-y-4">
        {filtered.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div
              className="h-16 w-16 rounded-2xl grid place-items-center mb-3 border"
              style={{
                background: "var(--srf2)",
                borderColor: "var(--bdr)",
                color: "var(--acc)",
              }}
            >
              <Activity size={28} />
            </div>
            <h3 className="font-bold text-[15px]">No Activities Found</h3>
            <p className="text-[13px] max-w-md mt-1" style={{ color: "var(--t2)" }}>
              {filterType === "ALL"
                ? "No activities have been recorded for your account yet. When you push commits, submit lab reports, or receive milestone reviews on your projects, they will show up here."
                : `No ${filterType.toLowerCase()} activities recorded for your account or projects.`}
            </p>
          </div>
        ) : (
          filtered.map((a) => (
            <div
              key={a.id}
              className="p-4 rounded-xl border flex gap-3 transition hover:shadow-sm"
              style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
            >
              <img
                src={a.avatar}
                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13px]">
                  <b>{a.user}</b>{" "}
                  <span style={{ color: "var(--t2)" }}>{a.msg}</span>{" "}
                  {a.project &&
                    !a.msg?.toLowerCase().includes(a.project.toLowerCase()) && (
                      <span
                        style={{ color: "var(--acc)" }}
                        className="font-semibold"
                      >
                        {a.project}
                      </span>
                    )}
                </div>
                {a.detail && (
                  <div
                    className="mt-1.5 text-[11px] p-2 rounded-lg mono"
                    style={{
                      background: "var(--srf)",
                      borderColor: "var(--bdr)",
                      border: "1px solid",
                      color: "var(--t2)",
                    }}
                  >
                    {a.detail}
                  </div>
                )}
                <div
                  className="text-[10px] mt-2 flex items-center gap-2"
                  style={{ color: "var(--t3)" }}
                >
                  <div
                    className="h-5 w-5 rounded-full grid place-items-center border"
                    style={{
                      borderColor: "var(--bdr)",
                      background: "var(--srf)",
                    }}
                  >
                    {a.type === "commit" ? (
                      <GitCommitHorizontal size={10} />
                    ) : a.type === "feedback" ? (
                      <MessageCircle size={10} />
                    ) : (
                      <CheckCircle2 size={10} />
                    )}
                  </div>
                  <span>{a.time}</span>
                  <Pill color="#06b6d4">{a.type}</Pill>
                </div>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default ActivityScreen;
