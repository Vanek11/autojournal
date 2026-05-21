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

writeFile("src/app/api/team/route.ts", getContent(function () {/*
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const members = await prisma.teamMember.findMany({
    where: {
      ownerId: user.id
    },
    include: {
      member: {
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({
    success: true,
    data: members
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const body = await request.json();

  const email = String(body.email || "").trim().toLowerCase();
  const role = String(body.role || "viewer");

  if (!email) {
    return NextResponse.json(
      { success: false, error: "Укажите email пользователя" },
      { status: 400 }
    );
  }

  const allowedRoles = ["viewer", "editor"];

  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      { success: false, error: "Некорректная роль" },
      { status: 400 }
    );
  }

  if (email === user.email.toLowerCase()) {
    return NextResponse.json(
      { success: false, error: "Нельзя добавить самого себя" },
      { status: 400 }
    );
  }

  const member = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!member) {
    return NextResponse.json(
      { success: false, error: "Пользователь с таким email не найден. Сначала он должен зарегистрироваться." },
      { status: 404 }
    );
  }

  const existingMember = await prisma.teamMember.findFirst({
    where: {
      ownerId: user.id,
      memberId: member.id
    }
  });

  if (existingMember) {
    return NextResponse.json(
      { success: false, error: "Этот пользователь уже добавлен в команду" },
      { status: 400 }
    );
  }

  const teamMember = await prisma.teamMember.create({
    data: {
      ownerId: user.id,
      memberId: member.id,
      role
    },
    include: {
      member: {
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          createdAt: true
        }
      }
    }
  });

  return NextResponse.json(
    {
      success: true,
      data: teamMember
    },
    { status: 201 }
  );
}
*/}));

writeFile("src/app/api/team/[id]/route.ts", getContent(function () {/*
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  const teamMember = await prisma.teamMember.findFirst({
    where: {
      id,
      ownerId: user.id
    }
  });

  if (!teamMember) {
    return NextResponse.json(
      { success: false, error: "Участник команды не найден" },
      { status: 404 }
    );
  }

  await prisma.teamMember.delete({
    where: {
      id
    }
  });

  return NextResponse.json({
    success: true
  });
}
*/}));

writeFile("src/components/team/team-manager.tsx", getContent(function () {/*
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
*/}));

writeFile("src/app/app/team/page.tsx", getContent(function () {/*
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamManager } from "@/components/team/team-manager";

export default async function TeamPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const members = await prisma.teamMember.findMany({
    where: {
      ownerId: user.id
    },
    include: {
      member: {
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const safeMembers = members.map((item) => ({
    id: item.id,
    role: item.role,
    createdAt: item.createdAt.toISOString(),
    member: {
      id: item.member.id,
      email: item.member.email,
      name: item.member.name,
      plan: item.member.plan,
      createdAt: item.member.createdAt.toISOString()
    }
  }));

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-[var(--accent-dark)]">
          Многопользовательский режим
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Команда
        </h1>
        <p className="mt-2 max-w-3xl text-[var(--text-secondary)]">
          Добавляйте пользователей, которым нужно открыть доступ к автомобилям. Это демонстрирует работу проекта в многопользовательском режиме.
        </p>
      </section>

      <TeamManager members={safeMembers} />
    </div>
  );
}
*/}));

console.log("");
console.log("Team module added.");