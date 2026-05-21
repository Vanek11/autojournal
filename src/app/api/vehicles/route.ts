import { getVehicleLimit } from "@/lib/plans";
﻿import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validators";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const vehicles = await prisma.vehicle.findMany({
    where: {
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
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({
    success: true,
    data: vehicles
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

  // plan-gate:vehicle-limit
  const gateUser = await prisma.user.findUnique({
    where: {
      id: user.id
    },
    select: {
      plan: true
    }
  });

  const activePlan = gateUser?.plan || user.plan;
  const vehicleLimit = getVehicleLimit(activePlan);

  if (vehicleLimit !== null) {
    const vehicleCount = await prisma.vehicle.count({
      where: {
        ownerId: user.id
      }
    });

    if (vehicleCount >= vehicleLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `Текущий тариф разрешает максимум ${vehicleLimit} автомобиль. Для добавления новых автомобилей измените тариф.`
        },
        { status: 403 }
      );
    }
  }

  const body = await request.json();
  const parsed = vehicleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Некорректные данные автомобиля" },
      { status: 400 }
    );
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      ownerId: user.id,
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

  return NextResponse.json(
    {
      success: true,
      data: vehicle
    },
    { status: 201 }
  );
}
