'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { useAuth } from '@/context/AuthContext';
import { RefreshCcw, Search, ShieldCheck, User, Users as UsersIcon } from 'lucide-react';

type AdminUser = {
  uid: string;
  email: string;
  displayName: string;
  role: 'customer' | 'vendor' | 'admin';
  vendorId?: string;
  createdAt: string;
  updatedAt: string;
};

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'customer', label: 'Customer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'admin', label: 'Admin' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'vendor' | 'admin'>('all');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user?.role === 'admin') {
      loadUsers();
    }
  }, [loading, user]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Unable to load users');
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserRole = async (uid: string, newRole: 'customer' | 'vendor' | 'admin') => {
    setActionLoading(uid);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, role: newRole }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Unable to update role');
      }
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((currentUser) => {
      const matchesSearch = [currentUser.displayName, currentUser.email, currentUser.vendorId || '']
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || currentUser.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-gray-300 border-t-gray-900 rounded-full" />
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-64">
        <AdminHeader />
        <div className="px-8 py-6 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 mb-2">Admin Panel</p>
              <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
                <UsersIcon size={28} /> User Management
              </h1>
              <p className="text-sm text-gray-500 max-w-2xl mt-2">
                Review registered accounts, manage user roles, and keep customer activity aligned with your boutique workflow.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={loadUsers}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <RefreshCcw size={16} /> Refresh
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_180px]">
              <label className="w-full">
                <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">Search users</span>
                <div className="mt-2 relative rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-primary">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email or vendor ID"
                    className="w-full bg-transparent pl-9 text-sm text-gray-900 outline-none"
                  />
                </div>
              </label>

              <label className="w-full">
                <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">Filter role</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600">Name</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600">Vendor ID</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600">Created</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-zinc-500">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-zinc-500">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((userItem) => {
                    const isCurrentAdmin = userItem.uid === user.uid;
                    return (
                      <tr key={userItem.uid}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{userItem.displayName}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{userItem.email}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700">
                            {userItem.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{userItem.vendorId || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(userItem.createdAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <button
                              type="button"
                              disabled={actionLoading === userItem.uid || isCurrentAdmin}
                              onClick={() => updateUserRole(userItem.uid, 'customer')}
                              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Customer
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === userItem.uid || isCurrentAdmin}
                              onClick={() => updateUserRole(userItem.uid, 'vendor')}
                              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Vendor
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === userItem.uid || isCurrentAdmin}
                              onClick={() => updateUserRole(userItem.uid, 'admin')}
                              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Admin
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Use the role buttons to update account access levels. Role changes are applied in the Firestore user profile.
          </p>
        </div>
      </main>
    </div>
  );
}
