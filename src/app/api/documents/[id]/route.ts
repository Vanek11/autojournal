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
