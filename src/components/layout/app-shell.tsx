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
        <Sidebar user={user} />

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
