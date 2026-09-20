// src/components/modals/ProposeProblemStatementModal.tsx
import React, { useState } from "react";
import { Sparkles, X, AlertCircle, Plus, CheckCircle2 } from "lucide-react";
import { Card, Btn, Btn2 } from "../common/UIPrimitives";
import { problemStatementsApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import type { ProblemStatement } from "../../types";

interface ProposeProblemStatementModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: (statement: ProblemStatement) => void;
}

const DOMAIN_OPTIONS = [
  "AI / Machine Learning",
  "Web3 & Blockchain",
  "Cybersecurity",
  "Cloud & DevOps",
  "Full Stack & SaaS",
  "FinTech",
  "HealthTech & Bio",
  "IoT & Embedded Systems",
  "Mobile & Cross-Platform",
  "Data Engineering",
];

const PRESET_TECHS = [
  "Python",
  "PyTorch",
  "TensorFlow",
  "React",
  "Next.js",
  "Node.js",
  "FastAPI",
  "PostgreSQL",
  "MongoDB",
  "Docker",
  "Kubernetes",
  "Solidity",
  "Rust",
  "Go",
  "TailwindCSS",
  "AWS",
  "TypeScript",
];

export const ProposeProblemStatementModal: React.FC<ProposeProblemStatementModalProps> = ({
  show,
  onClose,
  onCreated,
}) => {
  const showToast = useToast();
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState(DOMAIN_OPTIONS[0]);
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [description, setDescription] = useState("");
  const [expectedOutcomes, setExpectedOutcomes] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [selectedTechs, setSelectedTechs] = useState<string[]>(["React", "Node.js"]);
  const [customTech, setCustomTech] = useState("");
  const [maxSelections, setMaxSelections] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!show) return null;

  const toggleTech = (tech: string) => {
    setSelectedTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const addCustomTech = () => {
    const trimmed = customTech.trim();
    if (trimmed && !selectedTechs.includes(trimmed)) {
      setSelectedTechs((prev) => [...prev, trimmed]);
      setCustomTech("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length < 5) {
      setError("Please provide a title of at least 5 characters.");
      return;
    }
    if (!description.trim() || description.length < 20) {
      setError("Please write a detailed problem description (at least 20 characters).");
      return;
    }
    if (selectedTechs.length === 0) {
      setError("Please select or add at least one relevant technology.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await problemStatementsApi.create({
        title: title.trim(),
        description: description.trim(),
        domain,
        technologies: selectedTechs,
        difficulty,
        expectedOutcomes: expectedOutcomes.trim() || undefined,
        prerequisites: prerequisites.trim() || undefined,
        maxSelections: Number(maxSelections) || 3,
      });

      if (res.data) {
        onCreated(res.data);
        showToast("Problem statement submitted successfully for academic review! 🚀");
        onClose();
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit problem statement proposal.";
      setError(msg);
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[620px] max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: "var(--bdr)" }}>
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg grid place-items-center"
              style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-[15px]">Propose Problem Statement</h3>
              <p className="text-[11px]" style={{ color: "var(--t2)" }}>
                Submit a capstone / hackathon challenge for student teams (Max 3 teams capacity)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[12px]">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-[12px]">
          {/* Title */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
              Problem Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Decentralized Credential Verification System via Zero-Knowledge Proofs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 rounded-xl border px-3 text-[12px] outline-none"
              style={{
                background: "var(--srf2)",
                borderColor: "var(--bdr)",
                color: "var(--t1)",
              }}
              required
            />
          </div>

          {/* Dual Row: Domain & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
                Domain / Category *
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full h-10 rounded-xl border px-3 text-[12px] outline-none"
                style={{
                  background: "var(--srf2)",
                  borderColor: "var(--bdr)",
                  color: "var(--t1)",
                }}
              >
                {DOMAIN_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
                Target Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full h-10 rounded-xl border px-3 text-[12px] outline-none"
                style={{
                  background: "var(--srf2)",
                  borderColor: "var(--bdr)",
                  color: "var(--t1)",
                }}
              >
                <option value="BEGINNER">Beginner (Foundational)</option>
                <option value="INTERMEDIATE">Intermediate (Standard Capstone)</option>
                <option value="ADVANCED">Advanced (Research & High Complexity)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
              Problem Statement & Scope *
            </label>
            <textarea
              rows={4}
              placeholder="Detail the real-world problem, architectural goals, edge cases, and scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border p-3 text-[12px] outline-none resize-none"
              style={{
                background: "var(--srf2)",
                borderColor: "var(--bdr)",
                color: "var(--t1)",
              }}
              required
            />
          </div>

          {/* Expected Outcomes */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
              Expected Deliverables & Outcomes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Functional smart contracts on Sepolia, React frontend dashboard, CI/CD with automated test coverage..."
              value={expectedOutcomes}
              onChange={(e) => setExpectedOutcomes(e.target.value)}
              className="w-full rounded-xl border p-3 text-[12px] outline-none resize-none"
              style={{
                background: "var(--srf2)",
                borderColor: "var(--bdr)",
                color: "var(--t1)",
              }}
            />
          </div>

          {/* Prerequisites */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
              Prerequisites (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Data Structures, Basic Cryptography, Docker..."
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
              className="w-full rounded-xl border p-3 text-[12px] outline-none"
              style={{
                background: "var(--srf2)",
                borderColor: "var(--bdr)",
                color: "var(--t1)",
              }}
            />
          </div>

          {/* Technologies Tag Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
              Recommended Tech Stack *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_TECHS.map((tech) => {
                const active = selectedTechs.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTech(tech)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition"
                    style={{
                      borderColor: active ? "var(--acc)" : "var(--bdr)",
                      background: active ? "rgba(6, 182, 212, 0.15)" : "var(--srf2)",
                      color: active ? "var(--acc)" : "var(--t2)",
                    }}
                  >
                    {tech} {active ? "✓" : "+"}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add other tech (e.g. Neo4j, GraphQL)"
                value={customTech}
                onChange={(e) => setCustomTech(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTech();
                  }
                }}
                className="flex-1 h-8 rounded-xl border px-3 text-[11px] outline-none"
                style={{
                  background: "var(--srf2)",
                  borderColor: "var(--bdr)",
                  color: "var(--t1)",
                }}
              />
              <Btn2 type="button" onClick={addCustomTech} className="!h-8 text-[11px]">
                <Plus size={12} /> Add
              </Btn2>
            </div>
          </div>

          {/* Quota Setting */}
          <div className="p-3 rounded-xl border flex items-center justify-between" style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}>
            <div>
              <div className="font-bold text-[12px]">Max Team Capacity</div>
              <div className="text-[10px]" style={{ color: "var(--t3)" }}>
                Strict limit: A maximum of {maxSelections} student groups can select this idea.
              </div>
            </div>
            <input
              type="number"
              min={1}
              max={5}
              value={maxSelections}
              onChange={(e) => setMaxSelections(Number(e.target.value) || 3)}
              className="w-16 h-8 rounded-lg border text-center font-bold text-[13px] outline-none"
              style={{
                background: "var(--srf)",
                borderColor: "var(--bdr)",
                color: "var(--t1)",
              }}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Btn2 type="button" onClick={onClose} className="w-1/3 justify-center !h-10">
              Cancel
            </Btn2>
            <Btn type="submit" disabled={loading} className="w-2/3 justify-center !h-10">
              {loading ? (
                "Submitting Proposal..."
              ) : (
                <>
                  <CheckCircle2 size={15} /> Submit for Academic Review
                </>
              )}
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProposeProblemStatementModal;
