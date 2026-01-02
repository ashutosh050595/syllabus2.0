
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import { FIREBASE_CONFIG } from "../constants";
import { LessonPlan, Teacher, LoginLog } from "../types";

const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
const db = getFirestore(app);

// IMPORTANT: Ensure your Google Apps Script is deployed as "Anyone, even anonymous"
const GAS_WORKER_URL = 'https://script.google.com/macros/s/AKfycby_placeholder/exec';

export const APIService = {
  async fetchTeachers(): Promise<Teacher[]> {
    const querySnapshot = await getDocs(collection(db, "teachers"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));
  },

  async fetchLessonPlans(): Promise<LessonPlan[]> {
    const querySnapshot = await getDocs(collection(db, "lessonPlans"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LessonPlan));
  },

  async fetchLoginLogs(): Promise<LoginLog[]> {
    const querySnapshot = await getDocs(collection(db, "loginLogs"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoginLog));
  },

  async submitMultiplePlans(plans: Omit<LessonPlan, 'id' | 'submittedAt'>[]): Promise<void> {
    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();
    
    plans.forEach(plan => {
      const id = `${plan.teacherId}_${plan.className}_${plan.section}_${plan.subject}_${plan.weekStarting}`.replace(/\s+/g, '_');
      const planRef = doc(db, "lessonPlans", id);
      batch.set(planRef, {
        ...plan,
        id,
        submittedAt: timestamp
      });
    });

    // Commit to DB first
    await batch.commit();

    // Fire Email Notification in background (Do not await to prevent UI hang)
    if (plans.length > 0) {
      const emailPayload = {
        action: 'submission_alert',
        teacherEmail: plans[0].teacherId,
        teacherName: plans[0].teacherName,
        weekRange: plans[0].weekLabel,
        summary: plans.map(p => `${p.className}-${p.section} (${p.subject})`).join(', ')
      };

      // Use a background fetch that won't block the UI success message
      fetch(GAS_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Use text/plain to avoid CORS preflight for GAS
        body: JSON.stringify(emailPayload)
      }).catch(e => console.debug("Email background task initiated."));
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

  // Fix: Added triggerDefaulterReminders to satisfy usage in AdminRegistry.tsx
  async triggerDefaulterReminders(): Promise<void> {
    await fetch(GAS_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'trigger_defaulter_warnings' })
    });
  },

  // Fix: Added compileAndSendReports to satisfy usage in AdminCompiler.tsx
  async compileAndSendReports(): Promise<void> {
    await fetch(GAS_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'compile_reports' })
    });
  }
};
