
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, query, where, orderBy, limit, addDoc } from "firebase/firestore";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FIREBASE_CONFIG, DEFAULT_TEACHER_PASSWORD } from "../constants";
import { Teacher, LessonPlan, LoginLog } from "../types";

const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// FULLY ACTIVATED GAS URL
const GAS_WORKER_URL = "https://script.google.com/macros/s/AKfycbySZzxF_gOP2MRMp3jYJ9SgQypkgCpxb1EPKt88HfTV1ggrzxVQ_J96IP6LpTMedF-unQ/exec";

export const APIService = {
  async login(email: string, password: string): Promise<any> {
    const normalizedEmail = email.toLowerCase().trim();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      await addDoc(collection(db, "loginLogs"), {
        email: normalizedEmail,
        timestamp: new Date().toISOString(),
        device: navigator.userAgent.substring(0, 50)
      });
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      if (password === DEFAULT_TEACHER_PASSWORD && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential')) {
        try {
          const newUser = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
          return { success: true, user: newUser.user };
        } catch (createError: any) {
          return { success: false, message: "Credential Error." };
        }
      }
      return { success: false, message: "Access Denied." };
    }
  },

  async logout() { await signOut(auth); },
  onAuthChange(callback: (user: User | null) => void) { return onAuthStateChanged(auth, callback); },

  async fetchTeachers(): Promise<Teacher[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "teachers"));
      return querySnapshot.docs.map(doc => doc.data() as Teacher);
    } catch (e) { return []; }
  },

  async fetchLoginLogs(): Promise<LoginLog[]> {
    try {
      const q = query(collection(db, "loginLogs"), orderBy("timestamp", "desc"), limit(100));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as LoginLog));
    } catch (e) { return []; }
  },

  async syncTeacher(teacher: Teacher): Promise<void> {
    await setDoc(doc(db, "teachers", teacher.id), teacher);
  },

  async deleteTeacher(id: string): Promise<void> {
    await deleteDoc(doc(db, "teachers", id));
  },

  async syncInitialTeachers(teachers: Teacher[]): Promise<void> {
    for (const t of teachers) {
      await setDoc(doc(db, "teachers", t.id), t);
    }
  },

  async fetchLessonPlans(teacherId?: string): Promise<LessonPlan[]> {
    try {
      let q = query(collection(db, "lessonPlans"), orderBy("submittedAt", "desc"), limit(500));
      if (teacherId) {
        q = query(collection(db, "lessonPlans"), where("teacherId", "==", teacherId), orderBy("submittedAt", "desc"), limit(100));
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as LessonPlan);
    } catch (e) { return []; }
  },

  async saveLessonPlans(plans: LessonPlan[]): Promise<void> {
    const promises = plans.map(plan => setDoc(doc(db, "lessonPlans", plan.id), { ...plan, resubmissionStatus: 'none' }));
    await Promise.all(promises);
  },

  async emailDefaulters(defaulters: Teacher[], weekRange: string): Promise<void> {
    await fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'bulk_defaulter_alert', teachers: defaulters.map(d => ({ email: d.email, name: d.name })), weekRange })
    });
  },

  async sendCompiledToCT(teacher: Teacher, className: string, section: string, weekLabel: string): Promise<void> {
    await fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'send_to_ct', email: teacher.email, className, section, weekLabel })
    });
  },

  async requestResubmission(plan: LessonPlan, teacherEmail: string): Promise<void> {
    await setDoc(doc(db, "lessonPlans", plan.id), { ...plan, resubmissionStatus: 'pending' });
  },

  async generateAIAudit(plans: LessonPlan[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Audit Institutional Syllabus: ${JSON.stringify(plans.slice(0, 10))}`,
        config: { systemInstruction: "Institutional Lead Auditor.", thinkingConfig: { thinkingBudget: 1000 } },
      });
      return response.text || "Audit failed.";
    } catch (e) { return "AI Service Busy."; }
  }
};
