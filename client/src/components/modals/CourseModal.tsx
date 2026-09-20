// src/components/modals/CourseModal.tsx
import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import { Card, Inp, Btn, Btn2 } from "../common/UIPrimitives";
import { coursesApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import type { Course } from "../../types";

interface CourseModalProps {
  show: boolean;
  onClose: () => void;
  onCourseCreated: (course: Course) => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  show,
  onClose,
  onCourseCreated,
}) => {
  const showToast = useToast();
  const [courseForm, setCourseForm] = useState({
    code: "",
    title: "",
    durationYears: 4,
    school: "",
  });

  if (!show) return null;

  const handleCreate = async () => {
    if (!courseForm.code || !courseForm.title) {
      showToast("Course code and title are required");
      return;
    }
    const newC: Course = {
      id: `c${Date.now()}`,
      code: courseForm.code.toUpperCase(),
      title: courseForm.title,
      durationYears: courseForm.durationYears,
      school: courseForm.school || "School of Computing",
      batchCount: 0,
    };
    try {
      await coursesApi.createCourse({
        code: newC.code,
        title: newC.title,
        durationYears: newC.durationYears,
        school: newC.school,
      });
    } catch {
      // Graceful local sync
    }
    onCourseCreated(newC);
    setCourseForm({ code: "", title: "", durationYears: 4, school: "" });
    showToast(`Course "${newC.code}" created successfully`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[440px] p-6 shadow-2xl space-y-4">
        <h3 className="font-bold text-[16px] flex items-center gap-2">
          <BookOpen size={18} style={{ color: "var(--acc)" }} /> Add Degree
          Course
        </h3>
        <div>
          <label
            className="text-[11px] font-bold uppercase"
            style={{ color: "var(--t2)" }}
          >
            Course Code
          </label>
          <Inp
            placeholder="e.g. AI-MTECH"
            value={courseForm.code}
            onChange={(e) =>
              setCourseForm({ ...courseForm, code: e.target.value })
            }
            className="mt-1"
          />
        </div>
        <div>
          <label
            className="text-[11px] font-bold uppercase"
            style={{ color: "var(--t2)" }}
          >
            Course Title
          </label>
          <Inp
            placeholder="e.g. M.Tech Artificial Intelligence"
            value={courseForm.title}
            onChange={(e) =>
              setCourseForm({ ...courseForm, title: e.target.value })
            }
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              className="text-[11px] font-bold uppercase"
              style={{ color: "var(--t2)" }}
            >
              Duration (Years)
            </label>
            <Inp
              type="number"
              value={courseForm.durationYears}
              onChange={(e) =>
                setCourseForm({
                  ...courseForm,
                  durationYears: parseInt(e.target.value) || 4,
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <label
              className="text-[11px] font-bold uppercase"
              style={{ color: "var(--t2)" }}
            >
              School / Dept
            </label>
            <Inp
              placeholder="School of Computing"
              value={courseForm.school}
              onChange={(e) =>
                setCourseForm({ ...courseForm, school: e.target.value })
              }
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Btn2 onClick={onClose} className="flex-1 justify-center">
            Cancel
          </Btn2>
          <Btn onClick={handleCreate} className="flex-1 justify-center">
            Create Course
          </Btn>
        </div>
      </Card>
    </div>
  );
};

export default CourseModal;
