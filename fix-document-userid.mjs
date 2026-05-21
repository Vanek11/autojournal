import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const filePath = path.join(root, "src/app/api/documents/route.ts");
const backupPath = path.join(root, ".backup-documents-route-userid.ts");

if (!fs.existsSync(filePath)) {
  console.error("File not found: src/app/api/documents/route.ts");
  process.exit(1);
}

const original = fs.readFileSync(filePath, "utf8");
fs.copyFileSync(filePath, backupPath);
console.log("backup created: .backup-documents-route-userid.ts");

let content = original;

if (content.includes("userId: user.id")) {
  console.log("userId already exists. No changes needed.");
  process.exit(0);
}

content = content.replace(
  `      data: {
        vehicleId,
        title,`,
  `      data: {
        vehicleId,
        userId: user.id,
        title,`
);

fs.writeFileSync(filePath, content, "utf8");

console.log("updated: src/app/api/documents/route.ts");
console.log("Document userId fixed.");