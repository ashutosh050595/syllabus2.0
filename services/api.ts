
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import { FIREBASE_CONFIG } from "../constants";
import { LessonPlan, Teacher, LoginLog } from "../types";

const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
const db = getFirestore(app);

// IMPORTANT: Replace this placeholder with your deployed Google Apps Script URL
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
      // Create a specific ID to prevent duplicates: teacher_class_section_subject_week
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

    // CRITICAL: Await the batch commit before doing anything else
    await batch.commit();

    // Trigger Email Notification in background (fire and forget)
    // We don't await this to ensure the UI updates immediately after DB success
    if (plans.length > 0 && GAS_WORKER_URL && !GAS_WORKER_URL.includes('placeholder')) {
      const emailPayload = {
        action: 'submission_alert',
        teacherEmail: plans[0].teacherId,
        teacherName: plans[0].teacherName,
        weekRange: plans[0].weekLabel,
        summary: plans.map(p => `${p.className}-${p.section} (${p.subject})`).join(', ')
      };

      fetch(GAS_WORKER_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(emailPayload)
      }).catch(err => console.debug("Email ping skipped or failed:", err.message));
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
    await fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'trigger_defaulter_warnings' })
    });
  },

  async compileAndSendReports(): Promise<void> {
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) return;
    await fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'compile_reports' })
    });
  },

  async requestResubmission(plan: LessonPlan, teacherEmail: string): Promise<void> {
    await setDoc(doc(db, "lessonPlans", plan.id), { ...plan, resubmissionStatus: 'pending' }, { merge: true });
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) return;
    fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ 
        action: 'request_resubmit', 
        planId: plan.id, 
        teacherName: plan.teacherName, 
        teacherEmail: teacherEmail, 
        weekRange: plan.weekLabel 
      })
    }).catch(() => {});
  }
};
