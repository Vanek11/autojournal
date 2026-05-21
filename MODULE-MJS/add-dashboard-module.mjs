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

writeFile("src/app/app/dashboard/page.tsx", getContent(function () {/*
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const entryTypeLabels: Record<string, string> = {
  maintenance: "ТО",
  repair: "Ремонт",
  fuel: "Заправка",
  expense: "Расход",
  document: "Документ",
  other: "Другое"
};

const reminderStatusLabels: Record<string, string> = {
  active: "Активно",
  done: "Выполнено",
  postponed: "Отложено",
  cancelled: "Отменено"
};

function startOfCurrentMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getReminderSortValue(reminder: {
  triggerDate: Date | null;
  triggerMileage: number | null;
}) {
  if (reminder.triggerDate) {
    return reminder.triggerDate.getTime();
  }

  if (reminder.triggerMileage != null) {
    return Date.now() + reminder.triggerMileage;
  }

  return Number.MAX_SAFE_INTEGER;
}

function getReminderState(
  reminder: {
    status: string;
    triggerType: string;
    triggerDate: Date | null;
    triggerMileage: number | null;
  },
  currentMileage: number
) {
  if (reminder.status === "done") {
    return "Выполнено";
  }

  if (reminder.status === "cancelled") {
    return "Отменено";
  }

  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 7);

  const hasDateTrigger =
    reminder.triggerType === "date" || reminder.triggerType === "date_and_mileage";

  const hasMileageTrigger =
    reminder.triggerType === "mileage" || reminder.triggerType === "date_and_mileage";

  if (
    hasMileageTrigger &&
    reminder.triggerMileage != null &&
    currentMileage >= reminder.triggerMileage
  ) {
    return "Пора по пробегу";
  }

  if (hasDateTrigger && reminder.triggerDate) {
    if (reminder.triggerDate < now) {
      return "Просрочено";
    }

    if (reminder.triggerDate <= soon) {
      return "Скоро";
    }
  }

  return reminderStatusLabels[reminder.status] || reminder.status;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const vehicles = await prisma.vehicle.findMany({
    where: {
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
      },
      reminders: {
        orderBy: {
          createdAt: "desc"
        }
      },
      documents: {
        orderBy: {
          createdAt: "desc"
        }
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const monthStart = startOfCurrentMonth();

  const allEntries = vehicles
    .flatMap((vehicle) =>
      vehicle.journalEntries.map((entry) => ({
        ...entry,
        vehicle
      }))
    )
    .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());

  const allReminders = vehicles
    .flatMap((vehicle) =>
      vehicle.reminders.map((reminder) => ({
        ...reminder,
        vehicle
      }))
    );

  const monthlyExpenses = allEntries
    .filter((entry) => entry.eventDate >= monthStart)
    .reduce((sum, entry) => sum + (entry.amount ? Number(entry.amount) : 0), 0);

  const totalExpenses = allEntries.reduce((sum, entry) => {
    return sum + (entry.amount ? Number(entry.amount) : 0);
  }, 0);

  const documentsCount = vehicles.reduce((sum, vehicle) => {
    return sum + vehicle.documents.length;
  }, 0);

  const activeReminders = allReminders.filter((reminder) => {
    return reminder.status === "active";
  });

  const nearestReminders = activeReminders
    .sort((a, b) => getReminderSortValue(a) - getReminderSortValue(b))
    .slice(0, 5);

  const recentEntries = allEntries.slice(0, 6);

  const vehicleCards = vehicles.map((vehicle) => {
    const vehicleExpenses = vehicle.journalEntries.reduce((sum, entry) => {
      return sum + (entry.amount ? Number(entry.amount) : 0);
    }, 0);

    const activeVehicleReminders = vehicle.reminders.filter((reminder) => {
      return reminder.status === "active";
    }).length;

    return {
      id: vehicle.id,
      title: `${vehicle.make} ${vehicle.model}`,
      plateNumber: vehicle.plateNumber,
      currentMileage: vehicle.currentMileage,
      expenses: vehicleExpenses,
      entriesCount: vehicle.journalEntries.length,
      documentsCount: vehicle.documents.length,
      remindersCount: activeVehicleReminders,
      owner: vehicle.owner
    };
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-medium text-[var(--accent-dark)]">
            Обзор
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Панель управления AutoJournal
          </h1>
          <p className="mt-2 max-w-3xl text-[var(--text-secondary)]">
            Сводка по автомобилям, расходам, документам, журналу обслуживания и напоминаниям.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/app/vehicles" className="btn-primary">
            Автомобили
          </Link>
          <Link href="/app/team" className="btn-secondary">
            Команда
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm text-[var(--text-secondary)]">Автомобилей</p>
          <p className="mt-3 text-3xl font-semibold">
            {vehicles.length}
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Личные и доступные по команде
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-[var(--text-secondary)]">Расходов за месяц</p>
          <p className="mt-3 text-3xl font-semibold">
            {monthlyExpenses.toLocaleString("ru-RU")} ₽
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            По записям текущего месяца
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-[var(--text-secondary)]">Активных напоминаний</p>
          <p className="mt-3 text-3xl font-semibold">
            {activeReminders.length}
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            По дате и пробегу
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-[var(--text-secondary)]">Документов</p>
          <p className="mt-3 text-3xl font-semibold">
            {documentsCount}
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Фото, чеки, PDF и ссылки
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="card-large overflow-hidden">
          <div className="border-b border-[var(--border)] p-6">
            <h2 className="text-xl font-semibold">Последние записи журнала</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Последние события по обслуживанию, ремонту, топливу и расходам.
            </p>
          </div>

          {recentEntries.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="text-lg font-semibold">Записей пока нет</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Добавьте автомобиль и первую запись журнала.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recentEntries.map((entry) => (
                <article key={entry.id} className="flex flex-col justify-between gap-3 p-5 md:flex-row md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs text-[var(--accent-dark)]">
                        {entryTypeLabels[entry.type] || entry.type}
                      </span>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {entry.eventDate.toLocaleDateString("ru-RU")}
                      </p>
                    </div>

                    <h3 className="mt-2 font-semibold">
                      {entry.title}
                    </h3>

                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {entry.vehicle.make} {entry.vehicle.model}
                      {entry.vendor ? ` · ${entry.vendor}` : ""}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="font-semibold">
                      {entry.amount ? `${Number(entry.amount).toLocaleString("ru-RU")} ₽` : "Без суммы"}
                    </p>
                    {entry.mileage ? (
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {entry.mileage.toLocaleString("ru-RU")} км
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="card-large overflow-hidden">
          <div className="border-b border-[var(--border)] p-6">
            <h2 className="text-xl font-semibold">Ближайшие напоминания</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              События, требующие внимания по сроку или пробегу.
            </p>
          </div>

          {nearestReminders.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="text-lg font-semibold">Нет активных напоминаний</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Создайте напоминание в карточке автомобиля.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {nearestReminders.map((reminder) => (
                <article key={reminder.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs text-[var(--accent-dark)]">
                      {getReminderState(reminder, reminder.vehicle.currentMileage)}
                    </span>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {reminder.vehicle.make} {reminder.vehicle.model}
                    </p>
                  </div>

                  <h3 className="mt-2 font-semibold">
                    {reminder.title}
                  </h3>

                  <div className="mt-2 grid gap-2 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
                    <p>
                      Дата: {reminder.triggerDate ? reminder.triggerDate.toLocaleDateString("ru-RU") : "не указана"}
                    </p>
                    <p>
                      Пробег: {reminder.triggerMileage ? `${reminder.triggerMileage.toLocaleString("ru-RU")} км` : "не указан"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="card-large overflow-hidden">
        <div className="border-b border-[var(--border)] p-6">
          <h2 className="text-xl font-semibold">Автомобили</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Краткая сводка по каждому автомобилю.
          </p>
        </div>

        {vehicleCards.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold">Автомобилей пока нет</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Перейдите в раздел автомобилей и добавьте первую машину.
            </p>

            <Link href="/app/vehicles" className="btn-primary mt-5 inline-flex">
              Добавить автомобиль
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 p-6 lg:grid-cols-2">
            {vehicleCards.map((vehicle) => (
              <article key={vehicle.id} className="card p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {vehicle.title}
                    </h3>

                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {vehicle.plateNumber || "Госномер не указан"} · {vehicle.currentMileage.toLocaleString("ru-RU")} км
                    </p>

                    {vehicle.owner.id !== user.id ? (
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Владелец: {vehicle.owner.name || vehicle.owner.email}
                      </p>
                    ) : null}
                  </div>

                  <Link href={`/app/vehicles/${vehicle.id}`} className="btn-secondary text-sm">
                    Открыть
                  </Link>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-[var(--surface-muted)] p-3">
                    <p className="text-xs text-[var(--text-secondary)]">Расходы</p>
                    <p className="mt-1 font-semibold">
                      {vehicle.expenses.toLocaleString("ru-RU")} ₽
                    </p>
                  </div>

                  <div className="rounded-xl bg-[var(--surface-muted)] p-3">
                    <p className="text-xs text-[var(--text-secondary)]">Записи</p>
                    <p className="mt-1 font-semibold">
                      {vehicle.entriesCount}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[var(--surface-muted)] p-3">
                    <p className="text-xs text-[var(--text-secondary)]">Документы</p>
                    <p className="mt-1 font-semibold">
                      {vehicle.documentsCount}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[var(--surface-muted)] p-3">
                    <p className="text-xs text-[var(--text-secondary)]">Напоминания</p>
                    <p className="mt-1 font-semibold">
                      {vehicle.remindersCount}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/app/vehicles" className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="font-semibold">Управление автомобилями</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Добавление машин, просмотр карточек и переход к журналу.
          </p>
        </Link>

        <Link href="/app/team" className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="font-semibold">Команда</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Добавление пользователей для совместного доступа.
          </p>
        </Link>

        <Link href="/app/billing" className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="font-semibold">Тариф</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Демонстрация подписки и имитации платежей.
          </p>
        </Link>
      </section>
    </div>
  );
}
*/}));

console.log("");
console.log("Dashboard module added.");