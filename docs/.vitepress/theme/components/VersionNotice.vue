<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vitepress";
import { getVersionHref, resolveRouteContext } from "../../versioning.mjs";

const route = useRoute();

const currentPath = computed(() => {
  void route.path;
  return typeof window === "undefined" ? route.path : window.location.pathname;
});

const context = computed(() => resolveRouteContext(currentPath.value));
const latestHref = computed(() => getVersionHref(currentPath.value, "latest"));
const copy = computed(() => {
  if (context.value.locale === "en") {
    return {
      title: `You are reading tutorial ${context.value.version.label}.`,
      action: "Open latest",
    };
  }

  return {
    title: `当前正在浏览教程 ${context.value.version.label}。`,
    action: "查看最新版本",
  };
});
</script>

<template>
  <div v-if="context.version.key !== 'latest'" class="version-notice">
    <span>{{ copy.title }}</span>
    <a :href="latestHref">{{ copy.action }}</a>
  </div>
</template>
