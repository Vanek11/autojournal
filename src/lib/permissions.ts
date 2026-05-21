export function canEdit(role?: string) {
  return role === "editor";
}

export function canView(role?: string) {
  return role === "editor" || role === "viewer";
}
