"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TeamMember = {
  id: string;
  role: string;
  createdAt: string | Date;
  member: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
    createdAt: string | Date;
  };
};

type TeamManagerProps = {
  members: TeamMember[];
};

const roleLabels: Record<string, string> = {
  viewer: "Просмотр",
  editor: "Редактор"
};

export function TeamManager({ members }: TeamManagerProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAddMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const response = await fetch("/api/team", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        role
      })
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Не удалось добавить участника");
      return;
    }

    setEmail("");
    setRole("viewer");

    router.refresh();
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Удалить участника из команды?");

    if (!confirmed) {
      return;
    }

    await fetch(`/api/team/${id}`, {
      method: "DELETE"
    });

    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={handleAddMember} className="card-large space-y-5 p-6">
        <div>
          <h2 className="text-xl font-semibold">Добавить участника</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Пользователь должен сначала зарегистрироваться в системе. После добавления он увидит ваши автомобили.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <label className="block space-y-1 text-sm">
          <span>Email пользователя</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
            placeholder="user@example.com"
            type="email"
            required
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span>Роль</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="input"
          >
            <option value="viewer">Просмотр</option>
            <option value="editor">Редактор</option>
          </select>
        </label>

        <div className="rounded-xl bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-secondary)]">
          <p>
            <strong>Просмотр</strong> может видеть автомобили, журнал, документы, напоминания и отчеты.
          </p>
          <p className="mt-2">
            <strong>Редактор</strong> используется как роль для расширения проекта. Сейчас основные ограничения остаются на уровне владельца и автора записи.
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Добавление..." : "Добавить в команду"}
        </button>
      </form>

      <section className="card-large overflow-hidden">
        <div className="border-b border-[var(--border)] p-6">
          <h2 className="text-xl font-semibold">Участники команды</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Пользователи, которым открыт доступ к вашим автомобилям.
          </p>
        </div>

        {members.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold">Участников пока нет</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Добавьте пользователя по email, чтобы проверить многопользовательский режим.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {members.map((item) => (
              <article key={item.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">
                      {item.member.name || item.member.email}
                    </h3>
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs text-[var(--accent-dark)]">
                      {roleLabels[item.role] || item.role}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {item.member.email}
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Добавлен: {new Date(item.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="rounded-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Удалить
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
