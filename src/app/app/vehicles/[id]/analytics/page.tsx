import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ExpensesChart } from "@/components/analytics/expenses-chart";
import { canUseFeature } from "@/lib/plans";

type AnalyticsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const typeLabels: Record<string, string> = {
  maintenance: "ТО",
  repair: "Ремонт",
  fuel: "Заправки",
  expense: "Расходы",
  document: "Документы",
  other: "Другое"
};

function getMonthKey(date: Date) {
  const month = date.toLocaleString("ru-RU", {
    month: "short"
  });

  return `${month} ${date.getFullYear()}`;
}

export default async function VehicleAnalyticsPage({ params }: AnalyticsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // plan-gate:analytics:fresh
  const gateUser = await prisma.user.findUnique({
    where: {
      id: user.id
    },
    select: {
      plan: true
    }
  });

  const activePlan = gateUser?.plan || user.plan;

  if (!canUseFeature(activePlan, "analytics")) {
    redirect("/app/billing?required=analytics");
  }

  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id,
      OR: [
        { ownerId: user.id },
        {
          owner: {
            ownerTeamMembers: {
              some: {
                memberId: user.id
              }
            }
          }
        }
      ]
    },
    include: {
      journalEntries: {
        orderBy: {
          eventDate: "desc"
        }
      }
    }
  });

  if (!vehicle) {
    notFound();
  }

  const entries = vehicle.journalEntries.map((entry) => ({
    id: entry.id,
    type: entry.type,
    title: entry.title,
    eventDate: entry.eventDate,
    mileage: entry.mileage,
    amount: entry.amount ? Number(entry.amount) : 0,
    vendor: entry.vendor
  }));

  const paidEntries = entries.filter((entry) => entry.amount > 0);

  const totalAmount = paidEntries.reduce((sum, entry) => {
    return sum + entry.amount;
  }, 0);

  const averageAmount =
    paidEntries.length > 0 ? Math.round(totalAmount / paidEntries.length) : 0;

  const typeMap = new Map<string, number>();

  for (const entry of paidEntries) {
    typeMap.set(entry.type, (typeMap.get(entry.type) || 0) + entry.amount);
  }

  const expensesByType = Array.from(typeMap.entries())
    .map(([type, amount]) => ({
      type,
      name: typeLabels[type] || type,
      amount
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthMap = new Map<string, number>();

  for (const entry of paidEntries) {
    const key = getMonthKey(entry.eventDate);
    monthMap.set(key, (monthMap.get(key) || 0) + entry.amount);
  }

  const expensesByMonth = Array.from(monthMap.entries())
    .map(([name, amount]) => ({
      name,
      amount
    }))
    .reverse();

  const largestEntries = [...paidEntries]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-[var(--accent-dark)]">
            Аналитика
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Анализ расходов на обслуживание, ремонт, топливо и прочие записи.
          </p>
        </div>

        <Link href={`/app/vehicles/${vehicle.id}`} className="btn-secondary">
          Назад к автомобилю
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm text-[var(--text-secondary)]">Всего расходов</p>
          <p className="mt-3 text-3xl font-semibold">
            {totalAmount.toLocaleString("ru-RU")} ₽
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-[var(--text-secondary)]">Платных записей</p>
          <p className="mt-3 text-3xl font-semibold">
            {paidEntries.length}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-[var(--text-secondary)]">Средний расход</p>
          <p className="mt-3 text-3xl font-semibold">
            {averageAmount.toLocaleString("ru-RU")} ₽
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-[var(--text-secondary)]">Текущий пробег</p>
          <p className="mt-3 text-3xl font-semibold">
            {vehicle.currentMileage.toLocaleString("ru-RU")}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="card-large p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Расходы по месяцам</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Сумма расходов на основе записей журнала.
            </p>
          </div>

          <ExpensesChart data={expensesByMonth} />
        </div>

        <div className="card-large p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Расходы по типам</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Какие категории дают основную нагрузку.
            </p>
          </div>

          {expensesByType.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] p-8 text-center text-sm text-[var(--text-secondary)]">
              Нет расходов для анализа
            </div>
          ) : (
            <div className="space-y-3">
              {expensesByType.map((item) => {
                const percent =
                  totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0;

                return (
                  <div key={item.type} className="rounded-xl border border-[var(--border)] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {percent}% от общей суммы
                        </p>
                      </div>
                      <p className="font-semibold">
                        {item.amount.toLocaleString("ru-RU")} ₽
                      </p>
                    </div>

                    <div className="mt-3 h-2 rounded-full bg-[var(--surface-muted)]">
                      <div
                        className="h-2 rounded-full bg-[var(--accent)]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="card-large p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">Крупные расходы</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Пять самых дорогих записей по автомобилю.
          </p>
        </div>

        {largestEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-strong)] p-8 text-center text-sm text-[var(--text-secondary)]">
            Крупных расходов пока нет
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="bg-[var(--surface-muted)] text-left text-[var(--text-secondary)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">Тип</th>
                  <th className="px-4 py-3 font-medium">Название</th>
                  <th className="px-4 py-3 font-medium">Сервис</th>
                  <th className="px-4 py-3 font-medium">Сумма</th>
                </tr>
              </thead>

              <tbody>
                {largestEntries.map((entry) => (
                  <tr key={entry.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3">
                      {entry.eventDate.toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-4 py-3">
                      {typeLabels[entry.type] || entry.type}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {entry.title}
                    </td>
                    <td className="px-4 py-3">
                      {entry.vendor || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {entry.amount.toLocaleString("ru-RU")} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
