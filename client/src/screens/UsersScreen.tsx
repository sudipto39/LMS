// src/screens/UsersScreen.tsx
import React, { useState, useEffect } from "react";
import { Users, Edit, Trash2, Upload, UserPlus } from "lucide-react";
import { Card, Pill, Btn, Btn2, Inp } from "../components/common/UIPrimitives";
import { adminApi } from "../api";
import type { User } from "../types";

interface UsersScreenProps {
  users: User[];
  onOpenCreateUserModal: () => void;
  onOpenEditModal: (user: User) => void;
  onOpenDeleteModal: (user: User) => void;
  onOpenCsvModal: () => void;
  externalSearchQuery?: string;
}

export const UsersScreen: React.FC<UsersScreenProps> = ({
  users,
  onOpenCreateUserModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onOpenCsvModal,
  externalSearchQuery,
}) => {
  const [liveUsers, setLiveUsers] = useState<User[]>(users);
  const [search, setSearch] = useState(externalSearchQuery || "");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearch(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  useEffect(() => {
    setLiveUsers(users);
  }, [users]);

  useEffect(() => {
    adminApi
      .getAllUsers()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setLiveUsers(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = liveUsers.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.idNo && u.idNo.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold flex items-center gap-2">
            <Users size={22} style={{ color: "var(--acc)" }} /> Users & Role
            Governance
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--t2)" }}>
            Provision accounts, assign supervisory roles, and manage student enrollments
          </p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={onOpenCreateUserModal}>
            <UserPlus size={14} /> Add New User
          </Btn>
          <Btn2 onClick={onOpenCsvModal}>
            <Upload size={14} /> Bulk CSV Import
          </Btn2>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Inp
            placeholder="Search by student name, email, university ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {["ALL", "STUDENT", "SUPERVISOR", "ADMIN"].map((rf) => (
            <button
              key={rf}
              type="button"
              onClick={() => setRoleFilter(rf)}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                roleFilter === rf
                  ? "bg-[#0e4a5e] text-white border-transparent"
                  : ""
              }`}
              style={
                roleFilter !== rf
                  ? {
                      background: "var(--srf2)",
                      borderColor: "var(--bdr)",
                      color: "var(--t2)",
                    }
                  : {}
              }
            >
              {rf}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--srf2)", color: "var(--t2)" }}>
                <th className="text-left p-3">User Profile</th>
                <th className="text-left p-3">University ID</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Department / Batch</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-t"
                  style={{ borderColor: "var(--bdr)" }}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatar}
                        className="h-8 w-8 rounded-full object-cover"
                        alt=""
                      />
                      <div>
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-[10px]" style={{ color: "var(--t3)" }}>
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 mono font-medium">{u.idNo || "—"}</td>
                  <td className="p-3">
                    <Pill
                      color={
                        u.role === "ADMIN"
                          ? "#ef4444"
                          : u.role === "SUPERVISOR"
                          ? "#f59e0b"
                          : "#0891b2"
                      }
                    >
                      {u.role}
                    </Pill>
                  </td>
                  <td className="p-3">
                    <div>{u.dept}</div>
                    <div className="text-[10px]" style={{ color: "var(--t3)" }}>
                      {u.batch || "Staff"}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(u)}
                        className="h-7 w-7 rounded-lg border grid place-items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: "var(--bdr)" }}
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenDeleteModal(u)}
                        className="h-7 w-7 rounded-lg border border-[#ef4444]/30 text-[#ef4444] grid place-items-center cursor-pointer hover:bg-[#ef4444]/10"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default UsersScreen;
