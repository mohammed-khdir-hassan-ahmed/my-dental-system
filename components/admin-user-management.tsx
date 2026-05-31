'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Trash2, Pencil, Users, Search, Shield, UserCircle } from 'lucide-react'
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
  getAllPermissions,
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  type PermissionKey,
  type UserPermissions,
  type UserRole,
} from '@/lib/permissions'
import {
  mobileDialogContent,
  mobileDialogContentWide,
} from '@/components/dashboard-page-shell'
import { settingsInputClass, settingsPrimaryBtnClass } from '@/components/settings-ui'
import { cn } from '@/lib/utils'

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

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs',
        role === 'admin'
          ? 'bg-[#3dc1d3]/15 text-[#3dc1d3]'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {role === 'admin' ? (
        <>
          <Shield className="size-3" />
          ئەدمین
        </>
      ) : (
        <>
          <UserCircle className="size-3" />
          بەکارهێنەر
        </>
      )}
    </span>
  )
}

export function AdminUserManagement() {
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
    fetchUsers()
  }, [fetchUsers])

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

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="گەڕان بە ئیمەیڵ..."
            className={`${settingsInputClass} pr-10`}
          />
        </div>
        <Button
          onClick={openCreate}
          className={cn('h-10 w-full shrink-0 gap-2 sm:h-11 sm:w-auto', settingsPrimaryBtnClass)}
        >
          <Plus className="size-4" />
          ئەکاونتی نوێ
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 sm:py-16">
          <Loader2 className="size-6 animate-spin text-[#3dc1d3] sm:size-7" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-12 text-center sm:py-16">
          <Users className="size-10 text-muted-foreground/40 sm:size-12" />
          <p className="text-sm font-medium text-muted-foreground sm:text-base">
            {searchTerm ? 'هیچ ئەکاونتێک نەدۆزرایەوە' : 'هیچ ئەکاونتێک نییە'}
          </p>
          {!searchTerm && (
            <Button variant="outline" onClick={openCreate} className="mt-1 gap-2 rounded-lg">
              <Plus className="size-4" />
              یەکەم ئەکاونت دروست بکە
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="rounded-xl border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/40 sm:p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3 sm:items-center">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#3dc1d3] text-sm font-bold text-white sm:size-10">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                        {user.email}
                      </p>
                      <RoleBadge role={user.role} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground sm:line-clamp-1 sm:text-xs">
                      {user.role === 'admin'
                        ? 'هەموو دەسەڵاتەکان'
                        : PERMISSION_KEYS.filter((k) => user.permissions[k])
                            .map((k) => PERMISSION_LABELS[k])
                            .join(' · ') || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 border-t border-border/50 pt-3 sm:border-0 sm:pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(user)}
                    className="h-8 flex-1 rounded-lg text-xs sm:h-9 sm:flex-none sm:text-sm"
                  >
                    <Pencil className="size-3.5 sm:mr-1" />
                    <span>دەستکاری</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAskDelete(user)}
                    disabled={deleting}
                    className="h-8 flex-1 rounded-lg text-xs text-destructive hover:bg-destructive/5 hover:text-destructive sm:h-9 sm:flex-none sm:text-sm"
                  >
                    {deleting && deletingUserId === user.id ? (
                      <Loader2 className="size-3.5 animate-spin sm:mr-1" />
                    ) : (
                      <Trash2 className="size-3.5 sm:mr-1" />
                    )}
                    <span>سڕینەوە</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
        <DialogContent className={`${mobileDialogContent} rounded-xl`} dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-base sm:text-lg">دڵنیابوونەوە</DialogTitle>
            <DialogDescription className="text-center text-sm">
              {deletingUserEmail
                ? `ئایا دڵنیایت لە سڕینەوەی ${deletingUserEmail}؟`
                : 'ئایا دڵنیایت لە سڕینەوەی ئەم ئەکاونتە؟'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
              disabled={deleting}
              className="flex-1 rounded-lg"
            >
              پاشگەزبوونەوە
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="flex-1 rounded-lg"
            >
              {deleting ? <Loader2 className="ml-2 size-4 animate-spin" /> : null}
              بەڵێ، بیسڕەوە
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={`${mobileDialogContentWide} rounded-xl`} dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-base sm:text-lg">
              {editingId ? 'دەستکاری ئەکاونت' : 'دروستکردنی ئەکاونتی نوێ'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium sm:text-sm">ئیمەیڵ *</label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={settingsInputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium sm:text-sm">
                وشەی نهێنی {editingId ? '(بەتاڵی بهێڵە ئەگەر ناگۆڕیت)' : '*'}
              </label>
              <Input
                type="password"
                required={!editingId}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={settingsInputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium sm:text-sm">ڕۆڵ</label>
              <Select
                value={form.role}
                onValueChange={(v: UserRole) => setForm({ ...form, role: v })}
              >
                <SelectTrigger className={`${settingsInputClass} w-full`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">ئەدمین (هەموو دەسەڵات)</SelectItem>
                  <SelectItem value="user">بەکارهێنەر (دەسەڵات هەڵبژێرە)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.role === 'user' && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3 sm:space-y-3 sm:p-4">
                <p className="text-xs font-semibold sm:text-sm">دەسەڵاتەکان</p>
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  ئەو بەشانە هەڵبژێرە کە ئەم بەکارهێنەرە دەتوانێت بەکاری بهێنێت
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PERMISSION_KEYS.filter((k) => k !== 'manage_users').map((key) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs sm:text-sm"
                    >
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 rounded accent-[#3dc1d3]"
                        checked={form.permissions[key]}
                        onChange={(e) => togglePermission(key, e.target.checked)}
                      />
                      <span className="leading-tight">{PERMISSION_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 rounded-lg"
              >
                داخستن
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className={cn('flex-1', settingsPrimaryBtnClass)}
              >
                {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {editingId ? 'نوێکردنەوە' : 'دروستکردن'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
