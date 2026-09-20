import React from "react";
import {
  GitCommitHorizontal,
  X,
  File,
  GitBranch,
  RotateCcw,
  CloudUpload,
} from "lucide-react";
import { Card, Btn, Btn2, Inp } from "../../../components/common/UIPrimitives";

interface WorkspaceFile {
  name: string;
  path: string;
  content: string;
}

interface SandboxCommitModalProps {
  show: boolean;
  onClose: () => void;
  workspaceFiles: WorkspaceFile[];
  isPathIgnored: (path: string) => boolean;
  commitMessage: string;
  onChangeCommitMessage: (msg: string) => void;
  commitBranch: string;
  onChangeCommitBranch: (branch: string) => void;
  isPushing: boolean;
  onCommitAndPush: () => void;
}

export const SandboxCommitModal: React.FC<SandboxCommitModalProps> = ({
  show,
  onClose,
  workspaceFiles,
  isPathIgnored,
  commitMessage,
  onChangeCommitMessage,
  commitBranch,
  onChangeCommitBranch,
  isPushing,
  onCommitAndPush,
}) => {
  if (!show) return null;

  const stagedCount = workspaceFiles.filter((f) => !isPathIgnored(f.path)).length;
  const ignoredCount = workspaceFiles.filter((f) => isPathIgnored(f.path)).length;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <Card className="w-full max-w-[560px] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#0284c7]/15 text-[#0284c7] grid place-items-center">
              <GitCommitHorizontal size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[16px]">Commit & Push to Gitea</h3>
              <p className="text-[12px]" style={{ color: "var(--t3)" }}>
                Push workspace files directly to the remote repository
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Staged & .gitignore Filter Summary */}
        <div className="space-y-2">
          <div
            className="flex items-center justify-between text-[11px] font-bold uppercase"
            style={{ color: "var(--t2)" }}
          >
            <span>Files Staged for Commit ({stagedCount})</span>
            <span className="text-amber-400 font-normal">
              🛡️ {ignoredCount} ignored by .gitignore
            </span>
          </div>
          <div
            className="max-h-[140px] overflow-y-auto p-2.5 rounded-xl border space-y-1.5 custom-scrollbar"
            style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
          >
            {workspaceFiles.map((file) => {
              const ignored = isPathIgnored(file.path);
              return (
                <div
                  key={file.path}
                  className="flex items-center justify-between text-[12px] mono px-2 py-1 rounded bg-[var(--srf)] border border-[var(--bdr)]"
                >
                  <span className="flex items-center gap-2 truncate">
                    <File
                      size={12}
                      style={{ color: ignored ? "#94a3b8" : "var(--acc)" }}
                    />
                    <span className={ignored ? "line-through text-slate-400" : ""}>
                      {file.path}
                    </span>
                  </span>
                  {ignored ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-sans font-bold flex items-center gap-1">
                      {file.name.startsWith(".env") ? "🔒 Secret (.env)" : "Excluded (.gitignore)"}
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-sans font-bold">
                      Staged
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Commit Message Input */}
        <div className="space-y-1.5">
          <label
            className="text-[11px] font-bold uppercase"
            style={{ color: "var(--t2)" }}
          >
            Commit Message
          </label>
          <Inp
            placeholder="e.g. feat: implement algorithm pipelines & fullstack preview"
            value={commitMessage}
            onChange={(e) => onChangeCommitMessage(e.target.value)}
          />
        </div>

        {/* Branch Input */}
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1.5">
            <label
              className="text-[11px] font-bold uppercase"
              style={{ color: "var(--t2)" }}
            >
              Target Branch
            </label>
            <div className="relative">
              <Inp
                value={commitBranch}
                onChange={(e) => onChangeCommitBranch(e.target.value)}
                placeholder="main"
                className="pl-8"
              />
              <GitBranch
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t3)] pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div
          className="flex justify-end gap-2 pt-2 border-t"
          style={{ borderColor: "var(--bdr)" }}
        >
          <Btn2 onClick={onClose} className="h-9 text-[12px]">
            Cancel
          </Btn2>
          <Btn
            onClick={onCommitAndPush}
            disabled={isPushing}
            className="h-9 text-[12px] !px-5"
          >
            {isPushing ? (
              <>
                <RotateCcw size={13} className="animate-spin" /> Pushing to Gitea...
              </>
            ) : (
              <>
                <CloudUpload size={13} /> Push to Gitea Repo
              </>
            )}
          </Btn>
        </div>
      </Card>
    </div>
  );
};

export default SandboxCommitModal;
