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
