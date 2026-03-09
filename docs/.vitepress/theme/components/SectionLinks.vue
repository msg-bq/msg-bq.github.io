<script setup lang="ts">
import { computed } from "vue";
import { getVersionBase, resolveRouteContext } from "../../versioning.mjs";
import { useRoute } from "vitepress";

const route = useRoute();

const currentPath = computed(() => {
  void route.path;
  return typeof window === "undefined" ? route.path : window.location.pathname;
});

const context = computed(() => resolveRouteContext(currentPath.value));
const links = computed(() => {
  const locale = context.value.locale;
  const versionKey = context.value.version.key;
  const base = getVersionBase(locale, versionKey);

  return [
    {
      text: locale === "en" ? "Guide" : "指南",
      href: `${base}introduction`,
    },
    {
      text: locale === "en" ? "Usage" : "使用",
      href: `${base}usage/`,
    },
  ];
});
</script>

<template>
  <nav class="vp-section-links" aria-label="Section links">
    <a v-for="link in links" :key="link.href" :href="link.href">
      {{ link.text }}
    </a>
  </nav>
</template>
