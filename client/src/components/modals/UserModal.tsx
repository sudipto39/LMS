// src/components/modals/UserModal.tsx
import React, { useState, useEffect } from "react";
import { User as UserIcon, UserPlus, X, Eye, EyeOff } from "lucide-react";
import { Card, Inp, Btn, Btn2 } from "../common/UIPrimitives";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import type { User, Role, Batch } from "../../types";

interface UserModalProps {
  show: boolean;
  onClose: () => void;
  user?: User | null;
  batches?: Batch[];
  onUserSaved: (savedUser: User, isNew: boolean) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  show,
  onClose,
  user,
  batches = [],
  onUserSaved,
}) => {
  const showToast = useToast();
  const isEditing = !!user;

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userForm, setUserForm] = useState<{
    name: string;
    email: string;
    role: Role;
    dept: string;
    idNo: string;
    batchId: string;
    password: string;
  }>({
    name: "",
    email: "",
    role: "STUDENT",
    dept: "CSE",
    idNo: "",
    batchId: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      setUserForm({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "STUDENT",
        dept: user.dept || user.department || "CSE",
        idNo: user.idNo || user.universityId || "",
        batchId: "",
        password: "",
      });
    } else {
      setUserForm({
        name: "",
        email: "",
        role: "STUDENT",
        dept: "CSE",
        idNo: "",
        batchId: batches[0]?.id || "",
        password: "",
      });
    }
  }, [user, batches, show]);

  if (!show) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      showToast("Name and email are required fields");
      return;
    }
    if (!isEditing) {
      if (!userForm.password.trim()) {
        showToast("Password is required for new accounts");
        return;
      }
      if (userForm.password.trim().length < 8) {
        showToast("Password must be at least 8 characters long");
        return;
      }
    }

    setLoading(true);
    try {
      const selectedBatch = batches.find((b) => b.id === userForm.batchId);

      if (isEditing && user) {
        // Edit existing user
        try {
          const res = await adminApi.updateUser(user.id, {
            name: userForm.name.trim(),
            role: userForm.role,
            department: userForm.dept.trim(),
            universityId: userForm.idNo.trim(),
          });
          const updatedUser: User = {
            ...user,
            ...(res?.data || {}),
            name: userForm.name.trim(),
            role: userForm.role,
            dept: userForm.dept.trim(),
            idNo: userForm.idNo.trim() || user.idNo,
          };
          onUserSaved(updatedUser, false);
          showToast(`User ${userForm.name} updated successfully ✅`);
          onClose();
        } catch (err: any) {
          const msg = err?.response?.data?.message || err?.message || "Failed to update user";
          showToast(msg);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Create new user
      const res = await adminApi.createUser({
        name: userForm.name.trim(),
        email: userForm.email.trim().toLowerCase(),
        role: userForm.role,
        department: userForm.dept.trim() || "CSE",
        universityId: userForm.idNo.trim() || `ID-${Date.now().toString().slice(-4)}`,
        password: userForm.password.trim(),
        batchId: userForm.batchId || undefined,
      });

      if (res?.data) {
        const newUser: User = {
          ...res.data,
          avatar:
            res.data.avatar ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
              res.data.name || res.data.email || "User"
            )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`,
          dept: res.data.department || userForm.dept,
          idNo: res.data.universityId || userForm.idNo,
          batch: selectedBatch ? selectedBatch.name : userForm.role === "STUDENT" ? "General Batch" : "Academic Staff",
        };
        onUserSaved(newUser, true);
        showToast(`New ${userForm.role.toLowerCase()} account created successfully ✅`);
        onClose();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create user";
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[500px] p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            {isEditing ? (
              <>
                <UserIcon size={16} style={{ color: "var(--acc)" }} /> Edit User Account
              </>
            ) : (
              <>
                <UserPlus size={16} style={{ color: "var(--acc)" }} /> Provision New User Account
              </>
            )}
          </h3>
          <button onClick={onClose} className="cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3 text-[12px]">
          <div>
            <label
              className="text-[11px] font-bold uppercase"
              style={{ color: "var(--t2)" }}
            >
              Full Name *
            </label>
            <Inp
              placeholder="e.g. Dr. Eleanor Davis"
              value={userForm.name}
              onChange={(e) =>
                setUserForm({ ...userForm, name: e.target.value })
              }
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className="text-[11px] font-bold uppercase"
                style={{ color: "var(--t2)" }}
              >
                University Email *
              </label>
              <Inp
                placeholder="name@univ.edu"
                type="email"
                value={userForm.email}
                disabled={isEditing}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                className="mt-1 disabled:opacity-60"
              />
            </div>

            <div>
              <label
                className="text-[11px] font-bold uppercase"
                style={{ color: "var(--t2)" }}
              >
                University ID / Roll No
              </label>
              <Inp
                placeholder="e.g. CS2024-105"
                value={userForm.idNo}
                onChange={(e) =>
                  setUserForm({ ...userForm, idNo: e.target.value })
                }
                className="mt-1 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className="text-[11px] font-bold uppercase"
                style={{ color: "var(--t2)" }}
              >
                Platform Role
              </label>
              <select
                value={userForm.role}
                onChange={(e) =>
                  setUserForm({ ...userForm, role: e.target.value as Role })
                }
                className="mt-1 w-full h-11 rounded-xl border px-3 text-[12px] font-medium"
                style={{
                  background: "var(--srf2)",
                  borderColor: "var(--bdr)",
                  color: "var(--t1)",
                }}
              >
                <option value="STUDENT">STUDENT</option>
                <option value="SUPERVISOR">SUPERVISOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div>
              <label
                className="text-[11px] font-bold uppercase"
                style={{ color: "var(--t2)" }}
              >
                Department
              </label>
              <Inp
                placeholder="e.g. Computer Science"
                value={userForm.dept}
                onChange={(e) =>
                  setUserForm({ ...userForm, dept: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>

          {!isEditing && userForm.role === "STUDENT" && batches.length > 0 && (
            <div>
              <label
                className="text-[11px] font-bold uppercase"
                style={{ color: "var(--t2)" }}
              >
                Assign to Academic Batch
              </label>
              <select
                value={userForm.batchId}
                onChange={(e) =>
                  setUserForm({ ...userForm, batchId: e.target.value })
                }
                className="mt-1 w-full h-11 rounded-xl border px-3 text-[12px]"
                style={{
                  background: "var(--srf2)",
                  borderColor: "var(--bdr)",
                  color: "var(--t1)",
                }}
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.courseName || "General"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isEditing && (
            <div>
              <label
                className="text-[11px] font-bold uppercase"
                style={{ color: "var(--t2)" }}
              >
                Initial Password (Min 8 Characters) *
              </label>
              <div className="relative mt-1">
                <Inp
                  placeholder="Enter initial password"
                  type={showPassword ? "text" : "password"}
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
                  style={{ color: "var(--t2)" }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-3">
            <Btn2 type="button" onClick={onClose} className="flex-1 justify-center">
              Cancel
            </Btn2>
            <Btn type="submit" disabled={loading} className="flex-1 justify-center">
              {loading
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Create User Account"}
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UserModal;
