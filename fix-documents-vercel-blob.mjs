import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const filePath = path.join(root, "src/app/api/documents/route.ts");
const backupPath = path.join(root, ".backup-documents-route-before-blob.ts");

if (fs.existsSync(filePath)) {
  fs.copyFileSync(filePath, backupPath);
  console.log("backup created: .backup-documents-route-before-blob.ts");
}

const content = `import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

function safeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

async function getVehicleForUser(vehicleId: string, userId: string) {
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

  const vehicle = await getVehicleForUser(vehicleId, user.id);

  if (!vehicle) {
    return NextResponse.json(
      { success: false, error: "Автомобиль не найден" },
      { status: 404 }
    );
  }

  const documents = await prisma.document.findMany({
    where: {
      vehicleId
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({
    success: true,
    data: documents
  });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Пользователь не авторизован" },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const vehicleId = String(formData.get("vehicleId") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const type = String(formData.get("type") || "document").trim();
    const description = String(formData.get("description") || "").trim();

    const fileValue =
      formData.get("file") ||
      formData.get("document") ||
      formData.get("receipt");

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: "Не указан автомобиль" },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Укажите название документа" },
        { status: 400 }
      );
    }

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Файл не передан" },
        { status: 400 }
      );
    }

    if (fileValue.size <= 0) {
      return NextResponse.json(
        { success: false, error: "Файл пустой" },
        { status: 400 }
      );
    }

    if (fileValue.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Файл слишком большой. Максимум 4 МБ." },
        { status: 400 }
      );
    }

    if (fileValue.type && !allowedMimeTypes.has(fileValue.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Можно загружать только PDF, JPG, PNG или WEBP"
        },
        { status: 400 }
      );
    }

    const vehicle = await getVehicleForUser(vehicleId, user.id);

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: "Автомобиль не найден" },
        { status: 404 }
      );
    }

    const blobPath = [
      "autojournal",
      "documents",
      user.id,
      vehicleId,
      randomUUID() + "-" + safeFileName(fileValue.name || "file")
    ].join("/");

    const blob = await put(blobPath, fileValue, {
      access: "public",
      contentType: fileValue.type || "application/octet-stream"
    });

    const document = await prisma.document.create({
      data: {
        vehicleId,
        title,
        type,
        fileUrl: blob.url,
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
  } catch (error) {
    console.error("Document upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Ошибка сервера при загрузке документа"
      },
      { status: 500 }
    );
  }
}
`;

fs.writeFileSync(filePath, content, "utf8");

console.log("updated: src/app/api/documents/route.ts");
console.log("Documents upload now uses Vercel Blob.");