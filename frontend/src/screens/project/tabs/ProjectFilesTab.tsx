import React, { useState } from "react";
import {
  Folder,
  FileText,
  FileCode,
  Globe,
  Paperclip,
  Download,
  CheckCircle2,
  Copy,
  RotateCcw,
} from "lucide-react";
import { Card, Pill } from "../../../components/common/UIPrimitives";
import type { ProjectFile } from "../../../types";
import type { ProjectDeliverableItem } from "../types";

interface ProjectFilesTabProps {
  liveFiles: ProjectFile[];
  loadingFiles: boolean;
  onRefreshFiles: () => void;
  allProjectDeliverables: ProjectDeliverableItem[];
  projectTitle?: string;
  projectDescription?: string;
  projectTech?: string[];
  showToast: (msg: string) => void;
}

export const ProjectFilesTab: React.FC<ProjectFilesTabProps> = ({
  liveFiles,
  loadingFiles,
  onRefreshFiles,
  allProjectDeliverables,
  projectTitle,
  projectDescription,
  projectTech,
  showToast,
}) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [selectedDeliverable, setSelectedDeliverable] =
    useState<ProjectDeliverableItem | null>(null);

  const activeRawFile =
    (liveFiles && liveFiles[selectedFileIndex]) || (liveFiles && liveFiles[0]);

  const currentFile: ProjectFile = {
    name: activeRawFile?.name || "README.md",
    path: activeRawFile?.path || activeRawFile?.name || "README.md",
    content:
      activeRawFile?.content ??
      `# ${projectTitle || "Project"}\n\n${
        projectDescription || "Academic Capstone Project"
      }\n\n## Tech Stack\n${
        (projectTech || []).join(", ") || "TypeScript, React, Node.js"
      }`,
    language: activeRawFile?.language || "markdown",
    size: activeRawFile?.size || "1.2 KB",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-4 h-[580px]">
      {/* Left Column: Repository Files & Uploaded Milestone Deliverables */}
      <Card className="p-3 overflow-y-auto space-y-3 flex flex-col">
        {/* Section 1: Repository Files */}
        <div>
          <div
            className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 flex items-center justify-between border-b pb-2 mb-1.5"
            style={{ borderColor: "var(--bdr)", color: "var(--t2)" }}
          >
            <span className="flex items-center gap-1.5">
              <Folder size={13} style={{ color: "var(--acc)" }} /> Repo Files (
              {liveFiles.length})
            </span>
            <button
              type="button"
              onClick={onRefreshFiles}
              disabled={loadingFiles}
              className="text-[10px] text-[#06b6d4] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Sync latest files from Gitea"
            >
              <RotateCcw size={10} className={loadingFiles ? "animate-spin" : ""} />
              {loadingFiles ? "Syncing..." : "Sync"}
            </button>
          </div>

          <div className="space-y-0.5 max-h-[260px] overflow-y-auto">
            {liveFiles.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-[var(--t3)] space-y-1.5">
                <Folder size={20} className="mx-auto opacity-40 text-[var(--acc)]" />
                <p className="font-semibold text-[var(--t2)]">No files loaded yet</p>
                <button
                  type="button"
                  onClick={onRefreshFiles}
                  className="px-2 py-0.5 text-[10px] rounded-lg border border-[var(--acc)] text-[var(--acc)] hover:bg-[var(--acc)]/10 cursor-pointer"
                >
                  Fetch from Gitea
                </button>
              </div>
            ) : (
              liveFiles.map((file, idx) => {
                const fName = file?.name || file?.path || "file";
                let fileIcon = <FileCode size={13} className="text-[#38bdf8]" />;
                if (fName.endsWith(".html"))
                  fileIcon = <Globe size={13} className="text-[#f97316]" />;
                else if (fName.endsWith(".css"))
                  fileIcon = <FileCode size={13} className="text-[#06b6d4]" />;
                else if (fName.endsWith(".js") || fName.endsWith(".ts"))
                  fileIcon = <FileCode size={13} className="text-[#facc15]" />;
                else if (fName.endsWith(".py"))
                  fileIcon = <FileCode size={13} className="text-[#38bdf8]" />;
                else if (fName.endsWith(".r"))
                  fileIcon = <FileCode size={13} className="text-[#60a5fa]" />;
                else if (fName.endsWith(".json"))
                  fileIcon = <FileText size={13} className="text-[#4ade80]" />;
                else if (fName.endsWith(".md"))
                  fileIcon = <FileText size={13} className="text-[#cbd5e1]" />;

                const isSelected = !selectedDeliverable && selectedFileIndex === idx;

                return (
                  <button
                    key={file?.path || idx}
                    type="button"
                    onClick={() => {
                      setSelectedDeliverable(null);
                      setSelectedFileIndex(idx);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[12px] text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-[#0e4a5e] text-white font-semibold shadow-sm"
                        : "hover:bg-black/5 dark:hover:bg-white/5 text-[var(--t2)]"
                    }`}
                  >
                    {fileIcon}
                    <span className="flex-1 truncate mono text-[11px]">{fName}</span>
                    <span className="text-[10px]" style={{ color: "var(--t3)" }}>
                      {file?.size || ""}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Section 2: Uploaded Milestone Deliverables */}
        <div className="pt-2 border-t" style={{ borderColor: "var(--bdr)" }}>
          <div
            className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 flex items-center justify-between mb-1.5"
            style={{ color: "var(--t2)" }}
          >
            <span className="flex items-center gap-1.5 text-[#06b6d4]">
              <Paperclip size={13} /> Deliverables ({allProjectDeliverables.length})
            </span>
            <span className="text-[9px] text-[var(--t3)]">S3 Storage</span>
          </div>

          <div className="space-y-1 max-h-[220px] overflow-y-auto">
            {allProjectDeliverables.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-[var(--t3)]">
                No milestone deliverables uploaded yet.
              </div>
            ) : (
              allProjectDeliverables.map((deliv, idx) => {
                const isSelected = selectedDeliverable?.name === deliv.name;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDeliverable(deliv)}
                    className={`p-2 rounded-xl text-[11px] cursor-pointer transition border ${
                      isSelected
                        ? "bg-[#06b6d4]/15 border-[#06b6d4]/40 text-[#06b6d4] font-semibold"
                        : "border-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[var(--t2)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5 truncate">
                        <FileText size={13} className="text-[#06b6d4] shrink-0" />
                        <span className="truncate font-mono">{deliv.name}</span>
                      </span>
                      {deliv.url && (
                        <a
                          href={deliv.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#06b6d4] hover:text-[#22d3ee] p-0.5 rounded"
                          title="Download deliverable"
                        >
                          <Download size={11} />
                        </a>
                      )}
                    </div>
                    <div className="text-[9px] text-[var(--t3)] truncate mt-0.5">
                      {deliv.milestoneTitle}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {/* Right Pane: Code Viewer OR Milestone Deliverable Viewer */}
      {selectedDeliverable ? (
        <Card className="overflow-hidden flex flex-col p-6 space-y-6">
          <div
            className="flex items-center justify-between pb-4 border-b"
            style={{ borderColor: "var(--bdr)" }}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#06b6d4]/15 border border-[#06b6d4]/30 grid place-items-center text-[#06b6d4]">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-bold text-[15px] flex items-center gap-2">
                  {selectedDeliverable.name}
                  <Pill color="#06b6d4">Milestone Deliverable</Pill>
                </h3>
                <div className="text-[11px]" style={{ color: "var(--t2)" }}>
                  Attached to: <b>{selectedDeliverable.milestoneTitle}</b>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedDeliverable.url ? (
                <a
                  href={selectedDeliverable.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-3 rounded-xl bg-[#06b6d4] text-white font-semibold text-[12px] flex items-center gap-1.5 hover:opacity-90 transition cursor-pointer"
                >
                  <Download size={13} /> Download Deliverable
                </a>
              ) : (
                <span className="text-[12px] text-[#22c55e] font-semibold flex items-center gap-1">
                  <CheckCircle2 size={14} /> Presigned on S3
                </span>
              )}
              <button
                type="button"
                onClick={() => setSelectedDeliverable(null)}
                className="h-8 px-2.5 rounded-xl border text-[11px] text-[var(--t3)] hover:text-[var(--t1)] cursor-pointer"
                style={{ borderColor: "var(--bdr)" }}
              >
                Close
              </button>
            </div>
          </div>

          {/* Document Overview Card */}
          <div
            className="p-5 rounded-2xl border space-y-4 max-w-[640px]"
            style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[var(--t2)] uppercase tracking-wider">
                Deliverable Specifications
              </span>
              <Pill color="#22c55e">✓ Verified S3 Key</Pill>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div
                className="p-3 rounded-xl border"
                style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}
              >
                <div className="text-[10px] text-[var(--t3)] uppercase font-bold">
                  Milestone
                </div>
                <div className="font-semibold text-[var(--t1)] mt-0.5 truncate">
                  {selectedDeliverable.milestoneTitle}
                </div>
              </div>
              <div
                className="p-3 rounded-xl border"
                style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}
              >
                <div className="text-[10px] text-[var(--t3)] uppercase font-bold">
                  File Size
                </div>
                <div className="font-semibold text-[var(--t1)] mt-0.5">
                  {selectedDeliverable.size
                    ? `${(selectedDeliverable.size / 1024 / 1024).toFixed(2)} MB`
                    : "Presigned Payload"}
                </div>
              </div>
            </div>

            {selectedDeliverable.url ? (
              <div className="pt-2">
                <a
                  href={selectedDeliverable.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-[#0891b2] to-[#0284c7] text-white font-bold text-[13px] flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition"
                >
                  <Download size={15} /> Open / Download File from S3
                </a>
              </div>
            ) : (
              <div className="text-[12px] text-[var(--t3)] italic text-center py-2">
                Document registered for faculty supervisor grading.
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden flex flex-col">
          <div
            className="h-10 border-b flex items-center justify-between px-4"
            style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
          >
            <div className="flex items-center gap-2">
              <FileCode size={13} style={{ color: "var(--acc)" }} />
              <span className="text-[12px] font-medium mono">
                {currentFile?.path || currentFile?.name || "README.md"}
              </span>
              <Pill>{currentFile?.language || "markdown"}</Pill>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(currentFile?.content || "");
                showToast("Code copied to clipboard");
              }}
              className="h-7 px-2.5 rounded-lg border text-[11px] flex items-center gap-1 cursor-pointer"
              style={{ borderColor: "var(--bdr)" }}
            >
              <Copy size={11} /> Copy
            </button>
          </div>
          <div className="flex flex-1 overflow-auto bg-[#0a1520]">
            <div className="w-12 bg-[#060e15] text-right pr-3 py-3 select-none text-[#3a5a6a] mono text-[11px] leading-[22px]">
              {(currentFile?.content || "").split("\n").map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre className="flex-1 p-3 mono text-[12px] leading-[22px] text-[#e0f2f7] overflow-auto whitespace-pre">
              {currentFile?.content || "// No content available"}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProjectFilesTab;
