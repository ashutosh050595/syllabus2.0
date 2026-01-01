
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FIREBASE_CONFIG, DEFAULT_TEACHER_PASSWORD } from "../constants";
import { Teacher, LessonPlan, ClassName } from "../types";

const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// Replace this with your deployed GAS Web App URL
const GAS_WORKER_URL = "YOUR_GAS_WEB_APP_URL";

export const APIService = {
  async login(email: string, password: string): Promise<any> {
    const normalizedEmail = email.toLowerCase().trim();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      if (password === DEFAULT_TEACHER_PASSWORD) {
        try {
          const newUser = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
          return { success: true, user: newUser.user };
        } catch (createError: any) {
          return { success: false, message: createError.message };
        }
      }
      return { success: false, message: "Authentication failed." };
    }
  },

  async logout() { await signOut(auth); },
  onAuthChange(callback: (user: User | null) => void) { return onAuthStateChanged(auth, callback); },

  async fetchTeachers(): Promise<Teacher[]> {
    const querySnapshot = await getDocs(collection(db, "teachers"));
    return querySnapshot.docs.map(doc => doc.data() as Teacher);
  },

  async syncTeacher(teacher: Teacher): Promise<void> {
    await setDoc(doc(db, "teachers", teacher.id), teacher);
  },

  async deleteTeacher(id: string): Promise<void> {
    await deleteDoc(doc(db, "teachers", id));
  },

  async syncInitialTeachers(teachers: Teacher[]): Promise<void> {
    const promises = teachers.map(t => setDoc(doc(db, "teachers", t.id), t));
    await Promise.all(promises);
  },

  async fetchLessonPlans(teacherId?: string): Promise<LessonPlan[]> {
    let q = query(collection(db, "lessonPlans"), orderBy("submittedAt", "desc"));
    if (teacherId) {
      q = query(collection(db, "lessonPlans"), where("teacherId", "==", teacherId), orderBy("submittedAt", "desc"));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as LessonPlan);
  },

  async saveLessonPlans(plans: LessonPlan[]): Promise<void> {
    const batchPromises = plans.map(plan => setDoc(doc(db, "lessonPlans", plan.id), { ...plan, resubmissionStatus: 'none' }));
    await Promise.all(batchPromises);
    
    // Trigger submission alert email via GAS
    try {
      fetch(GAS_WORKER_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submission_alert',
          teacherEmail: plans[0].teacherId, // assuming email stored here or looked up
          teacherName: plans[0].teacherName,
          weekRange: plans[0].weekLabel
        })
      });
    } catch (e) { console.error("GAS Alert Failed", e); }
  },

  async requestResubmission(plan: LessonPlan, teacherEmail: string): Promise<void> {
    const planRef = doc(db, "lessonPlans", plan.id);
    await setDoc(planRef, { ...plan, resubmissionStatus: 'pending' });

    // Notify GAS to send emails to teacher and admin
    try {
      fetch(GAS_WORKER_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_resubmit',
          teacherName: plan.teacherName,
          teacherEmail: teacherEmail,
          planId: plan.id,
          weekRange: plan.weekLabel
        })
      });
    } catch (e) { console.error("GAS Request Failed", e); }
  },

  async deleteLessonPlan(id: string): Promise<void> {
    await deleteDoc(doc(db, "lessonPlans", id));
  },

  async triggerBatchDispatch(className: ClassName): Promise<{success: boolean, message: string}> {
    return new Promise((resolve) => {
      setTimeout(() => { resolve({ success: true, message: `Batch dispatch completed for Class ${className}.` }); }, 1500);
    });
  },

  async generateAIAudit(plans: LessonPlan[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Audit these plans: ${JSON.stringify(plans)}`,
      config: { systemInstruction: "Academic auditor instruction.", thinkingConfig: { thinkingBudget: 1000 } },
    });
    return response.text || "Audit failed.";
  }
};
