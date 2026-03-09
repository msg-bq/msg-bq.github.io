import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const docsRoot = path.join(repoRoot, "docs");

const SNAPSHOT_SOURCES = [
  { locale: "zh", sourceDir: path.join(docsRoot, "zh") },
  { locale: "en", sourceDir: path.join(docsRoot, "en") },
];

function rewriteContent(content, locale, version) {
  if (locale === "en") {
    return content
      .replaceAll("](/en/", `](/en/${version}/`)
      .replaceAll("link: /en/", `link: /en/${version}/`);
  }

  return content
    .replaceAll("](/", `](/${version}/`)
    .replaceAll("link: /", `link: /${version}/`);
}

async function copyDirectory(sourceDir, targetDir, locale, version) {
  await fs.mkdir(targetDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath, locale, version);
      continue;
    }

    const content = await fs.readFile(sourcePath, "utf8");
    const nextContent = sourcePath.endsWith(".md")
      ? rewriteContent(content, locale, version)
      : content;

    await fs.writeFile(targetPath, nextContent, "utf8");
  }
}

export async function snapshotVersion(version) {
  if (!version || version === "latest") {
    throw new Error("Please provide a concrete version like v1.0.");
  }

  const versionRoot = path.join(docsRoot, "versions", version);
  await fs.rm(versionRoot, { recursive: true, force: true });

  for (const source of SNAPSHOT_SOURCES) {
    const targetDir = path.join(versionRoot, source.locale);
    await copyDirectory(source.sourceDir, targetDir, source.locale, version);
  }

  return versionRoot;
}

async function runCli() {
  const version = process.argv[2];
  const outputDir = await snapshotVersion(version);
  console.log(`[version-docs] Snapshot created at ${path.relative(repoRoot, outputDir)}`);
}

if (process.argv[1] === __filename) {
  runCli().catch((error) => {
    console.error(`[version-docs] ${error.message}`);
    process.exitCode = 1;
  });
}
