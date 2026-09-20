import type {
  Project,
  Milestone,
  Feedback,
  ProjectFile,
} from "../../types";

export type ProjectTabKey =
  | "overview"
  | "milestones"
  | "progress"
  | "files"
  | "feedback"
  | "code-review"
  | "sandbox";

export interface ProjectDeliverableItem {
  milestoneTitle: string;
  milestoneId: string;
  name: string;
  url?: string;
  size?: number;
}

export interface ProjectDetailScreenProps {
  project: Project;
  milestones: Milestone[];
  feedbacks: Feedback[];
  files: ProjectFile[];
  onBack: () => void;
  onOpenTeamModal: () => void;
  onOpenGradeModal: () => void;
  onOpenSettingsModal: () => void;
  onStartMilestone: (id: string) => void;
  onApproveMilestone: (id: string) => void;
  onRejectMilestone: (id: string, feedback: string) => void;
  onAddFeedback: (text: string) => void;
  onReplyFeedback: (feedbackId: string, text: string) => void;
  onToggleResolveFeedback: (feedbackId: string) => void;
  onNavigate: (page: string) => void;
  defaultTab?: ProjectTabKey;
}

export interface TabBaseProps {
  project: Project;
}
