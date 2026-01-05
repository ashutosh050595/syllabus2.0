export const normalizeEmail = (email: string): string =>
  email.toLowerCase().trim();

export const teacherIdFromEmail = (email: string): string =>
  normalizeEmail(email);
