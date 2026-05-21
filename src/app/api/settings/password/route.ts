import bcrypt from "bcryptjs";
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

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  const repeatPassword = String(body.repeatPassword || "");

  if (!currentPassword || !newPassword || !repeatPassword) {
    return NextResponse.json(
      { success: false, error: "Заполните все поля пароля" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { success: false, error: "Новый пароль должен быть не короче 6 символов" },
      { status: 400 }
    );
  }

  if (newPassword !== repeatPassword) {
    return NextResponse.json(
      { success: false, error: "Новый пароль и повтор пароля не совпадают" },
      { status: 400 }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      id: user.id
    }
  });

  if (!dbUser) {
    return NextResponse.json(
      { success: false, error: "Пользователь не найден" },
      { status: 404 }
    );
  }

  const passwordIsValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);

  if (!passwordIsValid) {
    return NextResponse.json(
      { success: false, error: "Текущий пароль указан неверно" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      passwordHash
    }
  });

  return NextResponse.json({
    success: true
  });
}
