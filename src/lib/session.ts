import crypto from "node:crypto";

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}
