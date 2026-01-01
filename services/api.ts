
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
import { Teacher, LessonPlan, ClassName } from "../types";

const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

export const APIService = {
  // AUTHENTICATION
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
          if (createError.code === 'auth/email-already-in-use') {
             return { success: false, message: "Incorrect password." };
          }
          return { success: false, message: createError.message };
        }
      }
      return { success: false, message: "Authentication failed." };
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

  // BATCH OPERATIONS
  async triggerBatchDispatch(className: ClassName): Promise<{success: boolean, message: string}> {
    // This simulates calling the Google Apps Script dispatchWeeklyReports()
    // In a production environment, you would use a Cloud Function or Fetch call to the .gs Web App
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Batch dispatch completed for Class ${className}. Reports have been sent to respective Class Teachers.`
        });
      }, 1500);
    });
  },

  // AI CURRICULUM AUDIT
  async generateAIAudit(plans: LessonPlan[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const lessonDataString = JSON.stringify(plans, null, 2);
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Please audit the following school lesson plans: ${lessonDataString}`,
      config: {
        systemInstruction: "You are a world-class academic auditor for Sacred Heart School. Analyze lesson plans for pedagogical depth, curriculum coverage gaps, and strengths.",
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });
    return response.text || "Audit failed.";
  }
};
