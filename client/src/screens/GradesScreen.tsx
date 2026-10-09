// src/screens/GradesScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Award,
  Download,
  Save,
  Search,
  BookOpen,
  Eye,
  Edit3,
  RefreshCw,
} from "lucide-react";
import { Card, Pill, Btn, Btn2 } from "../components/common/UIPrimitives";
import { evaluationsApi, coursesApi } from "../api";
import {
  exportUniversityPracticalRegisterCsv,
  exportUniversityPracticalRegisterXlsx,
} from "../utils/excelExport";
import { StudentPracticalEvaluationModal } from "../components/modals/StudentPracticalEvaluationModal";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import type {
  ContinuousEvaluationRow,
  CourseEvaluationMetadata,
} from "../types/evaluation";
import type { Project, Course } from "../types";

interface GradesScreenProps {
  projects?: Project[];
  onOpenGradeModal?: (project: Project) => void;
  onExportGradesExcel?: () => void;
}

export const GradesScreen: React.FC<GradesScreenProps> = ({
  /* eslint-disable @typescript-eslint/no-unused-vars */
  projects = [],
  onOpenGradeModal: _onOpenGradeModal,
  onExportGradesExcel: _onExportGradesExcel,
  /* eslint-enable @typescript-eslint/no-unused-vars */
}) => {
  const showToast = useToast();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluations, setEvaluations] = useState<ContinuousEvaluationRow[]>([]);
  const [metadata, setMetadata] = useState<CourseEvaluationMetadata | null>(null);
  const [search, setSearch] = useState("");
  const [showFullExpDetails, setShowFullExpDetails] = useState(false);
  const [activeModalStudent, setActiveModalStudent] = useState<ContinuousEvaluationRow | null>(null);
  const [showArchivedCapstone, setShowArchivedCapstone] = useState(false);

  // Load course evaluation register from backend
  const loadEvaluations = async (targetCode?: string) => {
    const code = targetCode || selectedCourseCode;
    if (!code) return;
    setLoading(true);
    try {
      const res = await evaluationsApi.getCourseEvaluations(code);
      if (res && res.data) {
        setEvaluations(res.data);
        setMetadata(res.metadata);
      } else {
        setEvaluations([]);
        setMetadata(null);
      }
    } catch {
      setEvaluations([]);
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initCourses = async () => {
      setLoading(true);
      try {
        const res = await coursesApi.getAllCourses();
        const list = res.data || [];
        setCourses(list);
        const firstCode = list[0]?.code || list[0]?.id || "";
        setSelectedCourseCode(firstCode);
        if (firstCode) {
          const evalRes = await evaluationsApi.getCourseEvaluations(firstCode);
          if (evalRes && evalRes.data) {
            setEvaluations(evalRes.data);
            setMetadata(evalRes.metadata);
          }
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setLoading(false);
      }
    };
    initCourses();
  }, []);

  // Filtered rows
  const filteredEvaluations = useMemo(() => {
    if (!search.trim()) return evaluations;
    const q = search.toLowerCase();
    return evaluations.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.roll.toLowerCase().includes(q) ||
        e.programme.toLowerCase().includes(q)
    );
  }, [evaluations, search]);

  // Real-time Class Analytics
  const analytics = useMemo(() => {
    if (evaluations.length === 0) {
      return { count: 0, avgInternal: 0, avgEndSem: 0, avgFinal: 0, highest: 0 };
    }
    const totalInternalSum = evaluations.reduce((s, e) => s + (e.totalInternal || 0), 0);
    const totalEndSemSum = evaluations.reduce((s, e) => s + (e.totalEndSem || 0), 0);
    const totalFinalSum = evaluations.reduce((s, e) => s + (e.finalMarks || 0), 0);
    const maxMark = Math.max(...evaluations.map((e) => e.finalMarks || 0));

    return {
      count: evaluations.length,
      avgInternal: Math.round((totalInternalSum / evaluations.length) * 10) / 10,
      avgEndSem: Math.round((totalEndSemSum / evaluations.length) * 10) / 10,
      avgFinal: Math.round((totalFinalSum / evaluations.length) * 10) / 10,
      highest: maxMark,
    };
  }, [evaluations]);

  // Inline numeric edit handler for table
  const handleInlineChange = (
    index: number,
    field: "internalViva" | "endSemLabTest" | "endSemViva",
    valueStr: string
  ) => {
    const max = field === "internalViva" ? 10 : field === "endSemLabTest" ? 30 : 20;
    const val = Math.max(0, Math.min(max, parseFloat(valueStr) || 0));

    setEvaluations((prev) => {
      const copy = [...prev];
      const row = { ...copy[index], [field]: val };
      // Recalculate totals
      const expTotal = Number(row.experimentsTotal) || 0;
      const intViva = field === "internalViva" ? val : Number(row.internalViva) || 0;
      const labTest = field === "endSemLabTest" ? val : Number(row.endSemLabTest) || 0;
      const endViva = field === "endSemViva" ? val : Number(row.endSemViva) || 0;

      row.totalInternal = Math.min(50, expTotal + intViva);
      row.totalEndSem = Math.min(50, labTest + endViva);
      row.finalMarks = Math.min(100, row.totalInternal + row.totalEndSem);

      copy[index] = row;
      return copy;
    });
  };

  // Bulk save all records to server
  const handleBulkSave = async () => {
    const code = metadata?.courseCode || selectedCourseCode;
    if (!code) {
      showToast("No course selected to save evaluations");
      return;
    }
    setSaving(true);
    try {
      await evaluationsApi.bulkUpdateEvaluations(code, evaluations);
      showToast("All continuous evaluations saved to database! ✅");
    } catch {
      showToast("Saved locally. Ensure server is online.");
    } finally {
      setSaving(false);
    }
  };

  // Trigger University Excel Export (.xlsx)
  const handleExportXlsx = async () => {
    try {
      await exportUniversityPracticalRegisterXlsx(evaluations, metadata || undefined);
      showToast("Downloaded official University Practical Evaluation register (.xlsx) 📊");
    } catch {
      showToast("Failed to export Excel register");
    }
  };

  // Trigger University CSV Export
  const handleExportCsv = () => {
    exportUniversityPracticalRegisterCsv(evaluations, metadata || undefined);
    showToast("Downloaded official University Practical Evaluation register (.csv) 📊");
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6">
      {/* ─── UNIVERSITY COURSE BANNER ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border" style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {courses.length > 0 && (
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-[11px] font-semibold" style={{ color: "var(--t2)" }}>Course:</span>
                <select
                  value={selectedCourseCode}
                  onChange={(e) => {
                    const newCode = e.target.value;
                    setSelectedCourseCode(newCode);
                    loadEvaluations(newCode);
                  }}
                  className="text-[12px] font-medium px-2 py-1 rounded-lg border bg-[var(--srf)] text-[var(--t1)] border-[var(--bdr)] focus:outline-none focus:ring-1 focus:ring-[#06b6d4]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.code || c.id}>
                      {c.code ? `[${c.code}] ` : ""}{c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {metadata?.programme && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20">
                {metadata.programme}
              </span>
            )}
            {metadata?.semester && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Semester {metadata.semester}
              </span>
            )}
            {metadata?.session && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {metadata.session}
              </span>
            )}
          </div>
          <h1 className="text-[22px] sm:text-[25px] font-extrabold flex items-center gap-2 tracking-tight">
            <Award className="text-[#06b6d4]" size={26} />
            {metadata?.courseName || courses.find((c) => c.code === selectedCourseCode || c.id === selectedCourseCode)?.title || "Continuous Evaluation Register"}
            {(metadata?.courseCode || selectedCourseCode) && (
              <span className="text-[14px] font-mono font-medium px-2 py-0.5 rounded-md border" style={{ color: "var(--t2)", borderColor: "var(--bdr)" }}>
                {metadata?.courseCode || selectedCourseCode}
              </span>
            )}
          </h1>
          <p className="text-[12px]" style={{ color: "var(--t2)" }}>
            Instructor: <span className="font-semibold text-[var(--t1)]">{metadata?.instructor || user?.name || "Faculty Instructor"}</span> • Continuous Evaluation (50M) + End-Semester Exam (50M) = <strong className="text-green-500">100 Marks Total</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Btn2 onClick={loadEvaluations} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </Btn2>
          <Btn2 onClick={() => setShowFullExpDetails(!showFullExpDetails)}>
            <Eye size={13} /> {showFullExpDetails ? "Compact Matrix" : "Expand 10 Experiments"}
          </Btn2>
          <Btn2 onClick={handleExportXlsx} className="border-green-500/30 text-green-400 hover:border-green-500">
            <Download size={13} /> Export University Register (.xlsx)
          </Btn2>
          <Btn2 onClick={handleExportCsv} className="border-cyan-500/30 text-cyan-400 hover:border-cyan-500">
            <Download size={13} /> Export CSV
          </Btn2>
          <Btn onClick={handleBulkSave} disabled={saving} className="bg-gradient-to-r from-[#06b6d4] to-[#2563eb]">
            <Save size={13} /> {saving ? "Saving..." : "Save Register"}
          </Btn>
        </div>
      </div>

      {/* ─── SUMMARY STATS CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3.5 border" style={{ borderColor: "var(--bdr)" }}>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--t2)" }}>
            Enrolled Students
          </div>
          <div className="text-[20px] font-black mt-1 text-[#06b6d4]">
            {analytics.count}
          </div>
          <div className="text-[10px]" style={{ color: "var(--t2)" }}>Verified university roster</div>
        </Card>

        <Card className="p-3.5 border" style={{ borderColor: "var(--bdr)" }}>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--t2)" }}>
            Avg Internal
          </div>
          <div className="text-[20px] font-black mt-1 text-blue-400">
            {analytics.avgInternal} <span className="text-[11px] font-normal text-[var(--t2)]">/ 50</span>
          </div>
          <div className="text-[10px]" style={{ color: "var(--t2)" }}>10 Exps (40) + Viva (10)</div>
        </Card>

        <Card className="p-3.5 border" style={{ borderColor: "var(--bdr)" }}>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--t2)" }}>
            Avg End Semester
          </div>
          <div className="text-[20px] font-black mt-1 text-purple-400">
            {analytics.avgEndSem} <span className="text-[11px] font-normal text-[var(--t2)]">/ 50</span>
          </div>
          <div className="text-[10px]" style={{ color: "var(--t2)" }}>Lab Test (30) + Viva (20)</div>
        </Card>

        <Card className="p-3.5 border" style={{ borderColor: "var(--bdr)" }}>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--t2)" }}>
            Class Average
          </div>
          <div className="text-[20px] font-black mt-1 text-green-400">
            {analytics.avgFinal} <span className="text-[11px] font-normal text-[var(--t2)]">/ 100</span>
          </div>
          <div className="text-[10px]" style={{ color: "var(--t2)" }}>H = D + G Official Total</div>
        </Card>

        <Card className="p-3.5 border" style={{ borderColor: "var(--bdr)" }}>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--t2)" }}>
            Highest Score
          </div>
          <div className="text-[20px] font-black mt-1 text-amber-400">
            {analytics.highest} <span className="text-[11px] font-normal text-[var(--t2)]">/ 100</span>
          </div>
          <div className="text-[10px]" style={{ color: "var(--t2)" }}>Batch top performer</div>
        </Card>
      </div>

      {/* ─── SEARCH & FILTER BAR ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-3 text-[var(--t2)]" />
          <input
            type="text"
            placeholder="Search student roll, name or programme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-[12px] rounded-xl border focus:outline-none focus:border-[#06b6d4]"
            style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--t1)" }}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-[11px]" style={{ color: "var(--t2)" }}>
          <span>Showing <strong>{filteredEvaluations.length}</strong> of {evaluations.length} students</span>
          <span className="mx-1">•</span>
          <button
            onClick={() => setShowArchivedCapstone(!showArchivedCapstone)}
            className="text-[11px] underline hover:text-[#06b6d4] transition cursor-pointer"
          >
            {showArchivedCapstone ? "Hide NAAC Capstone Archive" : "Show NAAC Capstone Archive"}
          </button>
        </div>
      </div>

      {/* ─── OFFICIAL UNIVERSITY PRACTICAL EVALUATION REGISTER TABLE ─────────── */}
      <Card className="p-0 overflow-hidden border shadow-lg" style={{ borderColor: "var(--bdr)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left border-collapse min-w-[1100px]">
            <thead>
              {/* Row 1: High Level Rubric Categories */}
              <tr style={{ background: "var(--srf2)", color: "var(--t2)", borderColor: "var(--bdr)" }} className="border-b">
                <th className="p-2.5 font-bold border-r" style={{ borderColor: "var(--bdr)" }} colSpan={4}>
                  Student Identification
                </th>
                <th
                  className="p-2.5 font-bold text-center border-r bg-[#06b6d4]/10 text-[#06b6d4]"
                  style={{ borderColor: "var(--bdr)" }}
                  colSpan={showFullExpDetails ? 23 : 3}
                >
                  Continuous Internal Evaluation (Max 50 Marks)
                </th>
                <th
                  className="p-2.5 font-bold text-center border-r bg-purple-500/10 text-purple-400"
                  style={{ borderColor: "var(--bdr)" }}
                  colSpan={3}
                >
                  End-Semester Exam (Max 50 Marks)
                </th>
                <th
                  className="p-2.5 font-bold text-center bg-green-500/10 text-green-400 border-r"
                  style={{ borderColor: "var(--bdr)" }}
                >
                  Grand Total
                </th>
                <th className="p-2.5 font-bold text-center">Action</th>
              </tr>

              {/* Row 2: Detailed Columns */}
              <tr style={{ background: "var(--srf)", color: "var(--t1)", borderColor: "var(--bdr)" }} className="border-b text-[10px] uppercase font-bold">
                <th className="p-2 border-r w-10 text-center" style={{ borderColor: "var(--bdr)" }}>SL</th>
                <th className="p-2 border-r" style={{ borderColor: "var(--bdr)" }}>Roll No</th>
                <th className="p-2 border-r min-w-[140px]" style={{ borderColor: "var(--bdr)" }}>Student Name</th>
                <th className="p-2 border-r w-20" style={{ borderColor: "var(--bdr)" }}>Prog</th>

                {/* 10 Experiments Breakdown if Expanded */}
                {showFullExpDetails ? (
                  Array.from({ length: 10 }).map((_, idx) => (
                    <React.Fragment key={idx}>
                      <th className="p-1 border-r text-center bg-cyan-500/5 min-w-[36px]" style={{ borderColor: "var(--bdr)" }} title={`Exp ${idx + 1} Note Book (Max 2)`}>
                        E{idx + 1}-NB
                      </th>
                      <th className="p-1 border-r text-center bg-cyan-500/5 min-w-[36px]" style={{ borderColor: "var(--bdr)" }} title={`Exp ${idx + 1} Practical Performance (Max 2)`}>
                        E{idx + 1}-PP
                      </th>
                    </React.Fragment>
                  ))
                ) : null}

                <th className="p-2 border-r text-center w-20 bg-cyan-500/10" style={{ borderColor: "var(--bdr)" }} title="Sum of Note Book + Prac Perf across 10 experiments">
                  Exp (40)
                </th>
                <th className="p-2 border-r text-center w-24 bg-cyan-500/10" style={{ borderColor: "var(--bdr)" }} title="Continuous Viva Voce">
                  Viva (10)
                </th>
                <th className="p-2 border-r text-center w-24 font-black bg-[#06b6d4]/20 text-[#06b6d4]" style={{ borderColor: "var(--bdr)" }}>
                  Internal (50)
                </th>

                <th className="p-2 border-r text-center w-28 bg-purple-500/10" style={{ borderColor: "var(--bdr)" }} title="Lab Test and/or Mini Project">
                  Lab Test (30)
                </th>
                <th className="p-2 border-r text-center w-24 bg-purple-500/10" style={{ borderColor: "var(--bdr)" }} title="End-Sem Viva Voce">
                  Viva (20)
                </th>
                <th className="p-2 border-r text-center w-24 font-black bg-purple-500/20 text-purple-300" style={{ borderColor: "var(--bdr)" }}>
                  End Sem (50)
                </th>

                <th className="p-2 border-r text-center w-24 font-black bg-green-500/20 text-green-400" style={{ borderColor: "var(--bdr)" }}>
                  Total (100)
                </th>
                <th className="p-2 text-center w-20">Edit</th>
              </tr>
            </thead>

            <tbody>
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={showFullExpDetails ? 32 : 12} className="p-8 text-center" style={{ color: "var(--t2)" }}>
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map((row, idx) => (
                  <tr
                    key={row.studentId || row.roll}
                    className="border-b transition hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: "var(--bdr)" }}
                  >
                    <td className="p-2 text-center border-r font-mono" style={{ borderColor: "var(--bdr)" }}>
                      {row.slNo || idx + 1}
                    </td>
                    <td className="p-2 font-mono font-semibold text-[#06b6d4] border-r" style={{ borderColor: "var(--bdr)" }}>
                      {row.roll}
                    </td>
                    <td className="p-2 font-semibold border-r" style={{ borderColor: "var(--bdr)" }}>
                      {row.name}
                    </td>
                    <td className="p-2 text-center border-r text-[10px]" style={{ borderColor: "var(--bdr)", color: "var(--t2)" }}>
                      {row.programme}
                    </td>

                    {/* 10 Experiments inline display if expanded */}
                    {showFullExpDetails &&
                      Array.from({ length: 10 }).map((_, eIdx) => {
                        const exp = row.experiments?.find((x) => x.exp === eIdx + 1);
                        return (
                          <React.Fragment key={eIdx}>
                            <td className="p-1 text-center border-r text-[10px] font-mono" style={{ borderColor: "var(--bdr)" }}>
                              {exp?.notebook ?? 0}
                            </td>
                            <td className="p-1 text-center border-r text-[10px] font-mono" style={{ borderColor: "var(--bdr)" }}>
                              {exp?.performance ?? 0}
                            </td>
                          </React.Fragment>
                        );
                      })}

                    {/* Exp Total (40) */}
                    <td className="p-2 text-center border-r font-mono font-semibold" style={{ borderColor: "var(--bdr)" }}>
                      {Math.round(Number(row.experimentsTotal || 0) * 10) / 10}
                    </td>

                    {/* Continuous Viva (10) Input */}
                    <td className="p-1.5 text-center border-r" style={{ borderColor: "var(--bdr)" }}>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="10"
                        value={row.internalViva ?? 0}
                        onChange={(e) => handleInlineChange(idx, "internalViva", e.target.value)}
                        className="w-16 h-7 text-center rounded border font-mono font-bold text-[11px] focus:outline-none focus:border-[#06b6d4]"
                        style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                      />
                    </td>

                    {/* Total Internal (50) */}
                    <td className="p-2 text-center border-r font-mono font-bold bg-[#06b6d4]/10 text-[#06b6d4]" style={{ borderColor: "var(--bdr)" }}>
                      {Math.round(Number(row.totalInternal || 0) * 10) / 10}
                    </td>

                    {/* Lab Test / Mini Project (30) Input */}
                    <td className="p-1.5 text-center border-r" style={{ borderColor: "var(--bdr)" }}>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="30"
                        value={row.endSemLabTest ?? 0}
                        onChange={(e) => handleInlineChange(idx, "endSemLabTest", e.target.value)}
                        className="w-16 h-7 text-center rounded border font-mono font-bold text-[11px] focus:outline-none focus:border-purple-500"
                        style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                      />
                    </td>

                    {/* End-Sem Viva (20) Input */}
                    <td className="p-1.5 text-center border-r" style={{ borderColor: "var(--bdr)" }}>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="20"
                        value={row.endSemViva ?? 0}
                        onChange={(e) => handleInlineChange(idx, "endSemViva", e.target.value)}
                        className="w-16 h-7 text-center rounded border font-mono font-bold text-[11px] focus:outline-none focus:border-purple-500"
                        style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                      />
                    </td>

                    {/* Total End Sem (50) */}
                    <td className="p-2 text-center border-r font-mono font-bold bg-purple-500/10 text-purple-400" style={{ borderColor: "var(--bdr)" }}>
                      {Math.round(Number(row.totalEndSem || 0) * 10) / 10}
                    </td>

                    {/* Final Grade (100) */}
                    <td className="p-2 text-center border-r font-mono font-black text-[13px] bg-green-500/10 text-green-400" style={{ borderColor: "var(--bdr)" }}>
                      {Math.round(Number(row.finalMarks || 0) * 10) / 10}
                    </td>

                    {/* Action Button */}
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => setActiveModalStudent(row)}
                        className="h-7 px-2.5 rounded-lg bg-[#06b6d4]/10 hover:bg-[#06b6d4]/20 text-[#06b6d4] font-bold text-[10px] flex items-center justify-center gap-1 mx-auto transition cursor-pointer border border-[#06b6d4]/30"
                        title="Open full 10-experiment scorecard modal"
                      >
                        <Edit3 size={11} /> Grade
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── MODAL: FULL 10-EXPERIMENT SCORECARD ─────────────────────────────── */}
      <StudentPracticalEvaluationModal
        show={Boolean(activeModalStudent)}
        onClose={() => setActiveModalStudent(null)}
        evaluation={activeModalStudent}
        onSaved={(updated) => {
          setEvaluations((prev) =>
            prev.map((e) =>
              e.studentId === updated.studentId || e.roll === updated.roll
                ? updated
                : e
            )
          );
        }}
      />

      {/* =====================================================================
          NAAC CAPSTONE PROJECT GRADES (PRESERVED & ARCHIVED)
          Kept for future accreditation cycles and project evaluation reference.
         ===================================================================== */}
      {showArchivedCapstone && (
        <div className="space-y-3 pt-6 border-t" style={{ borderColor: "var(--bdr)" }}>
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-amber-400" />
            <h2 className="font-bold text-[16px] text-amber-400">
              NAAC Capstone Project Evaluation Register (Archived Reference)
            </h2>
          </div>
          <p className="text-[12px]" style={{ color: "var(--t2)" }}>
            These records contain legacy letter grades and rubric checklists from previous capstone project evaluations.
          </p>
          <Card className="p-4 border opacity-85" style={{ borderColor: "var(--bdr)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ background: "var(--srf2)", color: "var(--t2)" }}>
                    <th className="text-left p-2.5">Project Title</th>
                    <th className="text-left p-2.5">Student Lead</th>
                    <th className="text-left p-2.5">Phase</th>
                    <th className="text-left p-2.5">Grade</th>
                    <th className="text-left p-2.5">Evaluation Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-[var(--t2)]">
                        No legacy capstone projects recorded.
                      </td>
                    </tr>
                  ) : (
                    projects.map((p) => (
                      <tr key={p.id} className="border-t" style={{ borderColor: "var(--bdr)" }}>
                        <td className="p-2.5 font-semibold">{p.title}</td>
                        <td className="p-2.5">{p.team?.[0]?.name || "Student"}</td>
                        <td className="p-2.5">Phase {p.phase}</td>
                        <td className="p-2.5">
                          {p.grade ? <Pill color="#22c55e">Grade {p.grade}</Pill> : <Pill color="#f59e0b">Ungraded</Pill>}
                        </td>
                        <td className="p-2.5" style={{ color: "var(--t2)" }}>
                          {p.feedback || "Pending final evaluation remarks."}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GradesScreen;
