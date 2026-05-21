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

/*
  1. Убираем старый класс принудительного переноса у самой секции.
*/
page = page.replaceAll(
  '<section className="report-section report-page-break-before">',
  '<section className="report-section">'
);

/*
  2. Вставляем отдельный spacer перед разделом 4. Документы.
*/
if (!page.includes('<div className="report-documents-page-spacer" aria-hidden="true" />')) {
  page = page.replace(
    `<section className="report-section">
          <h3 className="report-section-title text-2xl font-semibold">
            4. Документы`,
    `<div className="report-documents-page-spacer" aria-hidden="true" />

        <section className="report-section">
          <h3 className="report-section-title text-2xl font-semibold">
            4. Документы`
  );
}

fs.writeFileSync(reportPagePath, page, "utf8");

/*
  3. Перезаписываем print-стили так, чтобы spacer работал гарантированно.
*/
let styles = fs.readFileSync(reportStylesPath, "utf8");

styles = styles.replace(
  /            \.report-page-break-before \{[\s\S]*?            \}\n/g,
  ""
);

if (!styles.includes(".report-documents-page-spacer")) {
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

            .report-documents-page-spacer {
              display: block !important;
              height: 25mm !important;
              break-before: page !important;
              page-break-before: always !important;
            }`
  );
}

fs.writeFileSync(reportStylesPath, styles, "utf8");

console.log("updated: src/app/app/vehicles/[id]/report/page.tsx");
console.log("updated: src/components/report/report-print-styles.tsx");
console.log("");
console.log("Documents spacer fixed.");