// src/screens/AuditLogsScreen.tsx
import React from "react";
import { FileText, Download } from "lucide-react";
import { Card, Pill, Btn2 } from "../components/common/UIPrimitives";
import { useToast } from "../context/ToastContext";
import { sanitizeCsvCell } from "../utils/security";
import type { AuditLogItem } from "../types";

interface AuditLogsScreenProps {
  auditLogs: AuditLogItem[];
}

export const AuditLogsScreen: React.FC<AuditLogsScreenProps> = ({
  auditLogs,
}) => {
  const showToast = useToast();

  const handleExportLogs = () => {
    const headers = ["Timestamp", "Actor / User", "Action", "Description"];
    const rows = auditLogs.map((l) => {
      const userStr =
        typeof l.user === "object" && l.user !== null
          ? (l.user as any).name || (l.user as any).email || "System"
          : String(l.user || "System");
      const actionStr = typeof l.action === "string" ? l.action : "SYSTEM_EVENT";
      const timeStr = typeof l.time === "string" ? l.time : "—";
      const descStr = typeof l.desc === "string" ? l.desc : "—";

      return [
        sanitizeCsvCell(timeStr),
        sanitizeCsvCell(userStr),
        sanitizeCsvCell(actionStr),
        sanitizeCsvCell(descStr),
      ].join(",");
    });

    const csvData = [headers.map(sanitizeCsvCell).join(","), ...rows].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvData], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `giteaforge_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Audit logs exported securely to CSV ✅");
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold flex items-center gap-2">
            <FileText size={22} style={{ color: "var(--acc)" }} /> System Audit
            Logs
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--t2)" }}>
            Immutable security trail of administrative actions, user logins, and repository events
          </p>
        </div>
        <Btn2 onClick={handleExportLogs}>
          <Download size={13} /> Export Audit CSV
        </Btn2>
      </div>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--srf2)", color: "var(--t2)" }}>
                <th className="text-left p-3">Timestamp</th>
                <th className="text-left p-3">Actor / User</th>
                <th className="text-left p-3">Event Action</th>
                <th className="text-left p-3">Event Description</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((a, idx) => {
                const actionStr = typeof a.action === "string" ? a.action : "SYSTEM_EVENT";
                const userStr =
                  typeof a.user === "object" && a.user !== null
                    ? (a.user as any).name || "System"
                    : String(a.user || "System");
                const timeStr = typeof a.time === "string" ? a.time : "—";
                const descStr = typeof a.desc === "string" ? a.desc : "—";

                return (
                  <tr
                    key={a.id || idx}
                    className="border-t"
                    style={{ borderColor: "var(--bdr)" }}
                  >
                    <td className="p-3 mono text-[11px]" style={{ color: "var(--t3)" }}>
                      {timeStr}
                    </td>
                    <td className="p-3 font-semibold">{userStr}</td>
                    <td className="p-3">
                      <Pill
                        color={
                          actionStr.includes("DELETE")
                            ? "#ef4444"
                            : actionStr.includes("CREATE")
                            ? "#22c55e"
                            : "#06b6d4"
                        }
                      >
                        {actionStr}
                      </Pill>
                    </td>
                    <td className="p-3" style={{ color: "var(--t2)" }}>
                      {descStr}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AuditLogsScreen;
