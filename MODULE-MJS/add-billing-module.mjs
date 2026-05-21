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

writeFile("src/app/api/billing/route.ts", getContent(function () {/*
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedPlans = ["free", "standard", "premium"];

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const plan = String(body.plan || "").toLowerCase();

  if (!allowedPlans.includes(plan)) {
    return NextResponse.json(
      { success: false, error: "Некорректный тариф" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      plan
    }
  });

  await prisma.subscription.upsert({
    where: {
      userId: user.id
    },
    create: {
      userId: user.id,
      plan,
      status: "active"
    },
    update: {
      plan,
      status: "active"
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      plan,
      status: "active"
    }
  });
}
*/}));

writeFile("src/components/billing/billing-manager.tsx", getContent(function () {/*
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BillingManagerProps = {
  currentPlan: string;
  subscriptionStatus: string;
};

const plans = [
  {
    id: "free",
    name: "Free",
    price: "0 ₽",
    description: "Базовый режим для демонстрации проекта.",
    features: [
      "1 пользователь",
      "Несколько автомобилей",
      "Журнал обслуживания",
      "Документы и напоминания"
    ]
  },
  {
    id: "standard",
    name: "Standard",
    price: "299 ₽ / месяц",
    description: "Основной тариф для личного использования.",
    features: [
      "Командный доступ",
      "Расширенная аналитика",
      "Экспорт отчетов",
      "Хранение чеков и PDF"
    ]
  },
  {
    id: "premium",
    name: "Premium",
    price: "599 ₽ / месяц",
    description: "Расширенный тариф для демонстрации платной модели.",
    features: [
      "Все функции Standard",
      "Приоритетные напоминания",
      "Расширенные отчеты",
      "Подготовка к интеграции платежей"
    ]
  }
];

const planLabels: Record<string, string> = {
  free: "Free",
  standard: "Standard",
  premium: "Premium"
};

export function BillingManager({ currentPlan, subscriptionStatus }: BillingManagerProps) {
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

    setMessage(`Тариф изменен на ${planLabels[plan] || plan}. Платеж успешно имитирован.`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="card-large p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-semibold">Текущий тариф</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Сейчас активен тариф: {planLabels[currentPlan] || currentPlan}
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--accent-soft)] px-5 py-3 text-sm text-[var(--accent-dark)]">
            Статус подписки: {subscriptionStatus || "active"}
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-secondary)]">
          Это имитация платежей. Реальное списание денег не выполняется. Отображние бизнес-логики тарифов и подписок.
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

              <ul className="mt-5 space-y-2 text-sm">
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
        <h2 className="text-xl font-semibold">Как это работает в проекте</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="card p-4">
            <p className="font-medium">1. Пользователь выбирает тариф</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              На странице тарифа пользователь нажимает кнопку выбора.
            </p>
          </div>

          <div className="card p-4">
            <p className="font-medium">2. Сервер обновляет данные</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              API обновляет поля пользователя и подписки в базе MySQL.
            </p>
          </div>

          <div className="card p-4">
            <p className="font-medium">3. Функции можно ограничивать</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              В дальнейшем тариф можно использовать для ограничения отчетов, команды и документов.
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

export default async function BillingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const subscription = await prisma.subscription.findUnique({
    where: {
      userId: user.id
    }
  });

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-[var(--accent-dark)]">
          Тариф и платежи
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Управление тарифом
        </h1>
        <p className="mt-2 max-w-3xl text-[var(--text-secondary)]">
          Раздел демонстрирует, как в AutoJournal может работать платная модель: тарифы, подписка и имитация платежа.
        </p>
      </section>

      <BillingManager
        currentPlan={user.plan}
        subscriptionStatus={subscription?.status || "active"}
      />
    </div>
  );
}
*/}));

console.log("");
console.log("Billing module added.");