<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vitepress";
import {
  getApiVersionOptions,
  resolveApiRouteContext,
} from "../../versioning.mjs";

const route = useRoute();

const currentPath = computed(() => {
  void route.path;
  return typeof window === "undefined" ? route.path : window.location.pathname;
});

const context = computed(() => resolveApiRouteContext(currentPath.value));
const options = computed(() => getApiVersionOptions(currentPath.value));
const label = computed(() =>
  context.value?.locale === "en" ? "API version" : "API 版本",
);

function formatOption(option: { label: string; status: string }) {
  if (option.status === "current") {
    return context.value?.locale === "en"
      ? `${option.label} (current)`
      : `${option.label}（当前）`;
  }

  return option.label;
}

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const option = options.value.find((item) => item.key === target.value);
  if (!option || option.href === currentPath.value) {
    return;
  }

  window.location.assign(option.href);
}
</script>

<template>
  <label v-if="context && options.length > 0" class="vp-version-switcher">
    <span>{{ label }}</span>
    <select :value="context.version.key" @change="onChange">
      <option v-for="option in options" :key="option.key" :value="option.key">
        {{ formatOption(option) }}
      </option>
    </select>
  </label>
</template>
