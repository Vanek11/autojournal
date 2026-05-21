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

  const dbUser = await prisma.user.findUnique({
    where: {
      id: user.id
    },
    select: {
      plan: true
    }
  });

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
        currentPlan={dbUser?.plan || user.plan}
        subscriptionStatus={subscription?.status || "active"}
        requiredFeature={resolvedSearchParams.required || null}
      />
    </div>
  );
}
