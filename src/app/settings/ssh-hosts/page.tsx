"use client"

import { Suspense } from "react"
import { useTranslations } from "next-intl"
import { SshHostSettings } from "@/components/settings/ssh-host-settings"

export default function SettingsSshHostsPage() {
  const t = useTranslations("SettingsPages")
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
          {t("sshHostsLoading")}
        </div>
      }
    >
      <SshHostSettings />
    </Suspense>
  )
}
