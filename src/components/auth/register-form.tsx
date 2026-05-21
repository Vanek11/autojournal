"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Не удалось зарегистрироваться");
      return;
    }

    router.push("/auth/login");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl border p-6">
      <div>
        <h1 className="text-2xl font-semibold">Регистрация</h1>
        <p className="mt-1 text-sm text-gray-500">Создайте аккаунт AutoJournal</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        Имя
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-lg border px-3 py-2"
          placeholder="Иван"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-lg border px-3 py-2"
          placeholder="ivan@example.com"
          type="email"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Пароль
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-lg border px-3 py-2"
          placeholder="Минимум 6 символов"
          type="password"
          required
          minLength={6}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Создание..." : "Создать аккаунт"}
      </button>

      <button
        type="button"
        onClick={() => router.push("/auth/login")}
        className="text-sm text-gray-600 underline"
      >
        Уже есть аккаунт
      </button>
    </form>
  );
}
