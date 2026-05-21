"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ReminderFormProps = {
  vehicleId: string;
};

const triggerTypes = [
  { value: "date", label: "По дате" },
  { value: "mileage", label: "По пробегу" },
  { value: "date_and_mileage", label: "По дате и пробегу" }
];

export function ReminderForm({ vehicleId }: ReminderFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("date");
  const [triggerDate, setTriggerDate] = useState("");
  const [triggerMileage, setTriggerMileage] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const response = await fetch("/api/reminders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        vehicleId,
        title,
        description,
        triggerType,
        triggerDate: triggerDate || null,
        triggerMileage: triggerMileage ? Number(triggerMileage) : null
      })
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Не удалось создать напоминание");
      return;
    }

    setTitle("");
    setDescription("");
    setTriggerDate("");
    setTriggerMileage("");

    router.refresh();
  }

  const needDate = triggerType === "date" || triggerType === "date_and_mileage";
  const needMileage = triggerType === "mileage" || triggerType === "date_and_mileage";

  return (
    <form onSubmit={handleSubmit} className="card-large space-y-5 p-6">
      <div>
        <h2 className="text-xl font-semibold">Новое напоминание</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Создайте напоминание о ТО, страховке, замене масла или другом событии.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <label className="block space-y-1 text-sm">
        <span>Название</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="input"
          placeholder="Например: заменить масло"
          required
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Тип напоминания</span>
        <select
          value={triggerType}
          onChange={(event) => setTriggerType(event.target.value)}
          className="input"
        >
          {triggerTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        {needDate ? (
          <label className="space-y-1 text-sm">
            <span>Дата</span>
            <input
              value={triggerDate}
              onChange={(event) => setTriggerDate(event.target.value)}
              className="input"
              type="date"
              required={needDate}
            />
          </label>
        ) : null}

        {needMileage ? (
          <label className="space-y-1 text-sm">
            <span>Пробег, км</span>
            <input
              value={triggerMileage}
              onChange={(event) => setTriggerMileage(event.target.value)}
              className="input"
              placeholder="90000"
              type="number"
              min="0"
              required={needMileage}
            />
          </label>
        ) : null}
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
        {loading ? "Создание..." : "Создать напоминание"}
      </button>
    </form>
  );
}
