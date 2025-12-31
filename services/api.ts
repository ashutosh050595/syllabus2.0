
import { initializeApp } from "firebase/app";
// Consolidated modular Firebase Auth imports and separated type imports to fix exported member errors
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from "firebase/auth";
import type { User } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc,
  query, 
  where, 
  addDoc,
  onSnapshot
} from "firebase/firestore";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FIREBASE_CONFIG, DEFAULT_TEACHER_PASSWORD, ADMIN_CREDENTIALS } from "../constants";
import { Teacher, LessonPlan } from "../types";

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

export const APIService = {
  // AUTHENTICATION
  async login(email: string, password: string): Promise<any> {
    try {
      // 1. Attempt standard login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      // 2. If login fails, check if this is a registered teacher attempting first-time access
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        try {
          // Check Firestore Registry
          const teachers = await this.fetchTeachers();
          const registeredTeacher = teachers.find(t => t.email.toLowerCase() === email.toLowerCase());

          // If they exist in registry and are using the correct default password, auto-provision Auth
          if (registeredTeacher && password === DEFAULT_TEACHER_PASSWORD) {
            console.log("Teacher found in registry. Provisioning Auth account...");
            const newUser = await createUserWithEmailAndPassword(auth, email, password);
            return { success: true, user: newUser.user };
          }
        } catch (provisionError: any) {
          console.error("Auto-provisioning failed:", provisionError);
        }
      }
      
      return { success: false, message: error.message };
    }
  },

  async logout() {
    await signOut(auth);
  },

  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // TEACHERS
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

  // LESSON PLANS
  async fetchLessonPlans(): Promise<LessonPlan[]> {
    const querySnapshot = await getDocs(collection(db, "lessonPlans"));
    return querySnapshot.docs.map(doc => doc.data() as LessonPlan);
  },

  async saveLessonPlans(plans: LessonPlan[]): Promise<void> {
    const batchPromises = plans.map(plan => 
      setDoc(doc(db, "lessonPlans", plan.id), plan)
    );
    await Promise.all(batchPromises);
  },

  // AI CURRICULUM AUDIT
  async generateAIAudit(plans: LessonPlan[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const lessonDataString = JSON.stringify(plans, null, 2);

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Please audit the following school lesson plans: ${lessonDataString}`,
      config: {
        systemInstruction: "You are a world-class academic auditor for Sacred Heart School. Analyze lesson plans for pedagogical depth, curriculum coverage gaps, and strengths. Provide a detailed, professional report with actionable recommendations.",
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });

    return response.text || "No audit report could be generated at this time.";
  },

  // PDF DISPATCH
  async triggerDispatch(): Promise<{ success: boolean; message: string }> {
    const legacyUrl = localStorage.getItem('sh_legacy_dispatch_url');
    if (!legacyUrl) return { success: false, message: "Dispatch Engine not configured" };
    
    try {
      await fetch(legacyUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'triggerDispatch' }),
      });
      return { success: true, message: 'Dispatch process initiated on Cloud Server.' };
    } catch (e) {
      return { success: false, message: 'Failed to reach dispatch engine.' };
    }
  }
};
