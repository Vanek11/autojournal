import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const filePath = path.join(root, "src/app/api/team/route.ts");
const backupPath = path.join(root, ".backup-team-route-role-type.ts");

if (fs.existsSync(filePath)) {
  fs.copyFileSync(filePath, backupPath);
  console.log("backup created: .backup-team-route-role-type.ts");
}

const content = `import { MemberRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/lib/plans";

const allowedRoles = Object.values(MemberRole) as MemberRole[];

function parseRole(value: unknown): MemberRole | null {
  const normalized = String(value || "viewer").trim().toLowerCase();

  return (
    allowedRoles.find((item) => item.toLowerCase() === normalized) || null
  );
}

async function getActivePlan(userId: string, fallbackPlan: string) {
  const dbUser = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      plan: true
    }
  });

  return dbUser?.plan || fallbackPlan;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Пользователь не авторизован" },
      { status: 401 }
    );
  }

  const activePlan = await getActivePlan(user.id, user.plan);

  if (!canUseFeature(activePlan, "team")) {
    return NextResponse.json(
      {
        success: false,
        error: "Командный доступ доступен начиная с тарифа Standard"
      },
      { status: 403 }
    );
  }

  const members = await prisma.teamMember.findMany({
    where: {
      ownerId: user.id
    },
    include: {
      member: {
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({
    success: true,
    data: members
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

  const activePlan = await getActivePlan(user.id, user.plan);

  if (!canUseFeature(activePlan, "team")) {
    return NextResponse.json(
      {
        success: false,
        error: "Командный доступ доступен начиная с тарифа Standard"
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  const email = String(body.email || "").trim().toLowerCase();
  const role = parseRole(body.role);

  if (!email) {
    return NextResponse.json(
      { success: false, error: "Укажите email пользователя" },
      { status: 400 }
    );
  }

  if (!role) {
    return NextResponse.json(
      { success: false, error: "Некорректная роль" },
      { status: 400 }
    );
  }

  if (email === user.email.toLowerCase()) {
    return NextResponse.json(
      { success: false, error: "Нельзя добавить самого себя" },
      { status: 400 }
    );
  }

  const member = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!member) {
    return NextResponse.json(
      { success: false, error: "Пользователь с таким email не найден. Сначала он должен зарегистрироваться." },
      { status: 404 }
    );
  }

  const existingMember = await prisma.teamMember.findFirst({
    where: {
      ownerId: user.id,
      memberId: member.id
    }
  });

  if (existingMember) {
    return NextResponse.json(
      { success: false, error: "Этот пользователь уже добавлен в команду" },
      { status: 400 }
    );
  }

  const teamMember = await prisma.teamMember.create({
    data: {
      ownerId: user.id,
      memberId: member.id,
      role
    },
    include: {
      member: {
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          createdAt: true
        }
      }
    }
  });

  return NextResponse.json(
    {
      success: true,
      data: teamMember
    },
    { status: 201 }
  );
}
`;

fs.writeFileSync(filePath, content, "utf8");

console.log("updated: src/app/api/team/route.ts");
console.log("Team role type fixed.");