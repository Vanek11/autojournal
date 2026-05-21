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

writeFile("src/lib/validators.ts", getContent(function () {/*
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const vehicleSchema = z.object({
  make: z.string().min(1, "Укажите марку"),
  model: z.string().min(1, "Укажите модель"),
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  plateNumber: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
  fuelType: z.enum(["petrol", "diesel", "gas", "hybrid", "electric", "other"]),
  currentMileage: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional().nullable()
});

export const journalSchema = z.object({
  vehicleId: z.string().min(1),
  type: z.enum(["maintenance", "repair", "fuel", "expense", "document", "other"]),
  title: z.string().min(1, "Укажите название записи"),
  description: z.string().optional().nullable(),
  eventDate: z.string().min(1, "Укажите дату"),
  mileage: z.coerce.number().int().min(0).optional().nullable(),
  amount: z.coerce.number().min(0).optional().nullable(),
  vendor: z.string().optional().nullable()
});
*/}));

writeFile("src/app/api/journal/route.ts", getContent(function () {/*
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { journalSchema } from "@/lib/validators";

async function canAccessVehicle(vehicleId: string, userId: string) {
  return prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      OR: [
        { ownerId: userId },
        {
          owner: {
            ownerTeamMembers: {
              some: {
                memberId: userId
              }
            }
          }
        }
      ]
    }
  });
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

  if (!vehicleId) {
    return NextResponse.json(
      { success: false, error: "Не указан автомобиль" },
      { status: 400 }
    );
  }

  const vehicle = await canAccessVehicle(vehicleId, user.id);

  if (!vehicle) {
    return NextResponse.json(
      { success: false, error: "Автомобиль не найден" },
      { status: 404 }
    );
  }

  const entries = await prisma.journalEntry.findMany({
    where: { vehicleId },
    orderBy: { eventDate: "desc" }
  });

  return NextResponse.json({
    success: true,
    data: entries
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = journalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Некорректные данные записи" },
      { status: 400 }
    );
  }

  const vehicle = await canAccessVehicle(parsed.data.vehicleId, user.id);

  if (!vehicle) {
    return NextResponse.json(
      { success: false, error: "Автомобиль не найден" },
      { status: 404 }
    );
  }

  const entry = await prisma.journalEntry.create({
    data: {
      vehicleId: parsed.data.vehicleId,
      userId: user.id,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description || null,
      eventDate: new Date(parsed.data.eventDate),
      mileage: parsed.data.mileage || null,
      amount: parsed.data.amount || null,
      vendor: parsed.data.vendor || null
    }
  });

  if (parsed.data.mileage && parsed.data.mileage > vehicle.currentMileage) {
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { currentMileage: parsed.data.mileage }
    });
  }

  return NextResponse.json(
    {
      success: true,
      data: entry
    },
    { status: 201 }
  );
}
*/}));

writeFile("src/app/api/journal/[id]/route.ts", getContent(function () {/*
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { journalSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getEntryForUser(entryId: string, userId: string) {
  return prisma.journalEntry.findFirst({
    where: {
      id: entryId,
      vehicle: {
        OR: [
          { ownerId: userId },
          {
            owner: {
              ownerTeamMembers: {
                some: {
                  memberId: userId
                }
              }
            }
          }
        ]
      }
    },
    include: {
      vehicle: true
    }
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const entry = await getEntryForUser(id, user.id);

  if (!entry) {
    return NextResponse.json(
      { success: false, error: "Запись не найдена" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: entry
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const existingEntry = await getEntryForUser(id, user.id);

  if (!existingEntry) {
    return NextResponse.json(
      { success: false, error: "Запись не найдена" },
      { status: 404 }
    );
  }

  if (existingEntry.vehicle.ownerId !== user.id && existingEntry.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: "Нет прав на изменение записи" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = journalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Некорректные данные записи" },
      { status: 400 }
    );
  }

  const updatedEntry = await prisma.journalEntry.update({
    where: { id },
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description || null,
      eventDate: new Date(parsed.data.eventDate),
      mileage: parsed.data.mileage || null,
      amount: parsed.data.amount || null,
      vendor: parsed.data.vendor || null
    }
  });

  return NextResponse.json({
    success: true,
    data: updatedEntry
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const entry = await getEntryForUser(id, user.id);

  if (!entry) {
    return NextResponse.json(
      { success: false, error: "Запись не найдена" },
      { status: 404 }
    );
  }

  if (entry.vehicle.ownerId !== user.id && entry.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: "Нет прав на удаление записи" },
      { status: 403 }
    );
  }

  await prisma.journalEntry.delete({
    where: { id }
  });

  return NextResponse.json({
    success: true
  });
}
*/}));

writeFile("src/components/journal/journal-form.tsx", getContent(function () {/*
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type JournalFormProps = {
  vehicleId: string;
};

const entryTypes = [
  { value: "maintenance", label: "ТО" },
  { value: "repair", label: "Ремонт" },
  { value: "fuel", label: "Заправка" },
  { value: "expense", label: "Расход" },
  { value: "document", label: "Документ" },
  { value: "other", label: "Другое" }
];

export function JournalForm({ vehicleId }: JournalFormProps) {
  const router = useRouter();

  const [type, setType] = useState("maintenance");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState("");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const response = await fetch("/api/journal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        vehicleId,
        type,
        title,
        description,
        eventDate,
        mileage: mileage ? Number(mileage) : null,
        amount: amount ? Number(amount) : null,
        vendor
      })
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Не удалось добавить запись");
      return;
    }

    setTitle("");
    setDescription("");
    setMileage("");
    setAmount("");
    setVendor("");

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card-large space-y-5 p-6">
      <div>
        <h2 className="text-xl font-semibold">Новая запись</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Добавьте ТО, ремонт, заправку, расход или другое событие.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Тип записи</span>
          <select value={type} onChange={(event) => setType(event.target.value)} className="input">
            {entryTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span>Дата</span>
          <input
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="input"
            type="date"
            required
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span>Название</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="input"
            placeholder="Например: замена масла"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>Пробег</span>
          <input
            value={mileage}
            onChange={(event) => setMileage(event.target.value)}
            className="input"
            placeholder="86500"
            type="number"
            min="0"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>Сумма, ₽</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="input"
            placeholder="7500"
            type="number"
            min="0"
            step="0.01"
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span>Сервис / магазин</span>
          <input
            value={vendor}
            onChange={(event) => setVendor(event.target.value)}
            className="input"
            placeholder="Название сервиса или магазина"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Комментарий</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="input min-h-24"
          placeholder="Дополнительные детали"
        />
      </label>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Добавление..." : "Добавить запись"}
      </button>
    </form>
  );
}
*/}));

writeFile("src/components/journal/journal-table.tsx", getContent(function () {/*
"use client";

import { useRouter } from "next/navigation";

type JournalEntry = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  eventDate: string;
  mileage: number | null;
  amount: number | null;
  vendor: string | null;
};

type JournalTableProps = {
  entries: JournalEntry[];
};

const typeLabels: Record<string, string> = {
  maintenance: "ТО",
  repair: "Ремонт",
  fuel: "Заправка",
  expense: "Расход",
  document: "Документ",
  other: "Другое"
};

export function JournalTable({ entries }: JournalTableProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Удалить запись из журнала?");

    if (!confirmed) {
      return;
    }

    await fetch(`/api/journal/${id}`, {
      method: "DELETE"
    });

    router.refresh();
  }

  if (entries.length === 0) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-lg font-semibold">Записей пока нет</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Добавьте первую запись через форму слева или сверху.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[var(--border)] p-5">
        <h2 className="text-lg font-semibold">История записей</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          ТО, ремонты, заправки, расходы и документы.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-[var(--surface-muted)] text-left text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 font-medium">Тип</th>
              <th className="px-4 py-3 font-medium">Название</th>
              <th className="px-4 py-3 font-medium">Пробег</th>
              <th className="px-4 py-3 font-medium">Сумма</th>
              <th className="px-4 py-3 font-medium">Сервис</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>

          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3">
                  {new Date(entry.eventDate).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs text-[var(--accent-dark)]">
                    {typeLabels[entry.type] || entry.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{entry.title}</div>
                  {entry.description ? (
                    <div className="mt-1 max-w-xs truncate text-xs text-[var(--text-secondary)]">
                      {entry.description}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {entry.mileage ? `${entry.mileage.toLocaleString("ru-RU")} км` : "—"}
                </td>
                <td className="px-4 py-3">
                  {entry.amount ? `${entry.amount.toLocaleString("ru-RU")} ₽` : "—"}
                </td>
                <td className="px-4 py-3">{entry.vendor || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
*/}));

writeFile("src/app/app/vehicles/[id]/journal/page.tsx", getContent(function () {/*
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JournalForm } from "@/components/journal/journal-form";
import { JournalTable } from "@/components/journal/journal-table";

type JournalPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VehicleJournalPage({ params }: JournalPageProps) {
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
    eventDate: entry.eventDate.toISOString(),
    mileage: entry.mileage,
    amount: entry.amount ? Number(entry.amount) : null,
    vendor: entry.vendor
  }));

  const totalAmount = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-[var(--accent-dark)]">
            Журнал автомобиля
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Записей: {entries.length} · Общая сумма: {totalAmount.toLocaleString("ru-RU")} ₽
          </p>
        </div>

        <Link href={`/app/vehicles/${vehicle.id}`} className="btn-secondary">
          Назад к автомобилю
        </Link>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <JournalForm vehicleId={vehicle.id} />
        <JournalTable entries={entries} />
      </section>
    </div>
  );
}
*/}));

console.log("");
console.log("Journal module added.");