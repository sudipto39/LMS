// src/components/modals/TeamModal.tsx
import React, { useState, useEffect } from "react";
import { Users, X, UserMinus, UserPlus, RotateCcw } from "lucide-react";
import { Card, Inp, Btn, Pill } from "../common/UIPrimitives";
import { projectsApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import type { Project, User } from "../../types";

interface TeamModalProps {
  show: boolean;
  onClose: () => void;
  project: Project;
  allUsers: User[];
  onAddMember: (user: User) => void;
  onRemoveMember: (userId: string) => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({
  show,
  onClose,
  project,
  allUsers,
  onAddMember,
  onRemoveMember,
}) => {
  const { role } = useAuth();
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [potentialMembers, setPotentialMembers] = useState<User[]>([]);
  const [loadingPotential, setLoadingPotential] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const showToast = useToast();

  useEffect(() => {
    if (!show || !project?.id) return;
    let isMounted = true;
    setLoadingPotential(true);

    projectsApi
      .getPotentialMembers(project.id)
      .then((res) => {
        if (isMounted && res?.data && Array.isArray(res.data)) {
          const mapped: User[] = res.data.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: "STUDENT" as const,
            avatar:
              u.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                u.name || u.email || "Student"
              )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`,
            dept: u.dept || u.department || "CSE",
            idNo: u.idNo || u.universityId || "CS1001",
          }));
          setPotentialMembers(mapped);
        }
      })
      .catch(() => {
        // Fallback handled via allUsers
      })
      .finally(() => {
        if (isMounted) setLoadingPotential(false);
      });

    return () => {
      isMounted = false;
    };
  }, [show, project?.id]);

  if (!show) return null;

  // Source list: potentialMembers from live API if available, else allUsers
  const sourceList = potentialMembers.length > 0 ? potentialMembers : allUsers;
  const availableStudents = sourceList.filter(
    (u) =>
      u.role === "STUDENT" &&
      !(project.team || []).some((m) => m.id === u.id) &&
      (u.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
        (u.idNo && u.idNo.toLowerCase().includes(teamSearchQuery.toLowerCase())))
  );

  const handleAdd = async (u: User) => {
    setActionLoading(u.id);
    try {
      await projectsApi.addMember(project.id, u.id);
      showToast(`${u.name} added to project repository team ✅`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || `${u.name} added to team`;
      showToast(msg);
    } finally {
      onAddMember(u);
      setPotentialMembers((prev) => prev.filter((p) => p.id !== u.id));
      setActionLoading(null);
    }
  };

  const handleRemove = async (userId: string, userName: string) => {
    setActionLoading(userId);
    try {
      await projectsApi.removeMember(project.id, userId);
      showToast(`${userName} removed from project team`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Member removed from team";
      showToast(msg);
    } finally {
      onRemoveMember(userId);
      setActionLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 overscroll-contain overflow-y-auto"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[540px] p-6 shadow-2xl space-y-4 my-auto">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-[16px] flex items-center gap-2">
            <Users size={18} style={{ color: "var(--acc)" }} /> Manage Project Team
            {role === "SUPERVISOR" && <Pill color="#a855f7">Supervisor</Pill>}
            {role === "ADMIN" && <Pill color="#06b6d4">Admin</Pill>}
          </h3>
          <button onClick={onClose} className="cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-[12px]" style={{ color: "var(--t2)" }}>
          {role === "SUPERVISOR"
            ? "Manage and allocate student team members for this capstone project."
            : role === "ADMIN"
            ? "Administer project collaborators and Gitea repository access permissions."
            : "Add batch peers as project collaborators. They will receive write permissions on the Gitea repo."}
        </p>

        {/* Current Members */}
        <div className="space-y-2">
          <div
            className="text-[11px] font-bold uppercase"
            style={{ color: "var(--t2)" }}
          >
            Current Collaborators ({(project.team || []).length})
          </div>
          {(project.team || []).map((m, idx) => (
            <div
              key={m.id}
              className="p-2.5 rounded-xl border flex items-center gap-2.5"
              style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
            >
              <img
                src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name || m.email || "Member")}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`}
                className="h-7 w-7 rounded-full object-cover"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[12px] truncate">{m.name}</div>
                <div className="text-[10px]" style={{ color: "var(--t3)" }}>
                  {m.email} • {m.idNo || (m as any).universityId || "CS1001"}
                </div>
              </div>
              <Pill color={idx === 0 ? "#06b6d4" : "#64748b"}>
                {idx === 0 ? "Lead Owner" : "Member"}
              </Pill>
              {idx > 0 && (
                <button
                  type="button"
                  disabled={actionLoading === m.id}
                  onClick={() => handleRemove(m.id, m.name)}
                  className="h-6 w-6 rounded-lg grid place-items-center text-[#ef4444] hover:bg-[#ef4444]/10 cursor-pointer disabled:opacity-50"
                  title="Remove from team"
                >
                  {actionLoading === m.id ? (
                    <RotateCcw size={11} className="animate-spin" />
                  ) : (
                    <UserMinus size={12} />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add peer from batch */}
        <div
          className="space-y-2 pt-2 border-t"
          style={{ borderColor: "var(--bdr)" }}
        >
          <div className="flex justify-between items-center">
            <span
              className="text-[11px] font-bold uppercase"
              style={{ color: "var(--t2)" }}
            >
              Invite Peer from Same Batch
            </span>
            {loadingPotential && (
              <span className="text-[10px] text-[#06b6d4] flex items-center gap-1">
                <RotateCcw size={10} className="animate-spin" /> Syncing batch...
              </span>
            )}
          </div>
          <Inp
            placeholder="Search student by name, email, or ID..."
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
          />
          <div className="max-h-[140px] overflow-y-auto space-y-1.5 pt-1">
            {availableStudents.length === 0 ? (
              <div
                className="text-center py-3 text-[11px]"
                style={{ color: "var(--t3)" }}
              >
                No available students matching query
              </div>
            ) : (
              availableStudents.map((u) => (
                <div
                  key={u.id}
                  className="p-2 rounded-lg flex items-center justify-between border"
                  style={{
                    background: "var(--srf)",
                    borderColor: "var(--bdr)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={u.avatar}
                      className="h-6 w-6 rounded-full object-cover"
                      alt=""
                    />
                    <div>
                      <span className="text-[12px] font-medium">{u.name}</span>
                      <span className="text-[10px] ml-1.5" style={{ color: "var(--t3)" }}>
                        ({u.idNo || (u as any).universityId || "CS1001"})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={actionLoading === u.id}
                    onClick={() => handleAdd(u)}
                    className="h-7 px-3 rounded-full bg-[#0e4a5e] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:opacity-90 disabled:opacity-50"
                  >
                    {actionLoading === u.id ? (
                      <RotateCcw size={10} className="animate-spin" />
                    ) : (
                      <UserPlus size={11} />
                    )}
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <Btn onClick={onClose} className="w-full justify-center">
          Done Managing Team
        </Btn>
      </Card>
    </div>
  );
};

export default TeamModal;
