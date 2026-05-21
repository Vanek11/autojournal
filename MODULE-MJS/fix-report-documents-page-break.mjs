import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const reportPagePath = path.join(
  root,
  "src/app/app/vehicles/[id]/report/page.tsx"
);

const reportStylesPath = path.join(
  root,
  "src/components/report/report-print-styles.tsx"
);

let page = fs.readFileSync(reportPagePath, "utf8");

page = page.replace(
  `<section className="report-section">
          <h3 className="report-section-title text-2xl font-semibold">
            4. Документы`,
  `<section className="report-section report-page-break-before">
          <h3 className="report-section-title text-2xl font-semibold">
            4. Документы`
);

fs.writeFileSync(reportPagePath, page, "utf8");

let styles = fs.readFileSync(reportStylesPath, "utf8");

styles = styles.replace(
  `            .report-section {
              margin-top: 16px !important;
              break-inside: auto;
              page-break-inside: auto;
            }`,
  `            .report-section {
              margin-top: 16px !important;
              break-inside: auto;
              page-break-inside: auto;
            }

            .report-page-break-before {
              break-before: page !important;
              page-break-before: always !important;
              padding-top: 8mm !important;
            }`
);

fs.writeFileSync(reportStylesPath, styles, "utf8");

console.log("updated: src/app/app/vehicles/[id]/report/page.tsx");
console.log("updated: src/components/report/report-print-styles.tsx");
console.log("");
console.log("Documents page break fixed.");