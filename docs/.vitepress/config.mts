import { defineConfig } from "vitepress";
import {
  createVersionedLocaleConfig,
  createVersionRewrites,
} from "./versioning.mjs";

const siteDescription =
  "Knowledge Equations based Logic Engine (KELE), a forward-chaining reasoning engine based on Assertion Logic.";

export default defineConfig({
  title: "KELE Documentation",
  description: siteDescription,
  lang: "zh-CN",
  cleanUrls: false,
  lastUpdated: true,
  sitemap: {
    hostname: "https://msg-bq.github.io",
  },
  head: [
    ["meta", { property: "og:title", content: "KELE Documentation" }],
    ["meta", { property: "og:description", content: siteDescription }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:url", content: "https://msg-bq.github.io/" }],
  ],
  rewrites: createVersionRewrites(),
  locales: {
    root: createVersionedLocaleConfig("zh"),
    en: createVersionedLocaleConfig("en"),
  },
  themeConfig: {
    search: { provider: "local" },
  },
});
