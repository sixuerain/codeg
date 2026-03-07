"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowUpCircle,
  Languages,
  Loader2,
  RefreshCw,
  Save,
  Wifi,
} from "lucide-react"
import type { Update } from "@tauri-apps/plugin-updater"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { useAppI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getSystemProxySettings,
  updateSystemLanguageSettings,
  updateSystemProxySettings,
} from "@/lib/tauri"
import type { AppLocale } from "@/lib/types"
import {
  checkAppUpdate,
  closeAppUpdate,
  getCurrentAppVersion,
  installAppUpdate,
  relaunchApp,
} from "@/lib/updater"

const PROXY_EXAMPLE = "http://127.0.0.1:7890"
const APP_LANGUAGE_VALUES = ["en", "zh_cn", "zh_tw"] as const

type LanguageSelectValue = "system" | AppLocale

function isAppLocale(value: string): value is AppLocale {
  return APP_LANGUAGE_VALUES.includes(value as AppLocale)
}

export function SystemNetworkSettings() {
  const t = useTranslations("SystemSettings")
  const tLanguage = useTranslations("Language")
  const locale = useLocale()
  const { languageSettings, languageSettingsLoaded, setLanguageSettings } =
    useAppI18n()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingLanguage, setSavingLanguage] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [proxyUrl, setProxyUrl] = useState("")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentVersion, setCurrentVersion] = useState<string>("")
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [installingUpdate, setInstallingUpdate] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null)

  const [appLanguage, setAppLanguage] = useState<LanguageSelectValue>(
    languageSettings.mode === "system" ? "system" : languageSettings.language
  )

  useEffect(() => {
    setAppLanguage(
      languageSettings.mode === "system" ? "system" : languageSettings.language
    )
  }, [languageSettings])

  const languageLabels = useMemo(
    () => ({
      en: tLanguage("english"),
      zh_cn: tLanguage("simplifiedChinese"),
      zh_tw: tLanguage("traditionalChinese"),
    }),
    [tLanguage]
  )

  const formattedLastCheckedAt = useMemo(() => {
    if (!lastCheckedAt) return null
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(lastCheckedAt)
  }, [lastCheckedAt, locale])

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const [proxySettings, version] = await Promise.all([
        getSystemProxySettings(),
        getCurrentAppVersion(),
      ])

      setEnabled(proxySettings.enabled)
      setProxyUrl(proxySettings.proxy_url ?? "")
      setCurrentVersion(version)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setLoadError(message)
      console.error("[Settings] load system settings failed:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings().catch((err) => {
      console.error("[Settings] load system settings failed:", err)
    })
  }, [loadSettings])

  useEffect(() => {
    return () => {
      if (!availableUpdate) return
      closeAppUpdate(availableUpdate).catch((err) => {
        console.error("[Settings] release updater resource failed:", err)
      })
    }
  }, [availableUpdate])

  const saveSettings = useCallback(async () => {
    if (enabled && !proxyUrl.trim()) {
      toast.error(t("proxyRequired"))
      return
    }

    setSaving(true)
    try {
      const next = await updateSystemProxySettings({
        enabled,
        proxy_url: proxyUrl.trim() || null,
      })
      setEnabled(next.enabled)
      setProxyUrl(next.proxy_url ?? "")
      toast.success(t("saveSuccess"))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(t("saveFailed", { message }))
    } finally {
      setSaving(false)
    }
  }, [enabled, proxyUrl, t])

  const saveLanguage = useCallback(async () => {
    setSavingLanguage(true)

    try {
      const next = await updateSystemLanguageSettings({
        mode: appLanguage === "system" ? "system" : "manual",
        language:
          appLanguage === "system" ? languageSettings.language : appLanguage,
      })

      setLanguageSettings(next)
      toast.success(t("languageSaveSuccess"))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(t("languageSaveFailed", { message }))
    } finally {
      setSavingLanguage(false)
    }
  }, [appLanguage, languageSettings.language, setLanguageSettings, t])

  const checkForUpdates = useCallback(async () => {
    setCheckingUpdate(true)
    setUpdateError(null)

    try {
      const previousUpdate = availableUpdate
      const result = await checkAppUpdate()
      setCurrentVersion(result.currentVersion)
      setLastCheckedAt(new Date())

      if (result.update) {
        setAvailableUpdate(result.update)
        toast.success(t("foundUpdate", { version: result.update.version }))
      } else {
        setAvailableUpdate(null)
        toast.success(t("alreadyLatest"))
      }

      if (previousUpdate && previousUpdate !== result.update) {
        await closeAppUpdate(previousUpdate)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setUpdateError(message)
      toast.error(t("checkUpdateFailed", { message }))
    } finally {
      setCheckingUpdate(false)
    }
  }, [availableUpdate, t])

  const installUpdate = useCallback(async () => {
    if (!availableUpdate) return

    setInstallingUpdate(true)
    setUpdateError(null)

    try {
      await installAppUpdate(availableUpdate)
      toast.success(t("installSuccess"))
      await relaunchApp()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setUpdateError(message)
      toast.error(t("installFailed", { message }))
    } finally {
      setInstallingUpdate(false)
    }
  }, [availableUpdate, t])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("loading")}
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="w-full space-y-4">
        <section className="space-y-1">
          <h1 className="text-sm font-semibold">{t("sectionTitle")}</h1>
          <p className="text-xs text-muted-foreground">
            {t("sectionDescription")}
          </p>
        </section>

        <section className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{t("proxyTitle")}</h2>
          </div>

          <p className="text-xs text-muted-foreground leading-5">
            {t("proxyDescription")}
          </p>

          {loadError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">
              {t("loadFailed", { message: loadError })}
            </div>
          )}

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            {t("enableProxy")}
          </label>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t("proxyAddress")}
            </label>
            <Input
              value={proxyUrl}
              onChange={(event) => setProxyUrl(event.target.value)}
              placeholder={PROXY_EXAMPLE}
            />
            <p className="text-[11px] text-muted-foreground">
              {t("proxyHint", { example: PROXY_EXAMPLE })}
            </p>
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={saveSettings} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {t("save")}
                </>
              )}
            </Button>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{t("languageTitle")}</h2>
          </div>

          <p className="text-xs text-muted-foreground leading-5">
            {t("languageDescription")}
          </p>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t("appLanguage")}
            </label>
            <Select
              value={appLanguage}
              onValueChange={(value) => {
                if (value === "system") {
                  setAppLanguage("system")
                  return
                }
                if (!isAppLocale(value)) return
                setAppLanguage(value)
              }}
              disabled={savingLanguage || !languageSettingsLoaded}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="system">
                  {tLanguage("followSystem")}
                </SelectItem>
                <SelectItem value="en">{languageLabels.en}</SelectItem>
                <SelectItem value="zh_cn">{languageLabels.zh_cn}</SelectItem>
                <SelectItem value="zh_tw">{languageLabels.zh_tw}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={saveLanguage} disabled={savingLanguage}>
              {savingLanguage ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {t("save")}
                </>
              )}
            </Button>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{t("updateTitle")}</h2>
          </div>

          <p className="text-xs text-muted-foreground leading-5">
            {t("updateDescription")}
          </p>

          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <div className="text-muted-foreground">{t("currentVersion")}</div>
              <div className="mt-1 font-medium">
                {currentVersion ? `v${currentVersion}` : "-"}
              </div>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <div className="text-muted-foreground">
                {t("upgradableVersion")}
              </div>
              <div className="mt-1 font-medium">
                {availableUpdate ? `v${availableUpdate.version}` : t("none")}
              </div>
            </div>
          </div>

          {formattedLastCheckedAt && (
            <p className="text-[11px] text-muted-foreground">
              {t("lastChecked", { time: formattedLastCheckedAt })}
            </p>
          )}

          {updateError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">
              {t("updateError", { message: updateError })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={checkForUpdates}
              disabled={checkingUpdate || installingUpdate}
            >
              {checkingUpdate ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("checking")}
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t("checkUpdate")}
                </>
              )}
            </Button>

            {availableUpdate && (
              <Button
                size="sm"
                onClick={installUpdate}
                disabled={installingUpdate || checkingUpdate}
              >
                {installingUpdate ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t("updating")}
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="h-3.5 w-3.5" />
                    {t("upgradeTo", { version: availableUpdate.version })}
                  </>
                )}
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
