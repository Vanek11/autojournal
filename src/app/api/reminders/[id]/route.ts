import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reminderSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getReminderForUser(reminderId: string, userId: string) {
  return prisma.reminder.findFirst({
    where: {
      id: reminderId,
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
  const reminder = await getReminderForUser(id, user.id);

  if (!reminder) {
    return NextResponse.json(
      { success: false, error: "Напоминание не найдено" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: reminder
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
  const reminder = await getReminderForUser(id, user.id);

  if (!reminder) {
    return NextResponse.json(
      { success: false, error: "Напоминание не найдено" },
      { status: 404 }
    );
  }

  if (reminder.vehicle.ownerId !== user.id && reminder.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: "Нет прав на изменение напоминания" },
      { status: 403 }
    );
  }

  const body = await request.json();

  if (body.status) {
    const allowedStatuses = ["active", "done", "postponed", "cancelled"];

    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Некорректный статус" },
        { status: 400 }
      );
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: {
        status: body.status
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedReminder
    });
  }

  const parsed = reminderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Некорректные данные напоминания" },
      { status: 400 }
    );
  }

  const updatedReminder = await prisma.reminder.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      triggerType: parsed.data.triggerType,
      triggerDate: parsed.data.triggerDate ? new Date(parsed.data.triggerDate) : null,
      triggerMileage: parsed.data.triggerMileage ?? null
    }
  });

  return NextResponse.json({
    success: true,
    data: updatedReminder
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
  const reminder = await getReminderForUser(id, user.id);

  if (!reminder) {
    return NextResponse.json(
      { success: false, error: "Напоминание не найдено" },
      { status: 404 }
    );
  }

  if (reminder.vehicle.ownerId !== user.id && reminder.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: "Нет прав на удаление напоминания" },
      { status: 403 }
    );
  }

  await prisma.reminder.delete({
    where: { id }
  });

  return NextResponse.json({
    success: true
  });
}
