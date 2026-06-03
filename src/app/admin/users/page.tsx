"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Search, Users, RefreshCw, X,
  Shield, UserCog, Briefcase, User, Mail, Calendar, Clock,
  Eye, Pencil, Check, ChevronLeft, ChevronRight,
  UserCheck, ArrowUpDown, Grid3X3, List, AlertTriangle,
} from "lucide-react";
import classNames from "classnames";
import { apiGet, apiPatch, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Input";

type UserRole = "admin" | "manager" | "staff" | "customer";

type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  email_verified?: boolean;
  created_at: string;
};

type SortField = "name" | "email" | "role" | "created";
type SortDir = "asc" | "desc";
type ViewMode = "table" | "grid";

const ROLES: { value: UserRole; label: string; icon: React.ReactNode; color: string; badge: "destructive" | "warning" | "primary" | "muted" }[] = [
  { value: "admin", label: "Admin", icon: <Shield className="h-4 w-4" />, color: "text-red-500", badge: "destructive" },
  { value: "manager", label: "Manager", icon: <UserCog className="h-4 w-4" />, color: "text-amber-500", badge: "warning" },
  { value: "staff", label: "Staff", icon: <Briefcase className="h-4 w-4" />, color: "text-blue-500", badge: "primary" },
  { value: "customer", label: "Customer", icon: <User className="h-4 w-4" />, color: "text-muted-foreground", badge: "muted" },
];

const ITEMS_PER_PAGE = 20;

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function getAvatarColor(id: string): string {
  const colors = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-orange-500",
    "bg-pink-500", "bg-cyan-500", "bg-rose-500", "bg-indigo-500",
    "bg-teal-500", "bg-amber-500", "bg-lime-500", "bg-fuchsia-500",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatRelative(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

function getRoleInfo(role: UserRole) {
  return ROLES.find((r) => r.value === role) || ROLES[3];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("customer");
  const [saving, setSaving] = useState(false);
  const [bulkRoleOpen, setBulkRoleOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<UserRole>("customer");
  const [bulkSaving, setBulkSaving] = useState(false);
  const { push } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<User[]>("/users");
      setUsers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("[Users] Load failed:", err);
      push(getApiErrorMessage(err), "error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let result = users;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }

    if (filterRole !== "all") {
      result = result.filter((u) => u.role === filterRole);
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name": cmp = (a.full_name || a.email).localeCompare(b.full_name || b.email); break;
        case "email": cmp = a.email.localeCompare(b.email); break;
        case "role": cmp = ROLES.findIndex((r) => r.value === a.role) - ROLES.findIndex((r) => r.value === b.role); break;
        case "created": cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [users, searchQuery, filterRole, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); setSelected(new Set()); }, [searchQuery, filterRole, sortField, sortDir]);

  const stats = useMemo(() => {
    const adminCount = users.filter((u) => u.role === "admin").length;
    const managerCount = users.filter((u) => u.role === "manager").length;
    const staffCount = users.filter((u) => u.role === "staff").length;
    const customerCount = users.filter((u) => u.role === "customer").length;
    const verifiedCount = users.filter((u) => u.email_verified).length;
    return { total: users.length, adminCount, managerCount, staffCount, customerCount, verifiedCount };
  }, [users]);

  const openEditRole = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role);
  };

  const saveRole = async () => {
    if (!editingUser || newRole === editingUser.role) { setEditingUser(null); return; }
    if (saving) return;
    setSaving(true);
    try {
      await apiPatch(`/users/${editingUser.id}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => u.id === editingUser.id ? { ...u, role: newRole } : u));
      push(`Updated ${editingUser.full_name || editingUser.email} to ${newRole}`, "success");
      setEditingUser(null);
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((u) => u.id)));
    }
  };

  const bulkUpdateRole = async () => {
    if (selected.size === 0 || bulkSaving) return;
    setBulkSaving(true);
    const ids = Array.from(selected);
    let success = 0;
    for (const id of ids) {
      try {
        await apiPatch(`/users/${id}/role`, { role: bulkRole });
        success++;
      } catch (err) {
        console.error(`Failed to update user ${id}:`, getApiErrorMessage(err));
      }
    }
    setUsers((prev) => prev.map((u) => selected.has(u.id) ? { ...u, role: bulkRole } : u));
    push(`Updated ${success} of ${ids.length} users to ${bulkRole}`, success > 0 ? "success" : "error");
    setSelected(new Set());
    setBulkRoleOpen(false);
    setBulkSaving(false);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const hasFilters = searchQuery || filterRole !== "all" || sortField !== "created" || sortDir !== "desc";

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Users"
        subtitle="Manage team members, roles, and access permissions"
        meta={<>{stats.total} users</>}
        actions={
          <Button variant="primary" onClick={load} loading={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats.total} subtitle={`${stats.verifiedCount} verified`} icon={<Users className="h-5 w-5" />} variant="primary" />
        <StatCard title="Admins" value={stats.adminCount} subtitle="Full access" icon={<Shield className="h-5 w-5" />} variant="destructive" />
        <StatCard title="Staff & Managers" value={stats.staffCount + stats.managerCount} subtitle={`${stats.staffCount} staff, ${stats.managerCount} managers`} icon={<UserCheck className="h-5 w-5" />} variant="warning" />
        <StatCard title="Customers" value={stats.customerCount} subtitle="Public accounts" icon={<User className="h-5 w-5" />} variant="default" />
      </div>

      <Card padding="md">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="input pl-11 pr-10"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as UserRole | "all")}
              options={[
                { value: "all", label: "All Roles" },
                ...ROLES.map((r) => ({ value: r.value, label: `${r.label} (${users.filter((u) => u.role === r.value).length})` })),
              ]}
              className="w-full sm:w-44"
            />

            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={classNames("px-3 py-2.5 transition-colors", viewMode === "table" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted")}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={classNames("px-3 py-2.5 transition-colors", viewMode === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted")}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {filterRole !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
                  Role: {getRoleInfo(filterRole).label}
                  <button onClick={() => setFilterRole("all")} className="ml-1 hover:text-foreground"><X className="h-3 w-3" /></button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
                  Search: &quot;{searchQuery}&quot;
                  <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-foreground"><X className="h-3 w-3" /></button>
                </span>
              )}
              <span>{filtered.length} of {users.length} users</span>
            </div>

            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary">{selected.size} selected</span>
                <Button variant="outline" size="sm" onClick={() => setBulkRoleOpen(true)}>
                  <UserCog className="mr-1.5 h-3.5 w-3.5" />
                  Change Role
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {loading && users.length === 0 ? (
        <Card className="p-8"><PageLoading text="Loading users..." /></Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No users found"
            description={hasFilters ? "Try adjusting your search or filters." : "No users have signed up yet."}
          />
        </Card>
      ) : viewMode === "table" ? (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-10 pl-4">
                    <input
                      type="checkbox"
                      checked={paginated.length > 0 && selected.size === paginated.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                  </th>
                  <th>
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      User <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th>
                    <button onClick={() => toggleSort("email")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Email <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th>
                    <button onClick={() => toggleSort("role")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Role <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th>
                    <button onClick={() => toggleSort("created")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Joined <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  const initials = getInitials(user.full_name, user.email);
                  const avatarColor = getAvatarColor(user.id);
                  const isSelected = selected.has(user.id);

                  return (
                    <tr
                      key={user.id}
                      className={classNames(isSelected && "bg-primary/5")}
                    >
                      <td className="pl-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(user.id)}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={classNames("flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0", avatarColor)}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{user.full_name || "No name"}</p>
                            <p className="text-xs text-muted-foreground sm:hidden truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate max-w-[220px]">{user.email}</span>
                        </div>
                      </td>
                      <td>
                        <button onClick={() => openEditRole(user)} className="inline-flex items-center">
                          <Badge variant={roleInfo.badge} dot>
                            {roleInfo.label}
                          </Badge>
                        </button>
                      </td>
                      <td>
                        <div className="text-sm text-muted-foreground" title={formatDate(user.created_at)}>
                          {formatRelative(user.created_at)}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingUser(user)}
                            className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditRole(user)}
                            className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Edit role"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Card className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</span> of{" "}
                <span className="font-medium text-foreground">{filtered.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <Button key={pageNum} variant={page === pageNum ? "primary" : "ghost"} size="sm" onClick={() => setPage(pageNum)} className="w-9">
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>
          )}
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map((user) => {
              const roleInfo = getRoleInfo(user.role);
              const initials = getInitials(user.full_name, user.email);
              const avatarColor = getAvatarColor(user.id);
              const isSelected = selected.has(user.id);

              return (
                <Card
                  key={user.id}
                  padding="md"
                  className={classNames(
                    "relative transition-all duration-200 hover:shadow-md cursor-pointer",
                    isSelected && "ring-2 ring-primary border-primary/30"
                  )}
                  onClick={() => setViewingUser(user)}
                >
                  <div className="absolute top-3 left-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(user.id)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                  </div>

                  <div className="flex flex-col items-center text-center pt-4">
                    <div className={classNames("flex h-14 w-14 items-center justify-center rounded-full text-white text-lg font-bold mb-3", avatarColor)}>
                      {initials}
                    </div>
                    <p className="font-semibold truncate max-w-full">{user.full_name || "No name"}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-full mt-0.5">{user.email}</p>
                    <div className="mt-3">
                      <Badge variant={roleInfo.badge} dot>{roleInfo.label}</Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Joined {formatDate(user.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => setViewingUser(user)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditRole(user)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Role
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Card className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</span> of{" "}
                <span className="font-medium text-foreground">{filtered.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      <Modal open={!!viewingUser} onClose={() => setViewingUser(null)} title="User Details" size="sm">
        {viewingUser && (() => {
          const roleInfo = getRoleInfo(viewingUser.role);
          const initials = getInitials(viewingUser.full_name, viewingUser.email);
          const avatarColor = getAvatarColor(viewingUser.id);
          return (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className={classNames("flex h-16 w-16 items-center justify-center rounded-full text-white text-xl font-bold", avatarColor)}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold truncate">{viewingUser.full_name || "No name set"}</p>
                  <p className="text-sm text-muted-foreground truncate">{viewingUser.email}</p>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Role
                  </span>
                  <Badge variant={roleInfo.badge} dot>{roleInfo.label}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email Verified
                  </span>
                  {viewingUser.email_verified ? (
                    <Badge variant="success" dot>Verified</Badge>
                  ) : (
                    <Badge variant="warning" dot>Pending</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Joined
                  </span>
                  <span className="text-sm font-medium">{formatDate(viewingUser.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Last Active
                  </span>
                  <span className="text-sm font-medium">{formatRelative(viewingUser.created_at)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setViewingUser(null); openEditRole(viewingUser); }}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Change Role
                </Button>
                <Button variant="ghost" onClick={() => setViewingUser(null)}>Close</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Change User Role" size="sm">
        {editingUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <div className={classNames("flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold", getAvatarColor(editingUser.id))}>
                {getInitials(editingUser.full_name, editingUser.email)}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{editingUser.full_name || editingUser.email}</p>
                <p className="text-xs text-muted-foreground truncate">{editingUser.email}</p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Select Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setNewRole(role.value)}
                    className={classNames(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      newRole === role.value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                    )}
                  >
                    <div className={classNames(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      newRole === role.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {role.icon}
                    </div>
                    <div>
                      <p className={classNames("text-sm font-medium", newRole === role.value && "text-primary")}>{role.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {role.value === "admin" ? "Full access" : role.value === "manager" ? "Manage content" : role.value === "staff" ? "Process orders" : "Browse & buy"}
                      </p>
                    </div>
                    {newRole === role.value && (
                      <Check className="ml-auto h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {newRole !== editingUser.role && (
              <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Changing from <strong>{getRoleInfo(editingUser.role).label}</strong> to <strong>{getRoleInfo(newRole).label}</strong>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="primary" onClick={saveRole} loading={saving} className="flex-1" disabled={newRole === editingUser.role}>
                <Check className="mr-2 h-4 w-4" /> Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={bulkRoleOpen} onClose={() => setBulkRoleOpen(false)} title={`Change Role for ${selected.size} Users`} size="sm">
        <div className="space-y-5">
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <Users className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{selected.size} users selected</span>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Assign Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setBulkRole(role.value)}
                  className={classNames(
                    "flex items-center gap-2 rounded-xl border p-3 text-left transition-all",
                    bulkRole === role.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className={classNames(
                    "flex h-7 w-7 items-center justify-center rounded-lg",
                    bulkRole === role.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {role.icon}
                  </div>
                  <span className="text-sm font-medium">{role.label}</span>
                  {bulkRole === role.value && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="primary" onClick={bulkUpdateRole} loading={bulkSaving} className="flex-1">
              Apply to {selected.size} Users
            </Button>
            <Button variant="outline" onClick={() => setBulkRoleOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
