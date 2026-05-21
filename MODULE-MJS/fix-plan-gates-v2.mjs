import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupDir = path.join(
  root,
  ".backup-plan-gates-v2",
  new Date().toISOString().replace(/[:.]/g, "-")
);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function backupFile(relativePath) {
  const sourcePath = path.join(root, relativePath);

  if (!fs.existsSync(sourcePath)) {
    console.log(`skip backup, file not found: ${relativePath}`);
    return;
  }

  const backupPath = path.join(backupDir, relativePath);
  ensureDir(path.dirname(backupPath));
  fs.copyFileSync(sourcePath, backupPath);
}

function writeFile(relativePath, content) {
  const fullPath = path.join(root, relativePath);
  backupFile(relativePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`updated: ${relativePath}`);
}

function readFile(relativePath) {
  const fullPath = path.join(root, relativePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`skip, file not found: ${relativePath}`);
    return null;
  }

  return fs.readFileSync(fullPath, "utf8");
}

function ensureImport(content, importLine) {
  if (content.includes(importLine)) {
    return content;
  }

  const lines = content.split("\n");
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].startsWith("import ")) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex === -1) {
    return `${importLine}\n${content}`;
  }

  lines.splice(lastImportIndex + 1, 0, importLine);
  return lines.join("\n");
}

function removeOldPageGate(content, feature) {
  const patterns = [
    new RegExp(
      `\\n\\s*\\/\\/ plan-gate:${feature}\\n\\s*if \\(!canUseFeature\\(user\\.plan, "${feature}"\\)\\) \\{\\n\\s*redirect\\("/app/billing\\?required=${feature}"\\);\\n\\s*\\}\\n`,
      "g"
    ),
    new RegExp(
      `\\n\\s*\\/\\/ plan-gate:${feature}:fresh[\\s\\S]*?redirect\\("/app/billing\\?required=${feature}"\\);\\n\\s*\\}\\n`,
      "g"
    )
  ];

  let result = content;

  for (const pattern of patterns) {
    result = result.replace(pattern, "\n");
  }

  return result;
}

function patchServerPageFeature(relativePath, feature) {
  let content = readFile(relativePath);

  if (!content) {
    return;
  }

  content = ensureImport(content, 'import { canUseFeature } from "@/lib/plans";');
  content = ensureImport(content, 'import { prisma } from "@/lib/prisma";');

  content = removeOldPageGate(content, feature);

  const authRegex = /if\s*\(!user\)\s*\{\s*redirect\(["']\/auth\/login["']\);\s*\}/;

  if (!authRegex.test(content)) {
    console.log(`warning: auth block not found in ${relativePath}`);
    writeFile(relativePath, content);
    return;
  }

  const guard = `$&

  // plan-gate:${feature}:fresh
  const gateUser = await prisma.user.findUnique({
    where: {
      id: user.id
    },
    select: {
      plan: true
    }
  });

  const activePlan = gateUser?.plan || user.plan;

  if (!canUseFeature(activePlan, "${feature}")) {
    redirect("/app/billing?required=${feature}");
  }`;

  content = content.replace(authRegex, guard);

  writeFile(relativePath, content);
}

function patchApiFreshPlan(relativePath, feature, errorText) {
  let content = readFile(relativePath);

  if (!content) {
    return;
  }

  content = ensureImport(content, 'import { canUseFeature } from "@/lib/plans";');
  content = ensureImport(content, 'import { prisma } from "@/lib/prisma";');

  content = content.replaceAll(
    `if (!canUseFeature(user.plan, "${feature}")) {`,
    `const gateUser = await prisma.user.findUnique({
    where: {
      id: user.id
    },
    select: {
      plan: true
    }
  });

  const activePlan = gateUser?.plan || user.plan;

  if (!canUseFeature(activePlan, "${feature}")) {`
  );

  content = content.replaceAll(
    `error: "${errorText}"`,
    `error: "${errorText}"`
  );

  writeFile(relativePath, content);
}

function patchVehicleLimitFreshPlan() {
  const relativePath = "src/app/api/vehicles/route.ts";
  let content = readFile(relativePath);

  if (!content) {
    return;
  }

  content = ensureImport(content, 'import { getVehicleLimit } from "@/lib/plans";');
  content = ensureImport(content, 'import { prisma } from "@/lib/prisma";');

  content = content.replaceAll(
    "const vehicleLimit = getVehicleLimit(user.plan);",
    `const gateUser = await prisma.user.findUnique({
    where: {
      id: user.id
    },
    select: {
      plan: true
    }
  });

  const activePlan = gateUser?.plan || user.plan;
  const vehicleLimit = getVehicleLimit(activePlan);`
  );

  writeFile(relativePath, content);
}

function patchBillingPageFreshPlan() {
  const relativePath = "src/app/app/billing/page.tsx";
  let content = readFile(relativePath);

  if (!content) {
    return;
  }

  if (!content.includes("const dbUser = await prisma.user.findUnique")) {
    content = content.replace(
      `  const resolvedSearchParams = searchParams ? await searchParams : {};
  const subscription = await prisma.subscription.findUnique({`,
      `  const resolvedSearchParams = searchParams ? await searchParams : {};

  const dbUser = await prisma.user.findUnique({
    where: {
      id: user.id
    },
    select: {
      plan: true
    }
  });

  const subscription = await prisma.subscription.findUnique({`
    );
  }

  content = content.replaceAll(
    "currentPlan={user.plan}",
    "currentPlan={dbUser?.plan || user.plan}"
  );

  writeFile(relativePath, content);
}

patchServerPageFeature(
  "src/app/app/vehicles/[id]/analytics/page.tsx",
  "analytics"
);

patchServerPageFeature(
  "src/app/app/vehicles/[id]/report/page.tsx",
  "reports"
);

patchServerPageFeature(
  "src/app/app/team/page.tsx",
  "team"
);

patchApiFreshPlan(
  "src/app/api/export/route.ts",
  "export",
  "Экспорт данных доступен начиная с тарифа Standard"
);

patchApiFreshPlan(
  "src/app/api/team/route.ts",
  "team",
  "Командный доступ доступен начиная с тарифа Standard"
);

patchApiFreshPlan(
  "src/app/api/team/[id]/route.ts",
  "team",
  "Командный доступ доступен начиная с тарифа Standard"
);

patchVehicleLimitFreshPlan();
patchBillingPageFreshPlan();

console.log("");
console.log("Plan gates v2 fixed.");
console.log(`Backup created in: ${path.relative(root, backupDir)}`);