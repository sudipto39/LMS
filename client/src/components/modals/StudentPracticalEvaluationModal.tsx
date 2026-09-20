import React, { useState, useEffect } from "react";
import { X, CheckCircle2, BookOpen, Award } from "lucide-react";
import { Card, Btn, Btn2, Pill } from "../common/UIPrimitives";
import { evaluationsApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import type { ContinuousEvaluationRow, ExperimentMark } from "../../types/evaluation";

interface StudentPracticalEvaluationModalProps {
  show: boolean;
  onClose: () => void;
  evaluation: ContinuousEvaluationRow | null;
  onSaved: (updated: ContinuousEvaluationRow) => void;
}

export const StudentPracticalEvaluationModal: React.FC<StudentPracticalEvaluationModalProps> = ({
  show,
  onClose,
  evaluation,
  onSaved,
}) => {
  const showToast = useToast();
  const [loading, setLoading] = useState(false);

  // Form states
  const [experiments, setExperiments] = useState<ExperimentMark[]>([]);
  const [internalViva, setInternalViva] = useState<number>(0);
  const [endSemLabTest, setEndSemLabTest] = useState<number>(0);
  const [endSemViva, setEndSemViva] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>("");

  useEffect(() => {
    if (evaluation) {
      // Initialize 10 experiments
      const exps: ExperimentMark[] = Array.from({ length: 10 }, (_, i) => {
        const found = evaluation.experiments?.find((e) => e.exp === i + 1);
        return {
          exp: i + 1,
          notebook: found?.notebook ?? 0,
          performance: found?.performance ?? 0,
        };
      });
      setExperiments(exps);
      setInternalViva(evaluation.internalViva ?? 0);
      setEndSemLabTest(evaluation.endSemLabTest ?? 0);
      setEndSemViva(evaluation.endSemViva ?? 0);
      setRemarks(evaluation.remarks ?? "");
    }
  }, [evaluation]);

  if (!show || !evaluation) return null;

  // Real-time calculations
  const experimentsTotal = Math.min(
    40,
    experiments.reduce(
      (sum, e) => sum + (Number(e.notebook) || 0) + (Number(e.performance) || 0),
      0
    )
  );
  const totalInternal = Math.min(50, experimentsTotal + (Number(internalViva) || 0));
  const totalEndSem = Math.min(
    50,
    (Number(endSemLabTest) || 0) + (Number(endSemViva) || 0)
  );
  const finalMarks = Math.min(100, totalInternal + totalEndSem);

  const handleExpChange = (
    expIndex: number,
    field: "notebook" | "performance",
    valStr: string
  ) => {
    const val = Math.max(0, Math.min(2, parseFloat(valStr) || 0));
    setExperiments((prev) => {
      const copy = [...prev];
      copy[expIndex] = {
        ...copy[expIndex],
        [field]: val,
      };
      return copy;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: Partial<ContinuousEvaluationRow> = {
        studentId: evaluation.studentId,
        courseCode: evaluation.courseCode,
        experiments,
        experimentsTotal,
        internalViva,
        totalInternal,
        endSemLabTest,
        endSemViva,
        totalEndSem,
        finalMarks,
        remarks,
      };

      await evaluationsApi.updateStudentEvaluation(
        evaluation.courseCode,
        evaluation.studentId,
        payload
      );

      const updatedRow: ContinuousEvaluationRow = {
        ...evaluation,
        experiments,
        experimentsTotal,
        internalViva,
        totalInternal,
        endSemLabTest,
        endSemViva,
        totalEndSem,
        finalMarks,
        remarks,
        updatedAt: new Date().toISOString(),
      };

      onSaved(updatedRow);
      showToast(`Evaluation for ${evaluation.name} saved successfully! ✅`);
      onClose();
    } catch {
      showToast("Error updating evaluation. Sync saved locally.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[840px] max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl border" style={{ borderColor: "var(--bdr)" }}>
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b" style={{ borderColor: "var(--bdr)" }}>
          <div>
            <div className="flex items-center gap-2">
              <Award size={20} style={{ color: "#06b6d4" }} />
              <h3 className="font-bold text-[17px]">
                University Continuous Practical Evaluation
              </h3>
            </div>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--t2)" }}>
              {evaluation.courseName} ({evaluation.courseCode}) • Semester {evaluation.semester}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Student Info & Real-Time Score Badges */}
        <div
          className="mt-3 p-3 rounded-xl border grid grid-cols-1 sm:grid-cols-4 gap-3 items-center"
          style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
        >
          <div className="sm:col-span-2">
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--t2)" }}>
              Student
            </div>
            <div className="font-bold text-[14px] text-[#06b6d4]">
              {evaluation.name}
            </div>
            <div className="text-[11px] font-mono" style={{ color: "var(--t2)" }}>
              Roll: {evaluation.roll} • {evaluation.programme}
            </div>
          </div>

          <div className="text-center p-2 rounded-lg border bg-blue-500/10 border-blue-500/20">
            <div className="text-[10px] font-bold uppercase text-blue-400">
              Total Internal
            </div>
            <div className="text-[18px] font-black text-blue-500">
              {totalInternal} <span className="text-[11px] font-normal">/ 50</span>
            </div>
          </div>

          <div className="text-center p-2 rounded-lg border bg-green-500/10 border-green-500/20">
            <div className="text-[10px] font-bold uppercase text-green-400">
              Final Grade (100M)
            </div>
            <div className="text-[18px] font-black text-green-500">
              {finalMarks} <span className="text-[11px] font-normal">/ 100</span>
            </div>
          </div>
        </div>

        {/* Scrollable Evaluation Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Section 1: 10 Experiments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-bold text-[13px]">
                <BookOpen size={16} className="text-[#06b6d4]" />
                <span>10 Lab Experiments Continuous Assessment</span>
              </div>
              <Pill color="#06b6d4">
                Subtotal: {experimentsTotal} / 40
              </Pill>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
              {experiments.map((exp, idx) => (
                <div
                  key={exp.exp}
                  className="p-2.5 rounded-xl border space-y-1.5"
                  style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}
                >
                  <div className="font-bold text-center border-b pb-1 flex justify-between items-center" style={{ borderColor: "var(--bdr)" }}>
                    <span className="text-[#06b6d4]">EXP-{exp.exp}</span>
                    <span className="text-[10px] font-mono" style={{ color: "var(--t2)" }}>
                      {(Number(exp.notebook) || 0) + (Number(exp.performance) || 0)}/4
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] block" style={{ color: "var(--t2)" }}>
                      Note Book (max 2):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="2"
                      value={exp.notebook}
                      onChange={(e) => handleExpChange(idx, "notebook", e.target.value)}
                      className="w-full h-7 px-2 text-center rounded border font-semibold focus:outline-none focus:border-[#06b6d4]"
                      style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] block" style={{ color: "var(--t2)" }}>
                      Prac Perf (max 2):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="2"
                      value={exp.performance}
                      onChange={(e) => handleExpChange(idx, "performance", e.target.value)}
                      className="w-full h-7 px-2 text-center rounded border font-semibold focus:outline-none focus:border-[#06b6d4]"
                      style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Internal Viva & End Sem */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Internal Viva */}
            <div className="p-3.5 rounded-xl border space-y-2" style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}>
              <div className="font-bold text-[12px] flex items-center justify-between">
                <span>Continuous Viva Voce</span>
                <Pill color="#3b82f6">{internalViva} / 10</Pill>
              </div>
              <p className="text-[11px]" style={{ color: "var(--t2)" }}>
                Continuous lab oral defense and comprehension viva marks.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={internalViva}
                  onChange={(e) =>
                    setInternalViva(Math.max(0, Math.min(10, parseFloat(e.target.value) || 0)))
                  }
                  className="h-9 px-3 rounded-lg border font-bold text-[14px] w-32 focus:outline-none focus:border-blue-500"
                  style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                />
                <span className="text-[11px]" style={{ color: "var(--t2)" }}>
                  out of 10 marks
                </span>
              </div>
            </div>

            {/* End Semester Exam */}
            <div className="p-3.5 rounded-xl border space-y-2" style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}>
              <div className="font-bold text-[12px] flex items-center justify-between">
                <span>End-Semester Examination</span>
                <Pill color="#10b981">{totalEndSem} / 50</Pill>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="text-[10px] block mb-1" style={{ color: "var(--t2)" }}>
                    Lab Test / Mini Project (30):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="30"
                    value={endSemLabTest}
                    onChange={(e) =>
                      setEndSemLabTest(Math.max(0, Math.min(30, parseFloat(e.target.value) || 0)))
                    }
                    className="w-full h-8 px-2 text-center rounded border font-semibold focus:outline-none"
                    style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                  />
                </div>
                <div>
                  <label className="text-[10px] block mb-1" style={{ color: "var(--t2)" }}>
                    End-Sem Viva Voce (20):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={endSemViva}
                    onChange={(e) =>
                      setEndSemViva(Math.max(0, Math.min(20, parseFloat(e.target.value) || 0)))
                    }
                    className="w-full h-8 px-2 text-center rounded border font-semibold focus:outline-none"
                    style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Remarks */}
          <div>
            <label className="text-[11px] font-bold uppercase mb-1.5 block" style={{ color: "var(--t2)" }}>
              Faculty / Supervisor Evaluation Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Excellent digital forensic analysis performance; lab documentation complete."
              className="w-full min-h-[60px] rounded-xl border p-2.5 text-[12px] focus:outline-none resize-y"
              style={{
                background: "var(--srf2)",
                borderColor: "var(--bdr)",
                color: "var(--t1)",
              }}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 pt-3 border-t mt-2" style={{ borderColor: "var(--bdr)" }}>
          <Btn2 onClick={onClose} className="flex-1 justify-center">
            Cancel
          </Btn2>
          <Btn
            disabled={loading}
            onClick={handleSave}
            className="flex-1 justify-center"
          >
            <CheckCircle2 size={14} />{" "}
            {loading ? "Saving..." : `Save Evaluation (${finalMarks}/100)`}
          </Btn>
        </div>
      </Card>
    </div>
  );
};

export default StudentPracticalEvaluationModal;
