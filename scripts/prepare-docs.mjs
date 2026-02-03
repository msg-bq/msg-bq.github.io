import fs from "node:fs";
import path from "node:path";

const mappings = [
  {
    source: path.resolve("docs", "advanced_example.del_md"),
    target: path.resolve("docs", "advanced_example.md"),
  },
];

for (const { source, target } of mappings) {
  if (!fs.existsSync(source)) {
    console.warn(`[prepare-docs] Missing source: ${source}`);
    continue;
  }

  const content = fs.readFileSync(source, "utf8");
  const dir = path.dirname(target);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(target)) {
    const existing = fs.readFileSync(target, "utf8");
    if (existing === content) {
      continue;
    }
  }

  fs.writeFileSync(target, content, "utf8");
  console.log(`[prepare-docs] Wrote ${path.relative(process.cwd(), target)}`);
}
