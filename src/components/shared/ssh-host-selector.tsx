"use client"

import { useEffect, useState } from "react"
import { listSshHosts, setFolderSshHost } from "@/lib/api"
import type { SshHostInfo } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SshHostSelectorProps {
  folderId: number
  currentSshHostId: number | null
  onChanged?: () => void
}

export function SshHostSelector({
  folderId,
  currentSshHostId,
  onChanged,
}: SshHostSelectorProps) {
  const [hosts, setHosts] = useState<SshHostInfo[]>([])

  useEffect(() => {
    listSshHosts().then(setHosts).catch(console.error)
  }, [])

  const handleChange = async (value: string) => {
    const id = value === "local" ? null : parseInt(value, 10)
    await setFolderSshHost(folderId, id).catch(console.error)
    onChanged?.()
  }

  return (
    <Select
      value={currentSshHostId != null ? String(currentSshHostId) : "local"}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="local">Local</SelectItem>
        {hosts.map((h) => (
          <SelectItem key={h.id} value={String(h.id)}>
            {h.name} ({h.username}@{h.host}:{h.port})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
