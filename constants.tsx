import { Teacher, ClassName, SectionName } from './types';

export const ADMIN_CREDENTIALS = {
  id: 'admin@sacredheartkoderma.org',
  password: 'School@029'
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
    name: "Kishor Kunal",
    email: "kunal2959@gmail.com",
    phone: "9852963971",
    isClassTeacher: true,
    classTeacherOf: { className: 'V', section: 'A' },
    assignments: [
      { className: 'V', sections: ['A', 'B', 'C'], subject: 'Computer' },
      { className: 'VI', sections: ['A', 'B', 'C', 'D'], subject: 'Computer' }
    ]
  },
  {
    id: "t2",
    name: "Radha Singh",
    email: "radhasingh1223@gmail.com",
    phone: "8709081170",
    isClassTeacher: true,
    classTeacherOf: { className: 'V', section: 'B' },
    assignments: [
      { className: 'V', sections: ['A', 'B', 'C'], subject: 'EVS' },
      { className: 'VI', sections: ['C'], subject: 'Maths' }
    ]
  },
  {
    id: "t3",
    name: "Renu Kumari",
    email: "69191@sacredheartkoderma.org",
    phone: "8340227030",
    isClassTeacher: true,
    classTeacherOf: { className: 'V', section: 'C' },
    assignments: [
      { className: 'V', sections: ['A', 'B', 'C'], subject: 'Hindi' },
      { className: 'VI', sections: ['A', 'B'], subject: 'Hindi' }
    ]
  },
  {
    id: "t4",
    name: "Jude Godwin",
    email: "frankgodwin416@gmail.com",
    phone: "8340203221",
    isClassTeacher: true,
    classTeacherOf: { className: 'VI', section: 'A' },
    assignments: [
      { className: 'VI', sections: ['A', 'B'], subject: 'English' },
      { className: 'V', sections: ['A', 'B', 'C'], subject: 'English' }
    ]
  },
  {
    id: "t5",
    name: "Neha Kumari",
    email: "nehajmt81@gmail.com",
    phone: "7667260558",
    isClassTeacher: true,
    classTeacherOf: { className: 'VI', section: 'B' },
    assignments: [
      { className: 'V', sections: ['A', 'B', 'C'], subject: 'Maths' }
    ]
  },
  {
    id: "t6",
    name: "Manoj Kumar Singh",
    email: "ms3020998@gmail.com",
    phone: "7739566755",
    isClassTeacher: true,
    classTeacherOf: { className: 'VI', section: 'C' },
    assignments: [
      { className: 'VI', sections: ['C', 'D'], subject: 'Hindi' },
      { className: 'VII', sections: ['A', 'B', 'C', 'D'], subject: 'Hindi' }
    ]
  },
  {
    id: "t7",
    name: "Rahul Kumar",
    email: "rahul.kkq@gmail.com",
    phone: "8340370475",
    isClassTeacher: true,
    classTeacherOf: { className: 'VI', section: 'D' },
    assignments: [
      { className: 'VI', sections: ['D'], subject: 'English' },
      { className: 'VI', sections: ['A', 'B', 'C', 'D'], subject: 'Social Science' }
    ]
  },
  {
    id: "t8",
    name: "Rajni Bala",
    email: "nancyrajni1510@gmail.com",
    phone: "8709648302",
    isClassTeacher: true,
    classTeacherOf: { className: 'VII', section: 'A' },
    assignments: [
      { className: 'VI', sections: ['C'], subject: 'English' },
      { className: 'VII', sections: ['A', 'B', 'C', 'D'], subject: 'English' }
    ]
  },
  {
    id: "t9",
    name: "Sumit Shaw",
    email: "10674690@cbsedigitaledu.in",
    phone: "7908682112",
    isClassTeacher: true,
    classTeacherOf: { className: 'VII', section: 'B' },
    assignments: [
      { className: 'VI', sections: ['A', 'B', 'C', 'D'], subject: 'Science' },
      { className: 'VII', sections: ['A', 'B'], subject: 'Science' }
    ]
  },
  {
    id: "t10",
    name: "Anmol Ratan",
    email: "anmolratan80@gmail.com",
    phone: "7091203535",
    isClassTeacher: true,
    classTeacherOf: { className: 'VII', section: 'C' },
    assignments: [
      { className: 'VII', sections: ['A', 'B', 'C', 'D'], subject: 'Social Science' }
    ]
  },
  {
    id: "t11",
    name: "Sujeet Pratap Singh",
    email: "sujeetpratapsingh65908@gmail.com",
    phone: "7667892143",
    isClassTeacher: true,
    classTeacherOf: { className: 'VII', section: 'D' },
    assignments: [
      { className: 'VII', sections: ['A', 'B', 'C', 'D'], subject: 'Maths' },
      { className: 'VII', sections: ['C', 'D'], subject: 'Science' }
    ]
  },
  {
    id: "t12",
    name: "Ramesh Kunj",
    email: "ramesh.kunj@sacredheartkoderma.org",
    phone: "6202915575",
    isClassTeacher: false,
    assignments: [
      { className: 'VI', sections: ['A', 'B', 'D'], subject: 'Maths' }
    ]
  },
  {
    id: "t13",
    name: "Sanjay Kumar",
    email: "sanjay.kumar@sacredheartkoderma.org",
    phone: "9204434436",
    isClassTeacher: false,
    assignments: [
      { className: 'V', sections: ['A', 'B', 'C'], subject: 'Sanskrit' },
      { className: 'VI', sections: ['A', 'B', 'C', 'D'], subject: 'Sanskrit' },
      { className: 'VII', sections: ['A', 'B', 'C', 'D'], subject: 'Sanskrit' }
    ]
  },
  {
    id: "t14",
    name: "Ashutosh Kumar Gautam",
    email: "gautam663@gmail.com",
    phone: "7004743875",
    isClassTeacher: false,
    assignments: [
      { className: 'VII', sections: ['A', 'B', 'C', 'D'], subject: 'Computer' }
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
    subjects: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer']
  },
  'VII': {
    sections: ['A', 'B', 'C', 'D'],
    subjects: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer']
  }
};