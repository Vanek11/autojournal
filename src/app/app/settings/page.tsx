import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsManager } from "@/components/settings/settings-manager";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      id: user.id
    },
    select: {
      email: true,
      name: true,
      plan: true,
      createdAt: true
    }
  });

  if (!dbUser) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-[var(--accent-dark)]">
          Настройки
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Профиль пользователя
        </h1>
        <p className="mt-2 max-w-3xl text-[var(--text-secondary)]">
          Управление основными данными аккаунта, отображаемым именем и паролем.
        </p>
      </section>

      <SettingsManager
        user={{
          email: dbUser.email,
          name: dbUser.name,
          plan: dbUser.plan,
          createdAt: dbUser.createdAt.toISOString()
        }}
      />
    </div>
  );
}
