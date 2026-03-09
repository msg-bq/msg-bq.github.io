import { defineConfig } from "vitepress";
import {
  createVersionedLocaleConfig,
  createVersionRewrites,
} from "./versioning.mjs";

export default defineConfig({
  title: "KELE Documentation",
  description: "Knowledge Equations based on Logical Engine",
  lang: "zh-CN",
  cleanUrls: false,
  lastUpdated: true,
  rewrites: createVersionRewrites(),
  locales: {
    root: createVersionedLocaleConfig("zh"),
    en: createVersionedLocaleConfig("en"),
  },
  themeConfig: {
    search: { provider: "local" },
  },
});
