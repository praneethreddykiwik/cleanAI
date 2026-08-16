'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Eye } from 'lucide-react';
import { apiCall } from '@/lib/api';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/shared/Pagination';
import {
  containerVariants,
  cardVariants,
  tableRowVariants,
} from '@/lib/animations';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'VENDOR' | 'AGENT'>('ALL');

  const fetchUsers = async () => {
    try {
      const response = await apiCall('/admin/users');
      if (response.success && response.data) {
        const mapped = response.data.map((u: any) => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'No Name',
          email: u.email,
          phone: u.phone || 'N/A',
          role: u.role,
          status: u.isActive ? 'ACTIVE' : 'SUSPENDED',
          joined: u.createdAt
        }));
        setUsers(mapped);
      }
    } catch (err: any) {
      toast.error('Failed to load users list.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const isSuspending = currentStatus === 'ACTIVE';
    const endpoint = `/admin/users/${id}/${isSuspending ? 'suspend' : 'restore'}`;
    try {
      const response = await apiCall(endpoint, { method: 'PATCH' });
      if (response.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: isSuspending ? 'SUSPENDED' : 'ACTIVE' } : u))
        );
        if (isSuspending) {
          toast.error('User account suspended successfully.');
        } else {
          toast.success('User account restored successfully.');
        }
      } else {
        toast.error(response.message || 'Operation failed.');
      }
    } catch (err: any) {
      toast.error('Failed to update user status.');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);

    if (roleFilter === 'ALL') return matchesSearch;
    return user.role === roleFilter && matchesSearch;
  });

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Users' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Users Directory</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and manage Customer, Vendor, and Agent profiles.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-muted/60 p-1 rounded-xl border border-border/50 self-start">
            {(['ALL', 'CUSTOMER', 'VENDOR', 'AGENT'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRoleFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  roleFilter === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.toLowerCase()}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search Name, Email, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-9 pr-4 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        {/* Users Table */}
        <motion.div
          variants={cardVariants}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    User Info
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Joined Date
                  </th>
                  <th className="px-5 py-3 text-right" />
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    custom={idx}
                    variants={tableRowVariants}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-xs font-bold text-foreground">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {user.email} · {user.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={user.status} size="sm" />
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-muted-foreground">{formatDate(user.joined)}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={
                            user.status === 'ACTIVE'
                              ? 'text-red-600 hover:bg-red-50 rounded-lg'
                              : 'text-green-600 hover:bg-green-50 rounded-lg'
                          }
                        >
                          {user.status === 'ACTIVE' ? <UserX size={13} /> : <UserCheck size={13} />}
                        </Button>
                        <Button variant="ghost" size="xs" className="gap-1 rounded-lg">
                          <Eye size={12} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pagination */}
        <Pagination
          currentPage={1}
          totalPages={1}
          onPageChange={() => {}}
          hasNextPage={false}
          hasPreviousPage={false}
        />
      </motion.div>
    </DashboardLayout>
  );
}
