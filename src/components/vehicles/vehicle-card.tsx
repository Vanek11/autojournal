import Link from "next/link";

type VehicleCardProps = {
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number | null;
    plateNumber: string | null;
    vin: string | null;
    fuelType: string;
    currentMileage: number;
  };
};

const fuelLabels: Record<string, string> = {
  petrol: "Бензин",
  diesel: "Дизель",
  gas: "Газ",
  hybrid: "Гибрид",
  electric: "Электро",
  other: "Другое"
};

export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <Link href={`/app/vehicles/${vehicle.id}`} className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            {vehicle.make} {vehicle.model}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {vehicle.year ? `${vehicle.year} год` : "Год не указан"}
          </p>
        </div>

        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm text-[var(--accent-dark)]">
          {fuelLabels[vehicle.fuelType] || vehicle.fuelType}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-[var(--text-secondary)]">Госномер</p>
          <p className="mt-1 font-medium">{vehicle.plateNumber || "Не указан"}</p>
        </div>

        <div>
          <p className="text-[var(--text-secondary)]">Пробег</p>
          <p className="mt-1 font-medium">{vehicle.currentMileage.toLocaleString("ru-RU")} км</p>
        </div>

        <div>
          <p className="text-[var(--text-secondary)]">VIN</p>
          <p className="mt-1 truncate font-medium">{vehicle.vin || "Не указан"}</p>
        </div>
      </div>
    </Link>
  );
}
