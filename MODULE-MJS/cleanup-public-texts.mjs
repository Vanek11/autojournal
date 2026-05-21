import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupDir = path.join(
  root,
  ".backup-ui-text-cleanup",
  new Date().toISOString().replace(/[:.]/g, "-")
);

function getContent(fn) {
  const source = fn.toString();
  return source.slice(source.indexOf("/*") + 2, source.lastIndexOf("*/")).trimStart();
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function backupFile(relativePath) {
  const sourcePath = path.join(root, relativePath);

  if (!fs.existsSync(sourcePath)) {
    console.log(`skip backup, file not found: ${relativePath}`);
    return;
  }

  const backupPath = path.join(backupDir, relativePath);
  ensureDir(path.dirname(backupPath));
  fs.copyFileSync(sourcePath, backupPath);
}

function writeFile(relativePath, content) {
  const fullPath = path.join(root, relativePath);

  backupFile(relativePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content, "utf8");

  console.log(`updated: ${relativePath}`);
}

function scanRemainingPublicTerms() {
  const terms = [
    "учебн",
    "демо",
    "демонстрац",
    "зачет",
    "стек",
    "технологии проекта",
    "Next.js",
    "MySQL",
    "Prisma",
    "ORM"
  ];

  const allowedExtensions = new Set([".tsx", ".ts"]);
  const ignoredParts = [
    `${path.sep}node_modules${path.sep}`,
    `${path.sep}.next${path.sep}`,
    `${path.sep}.backup-ui-text-cleanup${path.sep}`,
    `${path.sep}prisma${path.sep}`,
    `${path.sep}scripts${path.sep}`
  ];

  const results = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);

      if (ignoredParts.some((part) => fullPath.includes(part))) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const extension = path.extname(fullPath);

      if (!allowedExtensions.has(extension)) {
        continue;
      }

      const text = fs.readFileSync(fullPath, "utf8");
      const lines = text.split(/\r?\n/);

      lines.forEach((line, index) => {
        const matched = terms.some((term) =>
          line.toLowerCase().includes(term.toLowerCase())
        );

        if (matched) {
          results.push({
            file: path.relative(root, fullPath),
            line: index + 1,
            text: line.trim()
          });
        }
      });
    }
  }

  walk(path.join(root, "src"));

  console.log("");
  console.log("Remaining public-code matches:");

  if (results.length === 0) {
    console.log("No suspicious public terms found in src/*.ts or src/*.tsx.");
    return;
  }

  for (const item of results) {
    console.log(`${item.file}:${item.line} ${item.text}`);
  }

  console.log("");
  console.log(
    "If some matches remain in billing/settings, they may be intentional internal explanations. Check them manually."
  );
}

writeFile("src/app/page.tsx", getContent(function () {/*
import Link from "next/link";

const features = [
  {
    title: "История обслуживания",
    description: "Ведите записи о техническом обслуживании, ремонте, заправках и других расходах по каждому автомобилю."
  },
  {
    title: "Документы и чеки",
    description: "Храните фото чеков, PDF-документы, страховки, акты выполненных работ и другие важные файлы."
  },
  {
    title: "Напоминания",
    description: "Создавайте напоминания по дате или пробегу, чтобы не пропустить замену масла, страховку или диагностику."
  },
  {
    title: "Расходы и аналитика",
    description: "Отслеживайте общие расходы, крупные затраты и структуру обслуживания автомобиля."
  },
  {
    title: "Несколько автомобилей",
    description: "Добавляйте несколько машин и ведите отдельный журнал для каждой из них."
  },
  {
    title: "Отчеты",
    description: "Формируйте сводный отчет по автомобилю и экспортируйте данные для хранения или передачи."
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
              Учет обслуживания, расходов и документов автомобиля
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-6xl">
              Электронный журнал для вашего автомобиля
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
              AutoJournal помогает хранить историю обслуживания, контролировать расходы, загружать чеки и документы, создавать напоминания и быстро получать отчет по автомобилю.
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
                <p className="text-2xl font-semibold">Журнал</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  ТО, ремонт, топливо
                </p>
              </div>

              <div className="card p-4">
                <p className="text-2xl font-semibold">Документы</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Чеки, PDF, страховки
                </p>
              </div>

              <div className="card p-4">
                <p className="text-2xl font-semibold">Отчеты</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Сводка по автомобилю
                </p>
              </div>
            </div>
          </section>

          <section className="card-large overflow-hidden p-0">
            <div className="border-b border-[var(--border)] bg-[var(--surface-muted)] p-6">
              <p className="text-sm font-medium text-[var(--accent-dark)]">
                Личный кабинет
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Все данные автомобиля в одном месте
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
          <div className="mb-6">
            <h2 className="text-3xl font-semibold tracking-tight">
              Возможности AutoJournal
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">
              Сервис помогает системно вести историю автомобиля и не терять важные данные по обслуживанию.
            </p>
          </div>

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
*/}));

scanRemainingPublicTerms();

console.log("");
console.log("Public texts cleanup finished.");
console.log(`Backup created in: ${path.relative(root, backupDir)}`);