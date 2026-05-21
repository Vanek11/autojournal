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
              <p className="font-semibold">Аккаунт владельца</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Используйте email и пароль, указанные при регистрации.
              </p>
            </div>

            <div className="card p-4">
              <p className="font-semibold">Командный доступ</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Пользователь может получить доступ к автомобилям другого владельца через раздел команды.
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
