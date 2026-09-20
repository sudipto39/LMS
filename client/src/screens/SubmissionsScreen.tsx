// src/screens/SubmissionsScreen.tsx
import React from "react";
import { Upload, Download, FileText, CheckCircle2, Clock, Calendar, Paperclip } from "lucide-react";
import { Card, Pill, Btn2 } from "../components/common/UIPrimitives";
import { useToast } from "../context/ToastContext";
import type { Milestone } from "../types";

interface SubmissionsScreenProps {
  milestones: Milestone[];
}

export const SubmissionsScreen: React.FC<SubmissionsScreenProps> = ({
  milestones,
}) => {
  const showToast = useToast();
  const submittedItems = milestones.filter(
    (m) => m.status === "SUBMITTED" || m.status === "APPROVED"
  );

  const handleDownloadDeliverable = (m: Milestone) => {
    const atts = m.attachments || [];
    if (atts.length > 0) {
      atts.forEach((att) => {
        if (att.url) {
          const link = document.createElement("a");
          link.href = att.url;
          link.download = att.name || "deliverable.pdf";
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Generate downloadable file
          const content = `Capstone Milestone Deliverable:\n==============================\nTitle: ${m.title}\nStatus: ${m.status}\nSubmitted Date: ${m.submittedAt || new Date().toLocaleDateString()}\nDue Date: ${m.due}\nFile: ${att.name}\nNotes: ${m.note || "Milestone completed"}`;
          const blob = new Blob([content], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = att.name || `${m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-deliverable.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      });
      showToast(`Downloading ${atts.length} file(s) for "${m.title}" 📥`);
    } else {
      const content = `Capstone Milestone Deliverable:\n==============================\nTitle: ${m.title}\nStatus: ${m.status}\nSubmitted Date: ${m.submittedAt || new Date().toLocaleDateString()}\nDue Date: ${m.due}\nNotes: ${m.note || "Milestone deliverable"}`;
      const blob = new Blob([content], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-deliverable.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Downloading deliverable package for "${m.title}" 📥`);
    }
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      <div>
        <h1 className="text-[24px] font-bold flex items-center gap-2">
          <Upload size={22} style={{ color: "var(--acc)" }} /> My Uploaded Submissions
        </h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--t2)" }}>
          Archive of submitted milestone deliverables, submission dates, and S3 assets
        </p>
      </div>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--srf2)", color: "var(--t2)" }}>
                <th className="text-left p-3">Milestone Deliverable</th>
                <th className="text-left p-3">Due Date</th>
                <th className="text-left p-3">Submit Date</th>
                <th className="text-left p-3">Files & Attachments</th>
                <th className="text-left p-3">Review Status</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {submittedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-[13px]"
                    style={{ color: "var(--t3)" }}
                  >
                    No deliverables submitted yet.
                  </td>
                </tr>
              ) : (
                submittedItems.map((m) => {
                  const submitDateFormatted =
                    m.submittedAt ||
                    (m.status === "APPROVED"
                      ? "15/8/2026"
                      : m.status === "SUBMITTED"
                      ? "27/8/2026"
                      : "—");

                  return (
                    <tr
                      key={m.id}
                      className="border-t transition hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ borderColor: "var(--bdr)" }}
                    >
                      <td className="p-3 font-semibold">
                        <div className="font-bold text-[13px]">{m.title}</div>
                        {m.note && (
                          <div className="text-[11px] font-normal truncate max-w-[280px]" style={{ color: "var(--t3)" }}>
                            {m.note}
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px]">{m.due}</td>
                      <td className="p-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono border"
                          style={{ background: "var(--srf2)", borderColor: "var(--bdr)", color: "var(--t1)" }}
                        >
                          <Calendar size={11} className="text-[#06b6d4]" />
                          {submitDateFormatted}
                        </span>
                      </td>
                      <td className="p-3">
                        {m.attachments && m.attachments.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {m.attachments.map((att, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border"
                                style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--acc)" }}
                              >
                                <Paperclip size={10} />
                                <span className="truncate max-w-[130px]">{att.name}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--t2)" }}>
                            <FileText size={12} /> {m.files || 0} attachment(s)
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <Pill
                          color={
                            m.status === "APPROVED" ? "#22c55e" : "#06b6d4"
                          }
                        >
                          {m.status === "APPROVED" ? (
                            <>
                              <CheckCircle2 size={10} /> Approved
                            </>
                          ) : (
                            <>
                              <Clock size={10} /> In Review
                            </>
                          )}
                        </Pill>
                      </td>
                      <td className="p-3">
                        <Btn2
                          onClick={() => handleDownloadDeliverable(m)}
                          className="!h-7 text-[11px] !px-2.5 flex items-center gap-1 cursor-pointer"
                        >
                          <Download size={11} /> Download
                        </Btn2>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SubmissionsScreen;
