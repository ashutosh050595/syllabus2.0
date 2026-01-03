import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs, writeBatch, updateDoc } from "firebase/firestore";
import { FIREBASE_CONFIG } from "../constants";
import { LessonPlan, Teacher, LoginLog } from "../types";

const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
const db = getFirestore(app);

// Update with your actual Google Apps Script URL
const GAS_WORKER_URL = 'https://script.google.com/macros/s/AKfycby_placeholder/exec';

export const APIService = {
  async fetchTeachers(): Promise<Teacher[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "teachers"));
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Teacher));
    } catch (e) {
      console.warn("Teachers fetch failed, using offline fallback");
      return [];
    }
  },

  async fetchLessonPlans(): Promise<LessonPlan[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "lessonPlans"));
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LessonPlan));
    } catch (e) {
      return [];
    }
  },

  async fetchLoginLogs(): Promise<LoginLog[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "loginLogs"));
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LoginLog));
    } catch (e) {
      return [];
    }
  },

  async submitMultiplePlans(plans: Omit<LessonPlan, 'id' | 'submittedAt'>[]): Promise<void> {
    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();
    
    plans.forEach(plan => {
      // Unique ID to prevent duplication
      const id = `${plan.teacherId}_${plan.className}_${plan.section}_${plan.subject}_${plan.weekStarting}`
        .replace(/[@.]/g, '_')
        .replace(/\s+/g, '');
      
      const planRef = doc(db, "lessonPlans", id);
      batch.set(planRef, {
        ...plan,
        id,
        submittedAt: timestamp,
        resubmissionStatus: 'none'
      });
    });

    await batch.commit();

    // Send email confirmation for each unique teacher
    if (plans.length > 0 && GAS_WORKER_URL && !GAS_WORKER_URL.includes('placeholder')) {
      const uniqueTeachers = Array.from(new Set(plans.map(p => p.teacherId)));
      
      uniqueTeachers.forEach(teacherEmail => {
        const teacherPlans = plans.filter(p => p.teacherId === teacherEmail);
        const emailPayload = {
          action: 'submission_alert',
          teacherEmail: teacherEmail,
          teacherName: teacherPlans[0].teacherName,
          weekRange: teacherPlans[0].weekLabel,
          summary: teacherPlans.map(p => `${p.className}-${p.section} (${p.subject})`).join(', ')
        };

        fetch(GAS_WORKER_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        }).catch(() => console.debug("Email background task initiated."));
      });
    }
  },

  async requestResubmission(planId: string, teacherEmail: string, teacherName: string, weekRange: string): Promise<void> {
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) return;
    
    // Update the plan status in Firebase
    const planRef = doc(db, "lessonPlans", planId);
    await updateDoc(planRef, {
      resubmissionStatus: 'pending'
    });

    // Send request to GAS for email notifications
    const resubmitPayload = {
      action: 'request_resubmit',
      planId: planId,
      teacherEmail: teacherEmail,
      teacherName: teacherName,
      weekRange: weekRange
    };

    fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resubmitPayload)
    }).catch(() => console.debug("Resubmission request sent."));
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'trigger_defaulter_warnings' })
    }).catch(() => {});
  },

  async compileAndSendReports(): Promise<void> {
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) return;
    fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'compile_reports' })
    }).catch(() => {});
  }
};
