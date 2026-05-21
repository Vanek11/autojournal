"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SettingsManagerProps = {
  user: {
    email: string;
    name: string | null;
    plan: string;
    createdAt: string;
  };
};

const planLabels: Record<string, string> = {
  free: "Free",
  standard: "Standard",
  premium: "Premium"
};

export function SettingsManager({ user }: SettingsManagerProps) {
  const router = useRouter();

  const [name, setName] = useState(user.name || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setProfileLoading(true);
    setProfileMessage("");
    setProfileError("");

    const response = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name
      })
    });

    const result = await response.json();

    setProfileLoading(false);

    if (!response.ok) {
      setProfileError(result.error || "Не удалось сохранить профиль");
      return;
    }

    setProfileMessage("Профиль сохранен.");
    router.refresh();
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPasswordLoading(true);
    setPasswordMessage("");
    setPasswordError("");

    const response = await fetch("/api/settings/password", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        repeatPassword
      })
    });

    const result = await response.json();

    setPasswordLoading(false);

    if (!response.ok) {
      setPasswordError(result.error || "Не удалось изменить пароль");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setRepeatPassword("");
    setPasswordMessage("Пароль изменен.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-6">
        <div className="card-large p-6">
          <h2 className="text-xl font-semibold">Аккаунт</h2>

          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Email</p>
              <p className="mt-1 font-medium">{user.email}</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Тариф</p>
              <p className="mt-1 font-medium">{planLabels[user.plan] || user.plan}</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Дата регистрации</p>
              <p className="mt-1 font-medium">
                {new Date(user.createdAt).toLocaleDateString("ru-RU")}
              </p>
            </div>
          </div>
        </div>

      </section>

      <section className="space-y-6">
        <form onSubmit={handleProfileSubmit} className="card-large space-y-5 p-6">
          <div>
            <h2 className="text-xl font-semibold">Профиль</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Измените отображаемое имя пользователя.
            </p>
          </div>

          {profileMessage ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {profileMessage}
            </div>
          ) : null}

          {profileError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {profileError}
            </div>
          ) : null}

          <label className="block space-y-1 text-sm">
            <span>Имя</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input"
              placeholder="Ваше имя"
            />
          </label>

          <button type="submit" disabled={profileLoading} className="btn-primary">
            {profileLoading ? "Сохранение..." : "Сохранить профиль"}
          </button>
        </form>

        <form onSubmit={handlePasswordSubmit} className="card-large space-y-5 p-6">
          <div>
            <h2 className="text-xl font-semibold">Пароль</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Для изменения пароля нужно указать текущий пароль.
            </p>
          </div>

          {passwordMessage ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {passwordMessage}
            </div>
          ) : null}

          {passwordError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {passwordError}
            </div>
          ) : null}

          <label className="block space-y-1 text-sm">
            <span>Текущий пароль</span>
            <input
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="input"
              type="password"
              required
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Новый пароль</span>
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="input"
              type="password"
              minLength={6}
              required
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Повтор нового пароля</span>
            <input
              value={repeatPassword}
              onChange={(event) => setRepeatPassword(event.target.value)}
              className="input"
              type="password"
              minLength={6}
              required
            />
          </label>

          <button type="submit" disabled={passwordLoading} className="btn-primary">
            {passwordLoading ? "Изменение..." : "Изменить пароль"}
          </button>
        </form>
      </section>
    </div>
  );
}
