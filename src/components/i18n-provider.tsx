"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl"
import enMessages from "@/i18n/messages/en.json"
import zhCNMessages from "@/i18n/messages/zh-CN.json"
import zhTWMessages from "@/i18n/messages/zh-TW.json"
import {
  APP_LOCALE_TO_INTL_LOCALE,
  DEFAULT_LANGUAGE_SETTINGS,
  getSystemLocaleCandidates,
  normalizeLanguageSettings,
  resolveAppLocale,
} from "@/lib/i18n"
import { getSystemLanguageSettings } from "@/lib/tauri"
import type { AppLocale, SystemLanguageSettings } from "@/lib/types"

interface AppI18nContextValue {
  appLocale: AppLocale
  languageSettings: SystemLanguageSettings
  languageSettingsLoaded: boolean
  setLanguageSettings: (settings: SystemLanguageSettings) => void
}

const MESSAGES_BY_LOCALE: Record<AppLocale, AbstractIntlMessages> = {
  en: enMessages,
  zh_cn: zhCNMessages,
  zh_tw: zhTWMessages,
}

const AppI18nContext = createContext<AppI18nContextValue | null>(null)

function subscribeSystemLocale(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}

  window.addEventListener("languagechange", onStoreChange)
  return () => {
    window.removeEventListener("languagechange", onStoreChange)
  }
}

function getSystemLocaleSnapshot(): string {
  return getSystemLocaleCandidates().join("|")
}

function getSystemLocaleServerSnapshot(): string {
  return ""
}

export function useAppI18n() {
  const context = useContext(AppI18nContext)
  if (!context) {
    throw new Error("useAppI18n must be used within AppI18nProvider")
  }
  return context
}

export function AppI18nProvider({ children }: { children: React.ReactNode }) {
  const [languageSettings, setLanguageSettingsState] =
    useState<SystemLanguageSettings>(DEFAULT_LANGUAGE_SETTINGS)
  const [languageSettingsLoaded, setLanguageSettingsLoaded] = useState(false)

  const systemLocaleSnapshot = useSyncExternalStore(
    subscribeSystemLocale,
    getSystemLocaleSnapshot,
    getSystemLocaleServerSnapshot
  )
  const systemLocaleCandidates = useMemo(
    () => (systemLocaleSnapshot ? systemLocaleSnapshot.split("|") : []),
    [systemLocaleSnapshot]
  )

  const setLanguageSettings = useCallback(
    (settings: SystemLanguageSettings) => {
      setLanguageSettingsState(normalizeLanguageSettings(settings))
    },
    []
  )

  useEffect(() => {
    let cancelled = false

    getSystemLanguageSettings()
      .then((settings) => {
        if (cancelled) return
        setLanguageSettings(settings)
      })
      .catch((err) => {
        console.error("[i18n] load language settings failed:", err)
      })
      .finally(() => {
        if (!cancelled) {
          setLanguageSettingsLoaded(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [setLanguageSettings])

  const appLocale = useMemo(
    () => resolveAppLocale(languageSettings, systemLocaleCandidates),
    [languageSettings, systemLocaleCandidates]
  )

  const intlLocale = APP_LOCALE_TO_INTL_LOCALE[appLocale]

  useEffect(() => {
    document.documentElement.lang = intlLocale
  }, [intlLocale])

  const contextValue = useMemo<AppI18nContextValue>(
    () => ({
      appLocale,
      languageSettings,
      languageSettingsLoaded,
      setLanguageSettings,
    }),
    [appLocale, languageSettings, languageSettingsLoaded, setLanguageSettings]
  )

  return (
    <AppI18nContext.Provider value={contextValue}>
      <NextIntlClientProvider
        locale={intlLocale}
        messages={MESSAGES_BY_LOCALE[appLocale]}
      >
        {children}
      </NextIntlClientProvider>
    </AppI18nContext.Provider>
  )
}
