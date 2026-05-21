import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function getContent(fn) {
  const source = fn.toString();
  return source.slice(source.indexOf("/*") + 2, source.lastIndexOf("*/")).trimStart();
}

function writeFile(relativePath, content) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`updated: ${relativePath}`);
}

writeFile("src/components/layout/app-shell.tsx", getContent(function () {/*
"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

type AppShellUser = {
  id: string;
  name: string | null;
  email: string;
  plan: string;
};

type AppShellProps = {
  user: AppShellUser;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const isReportPage = pathname.includes("/report");

  if (isReportPage) {
    return (
      <div className="min-h-screen bg-white">
        <main className="mx-auto w-full max-w-[210mm] px-6 py-6 print:m-0 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Header user={user} />

          <main className="px-4 py-6 md:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
*/}));

writeFile("src/components/report/report-print-styles.tsx", getContent(function () {/*
export function ReportPrintStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4;
              margin: 12mm;
            }

            html,
            body {
              background: #ffffff !important;
              color: #111827 !important;
            }

            body {
              font-size: 10.5px !important;
              line-height: 1.35 !important;
            }

            .app-print-hidden,
            .print-hidden,
            .report-toolbar {
              display: none !important;
            }

            .report-page {
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            .report-document {
              border: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              padding: 0 !important;
              background: #ffffff !important;
            }

            .report-cover {
              border-bottom: 1px solid #111827 !important;
              padding-bottom: 12px !important;
              margin-bottom: 16px !important;
            }

            .report-title {
              font-size: 24px !important;
              line-height: 1.15 !important;
            }

            .report-section {
              break-inside: auto;
              page-break-inside: auto;
              margin-top: 18px !important;
            }

            .report-section-title {
              break-after: avoid;
              page-break-after: avoid;
              font-size: 16px !important;
              margin-bottom: 8px !important;
            }

            .report-avoid-break,
            .report-card {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .report-grid {
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 8px !important;
            }

            .report-card {
              border: 1px solid #d1d5db !important;
              border-radius: 6px !important;
              box-shadow: none !important;
              padding: 8px !important;
              background: #ffffff !important;
            }

            .report-table-wrap {
              overflow: visible !important;
            }

            .report-table {
              width: 100% !important;
              min-width: 0 !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
              font-size: 9.2px !important;
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
              border: 1px solid #d1d5db !important;
              padding: 5px !important;
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
              margin-top: 28px !important;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .report-sign-line {
              border-top: 1px solid #111827 !important;
              padding-top: 6px !important;
              font-size: 10px !important;
            }
          }
        `
      }}
    />
  );
}
*/}));

const reportPath = path.join(root, "src/app/app/vehicles/[id]/report/page.tsx");
let report = fs.readFileSync(reportPath, "utf8");

if (!report.includes("@/components/report/report-print-styles")) {
  report = report.replace(
    'import { PrintButton } from "@/components/report/print-button";',
    'import { PrintButton } from "@/components/report/print-button";\nimport { ReportPrintStyles } from "@/components/report/report-print-styles";'
  );
}

report = report.replaceAll(
  'className="print-hidden flex',
  'className="report-toolbar flex'
);

report = report.replaceAll(
  'className="report-table-wrap mt-4 overflow-x-auto"',
  'className="report-table-wrap mt-4"'
);

if (!report.includes("<ReportPrintStyles />")) {
  report = report.replace(
    '<div className="report-page space-y-6">',
    '<div className="report-page space-y-6">\n      <ReportPrintStyles />'
  );
}

fs.writeFileSync(reportPath, report, "utf8");
console.log("updated: src/app/app/vehicles/[id]/report/page.tsx");

console.log("");
console.log("Report print v2 fixed.");