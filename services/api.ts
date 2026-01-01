
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, query, where, orderBy, limit, addDoc, Timestamp } from "firebase/firestore";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FIREBASE_CONFIG, DEFAULT_TEACHER_PASSWORD } from "../constants";
import { Teacher, LessonPlan, ClassName, LoginLog } from "../types";

const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

const GAS_WORKER_URL = "https://script.google.com/macros/s/AKfycby-YOUR-GAS-URL/exec";

export const APIService = {
  async login(email: string, password: string): Promise<any> {
    const normalizedEmail = email.toLowerCase().trim();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      
      // Log login event
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
          return { success: false, message: "Credential Error. Contact Office." };
        }
      }
      return { success: false, message: "Security match failed. Please check your key." };
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
      // Fixed: Spread types may only be created from object types by casting doc.data() to any
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
    const promises = teachers.map(t => setDoc(doc(db, "teachers", t.id), t));
    await Promise.all(promises);
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
    await Promise.all(plans.map(plan => setDoc(doc(db, "lessonPlans", plan.id), { ...plan, resubmissionStatus: 'none' })));
  },

  async emailDefaulters(defaulters: Teacher[], weekRange: string): Promise<void> {
    if (GAS_WORKER_URL.includes("macros")) {
      await fetch(GAS_WORKER_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          action: 'bulk_defaulter_alert',
          teachers: defaulters.map(d => ({ email: d.email, name: d.name })),
          weekRange
        })
      });
    }
  },

  async requestResubmission(plan: LessonPlan, teacherEmail: string): Promise<void> {
    await setDoc(doc(db, "lessonPlans", plan.id), { ...plan, resubmissionStatus: 'pending' });
  },

  async generateAIAudit(plans: LessonPlan[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Audit Institutional Syllabus: ${JSON.stringify(plans.slice(0, 20))}`,
        config: { systemInstruction: "Institutional Lead Auditor. Provide critical feedback on pedagogical clarity.", thinkingConfig: { thinkingBudget: 1000 } },
      });
      return response.text || "AI Evaluation interrupted.";
    } catch (e) { return "AI Engine Busy."; }
  }
};
