"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type JournalFormProps = {
  vehicleId: string;
};

const entryTypes = [
  { value: "maintenance", label: "ТО" },
  { value: "repair", label: "Ремонт" },
  { value: "fuel", label: "Заправка" },
  { value: "expense", label: "Расход" },
  { value: "document", label: "Документ" },
  { value: "other", label: "Другое" }
];

export function JournalForm({ vehicleId }: JournalFormProps) {
  const router = useRouter();

  const [type, setType] = useState("maintenance");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState("");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const response = await fetch("/api/journal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        vehicleId,
        type,
        title,
        description,
        eventDate,
        mileage: mileage ? Number(mileage) : null,
        amount: amount ? Number(amount) : null,
        vendor
      })
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Не удалось добавить запись");
      return;
    }

    setTitle("");
    setDescription("");
    setMileage("");
    setAmount("");
    setVendor("");

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card-large space-y-5 p-6">
      <div>
        <h2 className="text-xl font-semibold">Новая запись</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Добавьте ТО, ремонт, заправку, расход или другое событие.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Тип записи</span>
          <select value={type} onChange={(event) => setType(event.target.value)} className="input">
            {entryTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span>Дата</span>
          <input
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="input"
            type="date"
            required
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span>Название</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="input"
            placeholder="Например: замена масла"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>Пробег</span>
          <input
            value={mileage}
            onChange={(event) => setMileage(event.target.value)}
            className="input"
            placeholder="86500"
            type="number"
            min="0"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>Сумма, ₽</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="input"
            placeholder="7500"
            type="number"
            min="0"
            step="0.01"
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span>Сервис / магазин</span>
          <input
            value={vendor}
            onChange={(event) => setVendor(event.target.value)}
            className="input"
            placeholder="Название сервиса или магазина"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Комментарий</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="input min-h-24"
          placeholder="Дополнительные детали"
        />
      </label>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Добавление..." : "Добавить запись"}
      </button>
    </form>
  );
}
