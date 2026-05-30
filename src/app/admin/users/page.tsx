'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { RefreshCcw, Search, Users, Shield, Award, User, UserPlus, X } from 'lucide-react';

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

function RoleIcon({ role }: { role: string }) {
  if (role === 'admin') return <Shield className="h-3 w-3" />;
  if (role === 'vendor') return <Award className="h-3 w-3" />;
  return <User className="h-3 w-3" />;
}

function getRoleBadgeStyle(role: string) {
  if (role === 'admin') return 'bg-primary/10 text-primary border border-primary/20';
  if (role === 'vendor') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'vendor' | 'admin'>('all');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ displayName: '', email: '', password: '', role: 'customer' as 'customer' | 'vendor' | 'admin' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user?.role === 'admin') loadUsers();
  }, [loading, user]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || 'Unable to load users');
      }
      const data = await res.json();
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
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, role: newRole }),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || 'Unable to update role');
      }
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  const createUser = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to create user');
      setShowAddForm(false);
      setAddForm({ displayName: '', email: '', password: '', role: 'customer' });
      await loadUsers();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create user');
    } finally {
      setAddLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = [u.displayName, u.email, u.vendorId || ''].join(' ').toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const formatDate = (value: string) => {
    try { return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return value; }
  };

  if (loading || !user) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <p className="text-zinc-500 text-xs">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-8">

      {/* Page header */}
      <div className="border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1 mb-1">
            <Users className="h-3.5 w-3.5" /> Account Registry
          </span>
          <h1 className="font-['Cinzel'] text-2xl font-bold tracking-widest text-white">USER MANAGEMENT</h1>
          <p className="text-zinc-500 text-xs mt-1 font-light">
            Review registered accounts, manage roles, and control platform access.
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black text-xs font-semibold tracking-wider uppercase hover:bg-opacity-90 transition-all"
          >
            <UserPlus className="h-3.5 w-3.5" /> Add User
          </button>
          <button
            onClick={loadUsers}
            className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-zinc-400 text-xs font-semibold tracking-wider uppercase hover:border-primary hover:text-white transition-all"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Add User Panel */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          <div className="relative z-10 w-full max-w-md glass border border-white/10 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-['Cinzel'] text-sm font-bold tracking-widest text-white">ADD USER</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Create a new account with Firebase Auth</p>
              </div>
              <button onClick={() => setShowAddForm(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={createUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={addForm.displayName}
                  onChange={e => setAddForm(p => ({ ...p, displayName: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Email</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={addForm.password}
                  onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Role</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm(p => ({ ...p, role: e.target.value as typeof addForm.role }))}
                  className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-zinc-400 focus:text-white"
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {addError && (
                <p className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 p-2.5">⚠ {addError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2.5 bg-primary text-black font-semibold text-xs tracking-[0.15em] uppercase hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {addLoading ? 'Creating...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2.5 border border-white/10 text-zinc-400 text-xs font-semibold tracking-wider uppercase hover:border-white/30 hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        {[
          { label: 'Total Accounts', value: users.length, color: 'text-white' },
          { label: 'Customers', value: users.filter(u => u.role === 'customer').length, color: 'text-zinc-400' },
          { label: 'Vendors', value: users.filter(u => u.role === 'vendor').length, color: 'text-blue-400' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'text-primary' },
        ].map((stat) => (
          <div key={stat.label} className="glass p-5 border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">{stat.label}</span>
            <p className={`text-xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or vendor ID..."
            className="w-full bg-black border border-white/10 px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-primary text-white"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="bg-black border border-white/10 px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:border-primary focus:text-white w-40"
        >
          {roleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-400 text-xs rounded">
          ⚠ {error}
        </div>
      )}

      {/* Table */}
      <div className="glass border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-zinc-400">
            <thead className="bg-black/40 text-zinc-600 uppercase tracking-widest text-[9px] border-b border-white/5">
              <tr>
                <th className="px-5 py-3.5 text-left font-semibold">Name</th>
                <th className="px-5 py-3.5 text-left font-semibold">Email</th>
                <th className="px-5 py-3.5 text-left font-semibold">Role</th>
                <th className="px-5 py-3.5 text-left font-semibold">Vendor ID</th>
                <th className="px-5 py-3.5 text-left font-semibold">Joined</th>
                <th className="px-5 py-3.5 text-left font-semibold">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loadingUsers ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-600 text-xs">Loading accounts...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-600 text-xs">No matching accounts found.</td>
                </tr>
              ) : filteredUsers.map((u) => {
                const isSelf = u.uid === user.uid;
                return (
                  <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-white text-[11px]">{u.displayName}</td>
                    <td className="px-5 py-3.5 text-zinc-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(u.role)}`}>
                        <RoleIcon role={u.role} /> {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[10px] text-zinc-600">{u.vendorId || '—'}</td>
                    <td className="px-5 py-3.5 text-zinc-600">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      {isSelf ? (
                        <span className="text-[9px] text-zinc-600 italic">Current session</span>
                      ) : (
                        <div className="flex gap-1.5">
                          {(['customer', 'vendor', 'admin'] as const).map((role) => (
                            <button
                              key={role}
                              disabled={actionLoading === u.uid || u.role === role}
                              onClick={() => updateUserRole(u.uid, role)}
                              className={`px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider border transition-all rounded-full ${
                                u.role === role
                                  ? 'border-primary/30 bg-primary/10 text-primary cursor-default'
                                  : 'border-white/10 text-zinc-500 hover:border-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                              }`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-zinc-600">
        Role changes update the Firestore user profile immediately. The affected user must re-login to receive updated permissions.
      </p>
    </div>
  );
}
