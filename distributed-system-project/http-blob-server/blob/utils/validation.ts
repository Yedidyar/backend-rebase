export function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(id);
}
