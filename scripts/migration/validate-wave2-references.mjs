import fs from "node:fs";
import path from "node:path";

const legacyRoot = process.env.LEGACY_ROOT || "/home/data/dev_react/awcms-dev/awcms-public/smandapbun";
const transformDir = path.resolve("project-docs/migration/transforms");

const files = [
  "news.sample.json",
  "pages.sample.json",
  "finance-reports.sample.json"
];

function existsInLegacy(p) {
  if (typeof p !== "string") return true;
  if (p.startsWith("http://") || p.startsWith("https://")) return true;
  if (!p.startsWith("/")) return true;
  return fs.existsSync(path.join(legacyRoot, "public", p.slice(1))) || fs.existsSync(path.join(legacyRoot, p.slice(1)));
}

const unresolved = [];

for (const name of files) {
  const full = path.join(transformDir, name);
  const data = JSON.parse(fs.readFileSync(full, "utf8"));
  for (const item of data) {
    for (const row of item.localeRows || []) {
      if (row.imageSource && !existsInLegacy(row.imageSource)) {
        unresolved.push({ file: name, slug: row.slug, field: "imageSource", value: row.imageSource });
      }
      if (row.heroImageSource && !existsInLegacy(row.heroImageSource)) {
        unresolved.push({ file: name, slug: row.slug, field: "heroImageSource", value: row.heroImageSource });
      }
      for (const attachment of row.attachments || []) {
        if (attachment.fileSource && !existsInLegacy(attachment.fileSource)) {
          unresolved.push({ file: name, slug: row.slug, field: "attachments.fileSource", value: attachment.fileSource });
        }
      }
    }
  }
}

const report = {
  checkedFiles: files,
  unresolvedCount: unresolved.length,
  unresolved
};

const reportPath = path.resolve("project-docs/migration/reference-validation-report.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");

if (unresolved.length > 0) {
  console.error(`Unresolved references: ${unresolved.length}`);
  process.exitCode = 1;
} else {
  console.log("No unresolved references in transform samples");
}
