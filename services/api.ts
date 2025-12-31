
import { initializeApp } from "firebase/app";
// Consolidated imports from firebase/auth to ensure named exports are correctly recognized by the compiler.
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
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

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
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
      console.log("Initial sign-in failed:", error.code);

      // 2. Fallback: If it's a first-time user using the default password, try to create the account
      // This solves the issue where the user exists in the "registry" (Firestore) but not in Auth.
      if ((error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') && password === DEFAULT_TEACHER_PASSWORD) {
        try {
          console.log("Auto-provisioning Auth account for:", normalizedEmail);
          const newUser = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
          return { success: true, user: newUser.user };
        } catch (createError: any) {
          // If creation fails with "email already in use", it means the password provided was wrong for an existing account
          if (createError.code === 'auth/email-already-in-use') {
            return { success: false, message: "Incorrect password for this faculty account." };
          }
          return { success: false, message: createError.message };
        }
      }
      
      return { success: false, message: "Authentication failed. Please check your credentials." };
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
      return querySnapshot.docs.map(doc => doc.data() as Teacher);
    } catch (e) {
      console.error("Firestore error:", e);
      return [];
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
    // Initializing GoogleGenAI client with API key from environment variables.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const lessonDataString = JSON.stringify(plans, null, 2);

    // Using ai.models.generateContent with 'gemini-3-pro-preview' as required for complex reasoning tasks.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Please audit the following school lesson plans: ${lessonDataString}`,
      config: {
        systemInstruction: "You are a world-class academic auditor for Sacred Heart School. Analyze lesson plans for pedagogical depth, curriculum coverage gaps, and strengths. Provide a detailed, professional report with actionable recommendations.",
        // Setting max thinking budget for gemini-3-pro-preview as per documentation for deep reasoning.
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });

    // Accessing the .text property of GenerateContentResponse to retrieve the model output.
    return response.text || "No audit report could be generated at this time.";
  }
};
