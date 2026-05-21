import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { journalSchema } from "@/lib/validators";

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

  const entries = await prisma.journalEntry.findMany({
    where: { vehicleId },
    orderBy: { eventDate: "desc" }
  });

  return NextResponse.json({
    success: true,
    data: entries
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
  const parsed = journalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Некорректные данные записи" },
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

  const entry = await prisma.journalEntry.create({
    data: {
      vehicleId: parsed.data.vehicleId,
      userId: user.id,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description || null,
      eventDate: new Date(parsed.data.eventDate),
      mileage: parsed.data.mileage || null,
      amount: parsed.data.amount || null,
      vendor: parsed.data.vendor || null
    }
  });

  if (parsed.data.mileage && parsed.data.mileage > vehicle.currentMileage) {
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { currentMileage: parsed.data.mileage }
    });
  }

  return NextResponse.json(
    {
      success: true,
      data: entry
    },
    { status: 201 }
  );
}
