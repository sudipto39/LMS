import React from "react";
import { Send, X, CheckCircle2 } from "lucide-react";
import { Card, Btn, Btn2 } from "../../../components/common/UIPrimitives";

interface SubmitProjectModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectTitle: string;
}

export const SubmitProjectModal: React.FC<SubmitProjectModalProps> = ({
  show,
  onClose,
  onConfirm,
  projectTitle,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-[460px] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/15 text-cyan-500 grid place-items-center">
              <Send size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base">Submit Final Capstone</h3>
              <p className="text-xs text-[var(--t3)]">Final Evaluation Stage</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-2 text-xs text-[var(--t2)] leading-relaxed">
          <p>
            You are submitting <b className="text-[var(--t1)]">{projectTitle}</b> for final supervisor grading.
          </p>
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 size={13} /> All verified milestone deliverables will be frozen for evaluation.
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--bdr)]">
          <Btn2 onClick={onClose} className="h-9 text-xs">
            Cancel
          </Btn2>
          <Btn
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="h-9 text-xs !px-5"
          >
            Confirm Submission
          </Btn>
        </div>
      </Card>
    </div>
  );
};

export default SubmitProjectModal;
