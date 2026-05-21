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
