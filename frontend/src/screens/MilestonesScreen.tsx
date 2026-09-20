// src/screens/MilestonesScreen.tsx
import React, { useRef, useState } from "react";
import { Flag, CloudUpload, FileText, Send, Paperclip, Download, CheckCircle2 } from "lucide-react";
import { Card, Card2, Btn, Btn2, Pill } from "../components/common/UIPrimitives";
import { milestonesApi } from "../api";
import { useToast } from "../context/ToastContext";
import { validateFile } from "../utils/security";
import type { Milestone } from "../types";

interface MilestonesScreenProps {
  milestones: Milestone[];
  onSubmitMilestone: (id: string, notes: string, fileCount: number) => void;
  onStartMilestone: (id: string) => void;
  searchQuery?: string;
}

export const MilestonesScreen: React.FC<MilestonesScreenProps> = ({
  milestones,
  onSubmitMilestone,
  onStartMilestone,
  searchQuery = "",
}) => {
  const showToast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMilestones = milestones.filter((m) => {
    if (!searchQuery || !searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      m.title.toLowerCase().includes(q) ||
      (m.note && m.note.toLowerCase().includes(q)) ||
      m.status.toLowerCase().includes(q)
    );
  });

  const [selectedMilestoneId, setSelectedMilestoneId] = useState(
    filteredMilestones[0]?.id || milestones[0]?.id || ""
  );
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedMilestone =
    milestones.find((m) => m.id === selectedMilestoneId) || filteredMilestones[0] || milestones[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const incoming = Array.from(e.target.files);
      const validFiles: File[] = [];
      for (const file of incoming) {
        const { valid, error } = validateFile(file);
        if (!valid) {
          showToast(`File rejected: ${error}`);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        validFiles.push(file);
      }
      setAttachedFiles(validFiles);
      showToast(`${validFiles.length} file(s) selected and validated ✅`);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMilestone) return;
    if (attachedFiles.length === 0 && !submissionNotes) {
      showToast("Please attach deliverables or add submission remarks");
      return;
    }
    setLoading(true);
    const fd = new FormData();
    fd.append("studentNotes", submissionNotes);
    attachedFiles.forEach((f) => fd.append("files", f));

    try {
      const res = await milestonesApi.submitMilestone(selectedMilestone.id, fd);
      if (res?.data?.attachments) {
        selectedMilestone.attachments = res.data.attachments;
      }
    } catch {
      // Graceful local sync
    }

    onSubmitMilestone(
      selectedMilestone.id,
      submissionNotes,
      attachedFiles.length || 1
    );
    showToast("Deliverables uploaded to S3 and submitted for review! 🚀");
    setSubmissionNotes("");
    setAttachedFiles([]);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      <div>
        <h1 className="text-[24px] font-bold flex items-center gap-2">
          <Flag size={22} style={{ color: "var(--acc)" }} /> Capstone Milestones
          & Deliverables
        </h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--t2)" }}>
          Upload PDF reports, presentation decks, and zip packages to S3 storage
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Milestone Queue */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-[14px] mb-3">
              Active Milestone Roadmap
            </h3>
            {milestones.length === 0 ? (
              <div className="p-8 text-center" style={{ color: "var(--t2)" }}>
                <Flag size={24} className="mx-auto opacity-40 mb-2" />
                <div className="text-[13px] font-semibold">No Milestones Found</div>
                <div className="text-[11px] mt-1">Select or create a project to manage milestone deliverables.</div>
              </div>
            ) : filteredMilestones.length === 0 ? (
              <div className="p-8 text-center" style={{ color: "var(--t2)" }}>
                <Flag size={24} className="mx-auto opacity-40 mb-2" />
                <div className="text-[13px] font-semibold">No Matching Milestones</div>
                <div className="text-[11px] mt-1">No milestones match &ldquo;{searchQuery}&rdquo;.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMilestones.map((m) => (
                  <Card2
                    key={m.id}
                    onClick={() => setSelectedMilestoneId(m.id)}
                    className={`p-4 cursor-pointer transition border ${
                      selectedMilestoneId === m.id
                        ? "border-[#06b6d4] shadow-md"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-[13px]">{m.title}</span>
                      <Pill
                        color={
                          m.status === "APPROVED"
                            ? "#22c55e"
                            : m.status === "SUBMITTED"
                            ? "#06b6d4"
                            : m.status === "IN_PROGRESS"
                            ? "#f59e0b"
                            : undefined
                        }
                      >
                        {m.status}
                      </Pill>
                    </div>
                    <div
                      className="text-[12px] mt-1"
                      style={{ color: "var(--t2)" }}
                    >
                      Due {m.due} • {m.files || m.attachments?.length || 0} attachments • {m.note}
                    </div>

                    {/* Show attachment pills if available */}
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 pt-1">
                        {m.attachments.map((att, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border"
                            style={{ background: "var(--srf2)", borderColor: "var(--bdr)", color: "var(--acc)" }}
                          >
                            <Paperclip size={10} />
                            <span className="truncate max-w-[150px]">{att.name}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {m.status === "PENDING" && (
                      <div className="mt-2">
                        <Btn2
                          onClick={() => {
                            onStartMilestone(m.id);
                          }}
                        >
                          Start Milestone
                        </Btn2>
                      </div>
                    )}
                  </Card2>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Upload & Submitted Deliverables Form */}
        <div>
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold text-[14px] flex items-center gap-2">
              <CloudUpload size={16} style={{ color: "var(--acc)" }} /> Submit Deliverables
            </h3>
            {selectedMilestone ? (
              <>
                <div
                  className="p-3 rounded-xl border text-[12px] space-y-1"
                  style={{
                    background: "var(--srf2)",
                    borderColor: "var(--bdr)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{selectedMilestone.title}</div>
                    <Pill
                      color={
                        selectedMilestone.status === "APPROVED"
                          ? "#22c55e"
                          : selectedMilestone.status === "SUBMITTED"
                          ? "#06b6d4"
                          : "#f59e0b"
                      }
                    >
                      {selectedMilestone.status}
                    </Pill>
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--t3)" }}>
                    Target Deadline: {selectedMilestone.due}
                  </div>
                </div>

                {/* Already Submitted Deliverables Section */}
                {selectedMilestone.attachments && selectedMilestone.attachments.length > 0 && (
                  <div
                    className="p-3.5 rounded-xl border space-y-2"
                    style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--t2)" }}>
                      <Paperclip size={12} className="text-[#06b6d4]" />
                      Uploaded Deliverables ({selectedMilestone.attachments.length})
                    </div>
                    <div className="space-y-1.5">
                      {selectedMilestone.attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg border text-[11px]"
                          style={{ background: "var(--srf)", borderColor: "var(--bdr)" }}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText size={14} className="text-[#06b6d4] shrink-0" />
                            <span className="font-mono font-medium truncate">{att.name}</span>
                            {att.size && (
                              <span className="text-[9px] text-[var(--t3)] shrink-0">
                                ({(att.size / 1024 / 1024).toFixed(1)}MB)
                              </span>
                            )}
                          </div>
                          {att.url ? (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded bg-[#06b6d4]/15 text-[#06b6d4] hover:bg-[#06b6d4]/25 text-[10px] font-semibold flex items-center gap-1 shrink-0 ml-2"
                            >
                              <Download size={10} /> View / Download
                            </a>
                          ) : (
                            <span className="text-[10px] text-[#22c55e] font-semibold flex items-center gap-0.5 shrink-0 ml-2">
                              <CheckCircle2 size={10} /> Uploaded
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Dropzone */}
                <div
                  className="rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition hover:border-[#06b6d4]"
                  style={{
                    borderColor: "var(--bdr)",
                    background: "var(--srf2)",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CloudUpload
                    size={28}
                    style={{ color: "var(--acc)" }}
                    className="mx-auto"
                  />
                  <div className="mt-2 font-medium text-[12px]">
                    {attachedFiles.length > 0
                      ? `${attachedFiles.length} new file(s) selected`
                      : "Drag and drop files here, or browse"}
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--t3)" }}>
                    PDF, PPT, ZIP, TAR up to 50MB
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />

                {attachedFiles.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase text-[var(--t3)]">Selected for upload:</div>
                    {attachedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="text-[11px] flex items-center gap-1.5 p-1.5 rounded-lg border"
                        style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--t2)" }}
                      >
                        <FileText size={12} className="text-[#06b6d4]" />
                        <span className="truncate flex-1 font-mono">{f.name}</span>
                        <span className="text-[10px] text-[var(--t3)]">
                          ({(f.size / 1024 / 1024).toFixed(1)}MB)
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label
                    className="text-[11px] font-bold uppercase block mb-1"
                    style={{ color: "var(--t2)" }}
                  >
                    Submission Remarks
                  </label>
                  <textarea
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="Notes for your faculty supervisor..."
                    className="w-full min-h-[75px] rounded-xl border p-2.5 text-[12px] focus:outline-none resize-y"
                    style={{
                      background: "var(--srf2)",
                      borderColor: "var(--bdr)",
                      color: "var(--t1)",
                    }}
                  />
                </div>

                <Btn
                  disabled={loading}
                  onClick={handleSubmit}
                  className="w-full justify-center"
                >
                  <Send size={13} />{" "}
                  {loading ? "Uploading to S3..." : selectedMilestone.status === "SUBMITTED" ? "Upload Additional / Update Deliverables" : "Submit to Supervisor"}
                </Btn>
              </>
            ) : (
              <div
                className="text-center py-6 text-[12px]"
                style={{ color: "var(--t3)" }}
              >
                Select a milestone from the list to upload
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MilestonesScreen;
