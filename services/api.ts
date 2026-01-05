import { normalizeEmail, teacherIdFromEmail } from "../utils/identity";
import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  writeBatch, 
  updateDoc,
  query,
  where,
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import { FIREBASE_CONFIG, DEFAULT_TEACHER_PASSWORD } from "../constants";
import { LessonPlan, Teacher, LoginLog } from "../types";

const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
const db = getFirestore(app);

// Using environment variable:
const GAS_WORKER_URL =
  import.meta.env.VITE_GAS_WORKER_URL ||
  'https://script.google.com/macros/s/AKfycbySZzxF_gOP2MRMp3jYJ9SgQypkgCpxb1EPKt88HfTV1ggrzxVQ_J96IP6LpTMedF-unQ/exec';

// ✅ HELPER FUNCTION: Email normalization
const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const APIService = {
  async fetchTeachers(): Promise<Teacher[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "teachers"));
      const teachers = querySnapshot.docs.map(docSnap => { 
        const data = docSnap.data();
        return { 
          ...data, 
          id: docSnap.id,
          email: data.email || docSnap.id,
          password: data.password || DEFAULT_TEACHER_PASSWORD
        } as Teacher;
      });
      console.log(`Fetched ${teachers.length} teachers from Firestore`);
      return teachers;
    } catch (e) {
      console.error("Teachers fetch failed:", e);
      throw new Error("Failed to fetch teachers from database. Please check your internet connection.");
    }
  },

  async fetchLessonPlans(): Promise<LessonPlan[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "lessonPlans"));
      const plans = querySnapshot.docs.map(docSnap => ({ 
        ...docSnap.data(), 
        id: docSnap.id 
      } as LessonPlan));
      console.log(`Fetched ${plans.length} lesson plans from Firestore`);
      return plans;
    } catch (e) {
      console.error("Lesson plans fetch failed:", e);
      throw new Error("Failed to fetch lesson plans.");
    }
  },

  async fetchLoginLogs(): Promise<LoginLog[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "loginLogs"));
      return querySnapshot.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id } as LoginLog));
    } catch (e) {
      console.error("Login logs fetch failed:", e);
      throw new Error("Failed to fetch login logs.");
    }
  },

  async submitMultiplePlans(plans: Omit<LessonPlan, 'id' | 'submittedAt'>[]): Promise<void> {
    try {
      console.log("Starting submission for", plans.length, "plans");
      
      if (!plans || plans.length === 0) {
        throw new Error("No lesson plans provided for submission.");
      }

      const existingPlans = await this.fetchLessonPlans();
      const duplicateErrors: string[] = [];
      
      plans.forEach(plan => {
        const existingPlan = existingPlans.find(p => 
          p.teacherId === plan.teacherId &&
          p.className === plan.className &&
          p.section === plan.section &&
          p.subject === plan.subject &&
          p.weekStarting === plan.weekStarting &&
          p.resubmissionStatus === 'none'
        );
        
        if (existingPlan) {
          duplicateErrors.push(
            `Lesson plan for ${plan.className}-${plan.section} (${plan.subject}) has already been submitted for this week.`
          );
        }
      });
      
      if (duplicateErrors.length > 0) {
        throw new Error(
          `DUPLICATE_SUBMISSION: ${duplicateErrors.join(' ')} ` +
          `If modifications are required, please use the "Request Modification" option.`
        );
      }
      
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();
      
      plans.forEach(plan => {
        const id = `${plan.teacherId}_${plan.className}_${plan.section}_${plan.subject}_${plan.weekStarting}`
          .replace(/[@.]/g, '_')
          .replace(/\s+/g, '');
        
        const planRef = doc(db, "lessonPlans", id);
        
        const planData = {
          ...plan,
          id,
          submittedAt: timestamp,
          resubmissionStatus: plan.resubmissionStatus || 'none',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        batch.set(planRef, planData);
      });

      await batch.commit();

      if (plans.length > 0 && GAS_WORKER_URL && !GAS_WORKER_URL.includes('placeholder')) {
        this.sendEmailConfirmations(plans);
      }
      
    } catch (error: any) {
      console.error("Submission error in submitMultiplePlans:", error);
      if (error.message?.includes('DUPLICATE_SUBMISSION')) {
        throw error;
      }
      throw new Error(`Failed to submit lesson plans: ${error.message || 'Unknown error'}`);
    }
  },

  async requestResubmission(
    planId: string,
    teacherEmail: string,
    teacherName: string,
    weekRange: string
  ): Promise<void> {
    try {
      const planRef = doc(db, "lessonPlans", planId);
      await updateDoc(planRef, {
        resubmissionStatus: 'pending',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error requesting resubmission:", error);
      throw new Error("Failed to submit resubmission request. Please try again.");
    }
  },

  async addTeacher(teacher: Teacher): Promise<void> {
    try {
      const normalizedEmail = normalizeEmail(teacher.email); // ✅ FIXED
      const teacherRef = doc(db, "teachers", normalizedEmail);
      
      await setDoc(teacherRef, {
        ...teacher,
        id: normalizedEmail, // ✅ Store normalized email as ID
        email: normalizedEmail, // ✅ Store normalized email in email field too
        password: teacher.password || DEFAULT_TEACHER_PASSWORD,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding teacher:", error);
      throw new Error("Failed to add teacher.");
    }
  },

  async updateTeacher(email: string, updates: Partial<Teacher>): Promise<void> {
    try {
      const normalizedEmail = normalizeEmail(email); // ✅ FIXED
      const teacherRef = doc(db, "teachers", normalizedEmail);
      
      const updateData: any = { 
        ...updates, 
        updatedAt: serverTimestamp() 
      };
      
      // ✅ FIX: If email is being updated, normalize it too
      if ('email' in updates && updates.email) {
        updateData.email = normalizeEmail(updates.email);
        updateData.id = normalizeEmail(updates.email);
      }
      
      // ✅ FIX: Password ko preserve karo
      if ('password' in updates && updates.password === undefined) {
        delete updateData.password;
      }
      
      await updateDoc(teacherRef, updateData);
    } catch (error) {
      console.error("Error updating teacher:", error);
      throw new Error("Failed to update teacher.");
    }
  },

  async removeTeacher(email: string): Promise<void> {
    try {
      const normalizedEmail = normalizeEmail(email); // ✅ FIXED
      await deleteDoc(doc(db, "teachers", normalizedEmail));
    } catch (error) {
      console.error("Error removing teacher:", error);
      throw new Error("Failed to remove teacher.");
    }
  },

  async clearTeachersCollection(): Promise<void> {
    try {
      const snapshot = await getDocs(collection(db, "teachers"));
      const batch = writeBatch(db);

      snapshot.docs.forEach(docSnap => {
        batch.delete(doc(db, "teachers", docSnap.id));
      });

      await batch.commit();
      console.log("All teachers cleared successfully");
    } catch (error) {
      console.error("Failed to clear teachers:", error);
      throw new Error("Unable to clear teachers collection");
    }
  },

  async syncInitialTeachers(teachers: Teacher[]): Promise<void> {
    try {
      const BATCH_SIZE = 400; // Firestore limit is 500
      let index = 0;

      while (index < teachers.length) {
        const batch = writeBatch(db);
        const slice = teachers.slice(index, index + BATCH_SIZE);

        slice.forEach(teacher => {
          const normalizedEmail = normalizeEmail(teacher.email); // ✅ FIXED
          const teacherRef = doc(db, "teachers", normalizedEmail);
          
          const { id: _, ...teacherWithoutId } = teacher; // 🔥 REMOVE OLD ID
          batch.set(teacherRef, {
            ...teacherWithoutId,
            id: normalizedEmail, // ✅ Store normalized email as ID
            email: normalizedEmail, // ✅ Store normalized email in email field
            password: teacher.password || DEFAULT_TEACHER_PASSWORD,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });

        await batch.commit();
        index += BATCH_SIZE;
      }
    } catch (error) {
      console.error("Error syncing initial teachers:", error);
      throw new Error("Failed to seed teachers database.");
    }
  },

 async getTeacherByEmail(email: string): Promise<Teacher | null> {
  try {
    const normalizedEmail = normalizeEmail(email);

    // 🔹 STEP 1: Direct lookup (fast & ideal)
    const directRef = doc(db, "teachers", normalizedEmail);
    const directSnap = await getDoc(directRef);

    if (directSnap.exists()) {
      const data = directSnap.data();
      return {
        ...data,
        id: directSnap.id,
        email: data.email || directSnap.id,
        password: data.password || DEFAULT_TEACHER_PASSWORD
      } as Teacher;
    }

    // 🔹 STEP 2: Fallback query (for old / inconsistent data)
    const q = query(
      collection(db, "teachers"),
      where("email", "==", normalizedEmail)
    );

    const querySnap = await getDocs(q);

    if (querySnap.empty) return null;

    const docSnap = querySnap.docs[0];
    const data = docSnap.data();

    return {
      ...data,
      id: docSnap.id,
      email: data.email || docSnap.id,
      password: data.password || DEFAULT_TEACHER_PASSWORD
    } as Teacher;

  } catch (error) {
    console.error("Error getting teacher by email:", error);
    return null;
  }
}
