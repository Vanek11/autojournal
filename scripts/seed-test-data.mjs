import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_OWNER_EMAIL = "demo@autojournal.local";
const DEMO_VIEWER_EMAIL = "viewer@autojournal.local";
const DEMO_PASSWORD = "123456";

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function monthsAgo(months, day = 10) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  date.setDate(day);
  return date;
}

function ensureDemoFiles() {
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  fs.mkdirSync(uploadDir, { recursive: true });

  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAlgAAAEYCAYAAADQn7xZAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA" +
    "B3RJTUUH5QYQFQk3bXHcJwAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCBmb3IgQXV0b0pvdXJu" +
    "YWwAAAAASUVORK5CYII=";

  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 95 >>
stream
BT
/F1 18 Tf
72 720 Td
(AutoJournal test PDF document) Tj
72 690 Td
(Service receipt example) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000262 00000 n 
0000000408 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
478
%%EOF`;

  fs.writeFileSync(
    path.join(uploadDir, "seed-receipt.png"),
    Buffer.from(pngBase64, "base64")
  );

  fs.writeFileSync(
    path.join(uploadDir, "seed-service-act.pdf"),
    pdfContent,
    "utf8"
  );
}

async function main() {
  console.log("Seed started");

  ensureDemoFiles();

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [DEMO_OWNER_EMAIL, DEMO_VIEWER_EMAIL]
      }
    }
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const owner = await prisma.user.create({
    data: {
      email: DEMO_OWNER_EMAIL,
      name: "Демо Владелец",
      passwordHash,
      plan: "standard",
      subscription: {
        create: {
          plan: "standard",
          status: "active"
        }
      }
    }
  });

  const viewer = await prisma.user.create({
    data: {
      email: DEMO_VIEWER_EMAIL,
      name: "Демо Наблюдатель",
      passwordHash,
      plan: "free",
      subscription: {
        create: {
          plan: "free",
          status: "active"
        }
      }
    }
  });

  await prisma.teamMember.create({
    data: {
      ownerId: owner.id,
      memberId: viewer.id,
      role: "viewer"
    }
  });

  const camry = await prisma.vehicle.create({
    data: {
      ownerId: owner.id,
      make: "Toyota",
      model: "Camry",
      year: 2020,
      plateNumber: "А123ВС 777",
      vin: "JTNB11HKX02000001",
      fuelType: "petrol",
      currentMileage: 86400,
      notes: "Основной автомобиль. Используется для демонстрации журнала, аналитики, документов и напоминаний."
    }
  });

  const bmw = await prisma.vehicle.create({
    data: {
      ownerId: owner.id,
      make: "BMW",
      model: "X3",
      year: 2018,
      plateNumber: "М456ОР 799",
      vin: "WBA0X000000000001",
      fuelType: "diesel",
      currentMileage: 124800,
      notes: "Второй автомобиль для проверки режима нескольких машин."
    }
  });

  await prisma.journalEntry.createMany({
    data: [
      {
        vehicleId: camry.id,
        userId: owner.id,
        type: "maintenance",
        title: "Замена масла и фильтров",
        description: "Масло 5W-30, масляный фильтр, воздушный фильтр.",
        eventDate: monthsAgo(0, 3),
        mileage: 86400,
        amount: 7500,
        vendor: "Fit Service"
      },
      {
        vehicleId: camry.id,
        userId: owner.id,
        type: "fuel",
        title: "Заправка АИ-95",
        description: "Полный бак.",
        eventDate: daysAgo(5),
        mileage: 86120,
        amount: 4200,
        vendor: "Лукойл"
      },
      {
        vehicleId: camry.id,
        userId: owner.id,
        type: "repair",
        title: "Замена тормозных колодок",
        description: "Передние колодки.",
        eventDate: monthsAgo(1, 15),
        mileage: 85200,
        amount: 12800,
        vendor: "Garage Plus"
      },
      {
        vehicleId: camry.id,
        userId: viewer.id,
        type: "expense",
        title: "Мойка кузова",
        description: "Комплексная мойка.",
        eventDate: daysAgo(12),
        mileage: 85820,
        amount: 1500,
        vendor: "Автомойка 24"
      },
      {
        vehicleId: camry.id,
        userId: owner.id,
        type: "document",
        title: "ОСАГО",
        description: "Продление страхового полиса.",
        eventDate: monthsAgo(2, 7),
        mileage: 83500,
        amount: 14800,
        vendor: "Страховая компания"
      },
      {
        vehicleId: camry.id,
        userId: owner.id,
        type: "fuel",
        title: "Заправка АИ-95",
        description: "Заправка перед поездкой.",
        eventDate: monthsAgo(2, 18),
        mileage: 82900,
        amount: 3900,
        vendor: "Газпромнефть"
      },
      {
        vehicleId: camry.id,
        userId: owner.id,
        type: "maintenance",
        title: "Диагностика подвески",
        description: "Проверка ходовой части.",
        eventDate: monthsAgo(3, 9),
        mileage: 81200,
        amount: 2500,
        vendor: "Fit Service"
      },
      {
        vehicleId: bmw.id,
        userId: owner.id,
        type: "maintenance",
        title: "Плановое ТО",
        description: "Замена масла, фильтров, диагностика.",
        eventDate: daysAgo(20),
        mileage: 124800,
        amount: 18500,
        vendor: "BMW Service"
      },
      {
        vehicleId: bmw.id,
        userId: owner.id,
        type: "fuel",
        title: "Заправка дизель",
        description: "Полный бак.",
        eventDate: daysAgo(8),
        mileage: 124500,
        amount: 5600,
        vendor: "Shell"
      }
    ]
  });

  await prisma.reminder.createMany({
    data: [
      {
        vehicleId: camry.id,
        userId: owner.id,
        title: "Следующая замена масла",
        description: "Рекомендуется заменить масло на пробеге 90000 км.",
        triggerType: "mileage",
        triggerDate: null,
        triggerMileage: 90000,
        status: "active"
      },
      {
        vehicleId: camry.id,
        userId: owner.id,
        title: "Проверить ОСАГО",
        description: "Проверить срок действия полиса.",
        triggerType: "date",
        triggerDate: daysFromNow(14),
        triggerMileage: null,
        status: "active"
      },
      {
        vehicleId: camry.id,
        userId: owner.id,
        title: "Переобуть резину",
        description: "Сезонная замена шин.",
        triggerType: "date_and_mileage",
        triggerDate: daysFromNow(7),
        triggerMileage: 87000,
        status: "active"
      },
      {
        vehicleId: bmw.id,
        userId: owner.id,
        title: "Диагностика тормозов",
        description: "Проверить диски и колодки.",
        triggerType: "mileage",
        triggerDate: null,
        triggerMileage: 126000,
        status: "active"
      },
      {
        vehicleId: bmw.id,
        userId: owner.id,
        title: "Старое выполненное напоминание",
        description: "Пример завершенного напоминания.",
        triggerType: "date",
        triggerDate: daysAgo(10),
        triggerMileage: null,
        status: "done"
      }
    ]
  });

  await prisma.document.createMany({
    data: [
      {
        vehicleId: camry.id,
        userId: owner.id,
        title: "Фото чека за замену масла",
        type: "receipt",
        fileName: "seed-receipt.png",
        fileUrl: "/uploads/seed-receipt.png",
        description: "Тестовое изображение чека."
      },
      {
        vehicleId: camry.id,
        userId: owner.id,
        title: "Акт выполненных работ",
        type: "service_act",
        fileName: "seed-service-act.pdf",
        fileUrl: "/uploads/seed-service-act.pdf",
        description: "Тестовый PDF-документ."
      },
      {
        vehicleId: camry.id,
        userId: owner.id,
        title: "Ссылка на страховой полис",
        type: "insurance",
        fileName: null,
        fileUrl: "https://example.com/insurance-policy.pdf",
        description: "Пример внешней ссылки на документ."
      },
      {
        vehicleId: bmw.id,
        userId: owner.id,
        title: "Сервисный документ BMW",
        type: "pdf",
        fileName: "seed-service-act.pdf",
        fileUrl: "/uploads/seed-service-act.pdf",
        description: "Тестовый PDF для второго автомобиля."
      }
    ]
  });

  const vehicleCount = await prisma.vehicle.count({
    where: {
      ownerId: owner.id
    }
  });

  const journalCount = await prisma.journalEntry.count({
    where: {
      vehicle: {
        ownerId: owner.id
      }
    }
  });

  const reminderCount = await prisma.reminder.count({
    where: {
      vehicle: {
        ownerId: owner.id
      }
    }
  });

  const documentCount = await prisma.document.count({
    where: {
      vehicle: {
        ownerId: owner.id
      }
    }
  });

  console.log("");
  console.log("Seed finished");
  console.log("");
  console.log("Demo accounts:");
  console.log(`Owner:  ${DEMO_OWNER_EMAIL}`);
  console.log(`Viewer: ${DEMO_VIEWER_EMAIL}`);
  console.log(`Password for both: ${DEMO_PASSWORD}`);
  console.log("");
  console.log("Created:");
  console.log(`Vehicles:  ${vehicleCount}`);
  console.log(`Journal:   ${journalCount}`);
  console.log(`Reminders: ${reminderCount}`);
  console.log(`Documents: ${documentCount}`);
}

main()
  .catch((error) => {
    console.error("Seed failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });