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

writeFile("src/app/page.tsx", getContent(function () {/*
import Link from "next/link";

const features = [
  {
    title: "Учет автомобилей",
    description: "Хранение информации о нескольких автомобилях: марка, модель, год, VIN, госномер, пробег и заметки."
  },
  {
    title: "Журнал обслуживания",
    description: "Фиксация ТО, ремонтов, заправок, расходов, документов и других событий по каждому автомобилю."
  },
  {
    title: "Документы и чеки",
    description: "Загрузка фото и PDF чеков, актов сервиса, страховок и других документов."
  },
  {
    title: "Напоминания",
    description: "Контроль событий по дате и пробегу: замена масла, страховка, диагностика, сезонное обслуживание."
  },
  {
    title: "Аналитика расходов",
    description: "Расчет общей суммы расходов, расходов по типам, крупных затрат и статистики по автомобилю."
  },
  {
    title: "Отчеты",
    description: "Формирование печатного отчета и экспорт данных в JSON и CSV для демонстрации проекта."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-3xl border border-[var(--border)] bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            AutoJournal
          </Link>

          <nav className="flex items-center gap-2">
            <Link href="/auth/login" className="btn-secondary text-sm">
              Войти
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm">
              Регистрация
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr]">
          <section>
            <div className="inline-flex rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--text-secondary)] shadow-sm">
              Учебный веб-проект для учета обслуживания автомобилей
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-6xl">
              Электронный журнал автомобиля в формате веб-сайта
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
              AutoJournal помогает хранить данные об автомобилях, вести историю обслуживания, учитывать расходы, загружать чеки, создавать напоминания и формировать отчет для демонстрации проекта.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/register" className="btn-primary">
                Начать работу
              </Link>
              <Link href="/auth/login" className="btn-secondary">
                Войти в систему
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="card p-4">
                <p className="text-2xl font-semibold">MySQL</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">База данных</p>
              </div>

              <div className="card p-4">
                <p className="text-2xl font-semibold">Next.js</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Frontend и API</p>
              </div>

              <div className="card p-4">
                <p className="text-2xl font-semibold">Prisma</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">ORM слой</p>
              </div>
            </div>
          </section>

          <section className="card-large overflow-hidden p-0">
            <div className="border-b border-[var(--border)] bg-[var(--surface-muted)] p-6">
              <p className="text-sm font-medium text-[var(--accent-dark)]">
                Демо-панель
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Что показывает проект
              </h2>
            </div>

            <div className="grid gap-4 p-6">
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Автомобиль</p>
                    <p className="mt-1 text-xl font-semibold">Toyota Camry</p>
                  </div>
                  <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm text-[var(--accent-dark)]">
                    86 400 км
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                  <p className="text-sm text-[var(--text-secondary)]">Расходы</p>
                  <p className="mt-2 text-2xl font-semibold">47 200 ₽</p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                  <p className="text-sm text-[var(--text-secondary)]">Документы</p>
                  <p className="mt-2 text-2xl font-semibold">4 файла</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="text-sm font-medium">Ближайшее напоминание</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Следующая замена масла на пробеге 90 000 км.
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="pb-12">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="card p-5">
                <h3 className="text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
*/}));

writeFile("src/components/layout/header.tsx", getContent(function () {/*
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type HeaderUser = {
  name: string | null;
  email: string;
  plan: string;
};

type HeaderProps = {
  user: HeaderUser;
};

const planLabels: Record<string, string> = {
  free: "Free",
  standard: "Standard",
  premium: "Premium"
};

const mobileLinks = [
  { href: "/app/dashboard", label: "Дашборд" },
  { href: "/app/vehicles", label: "Авто" },
  { href: "/app/team", label: "Команда" },
  { href: "/app/billing", label: "Тариф" },
  { href: "/app/settings", label: "Настройки" }
];

export function Header({ user }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST"
    });

    router.push("/auth/login");
    router.refresh();
  }

  return (
    <header className="app-print-hidden sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(250,250,249,0.9)] px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Аккаунт</p>
          <h1 className="text-base font-semibold sm:text-lg">
            {user.name || user.email}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm text-[var(--text-secondary)] sm:block">
            Тариф: {planLabels[user.plan] || user.plan}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn-secondary text-sm"
          >
            Выйти
          </button>
        </div>
      </div>

      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {mobileLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm text-[var(--text-secondary)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
*/}));

writeFile("src/app/auth/login/page.tsx", getContent(function () {/*
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden lg:block">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            AutoJournal
          </Link>

          <h1 className="mt-8 text-5xl font-semibold tracking-tight">
            Вход в электронный журнал автомобиля
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--text-secondary)]">
            После входа доступны автомобили, журнал обслуживания, документы, напоминания, аналитика, отчеты и управление командой.
          </p>

          <div className="mt-8 grid max-w-xl gap-3">
            <div className="card p-4">
              <p className="font-semibold">Демо-аккаунт владельца</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                demo@autojournal.local / 123456
              </p>
            </div>

            <div className="card p-4">
              <p className="font-semibold">Демо-аккаунт участника</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                viewer@autojournal.local / 123456
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Link href="/" className="text-2xl font-semibold tracking-tight">
              AutoJournal
            </Link>
          </div>

          <div className="card-large p-6 sm:p-8">
            <div>
              <p className="text-sm font-medium text-[var(--accent-dark)]">
                Авторизация
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Вход в аккаунт
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Введите email и пароль для доступа к личному кабинету.
              </p>
            </div>

            <div className="mt-6">
              <LoginForm />
            </div>

            <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
              Нет аккаунта?{" "}
              <Link href="/auth/register" className="font-medium text-[var(--accent-dark)] hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
*/}));

writeFile("src/app/auth/register/page.tsx", getContent(function () {/*
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden lg:block">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            AutoJournal
          </Link>

          <h1 className="mt-8 text-5xl font-semibold tracking-tight">
            Создайте аккаунт для ведения авто-журнала
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--text-secondary)]">
            Регистрация нужна для разделения данных пользователей, хранения автомобилей, работы команды и демонстрации многопользовательского режима.
          </p>

          <div className="mt-8 grid max-w-xl gap-3">
            <div className="card p-4">
              <p className="font-semibold">После регистрации доступно</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Добавление автомобилей, журнал, документы, напоминания, аналитика и отчеты.
              </p>
            </div>

            <div className="card p-4">
              <p className="font-semibold">Технологии проекта</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Next.js, React, TypeScript, Tailwind CSS, Prisma и MySQL.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Link href="/" className="text-2xl font-semibold tracking-tight">
              AutoJournal
            </Link>
          </div>

          <div className="card-large p-6 sm:p-8">
            <div>
              <p className="text-sm font-medium text-[var(--accent-dark)]">
                Регистрация
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Новый аккаунт
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Создайте пользователя для работы с системой.
              </p>
            </div>

            <div className="mt-6">
              <RegisterForm />
            </div>

            <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
              Уже есть аккаунт?{" "}
              <Link href="/auth/login" className="font-medium text-[var(--accent-dark)] hover:underline">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
*/}));

console.log("");
console.log("Final UI polish added.");