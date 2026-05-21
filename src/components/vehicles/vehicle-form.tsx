"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const fuelTypes = [
  { value: "petrol", label: "Бензин" },
  { value: "diesel", label: "Дизель" },
  { value: "gas", label: "Газ" },
  { value: "hybrid", label: "Гибрид" },
  { value: "electric", label: "Электро" },
  { value: "other", label: "Другое" }
];

export function VehicleForm() {
  const router = useRouter();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vin, setVin] = useState("");
  const [fuelType, setFuelType] = useState("petrol");
  const [currentMileage, setCurrentMileage] = useState("0");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const response = await fetch("/api/vehicles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        make,
        model,
        year: year ? Number(year) : null,
        plateNumber,
        vin,
        fuelType,
        currentMileage: Number(currentMileage || 0),
        notes
      })
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Не удалось сохранить автомобиль");
      return;
    }

    router.push("/app/vehicles");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card-large max-w-3xl space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Добавить автомобиль</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Заполните основные данные автомобиля. Позже к нему можно будет добавлять расходы, документы и напоминания.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Марка</span>
          <input
            value={make}
            onChange={(event) => setMake(event.target.value)}
            className="input"
            placeholder="Toyota"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>Модель</span>
          <input
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="input"
            placeholder="Camry"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>Год выпуска</span>
          <input
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="input"
            placeholder="2020"
            type="number"
            min="1900"
            max="2100"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>Госномер</span>
          <input
            value={plateNumber}
            onChange={(event) => setPlateNumber(event.target.value)}
            className="input"
            placeholder="А123ВС 777"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>VIN</span>
          <input
            value={vin}
            onChange={(event) => setVin(event.target.value)}
            className="input"
            placeholder="XTA..."
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>Тип топлива</span>
          <select
            value={fuelType}
            onChange={(event) => setFuelType(event.target.value)}
            className="input"
          >
            {fuelTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span>Текущий пробег</span>
          <input
            value={currentMileage}
            onChange={(event) => setCurrentMileage(event.target.value)}
            className="input"
            placeholder="86000"
            type="number"
            min="0"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Комментарий</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="input min-h-28"
          placeholder="Дополнительная информация об автомобиле"
        />
      </label>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Сохранение..." : "Сохранить автомобиль"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/app/vehicles")}
          className="btn-secondary"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
