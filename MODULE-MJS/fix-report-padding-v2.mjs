import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function writeFile(relativePath, content) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`updated: ${relativePath}`);
}

writeFile(
  "src/components/report/report-print-styles.tsx",
  `export function ReportPrintStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: \`
          @media print {
            @page {
              size: A4;
              margin: 14mm;
            }

            * {
              box-sizing: border-box !important;
            }

            html,
            body {
              width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #111827 !important;
            }

            body {
              font-size: 10.5px !important;
              line-height: 1.35 !important;
            }

            main {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .app-print-hidden,
            .print-hidden,
            .report-toolbar {
              display: none !important;
            }

            .report-page {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }

            .report-document {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 10mm !important;
              border: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: #ffffff !important;
            }

            .report-cover {
              padding-top: 0 !important;
              padding-bottom: 10px !important;
              margin-bottom: 14px !important;
              border-bottom: 1px solid #111827 !important;
            }

            .report-title {
              font-size: 23px !important;
              line-height: 1.15 !important;
            }

            .report-section {
              margin-top: 16px !important;
              break-inside: auto;
              page-break-inside: auto;
            }

            .report-section-title {
              margin-bottom: 8px !important;
              font-size: 15.5px !important;
              break-after: avoid;
              page-break-after: avoid;
            }

            .report-avoid-break,
            .report-card {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .report-grid {
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 7px !important;
            }

            .report-card {
              padding: 7px !important;
              border: 1px solid #d1d5db !important;
              border-radius: 6px !important;
              box-shadow: none !important;
              background: #ffffff !important;
            }

            .report-table-wrap {
              width: 100% !important;
              overflow: visible !important;
            }

            .report-table {
              width: 100% !important;
              min-width: 0 !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
              font-size: 8.4px !important;
            }

            .report-table thead {
              display: table-header-group;
            }

            .report-table tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .report-table th,
            .report-table td {
              padding: 4px !important;
              border: 1px solid #d1d5db !important;
              vertical-align: top !important;
              word-break: break-word !important;
              overflow-wrap: anywhere !important;
              white-space: normal !important;
            }

            .report-table th {
              background: #f3f4f6 !important;
              color: #374151 !important;
              font-weight: 700 !important;
            }

            .report-muted {
              color: #4b5563 !important;
            }

            .report-signatures {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 28px !important;
              margin-top: 26px !important;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .report-sign-line {
              padding-top: 6px !important;
              border-top: 1px solid #111827 !important;
              font-size: 10px !important;
            }
          }
        \`
      }}
    />
  );
}
`
);

console.log("");
console.log("Report padding v2 fixed.");