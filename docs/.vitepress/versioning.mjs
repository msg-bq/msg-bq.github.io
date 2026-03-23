export const DOC_VERSIONS = [
  { key: "latest", label: "latest", status: "current" },
  { key: "v0.1", label: "v0.1", status: "archived" },
];

export const API_DOC_VERSIONS = [
  { key: "v0.2", label: "v0.2", status: "current" },
  { key: "v0.1", label: "v0.1", status: "archived" },
];

const VERSION_KEYS = new Set(DOC_VERSIONS.map((version) => version.key));
const API_VERSION_KEYS = new Set(API_DOC_VERSIONS.map((version) => version.key));
const LOCALES = ["zh", "en"];

function normalizeVersionKey(versionKey = "latest") {
  return VERSION_KEYS.has(versionKey) ? versionKey : "latest";
}

function normalizeLocale(locale = "zh") {
  return LOCALES.includes(locale) ? locale : "zh";
}

function normalizeApiVersionKey(versionKey = "v0.2") {
  return API_VERSION_KEYS.has(versionKey) ? versionKey : "v0.2";
}

export function getVersionBase(locale = "zh", versionKey = "latest") {
  const normalizedLocale = normalizeLocale(locale);
  const normalizedVersion = normalizeVersionKey(versionKey);

  if (normalizedVersion === "latest") {
    return normalizedLocale === "en" ? "/en/" : "/";
  }

  return normalizedLocale === "en"
    ? `/en/${normalizedVersion}/`
    : `/${normalizedVersion}/`;
}

export function getApiVersionBase(locale = "zh", versionKey = "v0.2") {
  const normalizedLocale = normalizeLocale(locale);
  const normalizedVersion = normalizeApiVersionKey(versionKey);

  if (normalizedVersion === "v0.2") {
    return normalizedLocale === "en" ? "/en/" : "/";
  }

  return normalizedLocale === "en"
    ? `/en/api/${normalizedVersion}/`
    : `/api/${normalizedVersion}/`;
}

function joinDocPath(base, relativePath = "") {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedRelative = relativePath.replace(/^\/+/, "");
  return normalizedRelative ? `${normalizedBase}${normalizedRelative}` : normalizedBase;
}

function createDocLinkBuilder(locale = "zh", versionKey = "latest") {
  const base = getVersionBase(locale, versionKey);
  return (relativePath = "") => joinDocPath(base, relativePath);
}

function createSidebarSection(locale = "zh", versionKey = "latest") {
  const to = createDocLinkBuilder(locale, versionKey);
  const isEnglish = normalizeLocale(locale) === "en";

  if (isEnglish) {
    return [
      {
        text: "Introduction",
        items: [
          { text: "Overview", link: to("introduction") },
          { text: "Why choose KELE?", link: to("guide/why_choose") },
          { text: "Installation", link: to("guide/installation") },
          { text: "Basic Usage", link: to("guide/basic_usage") },
          { text: "Examples", link: to("guide/examples") },
          { text: "Inference Overview", link: to("guide/inference_overview") },
        ],
      },
      {
        text: "Guide",
        items: [
          { text: "Quick Start", link: to("quick_start") },
          { text: "Custom Modules", link: to("custom_module") },
        ],
      },
      {
        text: "Usage",
        items: [
          { text: "Overview", link: to("usage/") },
          { text: "Syntax", link: to("usage/syntax") },
          { text: "Built-in Hook Enabler", link: to("usage/builtin_hooks") },
          { text: "Ontology Base", link: to("usage/ontology_base") },
          { text: "Fact Base", link: to("usage/fact_base") },
          { text: "Rule Base", link: to("usage/rule_base") },
          { text: "Engine", link: to("usage/engine") },
          ...(versionKey === "latest"
            ? [{ text: "HTTP API", link: to("usage/api") }]
            : []),
          { text: "Config", link: to("usage/config") },
          { text: "User-friendly Syntax", link: to("usage/user_friendly_syntax") },
        ],
      },
    ];
  }

  return [
    {
      text: "简介",
      items: [
        { text: "概览", link: to("introduction") },
        { text: "为什么选择 KELE？", link: to("guide/why_choose") },
        { text: "安装", link: to("guide/installation") },
        { text: "基本使用", link: to("guide/basic_usage") },
        { text: "示例", link: to("guide/examples") },
        { text: "推理过程简介", link: to("guide/inference_overview") },
      ],
    },
    {
      text: "指南",
      items: [{ text: "快速开始", link: to("quick_start") }],
    },
    {
      text: "使用",
      items: [
        { text: "使用概览", link: to("usage/") },
        { text: "语法", link: to("usage/syntax") },
        { text: "本体库", link: to("usage/ontology_base") },
        { text: "事实库", link: to("usage/fact_base") },
        { text: "规则库", link: to("usage/rule_base") },
        { text: "引擎", link: to("usage/engine") },
        ...(versionKey === "latest"
          ? [{ text: "HTTP API", link: to("usage/api") }]
          : []),
        { text: "配置", link: to("usage/config") },
        { text: "用户友好语法", link: to("usage/user_friendly_syntax") },
      ],
    },
    {
      text: "扩展",
      items: [
        { text: "内置 Hook", link: to("usage/builtin_hooks") },
        { text: "自定义模块", link: to("custom_module") },
      ],
    },
  ];
}

export function createVersionedNav() {
  return [
    {
      text: "GitHub",
      link: "https://github.com/USTC-KnowledgeComputingLab/KELE",
    },
  ];
}

export function createVersionedSidebar(locale = "zh") {
  const normalizedLocale = normalizeLocale(locale);
  const sidebar = {};

  for (const version of DOC_VERSIONS) {
    sidebar[getVersionBase(normalizedLocale, version.key)] = createSidebarSection(
      normalizedLocale,
      version.key,
    );
  }

  return sidebar;
}

export function createVersionedLocaleConfig(locale = "zh") {
  const normalizedLocale = normalizeLocale(locale);
  const isEnglish = normalizedLocale === "en";

  return {
    label: isEnglish ? "English" : "中文",
    lang: isEnglish ? "en-US" : "zh-CN",
    ...(isEnglish ? { link: "/en/" } : {}),
    themeConfig: {
      nav: createVersionedNav(),
      sidebar: createVersionedSidebar(normalizedLocale),
    },
  };
}

export function createVersionRewrites() {
  const rewrites = {
    "zh/:rest*": ":rest*",
    "api-versions/v0.1/zh/:rest*": "api/v0.1/:rest*",
    "api-versions/v0.1/en/:rest*": "en/api/v0.1/:rest*",
  };

  for (const version of DOC_VERSIONS) {
    if (version.key === "latest") {
      continue;
    }

    rewrites[`versions/${version.key}/zh/:rest*`] = `${version.key}/:rest*`;
    rewrites[`versions/${version.key}/en/:rest*`] = `en/${version.key}/:rest*`;
  }

  return rewrites;
}

function stripHtmlSuffix(path = "") {
  return path.endsWith(".html") ? path.slice(0, -5) : path;
}

export function isApiDocPath(rawPath = "/") {
  const path = stripHtmlSuffix(rawPath.split(/[?#]/, 1)[0] || "/");

  if (path === "/usage/api" || path === "/en/usage/api") {
    return true;
  }

  return API_DOC_VERSIONS.some((version) => {
    if (version.key === "v0.2") {
      return false;
    }

    return (
      path === `/api/${version.key}/usage/api` ||
      path === `/en/api/${version.key}/usage/api`
    );
  });
}

function matchBase(path, base) {
  if (base === "/") {
    return { matched: true, restPath: path.replace(/^\/+/, "") };
  }

  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const exactBase = normalizedBase.slice(0, -1);

  if (path === exactBase || path === normalizedBase) {
    return { matched: true, restPath: "" };
  }

  if (path.startsWith(normalizedBase)) {
    return { matched: true, restPath: path.slice(normalizedBase.length) };
  }

  return { matched: false, restPath: "" };
}

export function resolveRouteContext(rawPath = "/") {
  const path = rawPath.split(/[?#]/, 1)[0] || "/";
  const prioritizedVersions = [
    ...DOC_VERSIONS.filter((version) => version.key !== "latest"),
    ...DOC_VERSIONS.filter((version) => version.key === "latest"),
  ];

  for (const version of prioritizedVersions) {
    const enBase = getVersionBase("en", version.key);
    const enMatch = matchBase(path, enBase);
    if (enMatch.matched) {
      return {
        locale: "en",
        version,
        base: enBase,
        restPath: enMatch.restPath,
      };
    }
  }

  for (const version of prioritizedVersions) {
    const zhBase = getVersionBase("zh", version.key);
    const zhMatch = matchBase(path, zhBase);
    if (zhMatch.matched) {
      return {
        locale: "zh",
        version,
        base: zhBase,
        restPath: zhMatch.restPath,
      };
    }
  }

  return {
    locale: "zh",
    version: DOC_VERSIONS[0],
    base: "/",
    restPath: path.replace(/^\/+/, ""),
  };
}

export function getVersionHref(path, versionKey = "latest") {
  const context = resolveRouteContext(path);
  return joinDocPath(getVersionBase(context.locale, versionKey), context.restPath);
}

export function getVersionOptions(path) {
  if (isApiDocPath(path)) {
    return [];
  }

  const context = resolveRouteContext(path);

  return DOC_VERSIONS.map((version) => ({
    ...version,
    active: version.key === context.version.key,
    href: getVersionHref(path, version.key),
  }));
}

export function resolveApiRouteContext(rawPath = "/") {
  if (!isApiDocPath(rawPath)) {
    return null;
  }

  const path = stripHtmlSuffix(rawPath.split(/[?#]/, 1)[0] || "/");
  const locale = path.startsWith("/en/") ? "en" : "zh";

  for (const version of API_DOC_VERSIONS) {
    if (version.key === "v0.2") {
      const latestPath = locale === "en" ? "/en/usage/api" : "/usage/api";
      if (path === latestPath) {
        return { locale, version };
      }
      continue;
    }

    const archivedPath =
      locale === "en"
        ? `/en/api/${version.key}/usage/api`
        : `/api/${version.key}/usage/api`;
    if (path === archivedPath) {
      return { locale, version };
    }
  }

  return null;
}

export function getApiVersionHref(path, versionKey = "v0.2") {
  const context = resolveApiRouteContext(path) ?? resolveRouteContext(path);
  const locale = context.locale;
  const normalizedVersion = normalizeApiVersionKey(versionKey);

  return joinDocPath(getApiVersionBase(locale, normalizedVersion), "usage/api");
}

export function getApiVersionOptions(path) {
  const context = resolveApiRouteContext(path);
  if (!context) {
    return [];
  }

  return API_DOC_VERSIONS.map((version) => ({
    ...version,
    active: version.key === context.version.key,
    href: getApiVersionHref(path, version.key),
  }));
}
