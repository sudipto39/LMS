import React, { useState } from "react";
import { MessageCircle, RotateCcw, Send, Check } from "lucide-react";
import { Card, Btn, Btn2, Pill, Inp } from "../../../components/common/UIPrimitives";
import type { Feedback } from "../../../types";

interface ProjectFeedbackTabProps {
  liveFeedbacks: Feedback[];
  loadingFeedback: boolean;
  onPostFeedback: (text: string) => Promise<void> | void;
  onSendReply: (feedbackId: string, text: string) => Promise<void> | void;
  onToggleResolve: (feedbackId: string) => Promise<void> | void;
}

export const ProjectFeedbackTab: React.FC<ProjectFeedbackTabProps> = ({
  liveFeedbacks,
  loadingFeedback,
  onPostFeedback,
  onSendReply,
  onToggleResolve,
}) => {
  const [newFeedbackText, setNewFeedbackText] = useState("");
  const [feedbackReplyText, setFeedbackReplyText] = useState<Record<string, string>>({});

  const handlePost = async () => {
    if (!newFeedbackText.trim()) return;
    const text = newFeedbackText.trim();
    setNewFeedbackText("");
    await onPostFeedback(text);
  };

  const handleReply = async (feedbackId: string) => {
    const text = feedbackReplyText[feedbackId]?.trim();
    if (!text) return;
    setFeedbackReplyText((prev) => ({ ...prev, [feedbackId]: "" }));
    await onSendReply(feedbackId, text);
  };

  return (
    <div className="space-y-4 w-full max-w-[1400px] mx-auto">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-[13px] flex items-center gap-2">
            <MessageCircle size={15} style={{ color: "var(--acc)" }} /> Leave
            Supervisor Feedback or Question
          </div>
          {loadingFeedback && (
            <span className="text-[10px] text-[#06b6d4] flex items-center gap-1">
              <RotateCcw size={10} className="animate-spin" /> Syncing board...
            </span>
          )}
        </div>
        <textarea
          value={newFeedbackText}
          onChange={(e) => setNewFeedbackText(e.target.value)}
          placeholder="Write constructive feedback, suggestions or questions..."
          className="w-full min-h-[90px] rounded-xl border p-3 text-[13px] focus:outline-none resize-y"
          style={{
            background: "var(--srf2)",
            borderColor: "var(--bdr)",
            color: "var(--t1)",
          }}
        />
        <div className="mt-3 flex justify-between items-center">
          <span className="text-[11px]" style={{ color: "var(--t3)" }}>
            Supports Markdown formatting • Live database thread
          </span>
          <Btn onClick={handlePost}>
            <Send size={13} /> Post Feedback
          </Btn>
        </div>
      </Card>

      <div className="space-y-3">
        {liveFeedbacks.length === 0 ? (
          <Card className="p-8 text-center" style={{ color: "var(--t3)" }}>
            <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-[13px]">No feedback threads yet.</p>
            <p className="text-[11px] mt-1">Start a discussion with your supervisor or team.</p>
          </Card>
        ) : (
          liveFeedbacks.map((fb) => (
            <Card key={fb.id} className="p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={
                    fb.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      fb.author || "User"
                    )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`
                  }
                  className="h-8 w-8 rounded-full object-cover"
                  alt=""
                />
                <div>
                  <div className="font-semibold text-[13px] flex items-center gap-2">
                    {fb.author}{" "}
                    <Pill
                      color={
                        fb.role === "SUPERVISOR" ? "#f59e0b" : "#0891b2"
                      }
                    >
                      {fb.role}
                    </Pill>
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--t3)" }}>
                    {fb.time}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleResolve(fb.id)}
                  className={`ml-auto text-[11px] px-2.5 py-1 rounded-full border flex items-center gap-1 font-semibold cursor-pointer ${
                    fb.resolved
                      ? "bg-[#22c55e]/15 border-[#22c55e]/30 text-[#22c55e]"
                      : ""
                  }`}
                  style={
                    !fb.resolved
                      ? { borderColor: "var(--bdr)", color: "var(--t3)" }
                      : {}
                  }
                >
                  <Check size={12} /> {fb.resolved ? "Resolved" : "Mark Resolved"}
                </button>
              </div>
              <p className="text-[13px] pl-10" style={{ color: "var(--t1)" }}>
                {fb.content}
              </p>

              {fb.replies && fb.replies.length > 0 && (
                <div
                  className="ml-10 space-y-2 border-l-2 pl-4 pt-2"
                  style={{ borderColor: "var(--bdr)" }}
                >
                  {fb.replies.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-2.5 rounded-xl"
                      style={{ background: "var(--srf2)" }}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            rep.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              rep.author || "User"
                            )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`
                          }
                          className="h-5 w-5 rounded-full object-cover"
                          alt=""
                        />
                        <span className="text-[11px] font-bold">
                          {rep.author}
                        </span>
                        <span
                          className="text-[9px]"
                          style={{ color: "var(--t3)" }}
                        >
                          {rep.time}
                        </span>
                      </div>
                      <p className="text-[12px] mt-1 pl-7">{rep.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="ml-10 flex gap-2 pt-2">
                <Inp
                  placeholder="Reply to this thread..."
                  value={feedbackReplyText[fb.id] || ""}
                  onChange={(e) =>
                    setFeedbackReplyText({
                      ...feedbackReplyText,
                      [fb.id]: e.target.value,
                    })
                  }
                  className="h-9 text-[12px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleReply(fb.id);
                    }
                  }}
                />
                <Btn2
                  onClick={() => handleReply(fb.id)}
                  className="flex-shrink-0"
                >
                  Reply
                </Btn2>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectFeedbackTab;
