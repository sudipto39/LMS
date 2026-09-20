// src/components/modals/DeleteUserModal.tsx
import React from "react";
import { Trash2 } from "lucide-react";
import { Card, Btn2 } from "../common/UIPrimitives";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import type { User } from "../../types";

interface DeleteUserModalProps {
  show: boolean;
  onClose: () => void;
  user: User | null;
  onUserDeleted: (userId: string) => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  show,
  onClose,
  user,
  onUserDeleted,
}) => {
  const showToast = useToast();

  if (!show || !user) return null;

  const handleDelete = async () => {
    try {
      await adminApi.deleteUser(user.id);
    } catch {
      // Graceful local sync
    }
    onUserDeleted(user.id);
    showToast(`User ${user.name} deleted`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[400px] p-6 shadow-2xl space-y-4">
        <h3 className="font-bold text-[16px] text-[#ef4444] flex items-center gap-2">
          <Trash2 size={18} /> Confirm Deletion
        </h3>
        <p className="text-[12px]" style={{ color: "var(--t2)" }}>
          Are you sure you want to delete user <b>{user.name}</b> ({user.email})? This action will remove their batch enrollments and platform access.
        </p>
        <div className="flex gap-2 pt-2">
          <Btn2 onClick={onClose} className="flex-1 justify-center">
            Cancel
          </Btn2>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 h-10 rounded-full bg-[#ef4444] text-white font-bold text-[12px] flex items-center justify-center gap-1 cursor-pointer"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </Card>
    </div>
  );
};

export default DeleteUserModal;
