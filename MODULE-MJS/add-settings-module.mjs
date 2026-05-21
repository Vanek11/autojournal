import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function getContent(fn) {
  const source = fn.toString();
  return source.slice(source.indexOf("/*") + 2, source.lastIndexOf("*/")).trimStart();
}

function writeFile(relativePath, content) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`updated: ${relativePath}`);
}

writeFile("src/app/api/settings/profile/route.ts", getContent(function () {/*
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const name = String(body.name || "").trim();

  if (name.length > 80) {
    return NextResponse.json(
      { success: false, error: "Имя не должно быть длиннее 80 символов" },
      { status: 400 }
    );
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      name: name || null
    },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true
    }
  });

  return NextResponse.json({
    success: true,
    data: updatedUser
  });
}
*/}));

writeFile("src/app/api/settings/password/route.ts", getContent(function () {/*
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const body = await request.json();

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  const repeatPassword = String(body.repeatPassword || "");

  if (!currentPassword || !newPassword || !repeatPassword) {
    return NextResponse.json(
      { success: false, error: "Заполните все поля пароля" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { success: false, error: "Новый пароль должен быть не короче 6 символов" },
      { status: 400 }
    );
  }

  if (newPassword !== repeatPassword) {
    return NextResponse.json(
      { success: false, error: "Новый пароль и повтор пароля не совпадают" },
      { status: 400 }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      id: user.id
    }
  });

  if (!dbUser) {
    return NextResponse.json(
      { success: false, error: "Пользователь не найден" },
      { status: 404 }
    );
  }

  const passwordIsValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);

  if (!passwordIsValid) {
    return NextResponse.json(
      { success: false, error: "Текущий пароль указан неверно" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      passwordHash
    }
  });

  return NextResponse.json({
    success: true
  });
}
*/}));

writeFile("src/components/settings/settings-manager.tsx", getContent(function () {/*
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
*/}));

writeFile("src/app/app/settings/page.tsx", getContent(function () {/*
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsManager } from "@/components/settings/settings-manager";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      id: user.id
    },
    select: {
      email: true,
      name: true,
      plan: true,
      createdAt: true
    }
  });

  if (!dbUser) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-[var(--accent-dark)]">
          Настройки
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Профиль пользователя
        </h1>
        <p className="mt-2 max-w-3xl text-[var(--text-secondary)]">
          Управление основными данными аккаунта, отображаемым именем и паролем.
        </p>
      </section>

      <SettingsManager
        user={{
          email: dbUser.email,
          name: dbUser.name,
          plan: dbUser.plan,
          createdAt: dbUser.createdAt.toISOString()
        }}
      />
    </div>
  );
}
*/}));

console.log("");
console.log("Settings module added.");