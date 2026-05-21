"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { canUseFeature, type FeatureKey } from "@/lib/plans";

type SidebarProps = {
  user: {
    plan: string;
  };
};

const navItems: Array<{
  href: string;
  label: string;
  feature?: FeatureKey;
}> = [
  { href: "/app/dashboard", label: "Дашборд" },
  { href: "/app/vehicles", label: "Автомобили" },
  { href: "/app/team", label: "Команда", feature: "team" },
  { href: "/app/billing", label: "Тариф" },
  { href: "/app/settings", label: "Настройки" }
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="app-print-hidden hidden min-h-screen w-64 border-r border-[var(--border)] bg-white px-4 py-5 lg:block">
      <Link href="/app/dashboard" className="mb-8 block">
        <div className="text-xl font-semibold tracking-tight">AutoJournal</div>
        <div className="mt-1 text-sm text-[var(--text-secondary)]">
          Личный кабинет
        </div>
      </Link>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const locked = item.feature ? !canUseFeature(user.plan, item.feature) : false;
          const href = locked ? `/app/billing?required=${item.feature}` : item.href;

          return (
            <Link
              key={item.href}
              href={href}
              className={[
                "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              ].join(" ")}
            >
              <span>{item.label}</span>
              {locked ? (
                <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                  Standard
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
