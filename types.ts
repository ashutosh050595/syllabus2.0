
export type ClassName = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X' | 'XI' | 'XII';
export type SectionName = 'A' | 'B' | 'C' | 'D';

export interface TeacherAssignment {
  className: ClassName;
  sections: SectionName[];
  subject: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignments: TeacherAssignment[];
  isClassTeacher: boolean;
  classTeacherOf?: {
    className: ClassName;
    section: SectionName;
  };
}

export interface LessonPlan {
  id: string;
  teacherId: string;
  teacherName: string;
  className: ClassName;
  section: SectionName;
  subject: string;
  dateFrom: string;
  dateTo: string;
  chapter: string;
  topics: string;
  homework: string;
  weekStarting: string;
  submittedAt: string;
  resubmissionStatus?: 'pending' | 'approved' | 'declined';
}

export interface AppState {
  currentUser: Teacher | 'admin' | null;
  teachers: Teacher[];
  lessonPlans: LessonPlan[];
}
