
import { Teacher, ClassName, SectionName } from './types';

export const ADMIN_CREDENTIALS = {
  id: 'admin@sacredheartkoderma.org',
  password: 'AdminPassword@2025' // Note: Create this user in Firebase Auth console
};

// FIREBASE CONFIGURATION
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCw3xYRbBdDk1dzOBBU00lGP6XFzyJgJwY",
  authDomain: "lesson-plan-b4c8e.firebaseapp.com",
  projectId: "lesson-plan-b4c8e",
  storageBucket: "lesson-plan-b4c8e.firebasestorage.app",
  messagingSenderId: "988824182644",
  appId: "1:988824182644:web:efbc9bb135afaabeb9d621",
  measurementId: "G-Y43N7T13E6"
};

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: "t1",
    name: "Rahul Sharma",
    email: "rahul.sharma@sacredheart.org",
    phone: "9876543210",
    isClassTeacher: true,
    classTeacherOf: { className: 'V', section: 'A' },
    assignments: [
      { className: 'V', sections: ['A', 'B', 'C'], subject: 'Maths' }
    ]
  },
  {
    id: "t2",
    name: "Priya Singh",
    email: "priya.singh@sacredheart.org",
    phone: "9876543211",
    isClassTeacher: true,
    classTeacherOf: { className: 'VI', section: 'A' },
    assignments: [
      { className: 'VI', sections: ['A', 'B', 'C', 'D'], subject: 'English' },
      { className: 'V', sections: ['A'], subject: 'English' }
    ]
  },
  {
    id: "t3",
    name: "Amit Verma",
    email: "amit.verma@sacredheart.org",
    phone: "9876543212",
    isClassTeacher: true,
    classTeacherOf: { className: 'VII', section: 'A' },
    assignments: [
      { className: 'VII', sections: ['A', 'B', 'C', 'D'], subject: 'Science' }
    ]
  },
  {
    id: "t4",
    name: "Suman Kumari",
    email: "suman.k@sacredheart.org",
    phone: "9876543213",
    isClassTeacher: false,
    assignments: [
      { className: 'V', sections: ['A', 'B', 'C'], subject: 'Hindi' },
      { className: 'VI', sections: ['A', 'B'], subject: 'Hindi' }
    ]
  }
];

export const CLASS_CONFIG: Partial<Record<ClassName, { sections: SectionName[], subjects: string[] }>> = {
  'V': {
    sections: ['A', 'B', 'C'],
    subjects: ['Hindi', 'English', 'Maths', 'EVS', 'Sanskrit', 'Computer']
  },
  'VI': {
    sections: ['A', 'B', 'C', 'D'],
    subjects: ['ENGLISH', 'HINDI', 'MATHS', 'SCIENCE', 'SOCIAL SCIENCE', 'SANSKRIT', 'COMPUTER']
  },
  'VII': {
    sections: ['A', 'B', 'C', 'D'],
    subjects: ['ENGLISH', 'HINDI', 'MATHS', 'SCIENCE', 'SOCIAL SCIENCE', 'SANSKRIT', 'COMPUTER']
  }
};
