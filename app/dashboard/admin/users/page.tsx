'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Shield, Trash2, Pencil, Search, Users } from 'lucide-react'
import {
  notifyUserAdded,
  notifyUserUpdated,
  notifyUserDeleted,
  notifyActionError,
} from '@/lib/notify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getAllPermissions,
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  type PermissionKey,
  type UserPermissions,
  type UserRole,
} from '@/lib/permissions'
import { usePermissions } from '@/hooks/usePermissions'

type AppUser = {
  id: number
  email: string
  role: UserRole
  permissions: UserPermissions
}

function newUserPermissions(): UserPermissions {
  return { ...getAllPermissions(false), dashboard: true }
}

const emptyForm = {
  email: '',
  password: '',
  role: 'user' as UserRole,
  permissions: newUserPermissions(),
}

export default function AdminUsersPage() {
  const { isAdmin, loading: authLoading } = usePermissions()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [deletingUserEmail, setDeletingUserEmail] = useState('')
  const [form, setForm] = useState(emptyForm)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      notifyActionError('هەڵە لە هێنانی بەکارهێنەران')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && isAdmin) fetchUsers()
  }, [authLoading, isAdmin, fetchUsers])

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => u.email.toLowerCase().includes(q))
  }, [users, searchTerm])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, permissions: newUserPermissions() })
    setDialogOpen(true)
  }

  const openEdit = (user: AppUser) => {
    setEditingId(user.id)
    setForm({
      email: user.email,
      password: '',
      role: user.role,
      permissions: { ...user.permissions },
    })
    setDialogOpen(true)
  }

  const handleAskDelete = (user: AppUser) => {
    setDeletingUserId(user.id)
    setDeletingUserEmail(user.email)
    setOpenDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingUserId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/users?id=${deletingUserId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message)
      }
      notifyUserDeleted(deletingUserEmail)
      setOpenDeleteDialog(false)
      setDeletingUserId(null)
      setDeletingUserEmail('')
      await fetchUsers()
    } catch (error) {
      notifyActionError(error instanceof Error ? error.message : 'هەڵە لە سڕینەوە')
    } finally {
      setDeleting(false)
    }
  }

  const togglePermission = (key: PermissionKey, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: checked },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = editingId
        ? {
            id: editingId,
            email: form.email,
            role: form.role,
            permissions: form.role === 'user' ? form.permissions : undefined,
            ...(form.password.trim() ? { password: form.password } : {}),
          }
        : {
            email: form.email,
            password: form.password,
            role: form.role,
            permissions: form.role === 'user' ? form.permissions : undefined,
          }

      const res = await fetch('/api/admin/users', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'failed')
      }

      if (editingId) {
        notifyUserUpdated(form.email)
      } else {
        notifyUserAdded(form.email)
      }
      setDialogOpen(false)
      await fetchUsers()
    } catch (error) {
      notifyActionError(error instanceof Error ? error.message : 'هەڵە ڕوویدا')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">تەنها ئەدمین دەتوانێت ئەم بەشە ببینێت</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1.5" dir="rtl">
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="گەڕان بە ئیمەیڵ"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-lg border-border/90 pr-10 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
        <Button
          onClick={openCreate}
          className="shrink-0 gap-1 bg-primary px-2 py-2 text-xs font-semibold text-white transition-all duration-150 hover:shadow-lg hover:shadow-primary/30 active:scale-95 active:shadow-inner sm:px-3 sm:text-sm"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>بەکارهێنەر</span>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/90 bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-border/40 bg-primary/5">
              <TableRow className="hover:bg-primary/2 transition-colors">
                <TableHead className="text-right font-bold text-primary">#</TableHead>
                <TableHead className="text-right font-bold text-primary">ئیمەیڵ</TableHead>
                <TableHead className="text-right font-bold text-primary">ڕۆڵ</TableHead>
                <TableHead className="text-right font-bold text-primary">دەسەڵاتەکان</TableHead>
                <TableHead className="text-center font-bold text-primary">کردارەکان</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground hover:bg-transparent">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="mx-auto h-12 w-12 opacity-30" />
                      <span className="text-lg">
                        {searchTerm ? 'هیچ بەکارهێنەرێک نەدۆزرایەوە!' : 'هیچ بەکارهێنەرێک نییە'}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, index) => (
                  <TableRow
                    key={user.id}
                    className={`border-b border-gray-100 transition-all duration-200 dark:border-gray-800 ${
                      index % 2 === 0
                        ? 'bg-white dark:bg-slate-950'
                        : 'bg-primary/2 dark:bg-slate-900/30'
                    } hover:bg-primary/5 dark:hover:bg-primary/10`}
                  >
                    <TableCell className="text-xs font-semibold text-foreground">{user.id}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">{user.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl px-2 py-0.5 text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-primary/15 text-primary'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {user.role === 'admin' ? 'ئەدمین' : 'بەکارهێنەر'}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs text-xs font-semibold text-foreground/80">
                      {user.role === 'admin'
                        ? 'هەموو دەسەڵاتەکان'
                        : PERMISSION_KEYS.filter((k) => user.permissions[k])
                            .map((k) => PERMISSION_LABELS[k])
                            .join(' · ') || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(user)}
                          className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAskDelete(user)}
                          disabled={deleting}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900"
                        >
                          {deleting && deletingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete confirmation — same style as staff section */}
      <Dialog
        open={openDeleteDialog}
        onOpenChange={(open) => {
          setOpenDeleteDialog(open)
          if (!open) {
            setDeletingUserId(null)
            setDeletingUserEmail('')
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center">دڵنیابوونەوە</DialogTitle>
            <DialogDescription className="text-center">
              {deletingUserEmail
                ? `ئایا دڵنیایت لە سڕینەوەی ${deletingUserEmail}؟`
                : 'ئایا دڵنیایت لە سڕینەوەی ئەم بەکارهێنەرە؟'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="flex-1"
            >
              {deleting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              بەڵێ ، بیسڕەوە
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
              disabled={deleting}
              className="flex-1"
            >
              پاشگەزبوونەوە
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit user */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center">
              {editingId ? 'دەستکاری بەکارهێنەر' : 'زیادکردنی بەکارهێنەر نوێ'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ئیمەیڵ *</label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                وشەی نهێنی {editingId ? '(بەتاڵی بهێڵە ئەگەر ناگۆڕیت)' : '*'}
              </label>
              <Input
                type="password"
                required={!editingId}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ڕۆڵ</label>
              <Select
                value={form.role}
                onValueChange={(v: UserRole) => setForm({ ...form, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">ئەدمین (هەموو دەسەڵات)</SelectItem>
                  <SelectItem value="user">بەکارهێنەر (دەسەڵات هەڵبژێرە)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.role === 'user' && (
              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">دەسەڵاتەکان</p>
                <p className="text-xs text-muted-foreground">
                  ئەو بەشانە هەڵبژێرە کە ئەم بەکارهێنەرە دەتوانێت بەکاری بهێنێت
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PERMISSION_KEYS.filter((k) => k !== 'manage_users').map((key) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border accent-primary"
                        checked={form.permissions[key]}
                        onChange={(e) => togglePermission(key, e.target.checked)}
                      />
                      <span>{PERMISSION_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary font-semibold text-white hover:shadow-lg hover:shadow-primary/30"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingId ? 'نوێکردنەوە' : 'زیادکردن'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                داخستن
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
