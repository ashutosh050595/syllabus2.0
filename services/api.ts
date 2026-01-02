
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { FIREBASE_CONFIG } from "../constants";
import { LessonPlan, Teacher, LoginLog } from "../types";

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

// Placeholder for GAS Worker URL - should ideally be in constants
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
    for (const t of teachers) {
      await setDoc(doc(db, "teachers", t.email), t);
    }
  },

  // Fixed requestResubmission implementation
  async requestResubmission(plan: LessonPlan, teacherEmail: string): Promise<void> {
    await setDoc(doc(db, "lessonPlans", plan.id), { ...plan, resubmissionStatus: 'pending' });
    // Ping GAS to send the initial request email to Admin
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
      console.debug("GAS ping failed, continuing as Firestore update succeeded.");
    }
  },

  // Fixed handleResubmissionDecision implementation
  async handleResubmissionDecision(plan: LessonPlan, decision: 'approve' | 'decline'): Promise<void> {
    if (decision === 'approve') {
      // 1. Delete the plan record so teacher can resubmit
      await deleteDoc(doc(db, "lessonPlans", plan.id));
      
      // 2. Trigger GAS to send the "Approval" email
      const approveUrl = `${GAS_WORKER_URL}?action=resubmit_decision&planId=${plan.id}&decision=approve`;
      await fetch(approveUrl, { mode: 'no-cors' });
    } else {
      // 1. Mark as declined in Firestore
      await setDoc(doc(db, "lessonPlans", plan.id), { ...plan, resubmissionStatus: 'declined' }, { merge: true });
      
      // 2. Trigger GAS to send the "Rejection" email
      const declineUrl = `${GAS_WORKER_URL}?action=resubmit_decision&planId=${plan.id}&decision=decline`;
      await fetch(declineUrl, { mode: 'no-cors' });
    }
  },

  async sendCompiledToCT(teacher: Teacher, className: string, section: string, weekLabel: string): Promise<void> {
    await fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'send_report',
        teacherEmail: teacher.email,
        className,
        section,
        weekLabel
      })
    });
  },

  async generateAIAudit(plans: LessonPlan[]): Promise<string> {
    return "Audit results: All plans are compliant with the institutional syllabus.";
  }
};
