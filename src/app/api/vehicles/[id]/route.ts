import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const vehicle = await getVehicleForUser(id, user.id);

  if (!vehicle) {
    return NextResponse.json(
      { success: false, error: "Автомобиль не найден" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: vehicle
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

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id,
      ownerId: user.id
    }
  });

  if (!vehicle) {
    return NextResponse.json(
      { success: false, error: "Автомобиль не найден или нет прав на изменение" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const parsed = vehicleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Некорректные данные автомобиля" },
      { status: 400 }
    );
  }

  const updatedVehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      make: parsed.data.make,
      model: parsed.data.model,
      year: parsed.data.year || null,
      plateNumber: parsed.data.plateNumber || null,
      vin: parsed.data.vin || null,
      fuelType: parsed.data.fuelType,
      currentMileage: parsed.data.currentMileage,
      notes: parsed.data.notes || null
    }
  });

  return NextResponse.json({
    success: true,
    data: updatedVehicle
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

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id,
      ownerId: user.id
    }
  });

  if (!vehicle) {
    return NextResponse.json(
      { success: false, error: "Автомобиль не найден или нет прав на удаление" },
      { status: 404 }
    );
  }

  await prisma.vehicle.delete({
    where: { id }
  });

  return NextResponse.json({
    success: true
  });
}