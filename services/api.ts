
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import { FIREBASE_CONFIG } from "../constants";
import { LessonPlan, Teacher, LoginLog } from "../types";

const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
const db = getFirestore(app);

// IMPORTANT: Replace this placeholder with your actual Apps Script Web App URL
const GAS_WORKER_URL = 'https://script.google.com/macros/s/AKfycby_placeholder/exec';

export const APIService = {
  async fetchTeachers(): Promise<Teacher[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "teachers"));
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Teacher));
    } catch (e) {
      console.error("Error fetching teachers:", e);
      return [];
    }
  },

  async fetchLessonPlans(): Promise<LessonPlan[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "lessonPlans"));
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LessonPlan));
    } catch (e) {
      console.error("Error fetching lesson plans:", e);
      return [];
    }
  },

  async fetchLoginLogs(): Promise<LoginLog[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "loginLogs"));
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LoginLog));
    } catch (e) {
      console.error("Error fetching login logs:", e);
      return [];
    }
  },

  async submitMultiplePlans(plans: Omit<LessonPlan, 'id' | 'submittedAt'>[]): Promise<void> {
    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();
    
    plans.forEach(plan => {
      // Robust ID: teacher_grade_section_subject_date
      const id = `${plan.teacherId}_${plan.className}_${plan.section}_${plan.subject}_${plan.weekStarting}`
        .replace(/[@.]/g, '_')
        .replace(/\s+/g, '');
      
      const planRef = doc(db, "lessonPlans", id);
      batch.set(planRef, {
        ...plan,
        id,
        submittedAt: timestamp
      });
    });

    // 1. Database first - this is the source of truth
    await batch.commit();

    // 2. Email trigger in background - do not await to prevent UI hanging
    if (plans.length > 0 && GAS_WORKER_URL && !GAS_WORKER_URL.includes('placeholder')) {
      const emailPayload = {
        action: 'submission_alert',
        teacherEmail: plans[0].teacherId,
        teacherName: plans[0].teacherName,
        weekRange: plans[0].weekLabel,
        summary: plans.map(p => `${p.className}-${p.section} (${p.subject})`).join(', ')
      };

      // no-cors mode ensures the browser doesn't block the request if GAS script isn't configured for CORS
      fetch(GAS_WORKER_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(emailPayload)
      }).catch(err => console.debug("Email background task initiated quietly."));
    }
  },

  async addTeacher(teacher: Teacher): Promise<void> {
    await setDoc(doc(db, "teachers", teacher.email), teacher);
  },

  async updateTeacher(id: string, updates: Partial<Teacher>): Promise<void> {
    await setDoc(doc(db, "teachers", id), updates, { merge: true });
  },

  async removeTeacher(id: string): Promise<void> {
    await deleteDoc(doc(db, "teachers", id));
  },

  async syncInitialTeachers(teachers: Teacher[]): Promise<void> {
    const batch = writeBatch(db);
    teachers.forEach((t) => {
      const teacherRef = doc(db, "teachers", t.email);
      batch.set(teacherRef, t);
    });
    await batch.commit();
  },

  async triggerDefaulterReminders(): Promise<void> {
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) return;
    fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'trigger_defaulter_warnings' })
    }).catch(() => {});
  },

  async compileAndSendReports(): Promise<void> {
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) return;
    fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'compile_reports' })
    }).catch(() => {});
  }
};
