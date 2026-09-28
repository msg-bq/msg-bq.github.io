import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("docs/.vitepress/dist");
const source = path.join(dist, "sitemap.xml");
const target = path.join(dist, "sitemap-pages.xml");

const sitemap = fs.readFileSync(source, "utf8")
  .replace(/\s+xmlns:(?:news|image|video|xhtml)="[^"]*"/g, "")
  .replace(/\s*<xhtml:link\b[^>]*\/>/g, "");

fs.writeFileSync(target, sitemap, "utf8");

const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(([, url]) => url)
  .join("\n");

fs.writeFileSync(path.join(dist, "sitemap-pages.txt"), `${urls}\n`, "utf8");
