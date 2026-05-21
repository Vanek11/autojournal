import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VehicleCard } from "@/components/vehicles/vehicle-card";

export default async function VehiclesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const vehicles = await prisma.vehicle.findMany({
    where: {
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
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-[var(--accent-dark)]">Гараж</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Автомобили</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Здесь хранятся автомобили, для которых ведется журнал обслуживания и расходов.
          </p>
        </div>

        <Link href="/app/vehicles/new" className="btn-primary">
          Добавить автомобиль
        </Link>
      </section>

      {vehicles.length === 0 ? (
        <section className="card-large p-8 text-center">
          <h2 className="text-xl font-semibold">Автомобилей пока нет</h2>
          <p className="mx-auto mt-2 max-w-xl text-[var(--text-secondary)]">
            Добавьте первый автомобиль, чтобы начать вести журнал ТО, ремонтов, заправок, документов и напоминаний.
          </p>
          <Link href="/app/vehicles/new" className="btn-primary mt-5">
            Добавить автомобиль
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </section>
      )}
    </div>
  );
}
