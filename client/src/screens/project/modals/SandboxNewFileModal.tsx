import React from "react";
import { FilePlus, X } from "lucide-react";
import { Card, Btn, Btn2, Inp } from "../../../components/common/UIPrimitives";

interface SandboxNewFileModalProps {
  show: boolean;
  fileName: string;
  onChangeFileName: (name: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

export const SandboxNewFileModal: React.FC<SandboxNewFileModalProps> = ({
  show,
  fileName,
  onChangeFileName,
  onClose,
  onCreate,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-[400px] p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-[14px] flex items-center gap-2">
            <FilePlus size={16} style={{ color: "var(--acc)" }} /> Create New File
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="hover:opacity-75 transition"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase" style={{ color: "var(--t2)" }}>
            File or Folder Path (e.g. src/components/Card.js, utils/api.js, .env)
          </label>
          <Inp
            autoFocus
            placeholder="e.g. src/utils/math.js"
            value={fileName}
            onChange={(e) => onChangeFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCreate();
              if (e.key === "Escape") onClose();
            }}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Btn2 onClick={onClose} className="h-8 text-[12px]">
            Cancel
          </Btn2>
          <Btn onClick={onCreate} className="h-8 text-[12px]">
            Create File
          </Btn>
        </div>
      </Card>
    </div>
  );
};

export default SandboxNewFileModal;
