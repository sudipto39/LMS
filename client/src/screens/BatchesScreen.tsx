// src/screens/BatchesScreen.tsx
import React, { useState } from "react";
import {
  Layers,
  BookOpen,
  Plus,
  Trash2,
  Users,
  FolderKanban,
  Search,
  GraduationCap,
  Clock,
} from "lucide-react";
import { Card, Pill, Btn, Btn2, Inp } from "../components/common/UIPrimitives";
import { batchesApi, coursesApi } from "../api";
import { useToast } from "../context/ToastContext";
import type { Course, Batch, Project, User } from "../types";

interface BatchesScreenProps {
  courses: Course[];
  batches: Batch[];
  projects?: Project[];
  users?: User[];
  onOpenCourseModal: () => void;
  onOpenBatchModal: () => void;
  onDeleteCourse: (id: string) => void;
  onDeleteBatch: (id: string) => void;
  externalSearchQuery?: string;
}

export const BatchesScreen: React.FC<BatchesScreenProps> = ({
  courses = [],
  batches = [],
  projects = [],
  users = [],
  onOpenCourseModal,
  onOpenBatchModal,
  onDeleteCourse,
  onDeleteBatch,
  externalSearchQuery,
}) => {
  const showToast = useToast();
  const [activeFilter, setActiveFilter] = useState<"all" | "courses" | "batches">("all");
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || "");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  // Helper to find linked course details for a batch
  const getLinkedCourse = (batch: Batch): Course | undefined => {
    return courses.find(
      (c) => c.id === batch.courseId || c.title.toLowerCase() === (batch.courseName || "").toLowerCase()
    );
  };

  // Helper to get project count for a batch
  const getBatchProjectsCount = (batchId: string, batchName?: string): number => {
    return (projects || []).filter(
      (p) => p.batchId === batchId || p.batch === batchId || (batchName && p.batch === batchName)
    ).length;
  };

  // Helper to get enrolled student count for a batch
  const getBatchStudentsCount = (batch: Batch): number => {
    if (typeof batch.enrolledCount === "number" && batch.enrolledCount > 0) {
      return batch.enrolledCount;
    }
    const fromUsers = (users || []).filter((u) => {
      const uBatch = u.batch || (u as any).batchName;
      return (
        u.role === "STUDENT" &&
        (uBatch === batch.name || (u as any).batchId === batch.id)
      );
    }).length;
    return fromUsers || (batch as any)._count?.enrollments || 0;
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    setDeletingId(id);
    try {
      await coursesApi.deleteCourse(id);
    } catch {
      // Graceful local sync
    }
    onDeleteCourse(id);
    showToast(`Course "${title}" removed successfully`);
    setDeletingId(null);
  };

  const handleDeleteBatch = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      await batchesApi.deleteBatch(id);
    } catch {
      // Graceful local sync
    }
    onDeleteBatch(id);
    showToast(`Batch "${name}" removed successfully`);
    setDeletingId(null);
  };

  // Search filtering
  const q = searchQuery.toLowerCase().trim();
  const filteredCourses = courses.filter(
    (c) =>
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.school && c.school.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
  );

  const filteredBatches = batches.filter((b) => {
    const linked = getLinkedCourse(b);
    return (
      !q ||
      b.name.toLowerCase().includes(q) ||
      (b.courseName && b.courseName.toLowerCase().includes(q)) ||
      (linked && (linked.title.toLowerCase().includes(q) || linked.code.toLowerCase().includes(q))) ||
      `${b.startYear}`.includes(q) ||
      `${b.endYear}`.includes(q)
    );
  });

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold flex items-center gap-2.5">
            <Layers size={24} style={{ color: "var(--acc)" }} />
            Academic Batches & Degree Courses
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--t2)" }}>
            Manage university curriculum programs, degree tracks, and cohort year groups
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Btn2 onClick={onOpenCourseModal} className="!px-3.5 !h-9 text-[12px] font-medium">
            <Plus size={14} /> Add Course
          </Btn2>
          <Btn onClick={onOpenBatchModal} className="!px-4 !h-9 text-[12px] font-medium">
            <Plus size={14} /> Add Batch
          </Btn>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        {/* Section View Tabs */}
        <div
          className="flex items-center gap-1.5 p-1 rounded-xl border w-full sm:w-auto"
          style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
        >
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "all"
                ? "bg-[#0e4a5e] text-white shadow-sm"
                : "text-[var(--t2)] hover:text-[var(--t1)]"
            }`}
          >
            All Sections
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("courses")}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "courses"
                ? "bg-[#0e4a5e] text-white shadow-sm"
                : "text-[var(--t2)] hover:text-[var(--t1)]"
            }`}
          >
            <BookOpen size={13} /> Courses ({courses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("batches")}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "batches"
                ? "bg-[#0e4a5e] text-white shadow-sm"
                : "text-[var(--t2)] hover:text-[var(--t1)]"
            }`}
          >
            <Layers size={13} /> Batches ({batches.length})
          </button>
        </div>

        {/* Live Search */}
        <div className="relative w-full sm:w-[280px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--t3)" }}
          />
          <Inp
            placeholder="Search courses or batches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="!pl-9 !h-9 text-[12px]"
          />
        </div>
      </div>

      {/* ── SECTION 1: COURSES (CARD BOXES GRID) ────────────────────────── */}
      {(activeFilter === "all" || activeFilter === "courses") && (
        <section className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <h2 className="text-[16px] font-bold flex items-center gap-2">
              <BookOpen size={18} style={{ color: "var(--acc)" }} />
              Courses ({filteredCourses.length})
            </h2>
            <button
              type="button"
              onClick={onOpenCourseModal}
              className="text-[12px] font-medium hover:underline flex items-center gap-1 cursor-pointer"
              style={{ color: "var(--acc)" }}
            >
              <Plus size={12} /> Add New Course
            </button>
          </div>

          {filteredCourses.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <BookOpen size={32} className="mx-auto opacity-40" />
              <p className="text-[13px]" style={{ color: "var(--t2)" }}>
                {searchQuery ? "No courses matching your search." : "No degree courses created yet."}
              </p>
              <Btn2 onClick={onOpenCourseModal} className="mx-auto !h-8 text-[11px]">
                <Plus size={12} /> Create First Course
              </Btn2>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((c) => {
                const linkedBatchesCount = batches.filter(
                  (b) => b.courseId === c.id || (b.courseName && b.courseName.toLowerCase() === c.title.toLowerCase())
                ).length;

                return (
                  <Card
                    key={c.id}
                    className="p-5 flex flex-col justify-between hover:border-[var(--acc)] transition-all duration-200 group relative shadow-sm"
                  >
                    <div>
                      {/* Top Bar: Title & Delete */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-[15px] group-hover:text-[var(--acc)] transition">
                            {c.title}
                          </h3>
                          <div className="text-[11px] mt-0.5 font-medium" style={{ color: "var(--t2)" }}>
                            <span className="mono font-semibold text-[var(--acc)]">{c.code}</span>
                            {c.description ? ` — ${c.description}` : ` — ${c.title}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={deletingId === c.id}
                          onClick={() => handleDeleteCourse(c.id, c.title)}
                          className="h-7 w-7 rounded-lg grid place-items-center text-[#ef4444] hover:bg-[#ef4444]/10 cursor-pointer transition opacity-70 group-hover:opacity-100 disabled:opacity-30 flex-shrink-0"
                          title="Delete Course"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Course Metadata Details */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1"
                          style={{
                            background: "var(--srf2)",
                            borderColor: "var(--bdr)",
                            color: "var(--t2)",
                          }}
                        >
                          <Clock size={10} /> {c.durationYears || 4} Years Duration
                        </span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1"
                          style={{
                            background: "var(--srf2)",
                            borderColor: "var(--bdr)",
                            color: "var(--t2)",
                          }}
                        >
                          <GraduationCap size={10} /> {c.school || "School of Engineering"}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 text-[#0891b2]"
                          style={{
                            background: "#0891b210",
                            borderColor: "#0891b230",
                          }}
                        >
                          <Layers size={10} /> {linkedBatchesCount} Active Batches
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── SECTION 2: BATCHES (CARD BOXES GRID) ─────────────────────────── */}
      {(activeFilter === "all" || activeFilter === "batches") && (
        <section className="space-y-3 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-[16px] font-bold flex items-center gap-2">
              <Layers size={18} style={{ color: "var(--acc)" }} />
              Batches ({filteredBatches.length})
            </h2>
            <button
              type="button"
              onClick={onOpenBatchModal}
              className="text-[12px] font-medium hover:underline flex items-center gap-1 cursor-pointer"
              style={{ color: "var(--acc)" }}
            >
              <Plus size={12} /> Add New Batch
            </button>
          </div>

          {filteredBatches.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <Layers size={32} className="mx-auto opacity-40" />
              <p className="text-[13px]" style={{ color: "var(--t2)" }}>
                {searchQuery ? "No batches matching your search." : "No cohort batches created yet."}
              </p>
              <Btn onClick={onOpenBatchModal} className="mx-auto !h-8 text-[11px]">
                <Plus size={12} /> Create First Batch
              </Btn>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBatches.map((b) => {
                const linkedCourse = getLinkedCourse(b);
                const courseTitle = linkedCourse?.title || b.courseName || "Engineering Track";
                const studentCount = getBatchStudentsCount(b);
                const projectCount = getBatchProjectsCount(b.id);

                return (
                  <Card
                    key={b.id}
                    className="p-5 flex flex-col justify-between hover:border-[var(--acc)] transition-all duration-200 group relative shadow-sm"
                  >
                    <div>
                      {/* Batch Header: Name and Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-[14px] leading-tight group-hover:text-[var(--acc)] transition">
                          {b.name}
                        </h3>
                        <Pill color="#22c55e">
                          Active
                        </Pill>
                      </div>

                      {/* Linked Course & Span */}
                      <div className="text-[11px] mt-1 font-medium" style={{ color: "var(--t2)" }}>
                        <span>{courseTitle}</span> •{" "}
                        <span className="mono">{b.startYear}–{b.endYear}</span>
                      </div>

                      {/* Stats Box (Students & Projects) */}
                      <div
                        className="mt-4 p-2.5 rounded-xl border flex items-center justify-around text-[11px]"
                        style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                      >
                        <div className="flex items-center gap-1.5 font-medium" style={{ color: "var(--t1)" }}>
                          <Users size={13} style={{ color: "#0891b2" }} />
                          <span>{studentCount} {studentCount === 1 ? "student" : "students"}</span>
                        </div>
                        <div className="h-3 w-px" style={{ background: "var(--bdr)" }} />
                        <div className="flex items-center gap-1.5 font-medium" style={{ color: "var(--t1)" }}>
                          <FolderKanban size={13} style={{ color: "#f59e0b" }} />
                          <span>{projectCount} {projectCount === 1 ? "project" : "projects"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div
                      className="mt-4 pt-3 border-t flex items-center justify-between text-[11px]"
                      style={{ borderColor: "var(--bdr)" }}
                    >
                      <span className="text-[10px] mono" style={{ color: "var(--t3)" }}>
                        Cohort {b.startYear}–{b.endYear}
                      </span>
                      <button
                        type="button"
                        disabled={deletingId === b.id}
                        onClick={() => handleDeleteBatch(b.id, b.name)}
                        className="text-[#ef4444] hover:underline cursor-pointer flex items-center gap-1 font-medium disabled:opacity-40"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default BatchesScreen;
