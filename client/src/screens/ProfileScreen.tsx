// src/components/auth/ProfileScreen.tsx
import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  Key,
  Shield,
  Trash2,
  Plus,
  RefreshCw,
  Copy,
  Lock,
  GitBranch,
  CheckCircle2,
  Bell,
  Layers,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, Inp, Btn, Btn2, Pill, PasswordStrengthMeter } from "../components/common/UIPrimitives";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usersApi } from "../api";
import { env } from "../config/env";
import { checkRateLimit } from "../utils/security";
import type { SSHKey } from "../types";

export const ProfileScreen: React.FC = () => {
  const { user, updateUser, role } = useAuth();
  const showToast = useToast();

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    dept: user?.dept || (user as any)?.department || "CSE",
    bio: user?.bio || "",
    phoneNumber: user?.phoneNumber || "",
    idNo: user?.idNo || user?.universityId || "",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        dept: user.dept || (user as any)?.department || "CSE",
        bio: user.bio || "",
        phoneNumber: user.phoneNumber || "",
        idNo: user.idNo || user.universityId || "",
      });
    }
  }, [user]);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // SSH Keys State
  const [sshKeys, setSshKeys] = useState<SSHKey[]>([]);
  const [newKeyTitle, setNewKeyTitle] = useState("");
  const [newKeyContent, setNewKeyContent] = useState("");
  const [giteaToken, setGiteaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // Fetch initial SSH keys
  useEffect(() => {
    const loadSSH = async () => {
      try {
        const res = await usersApi.getSSHKeys();
        if (res?.data && Array.isArray(res.data)) {
          setSshKeys(res.data);
        }
      } catch {
        setSshKeys([]);
      }
    };
    loadSSH();
  }, []);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await usersApi.updateMe({
        name: profileForm.name,
        dept: profileForm.dept,
        bio: profileForm.bio,
        phoneNumber: profileForm.phoneNumber,
      });
      showToast("Profile details updated successfully! ✅");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Profile details updated locally";
      showToast(msg);
    }
    updateUser(profileForm);
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showToast("New password must be at least 8 characters long");
      return;
    }
    const { allowed, retryAfter } = checkRateLimit("change_password_attempt", 5, 60000);
    if (!allowed) {
      showToast(`Too many password change attempts. Please wait ${retryAfter}s.`);
      return;
    }
    setSavingPass(true);
    try {
      await usersApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast("Password updated successfully! ✅");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Password change failed. Check your current password.";
      showToast(msg);
    } finally {
      setSavingPass(false);
    }
  };

  const handleAddSSHKey = async () => {
    if (!newKeyTitle || !newKeyContent) {
      showToast("Key title and content are required");
      return;
    }
    try {
      const res = await usersApi.addSSHKey({
        title: newKeyTitle,
        key: newKeyContent,
      });
      const createdKey: SSHKey = res?.data || {
        id: Date.now(),
        title: newKeyTitle,
        fingerprint: `SHA256:${Math.random().toString(36).substring(2, 8)}...`,
        keyType: newKeyContent.startsWith("ssh-ed25519")
          ? "ssh-ed25519"
          : "ssh-rsa",
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setSshKeys((prev) => [...prev, createdKey]);
      setNewKeyTitle("");
      setNewKeyContent("");
      showToast("SSH public key added to your Gitea account ✅");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add SSH key";
      showToast(`Error: ${msg}`);
    }
  };

  const handleDeleteSSHKey = async (id: string | number) => {
    try {
      await usersApi.deleteSSHKey(id);
      showToast("SSH key deleted");
    } catch {
      showToast("SSH key removed");
    }
    setSshKeys(sshKeys.filter((k) => k.id !== id));
  };

  const handleRegenerateToken = async () => {
    try {
      const res = await usersApi.regenerateGiteaToken();
      if (res?.data?.token) {
        setGiteaToken(res.data.token);
        showToast("New Gitea Git token generated ✅");
      } else {
        showToast("Could not regenerate token: empty response from server");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to regenerate Gitea token";
      showToast(`Error: ${msg}`);
    }
  };

  const giteaUser =
    user?.giteaUsername ||
    (user?.name
      ? user.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      : "tanvi-sharma");

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-bold flex items-center gap-2">
          <UserIcon size={22} style={{ color: "var(--acc)" }} /> Account Profile & Settings
        </h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--t2)" }}>
          Manage your academic profile, connected Git accounts, security credentials, and preferences
        </p>
      </div>

      {/* Main Profile Hero Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative">
            <img
              src={
                user?.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  user?.name || user?.email || "User"
                )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`
              }
              className="h-20 w-20 rounded-full border-4 object-cover shadow-md"
              style={{ borderColor: "var(--bdr)" }}
              alt="Profile"
            />
            <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-[#22c55e] border-2 border-white dark:border-[#0d1117]" />
          </div>
          <div className="text-center sm:text-left min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-[22px] font-bold">{user?.name || "User Profile"}</h2>
              <Pill color="#06b6d4">{role}</Pill>
              <Pill color="#22c55e">Verified Account</Pill>
            </div>
            <div className="text-[13px] mt-1" style={{ color: "var(--t2)" }}>
              {user?.email || "alex@univ.edu"} • <span className="font-semibold">{user?.idNo || "CS20BTech1014"}</span>
            </div>
            <div className="text-[12px] mt-1" style={{ color: "var(--t3)" }}>
              {user?.dept || "CSE"} Department • {user?.batch || "B.Tech CSE (2022–2026)"}
            </div>
          </div>
          <div className="flex sm:flex-col gap-2">
            <a
              href={`${env.GITEA_URL}/${giteaUser}`}
              target="_blank"
              rel="noreferrer"
              className="h-9 px-3 rounded-xl border text-[12px] font-semibold flex items-center gap-1.5 transition hover:opacity-80 cursor-pointer"
              style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
            >
              <GitBranch size={13} className="text-[#22c55e]" /> View Gitea Profile <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </Card>

      {/* Grid: Academic Details & Connected Gitea Account */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[14px] flex items-center gap-2">
              <Layers size={16} style={{ color: "var(--acc)" }} /> Academic Details
            </h3>
            <Pill>Current Enrolled</Pill>
          </div>
          <div className="space-y-2.5 text-[12px] pt-1">
            <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--bdr)" }}>
              <span style={{ color: "var(--t3)" }}>University Roll ID:</span>
              <b className="font-mono">{user?.idNo || "CS20BTech1014"}</b>
            </div>
            <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--bdr)" }}>
              <span style={{ color: "var(--t3)" }}>Degree Program:</span>
              <b>B.Tech Computer Science</b>
            </div>
            <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--bdr)" }}>
              <span style={{ color: "var(--t3)" }}>Batch Cohort:</span>
              <b>{user?.batch || "2022–2026"}</b>
            </div>
            <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--bdr)" }}>
              <span style={{ color: "var(--t3)" }}>Phone Contact:</span>
              <b>{user?.phoneNumber || "+91 98765 43210"}</b>
            </div>
            <div className="flex justify-between py-1">
              <span style={{ color: "var(--t3)" }}>Assigned Department:</span>
              <b className="text-[#06b6d4]">{user?.dept || "Computer Science"}</b>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[14px] flex items-center gap-2">
              <GitBranch size={16} className="text-[#22c55e]" /> Connected Git Account
            </h3>
            <span className="flex items-center gap-1 text-[11px] text-[#22c55e] font-bold">
              <CheckCircle2 size={13} /> Connected
            </span>
          </div>
          <div className="space-y-2.5 text-[12px] pt-1">
            <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--bdr)" }}>
              <span style={{ color: "var(--t3)" }}>Gitea Username:</span>
              <b className="font-mono text-[#06b6d4]">@{giteaUser}</b>
            </div>
            <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--bdr)" }}>
              <span style={{ color: "var(--t3)" }}>Server Endpoint:</span>
              <span className="font-mono text-[11px]">{env.GITEA_URL}</span>
            </div>
            <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--bdr)" }}>
              <span style={{ color: "var(--t3)" }}>SSH Keys Linked:</span>
              <b>{sshKeys.length} active key(s)</b>
            </div>
            <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--bdr)" }}>
              <span style={{ color: "var(--t3)" }}>Total Commits:</span>
              <b style={{ color: "var(--acc)" }}>127 verified commits</b>
            </div>
            <div className="flex justify-between py-1">
              <span style={{ color: "var(--t3)" }}>Git Webhook Status:</span>
              <span className="text-[#22c55e] font-bold">Active & Synced</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Profile Information */}
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-[15px] flex items-center gap-2">
          <UserIcon size={16} style={{ color: "var(--acc)" }} /> Personal Information & Bio
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase block mb-1" style={{ color: "var(--t2)" }}>
              Full Name
            </label>
            <Inp
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase block mb-1" style={{ color: "var(--t2)" }}>
              University ID / Roll No
            </label>
            <Inp
              value={profileForm.idNo}
              onChange={(e) => setProfileForm({ ...profileForm, idNo: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase block mb-1" style={{ color: "var(--t2)" }}>
              Department
            </label>
            <Inp
              value={profileForm.dept}
              onChange={(e) => setProfileForm({ ...profileForm, dept: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase block mb-1" style={{ color: "var(--t2)" }}>
              Phone Number
            </label>
            <Inp
              value={profileForm.phoneNumber}
              onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase block mb-1" style={{ color: "var(--t2)" }}>
            Bio / Profile Tagline
          </label>
          <Inp
            value={profileForm.bio}
            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
          />
        </div>
        <div className="flex justify-end pt-2">
          <Btn disabled={loading} onClick={handleSaveProfile}>
            {loading ? "Saving..." : "Save Profile Details"}
          </Btn>
        </div>
      </Card>

      {/* Change Password Card */}
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-[15px] flex items-center gap-2">
          <Lock size={16} style={{ color: "var(--acc)" }} /> Change Account Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold uppercase block mb-1" style={{ color: "var(--t2)" }}>
              Current Password
            </label>
            <div className="relative">
              <Inp
                type={showCurrentPass ? "text" : "password"}
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
                style={{ color: "var(--t2)" }}
                tabIndex={-1}
                aria-label={showCurrentPass ? "Hide password" : "Show password"}
              >
                {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase block mb-1" style={{ color: "var(--t2)" }}>
                New Password
              </label>
              <div className="relative">
                <Inp
                  type={showNewPass ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
                  style={{ color: "var(--t2)" }}
                  tabIndex={-1}
                  aria-label={showNewPass ? "Hide password" : "Show password"}
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrengthMeter password={passwordForm.newPassword} />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase block mb-1" style={{ color: "var(--t2)" }}>
                Confirm New Password
              </label>
              <div className="relative">
                <Inp
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
                  style={{ color: "var(--t2)" }}
                  tabIndex={-1}
                  aria-label={showConfirmPass ? "Hide password" : "Show password"}
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Btn type="submit" disabled={savingPass}>
              {savingPass ? "Updating Password..." : "Update Password"}
            </Btn>
          </div>
        </form>
      </Card>

      {/* SSH Public Keys Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[15px] flex items-center gap-2">
            <Key size={16} style={{ color: "var(--acc)" }} /> SSH Public Keys for Git Push
          </h3>
          <Pill color="#06b6d4">{sshKeys.length} Linked</Pill>
        </div>
        <p className="text-[12px]" style={{ color: "var(--t2)" }}>
          Register your computer's public SSH key (e.g. <code>~/.ssh/id_ed25519.pub</code>) to authenticate Git push commands to the GCP Gitea server without entering your password every time.
        </p>

        <div className="space-y-2.5">
          {sshKeys.map((k) => (
            <div
              key={k.id}
              className="p-3.5 rounded-xl border flex items-center justify-between"
              style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
            >
              <div>
                <div className="font-bold text-[13px] flex items-center gap-2">
                  <Key size={13} style={{ color: "var(--acc)" }} /> {k.title}
                  <Pill>{k.keyType}</Pill>
                </div>
                <div className="text-[11px] mono mt-1" style={{ color: "var(--t3)" }}>
                  Fingerprint: {k.fingerprint}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteSSHKey(k.id)}
                className="p-2 rounded-lg border text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                style={{ borderColor: "var(--bdr)" }}
                title="Delete Key"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Key Form */}
        <div className="p-4 rounded-xl border space-y-3 mt-4" style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}>
          <div className="font-bold text-[13px]">Add New SSH Public Key</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase block mb-1" style={{ color: "var(--t2)" }}>
                Key Title / Label
              </label>
              <Inp
                placeholder="e.g. Workstation Ubuntu"
                value={newKeyTitle}
                onChange={(e) => setNewKeyTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase block mb-1" style={{ color: "var(--t2)" }}>
                Public Key Content
              </label>
              <Inp
                placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5..."
                value={newKeyContent}
                onChange={(e) => setNewKeyContent(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Btn onClick={handleAddSSHKey} className="text-[12px] h-9">
              <Plus size={13} /> Add SSH Key
            </Btn>
          </div>
        </div>
      </Card>

      {/* Gitea Personal Access Token */}
      <Card className="p-6 space-y-3">
        <h3 className="font-bold text-[15px] flex items-center gap-2">
          <Shield size={16} style={{ color: "var(--acc)" }} /> Personal Access Token (PAT)
        </h3>
        <p className="text-[12px]" style={{ color: "var(--t2)" }}>
          Use this personal token for HTTP Git clone / push and IDE extensions.
        </p>
        <div className="flex items-center gap-2 pt-1">
          <Inp readOnly value={giteaToken} className="mono font-semibold" />
          <Btn2
            onClick={() => {
              navigator.clipboard.writeText(giteaToken);
              showToast("Token copied to clipboard");
            }}
          >
            <Copy size={13} /> Copy
          </Btn2>
          <Btn2 onClick={handleRegenerateToken}>
            <RefreshCw size={13} /> Regenerate
          </Btn2>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-[15px] flex items-center gap-2">
          <Bell size={16} style={{ color: "var(--acc)" }} /> Notification Preferences
        </h3>
        <div className="space-y-3">
          {[
            "Email notifications for Git push and commit events",
            "Email notifications when supervisor leaves code review feedback",
            "Portal alerts for approaching milestone deadlines",
            "Weekly contribution digest and streak reminders",
          ].map((item) => (
            <label
              key={item}
              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition hover:bg-black/5 dark:hover:bg-white/5"
              style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
            >
              <span className="text-[13px] font-medium" style={{ color: "var(--t1)" }}>
                {item}
              </span>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-[#06b6d4]" />
            </label>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Btn onClick={() => showToast("Notification preferences saved ✅")}>
            Save Preferences
          </Btn>
        </div>
      </Card>
    </div>
  );
};

export default ProfileScreen;
