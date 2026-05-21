"use client";

import { useRouter } from "next/navigation";

type JournalEntry = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  eventDate: string;
  mileage: number | null;
  amount: number | null;
  vendor: string | null;
};

type JournalTableProps = {
  entries: JournalEntry[];
};

const typeLabels: Record<string, string> = {
  maintenance: "ТО",
  repair: "Ремонт",
  fuel: "Заправка",
  expense: "Расход",
  document: "Документ",
  other: "Другое"
};

export function JournalTable({ entries }: JournalTableProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Удалить запись из журнала?");

    if (!confirmed) {
      return;
    }

    await fetch(`/api/journal/${id}`, {
      method: "DELETE"
    });

    router.refresh();
  }

  if (entries.length === 0) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-lg font-semibold">Записей пока нет</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Добавьте первую запись через форму слева или сверху.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[var(--border)] p-5">
        <h2 className="text-lg font-semibold">История записей</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          ТО, ремонты, заправки, расходы и документы.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-[var(--surface-muted)] text-left text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 font-medium">Тип</th>
              <th className="px-4 py-3 font-medium">Название</th>
              <th className="px-4 py-3 font-medium">Пробег</th>
              <th className="px-4 py-3 font-medium">Сумма</th>
              <th className="px-4 py-3 font-medium">Сервис</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>

          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3">
                  {new Date(entry.eventDate).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs text-[var(--accent-dark)]">
                    {typeLabels[entry.type] || entry.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{entry.title}</div>
                  {entry.description ? (
                    <div className="mt-1 max-w-xs truncate text-xs text-[var(--text-secondary)]">
                      {entry.description}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {entry.mileage ? `${entry.mileage.toLocaleString("ru-RU")} км` : "—"}
                </td>
                <td className="px-4 py-3">
                  {entry.amount ? `${entry.amount.toLocaleString("ru-RU")} ₽` : "—"}
                </td>
                <td className="px-4 py-3">{entry.vendor || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
