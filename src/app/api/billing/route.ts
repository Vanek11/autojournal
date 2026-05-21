import { Plan } from "@prisma/client";
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
