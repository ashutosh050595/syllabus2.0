
import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc,
} from "firebase/firestore";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FIREBASE_CONFIG, DEFAULT_TEACHER_PASSWORD, ADMIN_CREDENTIALS } from "../constants";
import { Teacher, LessonPlan } from "../types";

// Initialize Firebase as a singleton to prevent "Component auth has not been registered" errors
const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

export const APIService = {
  // AUTHENTICATION
  async login(email: string, password: string): Promise<any> {
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      // 1. Attempt standard login
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      console.warn("Auth attempt failed:", error.code);

      // 2. Fallback: Auto-provision Auth account if using default password
      if ((error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') && password === DEFAULT_TEACHER_PASSWORD) {
        try {
          console.log("Attempting to auto-provision account for:", normalizedEmail);
          const newUser = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
          return { success: true, user: newUser.user };
        } catch (createError: any) {
          if (createError.code === 'auth/email-already-in-use') {
             return { success: false, message: "Incorrect password. If you forgot your password, please contact the administrator." };
          }
          return { success: false, message: createError.message };
        }
      }
      
      const message = error.code === 'auth/invalid-credential' ? "Invalid email or password." : error.message;
      return { success: false, message };
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
    try {
      const querySnapshot = await getDocs(collection(db, "teachers"));
      const teachers = querySnapshot.docs.map(doc => doc.data() as Teacher);
      console.log(`Fetched ${teachers.length} teachers from registry.`);
      return teachers;
    } catch (e) {
      console.error("Firestore read error:", e);
      throw e;
    }
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
  }
};
