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

writeFile("src/lib/validators.ts", getContent(function () {/*
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const vehicleSchema = z.object({
  make: z.string().min(1, "Укажите марку"),
  model: z.string().min(1, "Укажите модель"),
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  plateNumber: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
  fuelType: z.enum(["petrol", "diesel", "gas", "hybrid", "electric", "other"]),
  currentMileage: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional().nullable()
});

export const journalSchema = z.object({
  vehicleId: z.string().min(1),
  type: z.enum(["maintenance", "repair", "fuel", "expense", "document", "other"]),
  title: z.string().min(1, "Укажите название записи"),
  description: z.string().optional().nullable(),
  eventDate: z.string().min(1, "Укажите дату"),
  mileage: z.coerce.number().int().min(0).optional().nullable(),
  amount: z.coerce.number().min(0).optional().nullable(),
  vendor: z.string().optional().nullable()
});

export const reminderSchema = z.object({
  vehicleId: z.string().min(1),
  title: z.string().min(1, "Укажите название напоминания"),
  description: z.string().optional().nullable(),
  triggerType: z.enum(["date", "mileage", "date_and_mileage"]),
  triggerDate: z.string().optional().nullable(),
  triggerMileage: z.coerce.number().int().min(0).optional().nullable()
});

export const documentSchema = z.object({
  vehicleId: z.string().min(1),
  title: z.string().min(1, "Укажите название документа"),
  type: z.enum(["receipt", "insurance", "service_act", "photo", "pdf", "other"]),
  fileUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable()
});
*/}));

writeFile("src/app/api/documents/route.ts", getContent(function () {/*
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
];

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf"
};

async function canAccessVehicle(vehicleId: string, userId: string) {
  return prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      OR: [
        { ownerId: userId },
        {
          owner: {
            ownerTeamMembers: {
              some: {
                memberId: userId
              }
            }
          }
        }
      ]
    }
  });
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");

  if (!vehicleId) {
    return NextResponse.json(
      { success: false, error: "Не указан автомобиль" },
      { status: 400 }
    );
  }

  const vehicle = await canAccessVehicle(vehicleId, user.id);

  if (!vehicle) {
    return NextResponse.json(
      { success: false, error: "Автомобиль не найден" },
      { status: 404 }
    );
  }

  const documents = await prisma.document.findMany({
    where: { vehicleId },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    success: true,
    data: documents
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

  const formData = await request.formData();

  const vehicleId = getStringValue(formData, "vehicleId");
  const title = getStringValue(formData, "title");
  const type = getStringValue(formData, "type") || "receipt";
  const description = getStringValue(formData, "description");
  const externalFileUrl = getStringValue(formData, "fileUrl");

  if (!vehicleId || !title) {
    return NextResponse.json(
      { success: false, error: "Укажите автомобиль и название документа" },
      { status: 400 }
    );
  }

  const allowedTypes = ["receipt", "insurance", "service_act", "photo", "pdf", "other"];

  if (!allowedTypes.includes(type)) {
    return NextResponse.json(
      { success: false, error: "Некорректный тип документа" },
      { status: 400 }
    );
  }

  const vehicle = await canAccessVehicle(vehicleId, user.id);

  if (!vehicle) {
    return NextResponse.json(
      { success: false, error: "Автомобиль не найден" },
      { status: 404 }
    );
  }

  let fileName: string | null = null;
  let fileUrl: string | null = externalFileUrl || null;

  const file = formData.get("file");

  if (file instanceof File && file.size > 0) {
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Можно загрузить только JPG, PNG, WEBP или PDF" },
        { status: 400 }
      );
    }

    const maxSizeBytes = 10 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { success: false, error: "Файл не должен быть больше 10 МБ" },
        { status: 400 }
      );
    }

    const extension = extensionByMimeType[file.type];
    fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const uploadPath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(uploadPath, buffer);

    fileUrl = `/uploads/${fileName}`;
  }

  if (!fileUrl) {
    return NextResponse.json(
      { success: false, error: "Загрузите файл или укажите ссылку на документ" },
      { status: 400 }
    );
  }

  const document = await prisma.document.create({
    data: {
      vehicleId,
      userId: user.id,
      title,
      type: type as any,
      fileName,
      fileUrl,
      description: description || null
    }
  });

  return NextResponse.json(
    {
      success: true,
      data: document
    },
    { status: 201 }
  );
}
*/}));

writeFile("src/app/api/documents/[id]/route.ts", getContent(function () {/*
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getDocumentForUser(documentId: string, userId: string) {
  return prisma.document.findFirst({
    where: {
      id: documentId,
      vehicle: {
        OR: [
          { ownerId: userId },
          {
            owner: {
              ownerTeamMembers: {
                some: {
                  memberId: userId
                }
              }
            }
          }
        ]
      }
    },
    include: {
      vehicle: true
    }
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const document = await getDocumentForUser(id, user.id);

  if (!document) {
    return NextResponse.json(
      { success: false, error: "Документ не найден" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: document
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const document = await getDocumentForUser(id, user.id);

  if (!document) {
    return NextResponse.json(
      { success: false, error: "Документ не найден" },
      { status: 404 }
    );
  }

  if (document.vehicle.ownerId !== user.id && document.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: "Нет прав на удаление документа" },
      { status: 403 }
    );
  }

  if (document.fileName) {
    const uploadPath = path.join(process.cwd(), "public", "uploads", document.fileName);

    try {
      await fs.unlink(uploadPath);
    } catch {
      // Файл мог быть уже удален. Для учебного проекта это не критично.
    }
  }

  await prisma.document.delete({
    where: { id }
  });

  return NextResponse.json({
    success: true
  });
}
*/}));

writeFile("src/components/documents/document-form.tsx", getContent(function () {/*
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DocumentFormProps = {
  vehicleId: string;
};

const documentTypes = [
  { value: "receipt", label: "Чек" },
  { value: "insurance", label: "Страховка" },
  { value: "service_act", label: "Акт сервиса" },
  { value: "photo", label: "Фото" },
  { value: "pdf", label: "PDF" },
  { value: "other", label: "Другое" }
];

export function DocumentForm({ vehicleId }: DocumentFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("receipt");
  const [fileUrl, setFileUrl] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const formData = new FormData();

    formData.append("vehicleId", vehicleId);
    formData.append("title", title);
    formData.append("type", type);
    formData.append("fileUrl", fileUrl);
    formData.append("description", description);

    if (file) {
      formData.append("file", file);
    }

    const response = await fetch("/api/documents", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Не удалось добавить документ");
      return;
    }

    setTitle("");
    setType("receipt");
    setFileUrl("");
    setDescription("");
    setFile(null);

    const input = document.getElementById("document-file") as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card-large space-y-5 p-6">
      <div>
        <h2 className="text-xl font-semibold">Новый документ</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Загрузите фото, PDF чека или укажите ссылку на документ.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Название</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="input"
            placeholder="Например: чек за замену масла"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>Тип документа</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="input"
          >
            {documentTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Файл JPG, PNG, WEBP или PDF</span>
        <input
          id="document-file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          className="input"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Или ссылка на файл</span>
        <input
          value={fileUrl}
          onChange={(event) => setFileUrl(event.target.value)}
          className="input"
          placeholder="https://example.com/receipt.pdf"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Комментарий</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="input min-h-24"
          placeholder="Дополнительные детали"
        />
      </label>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Добавление..." : "Добавить документ"}
      </button>
    </form>
  );
}
*/}));

writeFile("src/components/documents/document-list.tsx", getContent(function () {/*
"use client";

import { useRouter } from "next/navigation";

type VehicleDocument = {
  id: string;
  title: string;
  type: string;
  fileName: string | null;
  fileUrl: string | null;
  description: string | null;
  createdAt: string;
};

type DocumentListProps = {
  documents: VehicleDocument[];
};

const typeLabels: Record<string, string> = {
  receipt: "Чек",
  insurance: "Страховка",
  service_act: "Акт сервиса",
  photo: "Фото",
  pdf: "PDF",
  other: "Другое"
};

function isImage(url: string) {
  return /\.(jpg|jpeg|png|webp)$/i.test(url);
}

export function DocumentList({ documents }: DocumentListProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Удалить документ?");

    if (!confirmed) {
      return;
    }

    await fetch(`/api/documents/${id}`, {
      method: "DELETE"
    });

    router.refresh();
  }

  if (documents.length === 0) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-lg font-semibold">Документов пока нет</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Добавьте фото чека, PDF, страховку или другой документ.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {documents.map((document) => {
        const url = document.fileUrl || "";

        return (
          <article key={document.id} className="card overflow-hidden">
            {url && isImage(url) ? (
              <div className="h-44 border-b border-[var(--border)] bg-[var(--surface-muted)]">
                <img
                  src={url}
                  alt={document.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs text-[var(--accent-dark)]">
                    {typeLabels[document.type] || document.type}
                  </span>

                  <h2 className="mt-3 text-lg font-semibold">{document.title}</h2>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Добавлено: {new Date(document.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              </div>

              {document.description ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  {document.description}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-sm"
                  >
                    Открыть файл
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => handleDelete(document.id)}
                  className="rounded-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Удалить
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
*/}));

writeFile("src/app/app/vehicles/[id]/documents/page.tsx", getContent(function () {/*
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentForm } from "@/components/documents/document-form";
import { DocumentList } from "@/components/documents/document-list";

type DocumentsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VehicleDocumentsPage({ params }: DocumentsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id,
      OR: [
        { ownerId: user.id },
        {
          owner: {
            ownerTeamMembers: {
              some: {
                memberId: user.id
              }
            }
          }
        }
      ]
    },
    include: {
      documents: {
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!vehicle) {
    notFound();
  }

  const documents = vehicle.documents.map((document) => ({
    id: document.id,
    title: document.title,
    type: document.type,
    fileName: document.fileName,
    fileUrl: document.fileUrl,
    description: document.description,
    createdAt: document.createdAt.toISOString()
  }));

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-[var(--accent-dark)]">
            Документы
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Чеки, фото, PDF, страховки и сервисные документы. Всего: {documents.length}
          </p>
        </div>

        <Link href={`/app/vehicles/${vehicle.id}`} className="btn-secondary">
          Назад к автомобилю
        </Link>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <DocumentForm vehicleId={vehicle.id} />
        <DocumentList documents={documents} />
      </section>
    </div>
  );
}
*/}));

console.log("");
console.log("Documents module added.");