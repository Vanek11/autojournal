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

writeFile("src/components/report/print-button.tsx", getContent(function () {/*
"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-primary print:hidden"
    >
      Печать отчета
    </button>
  );
}
*/}));

writeFile("src/app/api/export/route.ts", getContent(function () {/*
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function makeCsv(rows: unknown[][]) {
  return rows.map((row) => row.map(csvEscape).join(";")).join("\n");
}

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");
  const format = searchParams.get("format") || "json";

  if (!vehicleId) {
    return NextResponse.json(
      { success: false, error: "Не указан автомобиль" },
      { status: 400 }
    );
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
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
    return NextResponse.json(
      { success: false, error: "Автомобиль не найден" },
      { status: 404 }
    );
  }

  const data = {
    vehicle: {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      plateNumber: vehicle.plateNumber,
      vin: vehicle.vin,
      fuelType: vehicle.fuelType,
      currentMileage: vehicle.currentMileage,
      notes: vehicle.notes
    },
    journalEntries: vehicle.journalEntries.map((entry) => ({
      id: entry.id,
      type: entry.type,
      title: entry.title,
      description: entry.description,
      eventDate: entry.eventDate.toISOString(),
      mileage: entry.mileage,
      amount: entry.amount ? Number(entry.amount) : null,
      vendor: entry.vendor
    })),
    reminders: vehicle.reminders.map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      triggerType: reminder.triggerType,
      triggerDate: reminder.triggerDate ? reminder.triggerDate.toISOString() : null,
      triggerMileage: reminder.triggerMileage,
      status: reminder.status
    })),
    documents: vehicle.documents.map((document) => ({
      id: document.id,
      title: document.title,
      type: document.type,
      fileUrl: document.fileUrl,
      description: document.description,
      createdAt: document.createdAt.toISOString()
    }))
  };

  if (format === "csv") {
    const rows = [
      ["Дата", "Тип", "Название", "Пробег", "Сумма", "Сервис", "Комментарий"],
      ...data.journalEntries.map((entry) => [
        new Date(entry.eventDate).toLocaleDateString("ru-RU"),
        entry.type,
        entry.title,
        entry.mileage ?? "",
        entry.amount ?? "",
        entry.vendor ?? "",
        entry.description ?? ""
      ])
    ];

    const csv = makeCsv(rows);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="autojournal-${vehicle.make}-${vehicle.model}.csv"`
      }
    });
  }

  return NextResponse.json({
    success: true,
    data
  });
}
*/}));

writeFile("src/app/app/vehicles/[id]/report/page.tsx", getContent(function () {/*
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/report/print-button";

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

  const exportJsonUrl = `/api/export?vehicleId=${vehicle.id}&format=json`;
  const exportCsvUrl = `/api/export?vehicleId=${vehicle.id}&format=csv`;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start print:hidden">
        <div>
          <p className="text-sm font-medium text-[var(--accent-dark)]">
            Отчет
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Сводка по автомобилю для печати, сдачи проекта или демонстрации.
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

      <article className="card-large space-y-8 p-6 print:border-0 print:shadow-none">
        <header className="border-b border-[var(--border)] pb-6">
          <p className="text-sm text-[var(--text-secondary)]">
            AutoJournal
          </p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">
            Отчет по автомобилю
          </h2>
          <p className="mt-3 text-[var(--text-secondary)]">
            Сформировано: {new Date().toLocaleDateString("ru-RU")}
          </p>
        </header>

        <section>
          <h3 className="text-2xl font-semibold">1. Основные данные</h3>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="card p-4 print:shadow-none">
              <p className="text-sm text-[var(--text-secondary)]">Автомобиль</p>
              <p className="mt-2 text-lg font-semibold">
                {vehicle.make} {vehicle.model}
              </p>
            </div>

            <div className="card p-4 print:shadow-none">
              <p className="text-sm text-[var(--text-secondary)]">Год выпуска</p>
              <p className="mt-2 text-lg font-semibold">
                {vehicle.year || "Не указан"}
              </p>
            </div>

            <div className="card p-4 print:shadow-none">
              <p className="text-sm text-[var(--text-secondary)]">Госномер</p>
              <p className="mt-2 text-lg font-semibold">
                {vehicle.plateNumber || "Не указан"}
              </p>
            </div>

            <div className="card p-4 print:shadow-none">
              <p className="text-sm text-[var(--text-secondary)]">VIN</p>
              <p className="mt-2 text-lg font-semibold">
                {vehicle.vin || "Не указан"}
              </p>
            </div>

            <div className="card p-4 print:shadow-none">
              <p className="text-sm text-[var(--text-secondary)]">Тип топлива</p>
              <p className="mt-2 text-lg font-semibold">
                {fuelLabels[vehicle.fuelType] || vehicle.fuelType}
              </p>
            </div>

            <div className="card p-4 print:shadow-none">
              <p className="text-sm text-[var(--text-secondary)]">Текущий пробег</p>
              <p className="mt-2 text-lg font-semibold">
                {vehicle.currentMileage.toLocaleString("ru-RU")} км
              </p>
            </div>
          </div>

          {vehicle.notes ? (
            <div className="mt-4 rounded-xl bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-secondary)]">
              {vehicle.notes}
            </div>
          ) : null}
        </section>

        <section>
          <h3 className="text-2xl font-semibold">2. Финансовая сводка</h3>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div className="card p-4 print:shadow-none">
              <p className="text-sm text-[var(--text-secondary)]">Всего расходов</p>
              <p className="mt-2 text-xl font-semibold">
                {totalAmount.toLocaleString("ru-RU")} ₽
              </p>
            </div>

            <div className="card p-4 print:shadow-none">
              <p className="text-sm text-[var(--text-secondary)]">Записей журнала</p>
              <p className="mt-2 text-xl font-semibold">
                {entries.length}
              </p>
            </div>

            <div className="card p-4 print:shadow-none">
              <p className="text-sm text-[var(--text-secondary)]">ТО</p>
              <p className="mt-2 text-xl font-semibold">
                {maintenanceCount}
              </p>
            </div>

            <div className="card p-4 print:shadow-none">
              <p className="text-sm text-[var(--text-secondary)]">Ремонтов</p>
              <p className="mt-2 text-xl font-semibold">
                {repairCount}
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Количество заправок: {fuelCount}. Документов: {vehicle.documents.length}. Напоминаний: {vehicle.reminders.length}.
          </p>
        </section>

        <section>
          <h3 className="text-2xl font-semibold">3. История обслуживания и расходов</h3>

          {entries.length === 0 ? (
            <p className="mt-4 text-[var(--text-secondary)]">
              Записей журнала пока нет.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-sm">
                <thead className="bg-[var(--surface-muted)] text-left text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Дата</th>
                    <th className="px-4 py-3 font-medium">Тип</th>
                    <th className="px-4 py-3 font-medium">Название</th>
                    <th className="px-4 py-3 font-medium">Пробег</th>
                    <th className="px-4 py-3 font-medium">Сумма</th>
                    <th className="px-4 py-3 font-medium">Сервис</th>
                  </tr>
                </thead>

                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-3">
                        {entry.eventDate.toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-4 py-3">
                        {entryTypeLabels[entry.type] || entry.type}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{entry.title}</p>
                        {entry.description ? (
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            {entry.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {entry.mileage ? `${entry.mileage.toLocaleString("ru-RU")} км` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {entry.amount ? `${entry.amount.toLocaleString("ru-RU")} ₽` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {entry.vendor || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-2xl font-semibold">4. Документы</h3>

          {vehicle.documents.length === 0 ? (
            <p className="mt-4 text-[var(--text-secondary)]">
              Документов пока нет.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {vehicle.documents.map((document) => (
                <div key={document.id} className="card p-4 print:shadow-none">
                  <p className="font-medium">{document.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Тип: {document.type}
                  </p>
                  {document.fileUrl ? (
                    <p className="mt-1 break-all text-sm text-[var(--text-secondary)]">
                      Файл: {document.fileUrl}
                    </p>
                  ) : null}
                  {document.description ? (
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {document.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-2xl font-semibold">5. Напоминания</h3>

          {vehicle.reminders.length === 0 ? (
            <p className="mt-4 text-[var(--text-secondary)]">
              Напоминаний пока нет.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {vehicle.reminders.map((reminder) => (
                <div key={reminder.id} className="card p-4 print:shadow-none">
                  <p className="font-medium">{reminder.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Статус: {reminderStatusLabels[reminder.status] || reminder.status}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Дата: {reminder.triggerDate ? reminder.triggerDate.toLocaleDateString("ru-RU") : "не указана"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Пробег: {reminder.triggerMileage ? `${reminder.triggerMileage.toLocaleString("ru-RU")} км` : "не указан"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </article>
    </div>
  );
}
*/}));

console.log("");
console.log("Report module added.");