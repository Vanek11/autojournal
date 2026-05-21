"use client";

import { useRouter } from "next/navigation";

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  triggerType: string;
  triggerDate: string | null;
  triggerMileage: number | null;
  status: string;
};

type ReminderListProps = {
  reminders: Reminder[];
  currentMileage: number;
};

const triggerLabels: Record<string, string> = {
  date: "Дата",
  mileage: "Пробег",
  date_and_mileage: "Дата и пробег"
};

function getReminderState(reminder: Reminder, currentMileage: number) {
  if (reminder.status === "done") {
    return {
      label: "Выполнено",
      className: "bg-green-50 text-green-700 border-green-200"
    };
  }

  if (reminder.status === "cancelled") {
    return {
      label: "Отменено",
      className: "bg-gray-50 text-gray-600 border-gray-200"
    };
  }

  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 7);

  const hasDateTrigger =
    reminder.triggerType === "date" || reminder.triggerType === "date_and_mileage";

  const hasMileageTrigger =
    reminder.triggerType === "mileage" || reminder.triggerType === "date_and_mileage";

  if (hasMileageTrigger && reminder.triggerMileage != null && currentMileage >= reminder.triggerMileage) {
    return {
      label: "Пора по пробегу",
      className: "bg-orange-50 text-orange-700 border-orange-200"
    };
  }

  if (hasDateTrigger && reminder.triggerDate) {
    const date = new Date(reminder.triggerDate);

    if (date < now) {
      return {
        label: "Просрочено",
        className: "bg-red-50 text-red-700 border-red-200"
      };
    }

    if (date <= soon) {
      return {
        label: "Скоро",
        className: "bg-yellow-50 text-yellow-700 border-yellow-200"
      };
    }
  }

  return {
    label: "Активно",
    className: "bg-[var(--accent-soft)] text-[var(--accent-dark)] border-[var(--accent-soft)]"
  };
}

export function ReminderList({ reminders, currentMileage }: ReminderListProps) {
  const router = useRouter();

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    router.refresh();
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Удалить напоминание?");

    if (!confirmed) {
      return;
    }

    await fetch(`/api/reminders/${id}`, {
      method: "DELETE"
    });

    router.refresh();
  }

  if (reminders.length === 0) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-lg font-semibold">Напоминаний пока нет</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Создайте первое напоминание по дате или пробегу.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => {
        const state = getReminderState(reminder, currentMileage);

        return (
          <article key={reminder.id} className="card p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{reminder.title}</h2>
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${state.className}`}>
                    {state.label}
                  </span>
                </div>

                {reminder.description ? (
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {reminder.description}
                  </p>
                ) : null}

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-[var(--text-secondary)]">Тип</p>
                    <p className="mt-1 font-medium">
                      {triggerLabels[reminder.triggerType] || reminder.triggerType}
                    </p>
                  </div>

                  <div>
                    <p className="text-[var(--text-secondary)]">Дата</p>
                    <p className="mt-1 font-medium">
                      {reminder.triggerDate
                        ? new Date(reminder.triggerDate).toLocaleDateString("ru-RU")
                        : "Не указана"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[var(--text-secondary)]">Пробег</p>
                    <p className="mt-1 font-medium">
                      {reminder.triggerMileage != null
                        ? `${reminder.triggerMileage.toLocaleString("ru-RU")} км`
                        : "Не указан"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {reminder.status !== "done" ? (
                  <button
                    type="button"
                    onClick={() => updateStatus(reminder.id, "done")}
                    className="btn-secondary text-sm"
                  >
                    Выполнено
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateStatus(reminder.id, "active")}
                    className="btn-secondary text-sm"
                  >
                    Вернуть
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(reminder.id)}
                  className="rounded-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Удалить
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
