import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reset = process.argv.includes("--reset");

const resetPaths = [
  "src",
  "prisma",
  "public/uploads"
];

const dirs = [
  "prisma",

  "public/uploads",

  "src/app/auth/login",
  "src/app/auth/register",

  "src/app/app/dashboard",

  "src/app/app/vehicles/new",
  "src/app/app/vehicles/[id]/journal",
  "src/app/app/vehicles/[id]/reminders",
  "src/app/app/vehicles/[id]/documents",
  "src/app/app/vehicles/[id]/analytics",
  "src/app/app/vehicles/[id]/report",

  "src/app/app/team",
  "src/app/app/billing",
  "src/app/app/settings",

  "src/app/api/auth/register",
  "src/app/api/auth/login",
  "src/app/api/auth/logout",
  "src/app/api/auth/me",

  "src/app/api/vehicles/[id]",
  "src/app/api/journal/[id]",
  "src/app/api/reminders/[id]",
  "src/app/api/documents/[id]",
  "src/app/api/team",
  "src/app/api/billing",
  "src/app/api/export",

  "src/components/layout",
  "src/components/auth",
  "src/components/vehicles",
  "src/components/journal",
  "src/components/reminders",
  "src/components/documents",
  "src/components/analytics",
  "src/components/billing",
  "src/components/ui",

  "src/lib",
  "src/types"
];

const files = {
  ".env.example": `DATABASE_URL="mysql://user:password@localhost:3306/autojournal"

APP_URL="http://localhost:3000"
JWT_SECRET="replace-with-random-secret"
`,

  ".gitignore": `node_modules
.next
.env
.env.local
.vercel
.DS_Store
dist
coverage
`,

  "package.json": `{
  "name": "autojournal",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "latest",
    "bcryptjs": "latest",
    "clsx": "latest",
    "date-fns": "latest",
    "jsonwebtoken": "latest",
    "lucide-react": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "react-hook-form": "latest",
    "recharts": "latest",
    "tailwind-merge": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@types/bcryptjs": "latest",
    "@types/jsonwebtoken": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "autoprefixer": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "postcss": "latest",
    "prisma": "latest",
    "tailwindcss": "latest",
    "tsx": "latest",
    "typescript": "latest"
  }
}
`,

  "README.md": `# AutoJournal

Учебный веб-проект для учета автомобилей, расходов, обслуживания, напоминаний, документов и отчетов.

## Стек

- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma
- MySQL

## Запуск

\`\`\`bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
\`\`\`
`,

  "PROJECT.md": `# AutoJournal

AutoJournal это учебный веб-сервис для владельцев автомобилей.

## Основные функции

- регистрация и авторизация;
- несколько пользователей;
- несколько автомобилей;
- журнал обслуживания, ремонта, заправок и расходов;
- напоминания по дате и пробегу;
- документы, фото и PDF чеков;
- аналитика расходов;
- отчет по автомобилю;
- демо-тарифы и имитация оплаты;
- экспорт данных.

## Архитектура

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Next.js Route Handlers в app/api
- Database: MySQL
- ORM: Prisma
`,

  "next.config.ts": `import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
`,

  "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`,

  "tailwind.config.ts": `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
`,

  "postcss.config.mjs": `const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};

export default config;
`,

  "middleware.ts": `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"]
};
`,

  "prisma/schema.prisma": `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String?
  plan         Plan     @default(free)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  sessions       Session[]
  vehicles       Vehicle[]
  journalEntries JournalEntry[]
  reminders      Reminder[]
  documents      Document[]

  ownerTeamMembers  TeamMember[] @relation("TeamOwner")
  memberTeamMembers TeamMember[] @relation("TeamMember")

  subscription Subscription?

  @@map("users")
}

model Session {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model TeamMember {
  id        String     @id @default(uuid())
  ownerId   String     @map("owner_id")
  memberId  String     @map("member_id")
  role      MemberRole @default(viewer)
  createdAt DateTime   @default(now()) @map("created_at")

  owner  User @relation("TeamOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  member User @relation("TeamMember", fields: [memberId], references: [id], onDelete: Cascade)

  @@unique([ownerId, memberId])
  @@map("team_members")
}

model Vehicle {
  id             String   @id @default(uuid())
  ownerId        String   @map("owner_id")
  make           String
  model          String
  year           Int?
  plateNumber    String?  @map("plate_number")
  vin            String?
  fuelType       FuelType @default(petrol) @map("fuel_type")
  currentMileage Int      @default(0) @map("current_mileage")
  notes          String?  @db.Text
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  owner          User           @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  journalEntries JournalEntry[]
  reminders      Reminder[]
  documents      Document[]

  @@map("vehicles")
}

model JournalEntry {
  id          String           @id @default(uuid())
  vehicleId   String           @map("vehicle_id")
  userId      String           @map("user_id")
  type        JournalEntryType
  title       String
  description String?          @db.Text
  eventDate   DateTime         @map("event_date")
  mileage     Int?
  amount      Decimal?         @db.Decimal(10, 2)
  vendor      String?
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("journal_entries")
}

model Reminder {
  id             String         @id @default(uuid())
  vehicleId      String         @map("vehicle_id")
  userId         String         @map("user_id")
  title          String
  description    String?        @db.Text
  triggerType    TriggerType    @map("trigger_type")
  triggerDate    DateTime?      @map("trigger_date")
  triggerMileage Int?           @map("trigger_mileage")
  status         ReminderStatus @default(active)
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")

  vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("reminders")
}

model Document {
  id          String       @id @default(uuid())
  vehicleId   String       @map("vehicle_id")
  userId      String       @map("user_id")
  title       String
  type        DocumentType @default(receipt)
  fileName    String?      @map("file_name")
  fileUrl     String?      @map("file_url")
  description String?      @db.Text
  createdAt   DateTime     @default(now()) @map("created_at")

  vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("documents")
}

model Subscription {
  id        String             @id @default(uuid())
  userId    String             @unique @map("user_id")
  plan      Plan               @default(free)
  status    SubscriptionStatus @default(active)
  createdAt DateTime           @default(now()) @map("created_at")
  updatedAt DateTime           @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}

enum Plan {
  free
  standard
  premium
}

enum MemberRole {
  editor
  viewer
}

enum FuelType {
  petrol
  diesel
  gas
  hybrid
  electric
  other
}

enum JournalEntryType {
  maintenance
  repair
  fuel
  expense
  document
  other
}

enum TriggerType {
  date
  mileage
  date_and_mileage
}

enum ReminderStatus {
  active
  done
  postponed
  cancelled
}

enum DocumentType {
  receipt
  insurance
  service_act
  photo
  pdf
  other
}

enum SubscriptionStatus {
  active
  cancelled
}
`,

  "prisma/seed.ts": `import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed started");
  console.log("Seed finished");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`,

  "src/app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  min-height: 100%;
}

body {
  margin: 0;
}
`,

  "src/app/layout.tsx": `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoJournal",
  description: "Учебный сервис для учета автомобиля"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
`,

  "src/app/page.tsx": `export default function HomePage() {
  return (
    <main>
      <h1>AutoJournal</h1>
      <p>Учебный веб-сервис для учета расходов, обслуживания и истории автомобиля.</p>
    </main>
  );
}
`,

  "src/app/app/layout.tsx": `export default function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div>{children}</div>;
}
`,

  "src/lib/prisma.ts": `import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
`,

  "src/lib/auth.ts": `export async function getCurrentUser() {
  return null;
}
`,

  "src/lib/password.ts": `import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
`,

  "src/lib/session.ts": `import crypto from "node:crypto";

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}
`,

  "src/lib/permissions.ts": `export function canEdit(role?: string) {
  return role === "editor";
}

export function canView(role?: string) {
  return role === "editor" || role === "viewer";
}
`,

  "src/lib/validators.ts": `import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
`,

  "src/lib/constants.ts": `export const APP_NAME = "AutoJournal";

export const plans = [
  { id: "free", name: "Free", price: 0 },
  { id: "standard", name: "Standard", price: 199 },
  { id: "premium", name: "Premium", price: 349 }
] as const;
`,

  "src/lib/utils.ts": `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,

  "src/types/index.ts": `export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
`
};

const pageFiles = [
  "src/app/auth/login/page.tsx",
  "src/app/auth/register/page.tsx",

  "src/app/app/page.tsx",
  "src/app/app/dashboard/page.tsx",

  "src/app/app/vehicles/page.tsx",
  "src/app/app/vehicles/new/page.tsx",
  "src/app/app/vehicles/[id]/page.tsx",
  "src/app/app/vehicles/[id]/journal/page.tsx",
  "src/app/app/vehicles/[id]/reminders/page.tsx",
  "src/app/app/vehicles/[id]/documents/page.tsx",
  "src/app/app/vehicles/[id]/analytics/page.tsx",
  "src/app/app/vehicles/[id]/report/page.tsx",

  "src/app/app/team/page.tsx",
  "src/app/app/billing/page.tsx",
  "src/app/app/settings/page.tsx"
];

const routeFiles = [
  "src/app/api/auth/register/route.ts",
  "src/app/api/auth/login/route.ts",
  "src/app/api/auth/logout/route.ts",
  "src/app/api/auth/me/route.ts",

  "src/app/api/vehicles/route.ts",
  "src/app/api/vehicles/[id]/route.ts",

  "src/app/api/journal/route.ts",
  "src/app/api/journal/[id]/route.ts",

  "src/app/api/reminders/route.ts",
  "src/app/api/reminders/[id]/route.ts",

  "src/app/api/documents/route.ts",
  "src/app/api/documents/[id]/route.ts",

  "src/app/api/team/route.ts",
  "src/app/api/billing/route.ts",
  "src/app/api/export/route.ts"
];

const componentFiles = [
  "src/components/layout/sidebar.tsx",
  "src/components/layout/header.tsx",
  "src/components/layout/app-shell.tsx",

  "src/components/auth/login-form.tsx",
  "src/components/auth/register-form.tsx",

  "src/components/vehicles/vehicle-form.tsx",
  "src/components/vehicles/vehicle-card.tsx",

  "src/components/journal/journal-form.tsx",
  "src/components/journal/journal-table.tsx",
  "src/components/journal/journal-filters.tsx",

  "src/components/reminders/reminder-form.tsx",
  "src/components/reminders/reminder-list.tsx",

  "src/components/documents/document-form.tsx",
  "src/components/documents/document-list.tsx",

  "src/components/analytics/expenses-chart.tsx",

  "src/components/billing/plan-card.tsx",

  "src/components/ui/button.tsx",
  "src/components/ui/input.tsx",
  "src/components/ui/card.tsx",
  "src/components/ui/table.tsx",
  "src/components/ui/modal.tsx"
];

function removeIfExists(relativePath) {
  const absolutePath = path.join(root, relativePath);

  if (fs.existsSync(absolutePath)) {
    fs.rmSync(absolutePath, { recursive: true, force: true });
    console.log(`removed: ${relativePath}`);
  }
}

function createDir(relativePath) {
  fs.mkdirSync(path.join(root, relativePath), { recursive: true });
}

function createFile(relativePath, content, overwrite = reset) {
  const absolutePath = path.join(root, relativePath);
  const dirName = path.dirname(absolutePath);

  fs.mkdirSync(dirName, { recursive: true });

  if (fs.existsSync(absolutePath) && !overwrite) {
    console.log(`skip: ${relativePath}`);
    return;
  }

  fs.writeFileSync(absolutePath, content, "utf8");
  console.log(`created: ${relativePath}`);
}

function toPascalCase(value) {
  return value
    .replace(/\[[^\]]+\]/g, "")
    .split(/[\/\-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("") || "Page";
}

function createPageContent(relativePath) {
  const name = toPascalCase(
    relativePath
      .replace("src/app/", "")
      .replace("/page.tsx", "")
  );

  const title = relativePath
    .replace("src/app/", "")
    .replace("/page.tsx", "")
    .replaceAll("[", "")
    .replaceAll("]", "")
    .replaceAll("/", " / ");

  return `export default function ${name}Page() {
  return (
    <main>
      <h1>${title}</h1>
    </main>
  );
}
`;
}

function createRouteContent(relativePath) {
  return `import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    route: "${relativePath}",
    message: "Учебный endpoint. Логика будет добавлена позже."
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    route: "${relativePath}",
    message: "Учебный endpoint. Логика будет добавлена позже."
  });
}
`;
}

function createComponentContent(relativePath) {
  const fileName = path.basename(relativePath, ".tsx");
  const name = toPascalCase(fileName);

  return `export function ${name}() {
  return <div>${name}</div>;
}
`;
}

if (reset) {
  for (const item of resetPaths) {
    removeIfExists(item);
  }
}

for (const dir of dirs) {
  createDir(dir);
}

for (const [relativePath, content] of Object.entries(files)) {
  createFile(relativePath, content);
}

for (const file of pageFiles) {
  createFile(file, createPageContent(file));
}

for (const file of routeFiles) {
  createFile(file, createRouteContent(file));
}

for (const file of componentFiles) {
  createFile(file, createComponentContent(file));
}

createFile("public/uploads/.gitkeep", "");

console.log("");
console.log("Структура AutoJournal создана.");
console.log("");
console.log("Дальше выполни:");
console.log("1. npm install");
console.log("2. cp .env.example .env");
console.log("3. настрой DATABASE_URL в .env");
console.log("4. npx prisma generate");
console.log("5. npx prisma migrate dev --name init");
console.log("6. npm run dev");