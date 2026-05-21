import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { journalSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getEntryForUser(entryId: string, userId: string) {
  return prisma.journalEntry.findFirst({
    where: {
      id: entryId,
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
  const entry = await getEntryForUser(id, user.id);

  if (!entry) {
    return NextResponse.json(
      { success: false, error: "Запись не найдена" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: entry
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const existingEntry = await getEntryForUser(id, user.id);

  if (!existingEntry) {
    return NextResponse.json(
      { success: false, error: "Запись не найдена" },
      { status: 404 }
    );
  }

  if (existingEntry.vehicle.ownerId !== user.id && existingEntry.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: "Нет прав на изменение записи" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = journalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Некорректные данные записи" },
      { status: 400 }
    );
  }

  const updatedEntry = await prisma.journalEntry.update({
    where: { id },
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description || null,
      eventDate: new Date(parsed.data.eventDate),
      mileage: parsed.data.mileage || null,
      amount: parsed.data.amount || null,
      vendor: parsed.data.vendor || null
    }
  });

  return NextResponse.json({
    success: true,
    data: updatedEntry
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
  const entry = await getEntryForUser(id, user.id);

  if (!entry) {
    return NextResponse.json(
      { success: false, error: "Запись не найдена" },
      { status: 404 }
    );
  }

  if (entry.vehicle.ownerId !== user.id && entry.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: "Нет прав на удаление записи" },
      { status: 403 }
    );
  }

  await prisma.journalEntry.delete({
    where: { id }
  });

  return NextResponse.json({
    success: true
  });
}
