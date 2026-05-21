import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type VehiclePageProps = {
  params: Promise<{
    id: string;
  }>;
};

const fuelLabels: Record<string, string> = {
  petrol: "Бензин",
  diesel: "Дизель",
  gas: "Газ",
  hybrid: "Гибрид",
  electric: "Электро",
  other: "Другое"
};

export default async function VehiclePage({ params }: VehiclePageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
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
      journalEntries: true,
      reminders: true,
      documents: true
    }
  });

  if (!vehicle) {
    notFound();
  }

  const totalExpenses = vehicle.journalEntries.reduce((sum, entry) => {
    return sum + Number(entry.amount || 0);
  }, 0);

  const navItems = [
    { href: `/app/vehicles/${vehicle.id}/journal`, label: "Журнал" },
    { href: `/app/vehicles/${vehicle.id}/reminders`, label: "Напоминания" },
    { href: `/app/vehicles/${vehicle.id}/documents`, label: "Документы" },
    { href: `/app/vehicles/${vehicle.id}/analytics`, label: "Аналитика" },
    { href: `/app/vehicles/${vehicle.id}/report`, label: "Отчет" }
  ];

  return (
    <div className="space-y-6">
      <section className="card-large p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm font-medium text-[var(--accent-dark)]">
              Карточка автомобиля
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              {vehicle.year ? `${vehicle.year} год` : "Год не указан"} ·{" "}
              {fuelLabels[vehicle.fuelType] || vehicle.fuelType}
            </p>
          </div>

          <Link href="/app/vehicles" className="btn-secondary">
            Назад к списку
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="card p-4">
            <p className="text-sm text-[var(--text-secondary)]">Госномер</p>
            <p className="mt-2 text-lg font-semibold">
              {vehicle.plateNumber || "Не указан"}
            </p>
          </div>

          <div className="card p-4">
            <p className="text-sm text-[var(--text-secondary)]">Пробег</p>
            <p className="mt-2 text-lg font-semibold">
              {vehicle.currentMileage.toLocaleString("ru-RU")} км
            </p>
          </div>

          <div className="card p-4">
            <p className="text-sm text-[var(--text-secondary)]">Записей</p>
            <p className="mt-2 text-lg font-semibold">
              {vehicle.journalEntries.length}
            </p>
          </div>

          <div className="card p-4">
            <p className="text-sm text-[var(--text-secondary)]">Расходы</p>
            <p className="mt-2 text-lg font-semibold">
              {totalExpenses.toLocaleString("ru-RU")} ₽
            </p>
          </div>
        </div>

        {vehicle.notes ? (
          <div className="mt-4 rounded-xl bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-secondary)]">
            {vehicle.notes}
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <p className="font-medium">{item.label}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Перейти в раздел
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}