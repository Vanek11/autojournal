import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reminderSchema } from "@/lib/validators";

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

  const reminders = await prisma.reminder.findMany({
    where: { vehicleId },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    success: true,
    data: reminders
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

  const body = await request.json();
  const parsed = reminderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Некорректные данные напоминания" },
      { status: 400 }
    );
  }

  const vehicle = await canAccessVehicle(parsed.data.vehicleId, user.id);

  if (!vehicle) {
    return NextResponse.json(
      { success: false, error: "Автомобиль не найден" },
      { status: 404 }
    );
  }

  if (
    (parsed.data.triggerType === "date" || parsed.data.triggerType === "date_and_mileage") &&
    !parsed.data.triggerDate
  ) {
    return NextResponse.json(
      { success: false, error: "Для напоминания по дате нужно указать дату" },
      { status: 400 }
    );
  }

  if (
    (parsed.data.triggerType === "mileage" || parsed.data.triggerType === "date_and_mileage") &&
    parsed.data.triggerMileage == null
  ) {
    return NextResponse.json(
      { success: false, error: "Для напоминания по пробегу нужно указать пробег" },
      { status: 400 }
    );
  }

  const reminder = await prisma.reminder.create({
    data: {
      vehicleId: parsed.data.vehicleId,
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      triggerType: parsed.data.triggerType,
      triggerDate: parsed.data.triggerDate ? new Date(parsed.data.triggerDate) : null,
      triggerMileage: parsed.data.triggerMileage ?? null,
      status: "active"
    }
  });

  return NextResponse.json(
    {
      success: true,
      data: reminder
    },
    { status: 201 }
  );
}
