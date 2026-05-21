import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const reportStylesPath = path.join(
  root,
  "src/components/report/report-print-styles.tsx"
);

let content = fs.readFileSync(reportStylesPath, "utf8");

content = content.replaceAll(
  "@page {\n              size: A4;\n              margin: 12mm;\n            }",
  "@page {\n              size: A4;\n              margin: 10mm;\n            }"
);

content = content.replaceAll(
  `.report-page {
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
            }`,
  `.report-page {
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
              box-sizing: border-box !important;
            }`
);

content = content.replaceAll(
  `.report-document {
              border: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              padding: 0 !important;
              background: #ffffff !important;
            }`,
  `.report-document {
              border: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              padding: 15mm !important;
              background: #ffffff !important;
              box-sizing: border-box !important;
            }`
);

content = content.replaceAll(
  `.report-table {
              width: 100% !important;
              min-width: 0 !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
              font-size: 9.2px !important;
            }`,
  `.report-table {
              width: 100% !important;
              min-width: 0 !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
              font-size: 8.8px !important;
            }`
);

fs.writeFileSync(reportStylesPath, content, "utf8");

console.log("updated: src/components/report/report-print-styles.tsx");
console.log("");
console.log("Report padding fixed.");