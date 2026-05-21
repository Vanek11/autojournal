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
            Аккаунт нужен для хранения ваших автомобилей, истории обслуживания, документов, напоминаний и отчетов.
          </p>

          <div className="mt-8 grid max-w-xl gap-3">
            <div className="card p-4">
              <p className="font-semibold">Личные данные автомобиля</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                У каждого пользователя свой список автомобилей и записей.
              </p>
            </div>

            <div className="card p-4">
              <p className="font-semibold">Совместный доступ</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                При необходимости можно открыть доступ другому пользователю через раздел команды.
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
