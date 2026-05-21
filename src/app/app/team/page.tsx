import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamManager } from "@/components/team/team-manager";
import { canUseFeature } from "@/lib/plans";

export default async function TeamPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // plan-gate:team:fresh
  const gateUser = await prisma.user.findUnique({
    where: {
      id: user.id
    },
    select: {
      plan: true
    }
  });

  const activePlan = gateUser?.plan || user.plan;

  if (!canUseFeature(activePlan, "team")) {
    redirect("/app/billing?required=team");
  }

  const members = await prisma.teamMember.findMany({
    where: {
      ownerId: user.id
    },
    include: {
      member: {
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const safeMembers = members.map((item) => ({
    id: item.id,
    role: item.role,
    createdAt: item.createdAt.toISOString(),
    member: {
      id: item.member.id,
      email: item.member.email,
      name: item.member.name,
      plan: item.member.plan,
      createdAt: item.member.createdAt.toISOString()
    }
  }));

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-[var(--accent-dark)]">
          Многопользовательский режим
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Команда
        </h1>
        <p className="mt-2 max-w-3xl text-[var(--text-secondary)]">
          Добавляйте пользователей, которым нужно открыть доступ к автомобилям. Это демонстрирует работу проекта в многопользовательском режиме.
        </p>
      </section>

      <TeamManager members={safeMembers} />
    </div>
  );
}
