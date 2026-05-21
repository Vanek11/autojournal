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
