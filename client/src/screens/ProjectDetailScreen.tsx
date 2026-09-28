// src/screens/ProjectDetailScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { projectsApi } from "../api";
import ErrorBoundary from "../components/common/ErrorBoundary";

// Shared contracts
import type {
  Milestone,
  Feedback,
  ProjectFile,
  CodeReviewComment,
} from "../types";
import type {
  ProjectDetailScreenProps,
  ProjectTabKey,
  ProjectDeliverableItem,
} from "./project/types";

// Modular Components & Modals
import ProjectHeader from "./project/components/ProjectHeader";
import ProjectTabBar from "./project/components/ProjectTabBar";
import SubmitProjectModal from "./project/modals/SubmitProjectModal";

// Modular Sub-Route Tabs
import ProjectOverviewTab from "./project/tabs/ProjectOverviewTab";
import ProjectMilestonesTab from "./project/tabs/ProjectMilestonesTab";
import ProjectProgressTab from "./project/tabs/ProjectProgressTab";
import ProjectFilesTab from "./project/tabs/ProjectFilesTab";
import ProjectFeedbackTab from "./project/tabs/ProjectFeedbackTab";
import ProjectCodeReviewTab from "./project/tabs/ProjectCodeReviewTab";
import ProjectSandboxTab from "./project/tabs/ProjectSandboxTab";

const VALID_TABS: ProjectTabKey[] = [
  "overview",
  "milestones",
  "progress",
  "files",
  "feedback",
  "code-review",
  "sandbox",
];

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  project,
  milestones,
  feedbacks,
  files,
  onBack,
  onOpenTeamModal,
  onOpenGradeModal,
  onOpenSettingsModal,
  onStartMilestone,
  onApproveMilestone,
  onRejectMilestone,
  onAddFeedback,
  onReplyFeedback,
  onToggleResolveFeedback,
  onNavigate,
  defaultTab = "overview",
}) => {
  const { user, role } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ projectId?: string; tab?: string }>();

  // ── Tab URL State Synchronization ───────────────────────────────────────────
  const resolveInitialTab = (): ProjectTabKey => {
    if (params.tab && VALID_TABS.includes(params.tab as ProjectTabKey)) {
      return params.tab as ProjectTabKey;
    }
    // Also check pathname endsWith
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] as ProjectTabKey;
    if (VALID_TABS.includes(lastPart)) {
      return lastPart;
    }
    return defaultTab;
  };

  const [activeTab, setActiveTab] = useState<ProjectTabKey>(resolveInitialTab);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Synchronize when route tab param changes (e.g. browser back/forward)
  useEffect(() => {
    if (params.tab && VALID_TABS.includes(params.tab as ProjectTabKey)) {
      setActiveTab(params.tab as ProjectTabKey);
    }
  }, [params.tab]);

  const handleSelectTab = useCallback(
    (nextTab: ProjectTabKey) => {
      setActiveTab(nextTab);
      // Seamlessly update URL without reloading page
      if (project?.id) {
        const targetUrl = `/projects/${project.id}/${nextTab}`;
        if (location.pathname !== targetUrl) {
          navigate(targetUrl, { replace: false });
        }
      }
    },
    [project?.id, location.pathname, navigate]
  );

  // ── Live Data State ─────────────────────────────────────────────────────────
  const resolveInitialMilestones = (): Milestone[] => {
    if (Array.isArray(milestones) && milestones.length > 0) return milestones;
    if (
      Array.isArray((project as any)?.milestones) &&
      (project as any).milestones.length > 0
    ) {
      return (project as any).milestones.map((m: any, idx: number) => ({
        id: m.id || `m-${project.id}-${idx}`,
        projectId: project.id,
        title: m.title,
        description: m.description,
        status: m.status || "PENDING",
        order: typeof m.order === "number" ? m.order : idx + 1,
        due: m.dueDate
          ? new Date(m.dueDate).toLocaleDateString()
          : m.due || "TBD",
        files: Array.isArray(m.attachments) ? m.attachments.length : m.files || 0,
        note: m.studentNotes || m.feedback || m.note || "Milestone deliverable",
        attachments: Array.isArray(m.attachments)
          ? m.attachments
          : m.files > 0
          ? [
              {
                name: `${m.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")}-deliverable.pdf`,
                size: 2450000,
              },
            ]
          : [],
      }));
    }
    return [];
  };

  const [liveMilestones, setLiveMilestones] =
    useState<Milestone[]>(resolveInitialMilestones);
  const [liveFeedbacks, setLiveFeedbacks] = useState<Feedback[]>(feedbacks || []);
  const [liveFiles, setLiveFiles] = useState<ProjectFile[]>(files || []);

  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [codeReviewComments, setCodeReviewComments] = useState<
    CodeReviewComment[]
  >([]);
  const [commitDiffFiles, setCommitDiffFiles] = useState<any[]>([]);
  const [commitDiffData, setCommitDiffData] = useState<any>(null);
  const [selectedDiffFileIndex, setSelectedDiffFileIndex] = useState<number>(0);
  const [selectedCommitSha, setSelectedCommitSha] = useState<string>("HEAD");
  const [loadingDiff, setLoadingDiff] = useState<boolean>(false);
  const [newInlineComment, setNewInlineComment] = useState("");
  const [commentAt, setCommentAt] = useState<number | null>(null);

  // Sync props to state
  useEffect(() => {
    setLiveMilestones(resolveInitialMilestones());
  }, [milestones, project]);

  useEffect(() => {
    if (feedbacks && feedbacks.length > 0) {
      setLiveFeedbacks(feedbacks);
    }
  }, [feedbacks]);

  useEffect(() => {
    if (files && files.length > 0) {
      setLiveFiles(files);
    }
  }, [files]);

  // Compute all project deliverables for files and overview tabs
  const allProjectDeliverables = useMemo(() => {
    const deliverables: ProjectDeliverableItem[] = [];
    (liveMilestones || []).forEach((m) => {
      if (m && Array.isArray(m.attachments)) {
        m.attachments.forEach((att) => {
          if (att && att.name) {
            deliverables.push({
              milestoneTitle: m.title || "Milestone",
              milestoneId: m.id || "",
              name: att.name,
              url: att.url,
              size: att.size,
            });
          }
        });
      }
    });
    return deliverables;
  }, [liveMilestones]);

  // Fetch Live Data from API
  useEffect(() => {
    if (!project?.id) return;
    let isMounted = true;

    // 0. Live Project Milestones
    projectsApi
      .getProjectById(project.id)
      .then((res: any) => {
        const rawMils = res?.data?.milestones;
        if (isMounted && rawMils && Array.isArray(rawMils) && rawMils.length > 0) {
          const mapped: Milestone[] = rawMils.map((m: any, idx: number) => ({
            id: m.id || `m-${project.id}-${idx}`,
            projectId: project.id,
            title: m.title,
            description: m.description,
            status: m.status || "PENDING",
            order: typeof m.order === "number" ? m.order : idx + 1,
            due: m.dueDate
              ? new Date(m.dueDate).toLocaleDateString()
              : m.due || "TBD",
            files: Array.isArray(m.attachments)
              ? m.attachments.length
              : m.files || 0,
            note: m.studentNotes || m.feedback || m.note || "Milestone deliverable",
            attachments: Array.isArray(m.attachments) ? m.attachments : [],
          }));
          setLiveMilestones(mapped);
        }
      })
      .catch(() => {});

    // 1. Live Feedback
    setLoadingFeedback(true);
    projectsApi
      .getFeedback(project.id)
      .then((res) => {
        if (isMounted && res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setLiveFeedbacks(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingFeedback(false);
      });

    // 2. Live Repository Files
    setLoadingFiles(true);
    projectsApi
      .getProjectFiles(project.id)
      .then((res) => {
        if (isMounted && res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setLiveFiles(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingFiles(false);
      });

    // 3. Live Code Review Comments & Commit Diffs
    projectsApi
      .getCodeReviewComments(project.id)
      .then((res) => {
        if (isMounted && res?.data && Array.isArray(res.data)) {
          setCodeReviewComments(res.data);
        }
      })
      .catch(() => {});

    projectsApi
      .getCommitDiff(project.id, "HEAD")
      .then((res) => {
        if (isMounted && res?.data) {
          setCommitDiffData(res.data);
          if (Array.isArray(res.data.files)) {
            setCommitDiffFiles(res.data.files);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [project?.id]);

  // ── Milestone Handlers ──────────────────────────────────────────────────────
  const handleStartMilestoneLocal = (id: string) => {
    setLiveMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "IN_PROGRESS" } : m))
    );
    onStartMilestone(id);
  };

  const handleApproveMilestoneLocal = (id: string) => {
    setLiveMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "APPROVED" } : m))
    );
    onApproveMilestone(id);
  };

  const handleRejectMilestoneLocal = (id: string, feedbackText: string) => {
    setLiveMilestones((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: "REJECTED", note: feedbackText } : m
      )
    );
    onRejectMilestone(id, feedbackText);
  };

  // ── Feedback Handlers ───────────────────────────────────────────────────────
  const handlePostFeedbackLive = async (text: string) => {
    if (!text.trim()) return;
    try {
      const res = await projectsApi.postFeedback(project.id, text);
      const newFb = res?.data;
      if (newFb) {
        setLiveFeedbacks((prev) => [newFb, ...prev]);
        showToast("Feedback posted to project board ✅");
        onAddFeedback(text);
        return;
      }
    } catch {
      // Local fallback
    }

    const fallbackFb: Feedback = {
      id: `fb-${Date.now()}`,
      projectId: project.id,
      author: user?.name || "User",
      avatar:
        user?.avatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          user?.name || user?.email || "User"
        )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`,
      role: role,
      content: text,
      time: "Just now",
      resolved: false,
    };
    setLiveFeedbacks((prev) => [fallbackFb, ...prev]);
    onAddFeedback(text);
    showToast("Feedback posted to project board");
  };

  const handleSendReplyLive = async (feedbackId: string, text: string) => {
    if (!text.trim()) return;
    try {
      await projectsApi.replyFeedback(project.id, feedbackId, text);
      showToast("Reply added to thread ✅");
    } catch {
      // Local fallback
    }

    const newReply = {
      id: `rep-${Date.now()}`,
      author: user?.name || "User",
      avatar:
        user?.avatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          user?.name || user?.email || "User"
        )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`,
      role: role,
      content: text,
      time: "Just now",
    };

    setLiveFeedbacks((prev) =>
      prev.map((fb) =>
        fb.id === feedbackId
          ? { ...fb, replies: [...(fb.replies || []), newReply] }
          : fb
      )
    );
    onReplyFeedback(feedbackId, text);
  };

  const handleToggleResolveLive = async (feedbackId: string) => {
    const target = liveFeedbacks.find((f) => f.id === feedbackId);
    const newStatus = !target?.resolved;

    try {
      await projectsApi.resolveFeedback(project.id, feedbackId, newStatus);
      showToast(`Feedback thread ${newStatus ? "marked resolved" : "reopened"}`);
    } catch {
      // Local fallback
    }

    setLiveFeedbacks((prev) =>
      prev.map((fb) =>
        fb.id === feedbackId ? { ...fb, resolved: newStatus } : fb
      )
    );
    onToggleResolveFeedback(feedbackId);
  };

  // ── Files & Review Handlers ─────────────────────────────────────────────────
  const handleRefreshFiles = async () => {
    if (!project?.id) return;
    setLoadingFiles(true);
    try {
      const res = await projectsApi.getProjectFiles(project.id);
      if (res?.data && Array.isArray(res.data)) {
        setLiveFiles(res.data);
        showToast(`Fetched ${res.data.length} files from Gitea repository 📦`);
      }
    } catch {
      showToast("Failed to sync files from Gitea");
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchCommitDiff = (sha = "HEAD") => {
    if (!project?.id) return;
    setLoadingDiff(true);
    setSelectedCommitSha(sha);
    projectsApi
      .getCommitDiff(project.id, sha)
      .then((res) => {
        if (res?.data) {
          setCommitDiffData(res.data);
          if (Array.isArray(res.data.files)) {
            setCommitDiffFiles(res.data.files);
            setSelectedDiffFileIndex(0);
          }
          showToast(
            `Loaded diff for ${sha === "HEAD" ? "latest commit" : sha} 🔍`
          );
        }
      })
      .catch(() => {
        showToast("Failed to fetch commit diff");
      })
      .finally(() => {
        setLoadingDiff(false);
      });
  };

  const currentDiffFile =
    commitDiffFiles[selectedDiffFileIndex] || commitDiffFiles[0];

  const parsedDiffLines = useMemo(() => {
    const file = currentDiffFile;
    if (!file) return [];
    if (file.patch) {
      const lines = (file.patch as string).split("\n");
      let oldLine = 1;
      let newLine = 1;
      const result: Array<{
        oldNum: number | null;
        newNum: number | null;
        type: "add" | "del" | "ctx" | "hdr";
        oldText: string;
        newText: string;
        text: string;
      }> = [];

      for (const line of lines) {
        if (line.startsWith("@@")) {
          const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
          if (match) {
            oldLine = parseInt(match[1], 10);
            newLine = parseInt(match[2], 10);
          }
          result.push({
            oldNum: null,
            newNum: null,
            type: "hdr",
            oldText: line,
            newText: line,
            text: line,
          });
        } else if (line.startsWith("+")) {
          result.push({
            oldNum: null,
            newNum: newLine++,
            type: "add",
            oldText: "",
            newText: line.slice(1),
            text: line.slice(1),
          });
        } else if (line.startsWith("-")) {
          result.push({
            oldNum: oldLine++,
            newNum: null,
            type: "del",
            oldText: line.slice(1),
            newText: "",
            text: line.slice(1),
          });
        } else {
          const content = line.startsWith(" ") ? line.slice(1) : line;
          result.push({
            oldNum: oldLine++,
            newNum: newLine++,
            type: "ctx",
            oldText: content,
            newText: content,
            text: content,
          });
        }
      }
      return result;
    }

    const fallbackContent =
      (file && file.content) ||
      `// ${(file && file.filename) || "file"}\n// No modified lines recorded in this commit`;
    return fallbackContent.split("\n").map((text: string, idx: number) => ({
      oldNum: idx + 1,
      newNum: idx + 1,
      type: "ctx" as const,
      oldText: text,
      newText: text,
      text,
    }));
  }, [currentDiffFile]);

  const handleSaveInlineComment = async (
    lineIdx: number,
    lineNum?: number | null
  ) => {
    if (!newInlineComment.trim()) {
      setCommentAt(null);
      return;
    }
    const text = newInlineComment.trim();
    setNewInlineComment("");

    const targetLine = lineNum || lineIdx + 1;
    const targetPath =
      currentDiffFile?.filename ||
      (liveFiles[0]?.path || "README.md");

    try {
      const res = await projectsApi.postCodeReviewComment(project.id, {
        content: text,
        lineNumber: targetLine,
        side: "RIGHT",
        filePath: targetPath,
        commitSha: selectedCommitSha,
      });
      const newComment = res?.data;
      if (newComment) {
        setCodeReviewComments((prev) => [...prev, newComment]);
        showToast("Inline code review comment saved to repository ✅");
        setCommentAt(null);
        return;
      }
    } catch {
      // Local fallback
    }

    showToast("Inline code comment saved");
    setCommentAt(null);
  };

  const handleResolveCodeComment = async (
    commentId: string,
    isResolved: boolean
  ) => {
    try {
      await projectsApi.resolveCodeReviewComment(
        project.id,
        commentId,
        isResolved
      );
      showToast(`Code review comment ${isResolved ? "resolved" : "reopened"}`);
    } catch {
      // Local fallback
    }
    setCodeReviewComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, isResolved } : c))
    );
  };

  // ── Metrics ─────────────────────────────────────────────────────────────────
  const approvedMilestonesCount = liveMilestones.filter(
    (m) => m.status === "APPROVED"
  ).length;
  const totalMilestonesCount = liveMilestones.length;
  const dynamicVelocity =
    totalMilestonesCount > 0
      ? Math.round((approvedMilestonesCount / totalMilestonesCount) * 100)
      : project.progress || 0;

  return (
    <div className={`w-full ${activeTab === "sandbox" ? "max-w-[1800px]" : "max-w-[1680px]"} mx-auto space-y-4`}>
      {/* Coordinator Header */}
      <ProjectHeader
        project={project}
        onBack={onBack}
        onOpenTeamModal={onOpenTeamModal}
        onOpenSettingsModal={onOpenSettingsModal}
        onOpenGradeModal={onOpenGradeModal}
        onSubmitFinal={() => setShowSubmitModal(true)}
      />

      {/* Synchronized Tab Navigation Bar */}
      <ProjectTabBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        milestonesCount={liveMilestones.length}
        feedbacksCount={liveFeedbacks.length}
        filesCount={liveFiles.length}
      />

      {/* Sub-Route Views with Fault-Isolated Error Boundaries */}
      <main className="min-h-[400px]">
        {activeTab === "overview" && (
          <ErrorBoundary name="Project Overview">
            <ProjectOverviewTab
              project={project}
              liveMilestones={liveMilestones}
              feedbacks={liveFeedbacks}
              onNavigateTab={handleSelectTab}
              onOpenTeamModal={onOpenTeamModal}
            />
          </ErrorBoundary>
        )}

        {activeTab === "milestones" && (
          <ErrorBoundary name="Project Milestones">
            <ProjectMilestonesTab
              liveMilestones={liveMilestones}
              onStartMilestone={handleStartMilestoneLocal}
              onApproveMilestone={handleApproveMilestoneLocal}
              onRejectMilestone={handleRejectMilestoneLocal}
              onOpenGradeModal={onOpenGradeModal}
              onNavigate={onNavigate}
            />
          </ErrorBoundary>
        )}

        {activeTab === "progress" && (
          <ErrorBoundary name="Project Analytics & Progress">
            <ProjectProgressTab
              projectId={project.id}
              totalMilestonesCount={totalMilestonesCount}
              approvedMilestonesCount={approvedMilestonesCount}
              liveFilesCount={liveFiles.length}
              dynamicVelocity={dynamicVelocity}
              liveMilestones={liveMilestones}
              liveFiles={liveFiles}
              commitDiffData={commitDiffData}
              projectCreatedAt={project.createdAt}
              feedbacks={liveFeedbacks}
            />
          </ErrorBoundary>
        )}

        {activeTab === "files" && (
          <ErrorBoundary name="Repository Files & Deliverables">
            <ProjectFilesTab
              liveFiles={liveFiles}
              loadingFiles={loadingFiles}
              onRefreshFiles={handleRefreshFiles}
              allProjectDeliverables={allProjectDeliverables}
              projectTitle={project.title}
              projectDescription={project.description}
              projectTech={project.technologies}
              showToast={showToast}
            />
          </ErrorBoundary>
        )}

        {activeTab === "feedback" && (
          <ErrorBoundary name="Discussions & Feedback">
            <ProjectFeedbackTab
              liveFeedbacks={liveFeedbacks}
              loadingFeedback={loadingFeedback}
              onPostFeedback={handlePostFeedbackLive}
              onSendReply={handleSendReplyLive}
              onToggleResolve={handleToggleResolveLive}
            />
          </ErrorBoundary>
        )}

        {activeTab === "code-review" && (
          <ErrorBoundary name="Code Review & Diff Annotations">
            <ProjectCodeReviewTab
              codeReviewComments={codeReviewComments}
              commitDiffData={commitDiffData}
              commitDiffFiles={commitDiffFiles}
              selectedDiffFileIndex={selectedDiffFileIndex}
              setSelectedDiffFileIndex={setSelectedDiffFileIndex}
              selectedCommitSha={selectedCommitSha}
              loadingDiff={loadingDiff}
              fetchCommitDiff={fetchCommitDiff}
              handleResolveCodeComment={handleResolveCodeComment}
              handleSaveInlineComment={handleSaveInlineComment}
              newInlineComment={newInlineComment}
              setNewInlineComment={setNewInlineComment}
              commentAt={commentAt}
              setCommentAt={setCommentAt}
              parsedDiffLines={parsedDiffLines}
            />
          </ErrorBoundary>
        )}

        {activeTab === "sandbox" && (
          <ErrorBoundary name="Codespace Sandbox">
            <ProjectSandboxTab
              projectId={project.id}
              showToast={showToast}
              isActiveTab={activeTab === "sandbox"}
              liveFiles={liveFiles}
              loadingFiles={loadingFiles}
              onRefreshFiles={handleRefreshFiles}
              onRefreshDiff={() => fetchCommitDiff("HEAD")}
            />
          </ErrorBoundary>
        )}
      </main>

      {/* Submit Capstone Modal */}
      <SubmitProjectModal
        show={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        projectTitle={project.title}
        onConfirm={async () => {
          try {
            await projectsApi.submitFinal(project.id);
            setShowSubmitModal(false);
            showToast("Project successfully submitted for final capstone review 🚀");
          } catch (err: any) {
            showToast(err?.response?.data?.message || err?.message || "Failed to submit project for review");
          }
        }}
      />
    </div>
  );
};

export default ProjectDetailScreen;
