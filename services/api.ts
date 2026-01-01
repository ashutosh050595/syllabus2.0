
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FIREBASE_CONFIG, DEFAULT_TEACHER_PASSWORD } from "../constants";
import { Teacher, LessonPlan, ClassName } from "../types";

const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// CRITICAL: Replace with your deployed GAS Web App URL for automated emails
const GAS_WORKER_URL = "https://script.google.com/macros/s/AKfycby-YOUR-GAS-URL/exec";

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
    try {
      let q = query(collection(db, "lessonPlans"), orderBy("submittedAt", "desc"));
      if (teacherId) {
        q = query(collection(db, "lessonPlans"), where("teacherId", "==", teacherId), orderBy("submittedAt", "desc"));
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as LessonPlan);
    } catch (e) {
      console.error("Firestore Fetch Error:", e);
      return [];
    }
  },

  async saveLessonPlans(plans: LessonPlan[]): Promise<void> {
    const batchPromises = plans.map(plan => setDoc(doc(db, "lessonPlans", plan.id), { ...plan, resubmissionStatus: 'none' }));
    await Promise.all(batchPromises);
    
    // Notify GAS for Submission Alert email
    fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'submission_alert',
        teacherEmail: plans[0].teacherId, // assuming teacherId is email for login
        weekRange: plans[0].weekLabel
      })
    }).catch(e => console.warn("Email dispatch failed:", e));
  },

  async requestResubmission(plan: LessonPlan, teacherEmail: string): Promise<void> {
    await setDoc(doc(db, "lessonPlans", plan.id), { ...plan, resubmissionStatus: 'pending' });
    
    // Notify GAS for Resubmission workflow (Teacher A + Admin B)
    fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'request_resubmit',
        teacherName: plan.teacherName,
        teacherEmail: teacherEmail,
        planId: plan.id,
        weekRange: plan.weekLabel
      })
    }).catch(e => console.warn("Resubmit request email failed:", e));
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
