import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/lib/plans";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
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

  if (!canUseFeature(activePlan, "team")) {
    return NextResponse.json(
      {
        success: false,
        error: "Командный доступ доступен начиная с тарифа Standard"
      },
      { status: 403 }
    );
  }

  const { id } = await context.params;

  const teamMember = await prisma.teamMember.findFirst({
    where: {
      id,
      ownerId: user.id
    }
  });

  if (!teamMember) {
    return NextResponse.json(
      { success: false, error: "Участник команды не найден" },
      { status: 404 }
    );
  }

  await prisma.teamMember.delete({
    where: {
      id
    }
  });

  return NextResponse.json({
    success: true
  });
}
