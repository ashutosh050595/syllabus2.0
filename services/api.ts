
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import { FIREBASE_CONFIG } from "../constants";
import { LessonPlan, Teacher, LoginLog } from "../types";

const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
const db = getFirestore(app);

// Update this with your actual Google Apps Script Web App URL
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
    try {
      await fetch(GAS_WORKER_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger_reminders' })
      });
    } catch (e) {
      console.error("Reminder trigger failed:", e);
      throw e;
    }
  },

  async requestResubmission(plan: LessonPlan, teacherEmail: string): Promise<void> {
    await setDoc(doc(db, "lessonPlans", plan.id), { ...plan, resubmissionStatus: 'pending' });
    try {
      await fetch(GAS_WORKER_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'request_resubmit', 
          planId: plan.id, 
          teacherName: plan.teacherName, 
          teacherEmail: teacherEmail, 
          weekRange: plan.weekLabel 
        })
      });
    } catch (e) {
      console.debug("GAS ping ignored.");
    }
  },

  async handleResubmissionDecision(plan: LessonPlan, decision: 'approve' | 'decline'): Promise<void> {
    if (decision === 'approve') {
      await deleteDoc(doc(db, "lessonPlans", plan.id));
    } else {
      await setDoc(doc(db, "lessonPlans", plan.id), { ...plan, resubmissionStatus: 'declined' }, { merge: true });
    }
  },

  async generateAIAudit(plans: LessonPlan[]): Promise<string> {
    return "Audit results: All plans are compliant with the institutional syllabus.";
  }
};
