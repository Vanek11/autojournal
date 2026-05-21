"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type HeaderUser = {
  name: string | null;
  email: string;
  plan: string;
};

type HeaderProps = {
  user: HeaderUser;
};

const planLabels: Record<string, string> = {
  free: "Free",
  standard: "Standard",
  premium: "Premium"
};

const mobileLinks = [
  { href: "/app/dashboard", label: "Дашборд" },
  { href: "/app/vehicles", label: "Авто" },
  { href: "/app/team", label: "Команда" },
  { href: "/app/billing", label: "Тариф" },
  { href: "/app/settings", label: "Настройки" }
];

export function Header({ user }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST"
    });

    router.push("/auth/login");
    router.refresh();
  }

  return (
    <header className="app-print-hidden sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(250,250,249,0.9)] px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Аккаунт</p>
          <h1 className="text-base font-semibold sm:text-lg">
            {user.name || user.email}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm text-[var(--text-secondary)] sm:block">
            Тариф: {planLabels[user.plan] || user.plan}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn-secondary text-sm"
          >
            Выйти
          </button>
        </div>
      </div>

      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {mobileLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm text-[var(--text-secondary)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
