import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import SectionLinks from "./components/SectionLinks.vue";
import VersionNotice from "./components/VersionNotice.vue";
import VersionSwitcher from "./components/VersionSwitcher.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      "nav-bar-content-before": () => h(SectionLinks),
      "nav-bar-content-after": () => h(VersionSwitcher),
      "doc-top": () => h(VersionNotice),
    }),
};
