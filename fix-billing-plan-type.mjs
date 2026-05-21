import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const filePath = path.join(root, "src/app/api/billing/route.ts");
const backupPath = path.join(root, ".backup-billing-route-plan-type.ts");

if (fs.existsSync(filePath)) {
  fs.copyFileSync(filePath, backupPath);
  console.log("backup created: .backup-billing-route-plan-type.ts");
}

const content = `import { Plan } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedPlans = Object.values(Plan) as Plan[];

function parsePlan(value: unknown): Plan | null {
  const normalized = String(value || "").trim().toLowerCase();

  return (
    allowedPlans.find((item) => item.toLowerCase() === normalized) || null
  );
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
  const plan = parsePlan(body.plan);

  if (!plan) {
    return NextResponse.json(
      { success: false, error: "Некорректный тариф" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      plan
    }
  });

  await prisma.subscription.upsert({
    where: {
      userId: user.id
    },
    create: {
      userId: user.id,
      plan,
      status: "active"
    },
    update: {
      plan,
      status: "active"
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      plan,
      status: "active"
    }
  });
}
`;

fs.writeFileSync(filePath, content, "utf8");

console.log("updated: src/app/api/billing/route.ts");
console.log("Billing plan type fixed.");