// src/hooks/useTeacherIdentity.ts

export const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const useTeacherIdentity = () => {
  const getTeacherId = (email: string): string => {
    return normalizeEmail(email);
  };

  const normalizeTeacher = <T extends { email: string }>(teacher: T) => {
    const normalizedEmail = normalizeEmail(teacher.email);
    return {
      ...teacher,
      id: normalizedEmail,
      email: normalizedEmail,
    };
  };

  return {
    normalizeEmail,
    getTeacherId,
    normalizeTeacher,
  };
};
