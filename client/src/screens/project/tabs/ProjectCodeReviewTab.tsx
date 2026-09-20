import React from "react";
import {
  FileCode,
  RotateCcw,
  GitCommitHorizontal,
} from "lucide-react";
import { Card, Pill } from "../../../components/common/UIPrimitives";
import type { CodeReviewComment } from "../../../types";

interface ProjectCodeReviewTabProps {
  codeReviewComments: CodeReviewComment[];
  commitDiffData: any;
  commitDiffFiles: any[];
  selectedDiffFileIndex: number;
  setSelectedDiffFileIndex: (idx: number) => void;
  selectedCommitSha: string;
  loadingDiff: boolean;
  fetchCommitDiff: (sha: string) => void;
  handleResolveCodeComment: (commentId: string, resolved: boolean) => void;
  handleSaveInlineComment: (diffIndex: number, lineNum: number | null) => void;
  newInlineComment: string;
  setNewInlineComment: (val: string) => void;
  commentAt: number | null;
  setCommentAt: (val: number | null) => void;
  parsedDiffLines: any[];
}

export const ProjectCodeReviewTab: React.FC<ProjectCodeReviewTabProps> = ({
  codeReviewComments,
  commitDiffData,
  commitDiffFiles,
  selectedDiffFileIndex,
  setSelectedDiffFileIndex,
  selectedCommitSha,
  loadingDiff,
  fetchCommitDiff,
  handleResolveCodeComment,
  handleSaveInlineComment,
  newInlineComment,
  setNewInlineComment,
  commentAt,
  setCommentAt,
  parsedDiffLines,
}) => {
  const currentDiffFile =
    commitDiffFiles[selectedDiffFileIndex] || commitDiffFiles[0];

  return (
    <Card className="overflow-hidden">
      <div
        className="h-11 px-4 flex items-center justify-between border-b"
        style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
      >
        <span className="font-semibold text-[13px] flex items-center gap-2">
          <FileCode size={14} style={{ color: "var(--acc)" }} /> In-App Code
          Review — Commit Diffs
        </span>
        <div className="flex items-center gap-2">
          <Pill color="#06b6d4">
            {codeReviewComments.length} review comment
            {codeReviewComments.length === 1 ? "" : "s"}
          </Pill>
          <Pill color="#22c55e">
            +
            {commitDiffData?.stats?.additions ??
              commitDiffFiles.reduce(
                (acc, f) => acc + (f.additions || 0),
                0
              )}{" "}
            -
            {commitDiffData?.stats?.deletions ??
              commitDiffFiles.reduce(
                (acc, f) => acc + (f.deletions || 0),
                0
              )}
          </Pill>
          <button
            type="button"
            onClick={() => fetchCommitDiff(selectedCommitSha)}
            disabled={loadingDiff}
            className="text-[11px] px-2 py-1 rounded-lg border flex items-center gap-1 text-[var(--acc)] hover:bg-[var(--acc)]/10 cursor-pointer disabled:opacity-50"
            style={{ borderColor: "var(--bdr)" }}
            title="Refresh live commit diff"
          >
            <RotateCcw size={11} className={loadingDiff ? "animate-spin" : ""} />
            {loadingDiff ? "Syncing..." : "Sync Diff"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] h-[520px]">
        {/* Left Sidebar: Changed Files & Recent Commits */}
        <div
          className="border-r p-3 overflow-y-auto space-y-3"
          style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
        >
          <div>
            <div
              className="text-[11px] font-bold uppercase flex items-center justify-between gap-1.5 mb-1.5"
              style={{ color: "var(--t2)" }}
            >
              <span className="flex items-center gap-1.5">
                <GitCommitHorizontal size={12} /> Changed Files (
                {commitDiffFiles.length})
              </span>
              <span className="mono text-[10px] text-[var(--t3)]">
                {commitDiffData?.sha
                  ? `SHA: ${commitDiffData.sha.slice(0, 7)}`
                  : "HEAD"}
              </span>
            </div>
            <div className="space-y-1">
              {commitDiffFiles.length > 0 ? (
                commitDiffFiles.map((f: any, idx: number) => {
                  const isSelected = selectedDiffFileIndex === idx;
                  return (
                    <div
                      key={f.filename || idx}
                      onClick={() => setSelectedDiffFileIndex(idx)}
                      className={`p-2 rounded-xl text-[11px] cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? "bg-[#06b6d4]/15 border border-[#06b6d4]/40 text-[#06b6d4] font-semibold"
                          : "hover:bg-black/5 dark:hover:bg-white/5 text-[var(--t2)]"
                      }`}
                    >
                      <span className="truncate flex-1 font-mono">
                        {f.filename || `File #${idx + 1}`}
                      </span>
                      <span className="mono text-[10px] flex-shrink-0 ml-2">
                        <span className="text-[#22c55e]">
                          +{f.additions || 0}
                        </span>{" "}
                        <span className="text-[#ef4444]">
                          -{f.deletions || 0}
                        </span>
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-[11px] text-[var(--t3)] py-2">
                  No modified files in this commit.
                </div>
              )}
            </div>
          </div>

          {/* Recent Commits Selector */}
          {commitDiffData?.recentCommits &&
            commitDiffData.recentCommits.length > 0 && (
              <div
                className="pt-2.5 border-t space-y-1.5"
                style={{ borderColor: "var(--bdr)" }}
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--t3)" }}
                >
                  Recent Commits ({commitDiffData.recentCommits.length})
                </div>
                <div className="space-y-1 max-h-[140px] overflow-y-auto">
                  {commitDiffData.recentCommits.map((c: any, idx: number) => {
                    const isActive = selectedCommitSha === (c.fullSha || c.sha);
                    return (
                      <div
                        key={c.sha || idx}
                        onClick={() => fetchCommitDiff(c.fullSha || c.sha)}
                        className={`p-1.5 rounded-lg text-[10px] cursor-pointer transition ${
                          isActive
                            ? "bg-[#22c55e]/15 border border-[#22c55e]/30 font-semibold"
                            : "hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="mono font-bold text-[var(--acc)]">
                            {c.sha}
                          </span>
                          <span className="text-[9px] text-[var(--t3)]">
                            {c.author}
                          </span>
                        </div>
                        <p
                          className="truncate text-[10px] mt-0.5"
                          style={{ color: "var(--t2)" }}
                        >
                          {c.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Open Review Comments */}
          {codeReviewComments.length > 0 && (
            <div
              className="pt-2.5 border-t space-y-1.5"
              style={{ borderColor: "var(--bdr)" }}
            >
              <div
                className="text-[10px] font-bold uppercase"
                style={{ color: "var(--t3)" }}
              >
                Open Remarks (
                {codeReviewComments.filter((c) => !c.isResolved).length})
              </div>
              <div className="space-y-1 max-h-[120px] overflow-y-auto">
                {codeReviewComments.map((rc) => (
                  <div
                    key={rc.id}
                    className="p-1.5 rounded-lg text-[10px] space-y-0.5 border"
                    style={{
                      background: "var(--srf)",
                      borderColor: "var(--bdr)",
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{rc.authorName}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleResolveCodeComment(rc.id, !rc.isResolved)
                        }
                        className="text-[9px] text-[#06b6d4] hover:underline cursor-pointer"
                      >
                        {rc.isResolved ? "Reopen" : "Resolve"}
                      </button>
                    </div>
                    <p
                      className="text-[10px] truncate"
                      style={{ color: "var(--t2)" }}
                    >
                      Line {rc.lineNumber}: {rc.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Live Git Diff View */}
        <div className="flex flex-col h-full overflow-hidden bg-[#080f18]">
          <div
            className="h-8 px-3 border-b flex items-center justify-between text-[11px] mono flex-shrink-0"
            style={{
              borderColor: "#16293d",
              background: "#050b12",
              color: "#94a3b8",
            }}
          >
            <span>{currentDiffFile?.filename || "README.md"}</span>
            <span>Click any line to leave an inline review comment</span>
          </div>

          <div className="flex-1 overflow-auto mono text-[12px] leading-6 select-text">
            {parsedDiffLines.length === 0 ? (
              <div className="p-8 text-center text-[#94a3b8]">
                <p>No changed lines recorded for this file.</p>
              </div>
            ) : (
              parsedDiffLines.map((l: any, i: number) => {
                const lineComments = codeReviewComments.filter(
                  (c) => c.lineNumber === (l.newNum || l.oldNum || i + 1)
                );
                const isHunkHeader = l.type === "hdr";

                if (isHunkHeader) {
                  return (
                    <div
                      key={i}
                      className="px-3 py-1 text-[11px] font-bold text-[#38bdf8] bg-[#0c2a40] border-y border-[#1e3a52]"
                    >
                      {l.text}
                    </div>
                  );
                }

                return (
                  <div key={i}>
                    <div
                      onClick={() => {
                        setCommentAt(commentAt === i ? null : i);
                        setNewInlineComment("");
                      }}
                      className="flex border-b cursor-pointer transition select-text group"
                      title="Click to add review remark"
                      style={{
                        borderColor: "#16293d",
                        background:
                          l.type === "del"
                            ? "#2e1518"
                            : l.type === "add"
                            ? "#0c2e2a"
                            : "transparent",
                      }}
                    >
                      {/* Old Line Side */}
                      <div className="flex w-1/2 border-r border-[#16293d] overflow-hidden">
                        <span className="w-10 text-right pr-2 select-none text-[#475569] bg-[#050b12] border-r border-[#16293d]">
                          {l.oldNum || ""}
                        </span>
                        <span
                          className="flex-1 px-2 whitespace-pre overflow-hidden"
                          style={{
                            color: l.type === "del" ? "#f87171" : "#cbd5e1",
                          }}
                        >
                          {l.type === "del"
                            ? `- ${l.oldText}`
                            : l.type === "ctx"
                            ? `  ${l.oldText}`
                            : ""}
                        </span>
                      </div>

                      {/* New Line Side */}
                      <div className="flex w-1/2 overflow-hidden">
                        <span className="w-10 text-right pr-2 select-none text-[#475569] bg-[#050b12] border-r border-[#16293d]">
                          {l.newNum || ""}
                        </span>
                        <span
                          className="flex-1 px-2 whitespace-pre overflow-hidden"
                          style={{
                            color: l.type === "add" ? "#4ade80" : "#cbd5e1",
                          }}
                        >
                          {l.type === "add"
                            ? `+ ${l.newText}`
                            : l.type === "ctx"
                            ? `  ${l.newText}`
                            : ""}
                        </span>
                      </div>
                    </div>

                    {/* Existing Inline Comments on this Line */}
                    {lineComments.map((rc) => (
                      <div
                        key={rc.id}
                        className="bg-[#0b1b2b] border-y border-[#1e3a52] px-6 py-2 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#38bdf8]">
                            {rc.authorName}{" "}
                            {(rc as any).authorRole
                              ? `(${(rc as any).authorRole})`
                              : ""}
                            :
                          </span>
                          <span className="text-[#f1f5f9]">{rc.content}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleResolveCodeComment(rc.id, !rc.isResolved)
                          }
                          className="text-[10px] text-[#4ade80] hover:underline cursor-pointer"
                        >
                          {rc.isResolved ? "Reopen" : "✓ Mark Resolved"}
                        </button>
                      </div>
                    ))}

                    {/* Inline Review Remark Input Box */}
                    {commentAt === i && (
                      <div className="p-3 bg-[#0a1826] border-y border-[#1e3a52]">
                        <Card className="max-w-[500px] ml-auto p-3 text-[12px] space-y-2 shadow-2xl bg-[#060e15] border-[#1e3a52]">
                          <div className="flex justify-between items-center">
                            <b className="text-[#38bdf8]">
                              Add Review Remark on Line{" "}
                              {l.newNum || l.oldNum || i + 1}:
                            </b>
                            <button
                              type="button"
                              onClick={() => setCommentAt(null)}
                              className="text-[#94a3b8] hover:text-white text-[11px] cursor-pointer"
                            >
                              Close
                            </button>
                          </div>
                          <textarea
                            value={newInlineComment}
                            onChange={(e) => setNewInlineComment(e.target.value)}
                            placeholder="Leave review feedback or question on this line of code..."
                            className="w-full h-16 p-2 rounded-lg border text-[12px] focus:outline-none resize-none font-sans bg-[#08121c] border-[#1e3a52] text-[#f1f5f9]"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setCommentAt(null)}
                              className="h-7 px-2.5 rounded-lg border border-[#1e3a52] text-[11px] text-[#94a3b8] hover:text-white cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSaveInlineComment(
                                  i,
                                  l.newNum || l.oldNum
                                )
                              }
                              className="h-7 px-3 rounded-lg bg-[#06b6d4] text-white font-semibold text-[11px] hover:opacity-90 cursor-pointer"
                            >
                              Save Remark
                            </button>
                          </div>
                        </Card>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProjectCodeReviewTab;
