import React, { useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import { ConfirmDialog, EmptyState, Modal } from '../ui/CommonUI';

interface UserFormState {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  active: boolean;
}

export const UsersPage: React.FC = () => {
  const { currentUser, users, addUser, updateUser, deleteUser } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState<UserFormState>({
    name: '',
    email: '',
    password: 'demo123',
    role: 'faculty',
    department: 'Computer Science & Engineering',
    active: true,
  });

  const openAddModal = () => {
    setEditingUser(null);
    setFormError(null);
    setForm({
      name: '',
      email: '',
      password: 'demo123',
      role: 'faculty',
      department: 'Computer Science & Engineering',
      active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormError(null);
    setForm({
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      department: u.department,
      active: u.active,
    });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (form.name.trim().length < 2) {
      setFormError('Full name is required.');
      return;
    }
    if (!form.email.includes('@')) {
      setFormError('Please enter a valid institutional email address.');
      return;
    }
    if (form.password.length < 4) {
      setFormError('Password must be at least 4 characters.');
      return;
    }

    const emailExists = users.some(
      (u) =>
        u.email.toLowerCase() === form.email.trim().toLowerCase() &&
        u.id !== editingUser?.id,
    );
    if (emailExists) {
      setFormError('Another user already uses this email address.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      department: form.department.trim() || 'General',
      active: form.active,
    };

    if (editingUser) {
      updateUser(editingUser.id, payload);
    } else {
      addUser(payload);
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            User &amp; Role Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Provision Faculty, HOD, and Examination Cell Admin accounts with
            role-scoped permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={<Users className="w-5 h-5" />}
          title="No user accounts"
          description="Create user accounts for Faculty, HOD, and Admin staff."
          actionLabel="Add User"
          onAction={openAddModal}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Name &amp; Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900">
                          {u.name}
                          {isSelf && (
                            <span className="ml-2 text-xs text-slate-500 font-normal">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-xs font-mono text-slate-500">
                          {u.email}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-800 uppercase">
                        {u.role}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {u.department}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium">
                        <span
                          className={
                            u.active ? 'text-emerald-700' : 'text-slate-500'
                          }
                        >
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            title="Edit User"
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeleteTarget(u)}
                            title={
                              isSelf
                                ? 'Cannot delete active session user'
                                : 'Delete User'
                            }
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit User Account' : 'Create User Account'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Dr. Ananya Rao"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Institutional Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="ananya@college.edu"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    role: e.target.value as UserRole,
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="faculty">Faculty</option>
                <option value="hod">HOD</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="text"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Department
            </label>
            <input
              type="text"
              value={form.department}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, department: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, active: e.target.checked }))
              }
              className="rounded border-slate-300 text-blue-700"
            />
            <span>Account is active and permitted to sign in</span>
          </label>

          {formError && (
            <p className="text-xs font-medium text-red-700">{formError}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              {editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete User Account"
        message={`Delete account for "${deleteTarget?.name}" (${deleteTarget?.email})?`}
        onConfirm={() => {
          if (deleteTarget) deleteUser(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
