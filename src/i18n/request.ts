import { getRequestConfig } from "next-intl/server"
import enMessages from "@/i18n/messages/en.json"

export default getRequestConfig(async () => ({
  locale: "en",
  messages: enMessages,
}))
