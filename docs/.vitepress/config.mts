import { defineConfig } from "vitepress";

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
  rewrites: {
    "zh/:rest*": ":rest*",
  },
  locales: {
    root: {
      label: "简体中文",
      lang: "zh-CN",
      themeConfig: {
        nav: [
          { text: "介绍", link: "/introduction" },
          { text: "用法", link: "/usage/" },
          {
            text: "GitHub",
            link: "https://github.com/USTC-KnowledgeComputingLab/KELE",
          },
        ],
        sidebar: {
          "/": [
            {
              text: "介绍",
              items: [
                { text: "概览", link: "/introduction" },
                { text: "为什么选择 KELE", link: "/guide/why_choose" },
                { text: "安装", link: "/guide/installation" },
                { text: "基础用法", link: "/guide/basic_usage" },
                { text: "示例", link: "/guide/examples" },
                { text: "推理概览", link: "/guide/inference_overview" },
              ],
            },
            {
              text: "指南",
              items: [
                { text: "快速开始", link: "/quick_start" },
                { text: "自定义模块", link: "/custom_module" },
              ],
            },
            {
              text: "用法",
              items: [
                { text: "概览", link: "/usage/" },
                { text: "语法", link: "/usage/syntax" },
                { text: "知识库 AST I/O", link: "/usage/bnf_parser" },
                { text: "本体库", link: "/usage/ontology_base" },
                { text: "事实库", link: "/usage/fact_base" },
                { text: "规则库", link: "/usage/rule_base" },
                { text: "引擎", link: "/usage/engine" },
                { text: "配置", link: "/usage/config" },
                { text: "用户友好语法", link: "/usage/user_friendly_syntax" },
                { text: "内置 Hook", link: "/usage/builtin_hooks" },
              ],
            },
          ],
        },
      },
    },
    en: {
      label: "English",
      lang: "en-US",
      link: "/en/",
      themeConfig: {
        nav: [
          { text: "Guide", link: "/en/introduction" },
          { text: "Usage", link: "/en/usage/" },
          {
            text: "GitHub",
            link: "https://github.com/USTC-KnowledgeComputingLab/KELE",
          },
        ],
        sidebar: {
          "/en/": [
            {
              text: "Introduction",
              items: [
                { text: "Overview", link: "/en/introduction" },
                { text: "Why choose KELE?", link: "/en/guide/why_choose" },
                { text: "Installation", link: "/en/guide/installation" },
                { text: "Basic Usage", link: "/en/guide/basic_usage" },
                { text: "Examples", link: "/en/guide/examples" },
                { text: "Inference Overview", link: "/en/guide/inference_overview" },
              ],
            },
            {
              text: "Guide",
              items: [
                { text: "Quick Start", link: "/en/quick_start" },
                { text: "Custom Modules", link: "/en/custom_module" },
              ],
            },
            {
              text: "Usage",
              items: [
                { text: "Overview", link: "/en/usage/" },
                { text: "Syntax", link: "/en/usage/syntax" },
                { text: "Knowledge Base AST I/O", link: "/en/usage/bnf_parser" },
                { text: "Ontology Base", link: "/en/usage/ontology_base" },
                { text: "Fact Base", link: "/en/usage/fact_base" },
                { text: "Rule Base", link: "/en/usage/rule_base" },
                { text: "Engine", link: "/en/usage/engine" },
                { text: "Config", link: "/en/usage/config" },
                { text: "User-friendly Syntax", link: "/en/usage/user_friendly_syntax" },
                { text: "Built-in Hook Enabler", link: "/en/usage/builtin_hooks" },
              ],
            },
          ],
        },
      },
    },
  },
  themeConfig: {
    search: { provider: "local" },
  },
});
