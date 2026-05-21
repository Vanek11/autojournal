import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupDir = path.join(
  root,
  ".backup-plan-gates",
  new Date().toISOString().replace(/[:.]/g, "-")
);

function getContent(fn) {
  const source = fn.toString();
  return source.slice(source.indexOf("/*") + 2, source.lastIndexOf("*/")).trimStart();
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function backupFile(relativePath) {
  const sourcePath = path.join(root, relativePath);

  if (!fs.existsSync(sourcePath)) {
    return;
  }

  const backupPath = path.join(backupDir, relativePath);
  ensureDir(path.dirname(backupPath));
  fs.copyFileSync(sourcePath, backupPath);
}

function writeFile(relativePath, content) {
  const fullPath = path.join(root, relativePath);
  backupFile(relativePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`updated: ${relativePath}`);
}

function readFile(relativePath) {
  const fullPath = path.join(root, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : null;
}

function ensureImport(content, importLine) {
  if (content.includes(importLine)) {
    return content;
  }

  const importBlock = content.match(/^import[\s\S]*?;\n(?=\n|import|type|const|export)/);

  if (!importBlock) {
    return `${importLine}\n${content}`;
  }

  return content.replace(importBlock[0], `${importBlock[0]}${importLine}\n`);
}

function patchServerPageFeature(relativePath, feature) {
  let content = readFile(relativePath);

  if (!content) {
    console.log(`skip: ${relativePath} not found`);
    return;
  }

  if (content.includes(`plan-gate:${feature}`)) {
    console.log(`skip: ${relativePath} already patched`);
    return;
  }

  content = ensureImport(
    content,
    'import { canUseFeature } from "@/lib/plans";'
  );

  const target = `  if (!user) {
    redirect("/auth/login");
  }
`;

  if (!content.includes(target)) {
    console.log(`warning: auth block not found in ${relativePath}`);
    return;
  }

  const replacement = `${target}
  // plan-gate:${feature}
  if (!canUseFeature(user.plan, "${feature}")) {
    redirect("/app/billing?required=${feature}");
  }
`;

  content = content.replace(target, replacement);

  writeFile(relativePath, content);
}

function patchVehicleLimit() {
  const relativePath = "src/app/api/vehicles/route.ts";
  let content = readFile(relativePath);

  if (!content) {
    console.log(`skip: ${relativePath} not found`);
    return;
  }

  if (content.includes("plan-gate:vehicle-limit")) {
    console.log(`skip: ${relativePath} already patched`);
    return;
  }

  content = ensureImport(
    content,
    'import { getVehicleLimit } from "@/lib/plans";'
  );

  const postIndex = content.indexOf("export async function POST");

  if (postIndex === -1) {
    console.log(`warning: POST handler not found in ${relativePath}`);
    return;
  }

  const bodyIndex = content.indexOf("  const body = await request.json();", postIndex);

  if (bodyIndex === -1) {
    console.log(`warning: body parse line not found in ${relativePath}`);
    return;
  }

  const guard = `  // plan-gate:vehicle-limit
  const vehicleLimit = getVehicleLimit(user.plan);

  if (vehicleLimit !== null) {
    const vehicleCount = await prisma.vehicle.count({
      where: {
        ownerId: user.id
      }
    });

    if (vehicleCount >= vehicleLimit) {
      return NextResponse.json(
        {
          success: false,
          error: \`Текущий тариф разрешает максимум \${vehicleLimit} автомобиль. Для добавления новых автомобилей измените тариф.\`
        },
        { status: 403 }
      );
    }
  }

`;

  content = content.slice(0, bodyIndex) + guard + content.slice(bodyIndex);

  writeFile(relativePath, content);
}

writeFile("src/lib/plans.ts", getContent(function () {/*
export type PlanKey = "free" | "standard" | "premium";

export type FeatureKey =
  | "analytics"
  | "reports"
  | "export"
  | "team"
  | "unlimitedVehicles";

const planOrder: Record<PlanKey, number> = {
  free: 0,
  standard: 1,
  premium: 2
};

export const planLabels: Record<PlanKey, string> = {
  free: "Free",
  standard: "Standard",
  premium: "Premium"
};

export const featureLabels: Record<FeatureKey, string> = {
  analytics: "Аналитика",
  reports: "Отчеты",
  export: "Экспорт данных",
  team: "Команда",
  unlimitedVehicles: "Безлимитные автомобили"
};

export const featureRequiredPlan: Record<FeatureKey, PlanKey> = {
  analytics: "standard",
  reports: "standard",
  export: "standard",
  team: "standard",
  unlimitedVehicles: "premium"
};

export function normalizePlan(plan: string | null | undefined): PlanKey {
  if (plan === "standard" || plan === "premium") {
    return plan;
  }

  return "free";
}

export function getPlanLabel(plan: string | null | undefined) {
  return planLabels[normalizePlan(plan)];
}

export function hasPlanAccess(
  currentPlan: string | null | undefined,
  requiredPlan: PlanKey
) {
  const normalizedPlan = normalizePlan(currentPlan);
  return planOrder[normalizedPlan] >= planOrder[requiredPlan];
}

export function canUseFeature(
  currentPlan: string | null | undefined,
  feature: FeatureKey
) {
  return hasPlanAccess(currentPlan, featureRequiredPlan[feature]);
}

export function getRequiredPlanForFeature(feature: FeatureKey) {
  return featureRequiredPlan[feature];
}

export function getVehicleLimit(plan: string | null | undefined) {
  const normalizedPlan = normalizePlan(plan);

  if (normalizedPlan === "free") {
    return 1;
  }

  if (normalizedPlan === "standard") {
    return 3;
  }

  return null;
}

export function getPlanFeatures(plan: string | null | undefined) {
  const normalizedPlan = normalizePlan(plan);

  if (normalizedPlan === "free") {
    return [
      "1 автомобиль",
      "Журнал обслуживания",
      "Документы и чеки",
      "Напоминания",
      "Дашборд"
    ];
  }

  if (normalizedPlan === "standard") {
    return [
      "До 3 автомобилей",
      "Журнал обслуживания",
      "Документы и чеки",
      "Напоминания",
      "Аналитика расходов",
      "Отчеты",
      "Экспорт JSON и CSV",
      "Команда"
    ];
  }

  return [
    "Без ограничения количества автомобилей",
    "Журнал обслуживания",
    "Документы и чеки",
    "Напоминания",
    "Аналитика расходов",
    "Отчеты",
    "Экспорт JSON и CSV",
    "Команда"
  ];
}
*/}));

writeFile("src/components/layout/sidebar.tsx", getContent(function () {/*
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { canUseFeature, type FeatureKey } from "@/lib/plans";

type SidebarProps = {
  user: {
    plan: string;
  };
};

const navItems: Array<{
  href: string;
  label: string;
  feature?: FeatureKey;
}> = [
  { href: "/app/dashboard", label: "Дашборд" },
  { href: "/app/vehicles", label: "Автомобили" },
  { href: "/app/team", label: "Команда", feature: "team" },
  { href: "/app/billing", label: "Тариф" },
  { href: "/app/settings", label: "Настройки" }
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="app-print-hidden hidden min-h-screen w-64 border-r border-[var(--border)] bg-white px-4 py-5 lg:block">
      <Link href="/app/dashboard" className="mb-8 block">
        <div className="text-xl font-semibold tracking-tight">AutoJournal</div>
        <div className="mt-1 text-sm text-[var(--text-secondary)]">
          Личный кабинет
        </div>
      </Link>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const locked = item.feature ? !canUseFeature(user.plan, item.feature) : false;
          const href = locked ? `/app/billing?required=${item.feature}` : item.href;

          return (
            <Link
              key={item.href}
              href={href}
              className={[
                "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              ].join(" ")}
            >
              <span>{item.label}</span>
              {locked ? (
                <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                  Standard
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
*/}));

writeFile("src/components/layout/app-shell.tsx", getContent(function () {/*
"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

type AppShellUser = {
  id: string;
  name: string | null;
  email: string;
  plan: string;
};

type AppShellProps = {
  user: AppShellUser;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const isReportPage = pathname.includes("/report");

  if (isReportPage) {
    return (
      <div className="min-h-screen bg-white">
        <main className="mx-auto w-full max-w-[210mm] px-6 py-6 print:m-0 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="flex min-h-screen">
        <Sidebar user={user} />

        <div className="min-w-0 flex-1">
          <Header user={user} />

          <main className="px-4 py-6 md:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
*/}));

writeFile("src/app/api/export/route.ts", getContent(function () {/*
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/lib/plans";

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

  if (!canUseFeature(user.plan, "export")) {
    return NextResponse.json(
      {
        success: false,
        error: "Экспорт данных доступен начиная с тарифа Standard"
      },
      { status: 403 }
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

writeFile("src/app/api/team/route.ts", getContent(function () {/*
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/lib/plans";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  if (!canUseFeature(user.plan, "team")) {
    return NextResponse.json(
      {
        success: false,
        error: "Командный доступ доступен начиная с тарифа Standard"
      },
      { status: 403 }
    );
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

  return NextResponse.json({
    success: true,
    data: members
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

  if (!canUseFeature(user.plan, "team")) {
    return NextResponse.json(
      {
        success: false,
        error: "Командный доступ доступен начиная с тарифа Standard"
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  const email = String(body.email || "").trim().toLowerCase();
  const role = String(body.role || "viewer");

  if (!email) {
    return NextResponse.json(
      { success: false, error: "Укажите email пользователя" },
      { status: 400 }
    );
  }

  const allowedRoles = ["viewer", "editor"];

  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      { success: false, error: "Некорректная роль" },
      { status: 400 }
    );
  }

  if (email === user.email.toLowerCase()) {
    return NextResponse.json(
      { success: false, error: "Нельзя добавить самого себя" },
      { status: 400 }
    );
  }

  const member = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!member) {
    return NextResponse.json(
      { success: false, error: "Пользователь с таким email не найден. Сначала он должен зарегистрироваться." },
      { status: 404 }
    );
  }

  const existingMember = await prisma.teamMember.findFirst({
    where: {
      ownerId: user.id,
      memberId: member.id
    }
  });

  if (existingMember) {
    return NextResponse.json(
      { success: false, error: "Этот пользователь уже добавлен в команду" },
      { status: 400 }
    );
  }

  const teamMember = await prisma.teamMember.create({
    data: {
      ownerId: user.id,
      memberId: member.id,
      role
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
    }
  });

  return NextResponse.json(
    {
      success: true,
      data: teamMember
    },
    { status: 201 }
  );
}
*/}));

writeFile("src/app/api/team/[id]/route.ts", getContent(function () {/*
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/lib/plans";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  if (!canUseFeature(user.plan, "team")) {
    return NextResponse.json(
      {
        success: false,
        error: "Командный доступ доступен начиная с тарифа Standard"
      },
      { status: 403 }
    );
  }

  const { id } = await context.params;

  const teamMember = await prisma.teamMember.findFirst({
    where: {
      id,
      ownerId: user.id
    }
  });

  if (!teamMember) {
    return NextResponse.json(
      { success: false, error: "Участник команды не найден" },
      { status: 404 }
    );
  }

  await prisma.teamMember.delete({
    where: {
      id
    }
  });

  return NextResponse.json({
    success: true
  });
}
*/}));

writeFile("src/components/billing/billing-manager.tsx", getContent(function () {/*
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  featureLabels,
  getPlanFeatures,
  getPlanLabel,
  getRequiredPlanForFeature,
  type FeatureKey
} from "@/lib/plans";

type BillingManagerProps = {
  currentPlan: string;
  subscriptionStatus: string;
  requiredFeature?: string | null;
};

const plans = [
  {
    id: "free",
    name: "Free",
    price: "0 ₽",
    description: "Базовый тариф для личного учета автомобиля.",
    features: getPlanFeatures("free")
  },
  {
    id: "standard",
    name: "Standard",
    price: "299 ₽ / месяц",
    description: "Тариф для расширенного учета, отчетов и совместного доступа.",
    features: getPlanFeatures("standard")
  },
  {
    id: "premium",
    name: "Premium",
    price: "599 ₽ / месяц",
    description: "Максимальный тариф без ограничения количества автомобилей.",
    features: getPlanFeatures("premium")
  }
];

function isFeatureKey(value: string | null | undefined): value is FeatureKey {
  return (
    value === "analytics" ||
    value === "reports" ||
    value === "export" ||
    value === "team" ||
    value === "unlimitedVehicles"
  );
}

export function BillingManager({
  currentPlan,
  subscriptionStatus,
  requiredFeature
}: BillingManagerProps) {
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const lockedFeature = isFeatureKey(requiredFeature) ? requiredFeature : null;
  const requiredPlan = lockedFeature ? getRequiredPlanForFeature(lockedFeature) : null;

  async function handleChangePlan(plan: string) {
    setSelectedPlan(plan);
    setLoading(true);
    setMessage("");
    setError("");

    const response = await fetch("/api/billing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan
      })
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Не удалось изменить тариф");
      return;
    }

    setMessage(`Тариф изменен на ${getPlanLabel(plan)}.`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {lockedFeature && requiredPlan ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h2 className="font-semibold">
            Функция недоступна на текущем тарифе
          </h2>
          <p className="mt-2 text-sm">
            Для доступа к функции «{featureLabels[lockedFeature]}» нужен тариф {getPlanLabel(requiredPlan)} или выше.
          </p>
        </section>
      ) : null}

      <section className="card-large p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-semibold">Текущий тариф</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Сейчас активен тариф: {getPlanLabel(currentPlan)}
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--accent-soft)] px-5 py-3 text-sm text-[var(--accent-dark)]">
            Статус подписки: {subscriptionStatus || "active"}
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-secondary)]">
          При смене тарифа доступ к функциям обновляется автоматически. Данные не удаляются при понижении тарифа, но часть разделов может стать недоступной.
        </div>
      </section>

      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const active = currentPlan === plan.id;
          const selected = selectedPlan === plan.id;

          return (
            <article
              key={plan.id}
              className={[
                "card-large flex flex-col p-6",
                active ? "ring-2 ring-[var(--accent)]" : ""
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <p className="mt-2 text-3xl font-semibold">{plan.price}</p>
                </div>

                {active ? (
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs text-[var(--accent-dark)]">
                    Активен
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                {plan.description}
              </p>

              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-[var(--accent-dark)]">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={loading || active}
                onClick={() => handleChangePlan(plan.id)}
                className={active ? "btn-secondary mt-6 opacity-70" : "btn-primary mt-6"}
              >
                {active
                  ? "Текущий тариф"
                  : loading && selected
                    ? "Обработка..."
                    : "Выбрать тариф"}
              </button>
            </article>
          );
        })}
      </section>

      <section className="card-large p-6">
        <h2 className="text-xl font-semibold">Как тариф влияет на доступ</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="card p-4">
            <p className="font-medium">Free</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Базовый учет одного автомобиля без аналитики, отчетов, экспорта и команды.
            </p>
          </div>

          <div className="card p-4">
            <p className="font-medium">Standard</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Открывает аналитику, отчеты, экспорт данных и командный доступ.
            </p>
          </div>

          <div className="card p-4">
            <p className="font-medium">Premium</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Убирает ограничение по количеству автомобилей.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
*/}));

writeFile("src/app/app/billing/page.tsx", getContent(function () {/*
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingManager } from "@/components/billing/billing-manager";

type BillingPageProps = {
  searchParams?: Promise<{
    required?: string;
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const subscription = await prisma.subscription.findUnique({
    where: {
      userId: user.id
    }
  });

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-[var(--accent-dark)]">
          Тариф и доступ
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Управление тарифом
        </h1>
        <p className="mt-2 max-w-3xl text-[var(--text-secondary)]">
          Выберите тариф, чтобы открыть нужные функции AutoJournal.
        </p>
      </section>

      <BillingManager
        currentPlan={user.plan}
        subscriptionStatus={subscription?.status || "active"}
        requiredFeature={resolvedSearchParams.required || null}
      />
    </div>
  );
}
*/}));

patchServerPageFeature("src/app/app/vehicles/[id]/analytics/page.tsx", "analytics");
patchServerPageFeature("src/app/app/vehicles/[id]/report/page.tsx", "reports");
patchServerPageFeature("src/app/app/team/page.tsx", "team");
patchVehicleLimit();

console.log("");
console.log("Plan gates added.");
console.log(`Backup created in: ${path.relative(root, backupDir)}`);
