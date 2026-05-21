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
