import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/lib/plans";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function makeCsv(rows: unknown[][]) {
  return rows.map((row) => row.map(csvEscape).join(";")).join("\n");
}

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const gateUser = await prisma.user.findUnique({
    where: {
      id: user.id
    },
    select: {
      plan: true
    }
  });

  const activePlan = gateUser?.plan || user.plan;

  if (!canUseFeature(activePlan, "export")) {
    return NextResponse.json(
      {
        success: false,
        error: "Экспорт данных доступен начиная с тарифа Standard"
      },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");
  const format = searchParams.get("format") || "json";

  if (!vehicleId) {
    return NextResponse.json(
      { success: false, error: "Не указан автомобиль" },
      { status: 400 }
    );
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
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
      journalEntries: {
        orderBy: {
          eventDate: "desc"
        }
      },
      reminders: {
        orderBy: {
          createdAt: "desc"
        }
      },
      documents: {
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!vehicle) {
    return NextResponse.json(
      { success: false, error: "Автомобиль не найден" },
      { status: 404 }
    );
  }

  const data = {
    vehicle: {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      plateNumber: vehicle.plateNumber,
      vin: vehicle.vin,
      fuelType: vehicle.fuelType,
      currentMileage: vehicle.currentMileage,
      notes: vehicle.notes
    },
    journalEntries: vehicle.journalEntries.map((entry) => ({
      id: entry.id,
      type: entry.type,
      title: entry.title,
      description: entry.description,
      eventDate: entry.eventDate.toISOString(),
      mileage: entry.mileage,
      amount: entry.amount ? Number(entry.amount) : null,
      vendor: entry.vendor
    })),
    reminders: vehicle.reminders.map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      triggerType: reminder.triggerType,
      triggerDate: reminder.triggerDate ? reminder.triggerDate.toISOString() : null,
      triggerMileage: reminder.triggerMileage,
      status: reminder.status
    })),
    documents: vehicle.documents.map((document) => ({
      id: document.id,
      title: document.title,
      type: document.type,
      fileUrl: document.fileUrl,
      description: document.description,
      createdAt: document.createdAt.toISOString()
    }))
  };

  if (format === "csv") {
    const rows = [
      ["Дата", "Тип", "Название", "Пробег", "Сумма", "Сервис", "Комментарий"],
      ...data.journalEntries.map((entry) => [
        new Date(entry.eventDate).toLocaleDateString("ru-RU"),
        entry.type,
        entry.title,
        entry.mileage ?? "",
        entry.amount ?? "",
        entry.vendor ?? "",
        entry.description ?? ""
      ])
    ];

    const csv = makeCsv(rows);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="autojournal-${vehicle.make}-${vehicle.model}.csv"`
      }
    });
  }

  return NextResponse.json({
    success: true,
    data
  });
}
