"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import {
  listSshHosts,
  createSshHost,
  updateSshHost,
  deleteSshHost,
} from "@/lib/api"
import type { SshHostInfo } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"

interface HostFormState {
  name: string
  host: string
  port: string
  username: string
  identityFile: string
  shellInit: string
}

const EMPTY_FORM: HostFormState = {
  name: "",
  host: "",
  port: "22",
  username: "",
  identityFile: "",
  shellInit: "",
}

export function SshHostSettings() {
  const t = useTranslations("SshHostSettings")
  const [hosts, setHosts] = useState<SshHostInfo[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<SshHostInfo | null>(null)
  const [form, setForm] = useState<HostFormState>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<SshHostInfo | null>(null)
  const [saving, setSaving] = useState(false)

  const reload = () => listSshHosts().then(setHosts).catch(console.error)

  useEffect(() => {
    reload()
  }, [])

  const openAdd = () => {
    setEditingHost(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (h: SshHostInfo) => {
    setEditingHost(h)
    setForm({
      name: h.name,
      host: h.host,
      port: String(h.port),
      username: h.username,
      identityFile: h.identity_file ?? "",
      shellInit: h.shell_init ?? "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const port = parseInt(form.port, 10) || 22
      const identity_file = form.identityFile.trim() || null
      const shell_init = form.shellInit.trim() || null
      if (editingHost) {
        await updateSshHost({
          id: editingHost.id,
          name: form.name.trim(),
          host: form.host.trim(),
          port,
          username: form.username.trim(),
          identity_file,
          shell_init,
        })
      } else {
        await createSshHost({
          name: form.name.trim(),
          host: form.host.trim(),
          port,
          username: form.username.trim(),
          identity_file,
          shell_init,
        })
      }
      setDialogOpen(false)
      await reload()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteSshHost(deleteTarget.id).catch(console.error)
    setDeleteTarget(null)
    await reload()
  }

  const field = (key: keyof HostFormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" />
          {t("addHost")}
        </Button>
      </div>

      {hosts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("emptyState")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {hosts.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{h.name}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {h.username}@{h.host}:{h.port}
                </span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(h)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(h)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingHost ? t("editHost") : t("addHost")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>{t("fields.name")}</Label>
              <Input placeholder={t("fields.namePlaceholder")} {...field("name")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("fields.host")}</Label>
              <Input placeholder={t("fields.hostPlaceholder")} {...field("host")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("fields.port")}</Label>
              <Input type="number" {...field("port")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("fields.username")}</Label>
              <Input
                placeholder={t("fields.usernamePlaceholder")}
                {...field("username")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("fields.identityFile")}</Label>
              <Input
                placeholder={t("fields.identityFilePlaceholder")}
                {...field("identityFile")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("fields.shellInit")}</Label>
              <Input
                placeholder={t("fields.shellInitPlaceholder")}
                {...field("shellInit")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteHost")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm", { name: deleteTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("deleteHost")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
