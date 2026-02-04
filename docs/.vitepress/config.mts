import { defineConfig } from "vitepress";

export default defineConfig({
  title: "KELE Documentation",
  description: "Knowledge Equations based on Logical Engine",
  lang: "zh-CN",
  cleanUrls: false,
  lastUpdated: true,
  locales: {
    root: { label: "中文", lang: "zh-CN" },
    en: { label: "English", lang: "en-US", link: "/en/" },
  },
  themeConfig: {
    search: { provider: "local" },
    locales: {
      root: {
        nav: [
          { text: "指南", link: "/introduction" },
          { text: "使用", link: "/usage/" },
          {
            text: "GitHub",
            link: "https://github.com/USTC-KnowledgeComputingLab/KELE",
          },
        ],
        sidebar: {
          "/": [
            {
              text: "指南",
              items: [
                { text: "介绍", link: "/introduction" },
                { text: "快速开始", link: "/quick_start" },
                { text: "使用", link: "/usage/" },
                { text: "自定义模块", link: "/custom_module" },
                { text: "高阶示例", link: "/advanced_example" },
              ],
            },
            {
              text: "Usage",
              items: [
                { text: "语法", link: "/usage/syntax" },
                { text: "内置 Hook", link: "/usage/builtin_hooks" },
                { text: "本体库", link: "/usage/ontology_base" },
                { text: "事实库", link: "/usage/fact_base" },
                { text: "规则库", link: "/usage/rule_base" },
                { text: "引擎", link: "/usage/engine" },
                { text: "配置", link: "/usage/config" },
                { text: "用户友好语法", link: "/usage/user_friendly_syntax" },
              ],
            },
          ],
        },
      },
      en: {
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
              text: "Guide",
              items: [
                { text: "Introduction", link: "/en/introduction" },
                { text: "Quick Start", link: "/en/quick_start" },
                { text: "Usage", link: "/en/usage/" },
                { text: "Custom Modules", link: "/en/custom_module" },
              ],
            },
            {
              text: "Usage",
              items: [
                { text: "Syntax", link: "/en/usage/syntax" },
                { text: "Built-in Hook Enabler", link: "/en/usage/builtin_hooks" },
                { text: "Ontology Base", link: "/en/usage/ontology_base" },
                { text: "Fact Base", link: "/en/usage/fact_base" },
                { text: "Rule Base", link: "/en/usage/rule_base" },
                { text: "Engine", link: "/en/usage/engine" },
                { text: "Config", link: "/en/usage/config" },
                { text: "User-friendly Syntax", link: "/en/usage/user_friendly_syntax" },
              ],
            },
          ],
        },
      },
    },
  },
});
