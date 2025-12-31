
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
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
  query, 
  where, 
  addDoc,
  onSnapshot
} from "firebase/firestore";
import { FIREBASE_CONFIG } from "../constants";
import { Teacher, LessonPlan } from "../types";

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

export const APIService = {
  // AUTHENTICATION
  async login(email: string, password: string): Promise<any> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
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
