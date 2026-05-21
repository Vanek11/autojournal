import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const name = String(body.name || "").trim();

  if (name.length > 80) {
    return NextResponse.json(
      { success: false, error: "Имя не должно быть длиннее 80 символов" },
      { status: 400 }
    );
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      name: name || null
    },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true
    }
  });

  return NextResponse.json({
    success: true,
    data: updatedUser
  });
}
