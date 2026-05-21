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

export const reminderSchema = z.object({
  vehicleId: z.string().min(1),
  title: z.string().min(1, "Укажите название напоминания"),
  description: z.string().optional().nullable(),
  triggerType: z.enum(["date", "mileage", "date_and_mileage"]),
  triggerDate: z.string().optional().nullable(),
  triggerMileage: z.coerce.number().int().min(0).optional().nullable()
});
*/}));

writeFile("src/app/api/reminders/route.ts", getContent(function () {/*
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reminderSchema } from "@/lib/validators";

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

  const reminders = await prisma.reminder.findMany({
    where: { vehicleId },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    success: true,
    data: reminders
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
  const parsed = reminderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Некорректные данные напоминания" },
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

  if (
    (parsed.data.triggerType === "date" || parsed.data.triggerType === "date_and_mileage") &&
    !parsed.data.triggerDate
  ) {
    return NextResponse.json(
      { success: false, error: "Для напоминания по дате нужно указать дату" },
      { status: 400 }
    );
  }

  if (
    (parsed.data.triggerType === "mileage" || parsed.data.triggerType === "date_and_mileage") &&
    parsed.data.triggerMileage == null
  ) {
    return NextResponse.json(
      { success: false, error: "Для напоминания по пробегу нужно указать пробег" },
      { status: 400 }
    );
  }

  const reminder = await prisma.reminder.create({
    data: {
      vehicleId: parsed.data.vehicleId,
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      triggerType: parsed.data.triggerType,
      triggerDate: parsed.data.triggerDate ? new Date(parsed.data.triggerDate) : null,
      triggerMileage: parsed.data.triggerMileage ?? null,
      status: "active"
    }
  });

  return NextResponse.json(
    {
      success: true,
      data: reminder
    },
    { status: 201 }
  );
}
*/}));

writeFile("src/app/api/reminders/[id]/route.ts", getContent(function () {/*
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reminderSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getReminderForUser(reminderId: string, userId: string) {
  return prisma.reminder.findFirst({
    where: {
      id: reminderId,
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
  const reminder = await getReminderForUser(id, user.id);

  if (!reminder) {
    return NextResponse.json(
      { success: false, error: "Напоминание не найдено" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: reminder
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
  const reminder = await getReminderForUser(id, user.id);

  if (!reminder) {
    return NextResponse.json(
      { success: false, error: "Напоминание не найдено" },
      { status: 404 }
    );
  }

  if (reminder.vehicle.ownerId !== user.id && reminder.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: "Нет прав на изменение напоминания" },
      { status: 403 }
    );
  }

  const body = await request.json();

  if (body.status) {
    const allowedStatuses = ["active", "done", "postponed", "cancelled"];

    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Некорректный статус" },
        { status: 400 }
      );
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: {
        status: body.status
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedReminder
    });
  }

  const parsed = reminderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Некорректные данные напоминания" },
      { status: 400 }
    );
  }

  const updatedReminder = await prisma.reminder.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      triggerType: parsed.data.triggerType,
      triggerDate: parsed.data.triggerDate ? new Date(parsed.data.triggerDate) : null,
      triggerMileage: parsed.data.triggerMileage ?? null
    }
  });

  return NextResponse.json({
    success: true,
    data: updatedReminder
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
  const reminder = await getReminderForUser(id, user.id);

  if (!reminder) {
    return NextResponse.json(
      { success: false, error: "Напоминание не найдено" },
      { status: 404 }
    );
  }

  if (reminder.vehicle.ownerId !== user.id && reminder.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: "Нет прав на удаление напоминания" },
      { status: 403 }
    );
  }

  await prisma.reminder.delete({
    where: { id }
  });

  return NextResponse.json({
    success: true
  });
}
*/}));

writeFile("src/components/reminders/reminder-form.tsx", getContent(function () {/*
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ReminderFormProps = {
  vehicleId: string;
};

const triggerTypes = [
  { value: "date", label: "По дате" },
  { value: "mileage", label: "По пробегу" },
  { value: "date_and_mileage", label: "По дате и пробегу" }
];

export function ReminderForm({ vehicleId }: ReminderFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("date");
  const [triggerDate, setTriggerDate] = useState("");
  const [triggerMileage, setTriggerMileage] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const response = await fetch("/api/reminders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        vehicleId,
        title,
        description,
        triggerType,
        triggerDate: triggerDate || null,
        triggerMileage: triggerMileage ? Number(triggerMileage) : null
      })
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Не удалось создать напоминание");
      return;
    }

    setTitle("");
    setDescription("");
    setTriggerDate("");
    setTriggerMileage("");

    router.refresh();
  }

  const needDate = triggerType === "date" || triggerType === "date_and_mileage";
  const needMileage = triggerType === "mileage" || triggerType === "date_and_mileage";

  return (
    <form onSubmit={handleSubmit} className="card-large space-y-5 p-6">
      <div>
        <h2 className="text-xl font-semibold">Новое напоминание</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Создайте напоминание о ТО, страховке, замене масла или другом событии.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <label className="block space-y-1 text-sm">
        <span>Название</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="input"
          placeholder="Например: заменить масло"
          required
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Тип напоминания</span>
        <select
          value={triggerType}
          onChange={(event) => setTriggerType(event.target.value)}
          className="input"
        >
          {triggerTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        {needDate ? (
          <label className="space-y-1 text-sm">
            <span>Дата</span>
            <input
              value={triggerDate}
              onChange={(event) => setTriggerDate(event.target.value)}
              className="input"
              type="date"
              required={needDate}
            />
          </label>
        ) : null}

        {needMileage ? (
          <label className="space-y-1 text-sm">
            <span>Пробег, км</span>
            <input
              value={triggerMileage}
              onChange={(event) => setTriggerMileage(event.target.value)}
              className="input"
              placeholder="90000"
              type="number"
              min="0"
              required={needMileage}
            />
          </label>
        ) : null}
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
        {loading ? "Создание..." : "Создать напоминание"}
      </button>
    </form>
  );
}
*/}));

writeFile("src/components/reminders/reminder-list.tsx", getContent(function () {/*
"use client";

import { useRouter } from "next/navigation";

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  triggerType: string;
  triggerDate: string | null;
  triggerMileage: number | null;
  status: string;
};

type ReminderListProps = {
  reminders: Reminder[];
  currentMileage: number;
};

const triggerLabels: Record<string, string> = {
  date: "Дата",
  mileage: "Пробег",
  date_and_mileage: "Дата и пробег"
};

function getReminderState(reminder: Reminder, currentMileage: number) {
  if (reminder.status === "done") {
    return {
      label: "Выполнено",
      className: "bg-green-50 text-green-700 border-green-200"
    };
  }

  if (reminder.status === "cancelled") {
    return {
      label: "Отменено",
      className: "bg-gray-50 text-gray-600 border-gray-200"
    };
  }

  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 7);

  const hasDateTrigger =
    reminder.triggerType === "date" || reminder.triggerType === "date_and_mileage";

  const hasMileageTrigger =
    reminder.triggerType === "mileage" || reminder.triggerType === "date_and_mileage";

  if (hasMileageTrigger && reminder.triggerMileage != null && currentMileage >= reminder.triggerMileage) {
    return {
      label: "Пора по пробегу",
      className: "bg-orange-50 text-orange-700 border-orange-200"
    };
  }

  if (hasDateTrigger && reminder.triggerDate) {
    const date = new Date(reminder.triggerDate);

    if (date < now) {
      return {
        label: "Просрочено",
        className: "bg-red-50 text-red-700 border-red-200"
      };
    }

    if (date <= soon) {
      return {
        label: "Скоро",
        className: "bg-yellow-50 text-yellow-700 border-yellow-200"
      };
    }
  }

  return {
    label: "Активно",
    className: "bg-[var(--accent-soft)] text-[var(--accent-dark)] border-[var(--accent-soft)]"
  };
}

export function ReminderList({ reminders, currentMileage }: ReminderListProps) {
  const router = useRouter();

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    router.refresh();
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Удалить напоминание?");

    if (!confirmed) {
      return;
    }

    await fetch(`/api/reminders/${id}`, {
      method: "DELETE"
    });

    router.refresh();
  }

  if (reminders.length === 0) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-lg font-semibold">Напоминаний пока нет</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Создайте первое напоминание по дате или пробегу.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => {
        const state = getReminderState(reminder, currentMileage);

        return (
          <article key={reminder.id} className="card p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{reminder.title}</h2>
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${state.className}`}>
                    {state.label}
                  </span>
                </div>

                {reminder.description ? (
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {reminder.description}
                  </p>
                ) : null}

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-[var(--text-secondary)]">Тип</p>
                    <p className="mt-1 font-medium">
                      {triggerLabels[reminder.triggerType] || reminder.triggerType}
                    </p>
                  </div>

                  <div>
                    <p className="text-[var(--text-secondary)]">Дата</p>
                    <p className="mt-1 font-medium">
                      {reminder.triggerDate
                        ? new Date(reminder.triggerDate).toLocaleDateString("ru-RU")
                        : "Не указана"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[var(--text-secondary)]">Пробег</p>
                    <p className="mt-1 font-medium">
                      {reminder.triggerMileage != null
                        ? `${reminder.triggerMileage.toLocaleString("ru-RU")} км`
                        : "Не указан"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {reminder.status !== "done" ? (
                  <button
                    type="button"
                    onClick={() => updateStatus(reminder.id, "done")}
                    className="btn-secondary text-sm"
                  >
                    Выполнено
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateStatus(reminder.id, "active")}
                    className="btn-secondary text-sm"
                  >
                    Вернуть
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(reminder.id)}
                  className="rounded-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Удалить
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
*/}));

writeFile("src/app/app/vehicles/[id]/reminders/page.tsx", getContent(function () {/*
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { ReminderList } from "@/components/reminders/reminder-list";

type RemindersPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VehicleRemindersPage({ params }: RemindersPageProps) {
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
      reminders: {
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!vehicle) {
    notFound();
  }

  const reminders = vehicle.reminders.map((reminder) => ({
    id: reminder.id,
    title: reminder.title,
    description: reminder.description,
    triggerType: reminder.triggerType,
    triggerDate: reminder.triggerDate ? reminder.triggerDate.toISOString() : null,
    triggerMileage: reminder.triggerMileage,
    status: reminder.status
  }));

  const activeCount = reminders.filter((reminder) => reminder.status === "active").length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-[var(--accent-dark)]">
            Напоминания
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Активных: {activeCount} · Текущий пробег: {vehicle.currentMileage.toLocaleString("ru-RU")} км
          </p>
        </div>

        <Link href={`/app/vehicles/${vehicle.id}`} className="btn-secondary">
          Назад к автомобилю
        </Link>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <ReminderForm vehicleId={vehicle.id} />
        <ReminderList reminders={reminders} currentMileage={vehicle.currentMileage} />
      </section>
    </div>
  );
}
*/}));

console.log("");
console.log("Reminders module added.");