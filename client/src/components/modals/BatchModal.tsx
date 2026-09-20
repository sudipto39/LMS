// src/components/modals/BatchModal.tsx
import React, { useState } from "react";
import { Layers } from "lucide-react";
import { Card, Inp, Btn, Btn2 } from "../common/UIPrimitives";
import { batchesApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import type { Course, Batch } from "../../types";

interface BatchModalProps {
  show: boolean;
  onClose: () => void;
  courses: Course[];
  onBatchCreated: (batch: Batch) => void;
}

export const BatchModal: React.FC<BatchModalProps> = ({
  show,
  onClose,
  courses,
  onBatchCreated,
}) => {
  const showToast = useToast();
  const [batchForm, setBatchForm] = useState({
    name: "",
    courseId: courses[0]?.id || "",
    startYear: 2023,
    endYear: 2027,
  });

  React.useEffect(() => {
    setBatchForm((prev) => ({
      ...prev,
      courseId: prev.courseId || courses[0]?.id || "",
    }));
  }, [courses]);

  if (!show) return null;

  const handleCreate = async () => {
    if (!batchForm.name) {
      showToast("Batch name is required");
      return;
    }
    const linkedCourse = courses.find((c) => c.id === batchForm.courseId);
    const newB: Batch = {
      id: `b${Date.now()}`,
      name: batchForm.name,
      courseId: batchForm.courseId,
      courseName: linkedCourse?.title || "Engineering",
      startYear: batchForm.startYear,
      endYear: batchForm.endYear,
      enrolledCount: 0,
      isActive: true,
    };
    try {
      await batchesApi.createBatch({
        name: newB.name,
        courseId: newB.courseId,
        startYear: newB.startYear,
        endYear: newB.endYear,
      });
    } catch {
      // Graceful local sync
    }
    onBatchCreated(newB);
    setBatchForm({
      name: "",
      courseId: courses[0]?.id || "c1",
      startYear: 2023,
      endYear: 2027,
    });
    showToast(`Batch "${newB.name}" created`);
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
          <Layers size={18} style={{ color: "var(--acc)" }} /> Add Academic
          Batch
        </h3>
        <div>
          <label
            className="text-[11px] font-bold uppercase"
            style={{ color: "var(--t2)" }}
          >
            Batch Name
          </label>
          <Inp
            placeholder="e.g. B.Tech CSE (2024–2028)"
            value={batchForm.name}
            onChange={(e) =>
              setBatchForm({ ...batchForm, name: e.target.value })
            }
            className="mt-1"
          />
        </div>
        <div>
          <label
            className="text-[11px] font-bold uppercase"
            style={{ color: "var(--t2)" }}
          >
            Linked Course
          </label>
          <select
            value={batchForm.courseId}
            onChange={(e) =>
              setBatchForm({ ...batchForm, courseId: e.target.value })
            }
            className="mt-1 w-full h-11 rounded-xl border px-3 text-[12px]"
            style={{
              background: "var(--srf2)",
              borderColor: "var(--bdr)",
              color: "var(--t1)",
            }}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.code})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              className="text-[11px] font-bold uppercase"
              style={{ color: "var(--t2)" }}
            >
              Start Year
            </label>
            <Inp
              type="number"
              value={batchForm.startYear}
              onChange={(e) =>
                setBatchForm({
                  ...batchForm,
                  startYear: parseInt(e.target.value) || 2023,
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
              End Year
            </label>
            <Inp
              type="number"
              value={batchForm.endYear}
              onChange={(e) =>
                setBatchForm({
                  ...batchForm,
                  endYear: parseInt(e.target.value) || 2027,
                })
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
            Create Batch
          </Btn>
        </div>
      </Card>
    </div>
  );
};

export default BatchModal;
