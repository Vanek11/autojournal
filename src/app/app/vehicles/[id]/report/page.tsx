import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/report/print-button";
import { ReportPrintStyles } from "@/components/report/report-print-styles";
import { canUseFeature } from "@/lib/plans";

type ReportPageProps = {
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

const entryTypeLabels: Record<string, string> = {
  maintenance: "ТО",
  repair: "Ремонт",
  fuel: "Заправка",
  expense: "Расход",
  document: "Документ",
  other: "Другое"
};

const documentTypeLabels: Record<string, string> = {
  receipt: "Чек",
  insurance: "Страховка",
  service_act: "Акт сервиса",
  photo: "Фото",
  pdf: "PDF",
  other: "Другое"
};

const reminderStatusLabels: Record<string, string> = {
  active: "Активно",
  done: "Выполнено",
  postponed: "Отложено",
  cancelled: "Отменено"
};

export default async function VehicleReportPage({ params }: ReportPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // plan-gate:reports:fresh
  const gateUser = await prisma.user.findUnique({
    where: {
      id: user.id
    },
    select: {
      plan: true
    }
  });

  const activePlan = gateUser?.plan || user.plan;

  if (!canUseFeature(activePlan, "reports")) {
    redirect("/app/billing?required=reports");
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
    description: entry.description,
    eventDate: entry.eventDate,
    mileage: entry.mileage,
    amount: entry.amount ? Number(entry.amount) : 0,
    vendor: entry.vendor
  }));

  const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const maintenanceCount = entries.filter((entry) => entry.type === "maintenance").length;
  const repairCount = entries.filter((entry) => entry.type === "repair").length;
  const fuelCount = entries.filter((entry) => entry.type === "fuel").length;

  const reportNumber = `AJ-${vehicle.id.slice(0, 8).toUpperCase()}`;
  const exportJsonUrl = `/api/export?vehicleId=${vehicle.id}&format=json`;
  const exportCsvUrl = `/api/export?vehicleId=${vehicle.id}&format=csv`;

  return (
    <div className="report-page space-y-6">
      <ReportPrintStyles />
      <section className="report-toolbar flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-[var(--accent-dark)]">
            Отчет
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Печатный отчет по автомобилю, журналу, документам и напоминаниям.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/app/vehicles/${vehicle.id}`} className="btn-secondary">
            Назад к автомобилю
          </Link>
          <a href={exportJsonUrl} target="_blank" rel="noreferrer" className="btn-secondary">
            JSON
          </a>
          <a href={exportCsvUrl} className="btn-secondary">
            CSV
          </a>
          <PrintButton />
        </div>
      </section>

      <article className="report-document card-large p-8">
        <header className="report-cover">
          <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                AutoJournal
              </p>
              <h2 className="report-title mt-3 text-4xl font-semibold tracking-tight">
                Отчет по автомобилю
              </h2>
              <p className="report-muted mt-3 text-sm text-[var(--text-secondary)]">
                Документ сформирован автоматически на основании данных журнала.
              </p>
            </div>

            <div className="min-w-56 rounded-xl border border-[var(--border)] p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">Номер</span>
                <span className="font-medium">{reportNumber}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">Дата</span>
                <span className="font-medium">{new Date().toLocaleDateString("ru-RU")}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">Статус</span>
                <span className="font-medium">Информационный</span>
              </div>
            </div>
          </div>
        </header>

        <section className="report-section">
          <h3 className="report-section-title text-2xl font-semibold">
            1. Основные сведения
          </h3>

          <div className="report-grid mt-4 grid gap-4 md:grid-cols-3">
            <div className="report-card card p-4">
              <p className="text-sm text-[var(--text-secondary)]">Автомобиль</p>
              <p className="mt-2 text-lg font-semibold">
                {vehicle.make} {vehicle.model}
              </p>
            </div>

            <div className="report-card card p-4">
              <p className="text-sm text-[var(--text-secondary)]">Год выпуска</p>
              <p className="mt-2 text-lg font-semibold">
                {vehicle.year || "Не указан"}
              </p>
            </div>

            <div className="report-card card p-4">
              <p className="text-sm text-[var(--text-secondary)]">Госномер</p>
              <p className="mt-2 text-lg font-semibold">
                {vehicle.plateNumber || "Не указан"}
              </p>
            </div>

            <div className="report-card card p-4">
              <p className="text-sm text-[var(--text-secondary)]">VIN</p>
              <p className="mt-2 text-lg font-semibold">
                {vehicle.vin || "Не указан"}
              </p>
            </div>

            <div className="report-card card p-4">
              <p className="text-sm text-[var(--text-secondary)]">Тип топлива</p>
              <p className="mt-2 text-lg font-semibold">
                {fuelLabels[vehicle.fuelType] || vehicle.fuelType}
              </p>
            </div>

            <div className="report-card card p-4">
              <p className="text-sm text-[var(--text-secondary)]">Текущий пробег</p>
              <p className="mt-2 text-lg font-semibold">
                {vehicle.currentMileage.toLocaleString("ru-RU")} км
              </p>
            </div>
          </div>

          {vehicle.notes ? (
            <div className="report-card mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-secondary)]">
              {vehicle.notes}
            </div>
          ) : null}
        </section>

        <section className="report-section">
          <h3 className="report-section-title text-2xl font-semibold">
            2. Финансовая сводка
          </h3>

          <div className="report-grid mt-4 grid gap-4 md:grid-cols-4">
            <div className="report-card card p-4">
              <p className="text-sm text-[var(--text-secondary)]">Всего расходов</p>
              <p className="mt-2 text-xl font-semibold">
                {totalAmount.toLocaleString("ru-RU")} ₽
              </p>
            </div>

            <div className="report-card card p-4">
              <p className="text-sm text-[var(--text-secondary)]">Записей журнала</p>
              <p className="mt-2 text-xl font-semibold">
                {entries.length}
              </p>
            </div>

            <div className="report-card card p-4">
              <p className="text-sm text-[var(--text-secondary)]">ТО</p>
              <p className="mt-2 text-xl font-semibold">
                {maintenanceCount}
              </p>
            </div>

            <div className="report-card card p-4">
              <p className="text-sm text-[var(--text-secondary)]">Ремонтов</p>
              <p className="mt-2 text-xl font-semibold">
                {repairCount}
              </p>
            </div>
          </div>

          <p className="report-muted mt-3 text-sm text-[var(--text-secondary)]">
            Количество заправок: {fuelCount}. Документов: {vehicle.documents.length}. Напоминаний: {vehicle.reminders.length}.
          </p>
        </section>

        <section className="report-section">
          <h3 className="report-section-title text-2xl font-semibold">
            3. История обслуживания и расходов
          </h3>

          {entries.length === 0 ? (
            <p className="report-muted mt-4 text-[var(--text-secondary)]">
              Записей журнала пока нет.
            </p>
          ) : (
            <div className="report-table-wrap mt-4">
              <table className="report-table w-full border-collapse text-sm">
                <colgroup>
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "37%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "13%" }} />
                </colgroup>

                <thead className="bg-[var(--surface-muted)] text-left text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-3 py-3 font-medium">Дата</th>
                    <th className="px-3 py-3 font-medium">Тип</th>
                    <th className="px-3 py-3 font-medium">Описание</th>
                    <th className="px-3 py-3 font-medium">Пробег</th>
                    <th className="px-3 py-3 font-medium">Сумма</th>
                    <th className="px-3 py-3 font-medium">Сервис</th>
                  </tr>
                </thead>

                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-[var(--border)]">
                      <td className="px-3 py-3">
                        {entry.eventDate.toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-3 py-3">
                        {entryTypeLabels[entry.type] || entry.type}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{entry.title}</p>
                        {entry.description ? (
                          <p className="report-muted mt-1 text-xs text-[var(--text-secondary)]">
                            {entry.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        {entry.mileage ? `${entry.mileage.toLocaleString("ru-RU")} км` : "—"}
                      </td>
                      <td className="px-3 py-3">
                        {entry.amount ? `${entry.amount.toLocaleString("ru-RU")} ₽` : "—"}
                      </td>
                      <td className="px-3 py-3">
                        {entry.vendor || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="report-section">
          <h3 className="report-section-title text-2xl font-semibold">
            4. Документы
          </h3>

          {vehicle.documents.length === 0 ? (
            <p className="report-muted mt-4 text-[var(--text-secondary)]">
              Документов пока нет.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {vehicle.documents.map((document) => (
                <div key={document.id} className="report-card card p-4">
                  <p className="font-medium">{document.title}</p>
                  <p className="report-muted mt-1 text-sm text-[var(--text-secondary)]">
                    Тип: {documentTypeLabels[document.type] || document.type}
                  </p>
                  {document.fileUrl ? (
                    <p className="report-muted mt-1 break-all text-sm text-[var(--text-secondary)]">
                      Файл: {document.fileUrl}
                    </p>
                  ) : null}
                  {document.description ? (
                    <p className="report-muted mt-2 text-sm text-[var(--text-secondary)]">
                      {document.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="report-section">
          <h3 className="report-section-title text-2xl font-semibold">
            5. Напоминания
          </h3>

          {vehicle.reminders.length === 0 ? (
            <p className="report-muted mt-4 text-[var(--text-secondary)]">
              Напоминаний пока нет.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {vehicle.reminders.map((reminder) => (
                <div key={reminder.id} className="report-card card p-4">
                  <p className="font-medium">{reminder.title}</p>
                  <p className="report-muted mt-1 text-sm text-[var(--text-secondary)]">
                    Статус: {reminderStatusLabels[reminder.status] || reminder.status}
                  </p>
                  <p className="report-muted mt-1 text-sm text-[var(--text-secondary)]">
                    Дата: {reminder.triggerDate ? reminder.triggerDate.toLocaleDateString("ru-RU") : "не указана"}
                  </p>
                  <p className="report-muted mt-1 text-sm text-[var(--text-secondary)]">
                    Пробег: {reminder.triggerMileage ? `${reminder.triggerMileage.toLocaleString("ru-RU")} км` : "не указан"}
                  </p>
                  {reminder.description ? (
                    <p className="report-muted mt-2 text-sm text-[var(--text-secondary)]">
                      {reminder.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="report-section report-avoid-break">
          <h3 className="report-section-title text-2xl font-semibold">
            6. Подтверждение
          </h3>

          <p className="report-muted mt-3 text-sm text-[var(--text-secondary)]">
            Отчет сформирован автоматически в системе AutoJournal. Данные предназначены для просмотра истории обслуживания автомобиля и демонстрации работы учебного проекта.
          </p>

          <div className="report-signatures mt-10 grid gap-10 sm:grid-cols-2">
            <div className="report-sign-line border-t border-[var(--border-strong)] pt-3 text-sm text-[var(--text-secondary)]">
              Владелец автомобиля
            </div>

            <div className="report-sign-line border-t border-[var(--border-strong)] pt-3 text-sm text-[var(--text-secondary)]">
              Дата проверки
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
