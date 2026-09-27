import { defineConfig } from "vitepress";
import {
  createVersionedLocaleConfig,
  createVersionRewrites,
} from "./versioning.mjs";

const siteDescription =
  "KELE (Knowledge Equations based Logic Engine) is a Python forward-chaining inference engine for knowledge representation and reasoning, based on Assertional Logic.";
const siteUrl = "https://msg-bq.github.io";

function canonicalPath(relativePath: string) {
  let path = relativePath.replace(/\\/g, "/").replace(/\.md$/, ".html");
  path = path.replace(/^versions\/([^/]+)\/en\//, "en/$1/");
  path = path.replace(/^versions\/([^/]+)\/zh\//, "$1/");
  path = path.replace(/^zh\//, "");
  return path.replace(/(^|\/)index\.html$/, "$1");
}

export default defineConfig({
  title: "KELE Inference Engine Documentation",
  description: siteDescription,
  lang: "zh-CN",
  cleanUrls: false,
  lastUpdated: true,
  sitemap: {
    hostname: "https://msg-bq.github.io",
  },
  head: [
    ["meta", { property: "og:title", content: "KELE Inference Engine" }],
    ["meta", { property: "og:description", content: siteDescription }],
    ["meta", { property: "og:type", content: "website" }],
  ],
  transformPageData(pageData) {
    const path = canonicalPath(pageData.relativePath);
    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push([
      "link",
      {
        rel: "canonical",
        href: `${siteUrl}${path ? `/${path}` : "/"}`,
      },
    ]);
  },
  rewrites: createVersionRewrites(),
  locales: {
    root: createVersionedLocaleConfig("zh"),
    en: createVersionedLocaleConfig("en"),
  },
  themeConfig: {
    search: { provider: "local" },
  },
});
