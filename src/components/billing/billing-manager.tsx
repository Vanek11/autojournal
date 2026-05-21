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
