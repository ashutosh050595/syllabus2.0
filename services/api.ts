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
import { FIREBASE_CONFIG } from "../constants";
import { LessonPlan, Teacher, LoginLog } from "../types";

const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
const db = getFirestore(app);

// Using environment variable:
const GAS_WORKER_URL = import.meta.env.VITE_GAS_WORKER_URL || 'https://script.google.com/macros/s/AKfycbySZzxF_gOP2MRMp3jYJ9SgQypkgCpxb1EPKt88HfTV1ggrzxVQ_J96IP6LpTMedF-unQ/exec';

export const APIService = {
  async fetchTeachers(): Promise<Teacher[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "teachers"));
      const teachers = querySnapshot.docs.map(doc => { 
        const data = doc.data();
        return { 
          ...data, 
          id: doc.id, // This is the email (document ID)
          email: data.email || doc.id // Ensure email field exists
        } as Teacher;
      });
      console.log(`Fetched ${teachers.length} teachers from Firestore:`, teachers.map(t => t.email));
      return teachers;
    } catch (e) {
      console.error("Teachers fetch failed:", e);
      throw new Error("Failed to fetch teachers from database. Please check your internet connection.");
    }
  },

  async fetchLessonPlans(): Promise<LessonPlan[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "lessonPlans"));
      const plans = querySnapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
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
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LoginLog));
    } catch (e) {
      console.error("Login logs fetch failed:", e);
      throw new Error("Failed to fetch login logs.");
    }
  },

  async submitMultiplePlans(plans: Omit<LessonPlan, 'id' | 'submittedAt'>[]): Promise<void> {
    try {
      console.log("Starting submission for", plans.length, "plans");
      
      // Validate input
      if (!plans || plans.length === 0) {
        throw new Error("No lesson plans provided for submission.");
      }

      // Check if any of these plans already exist
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
        throw new Error(`DUPLICATE_SUBMISSION: ${duplicateErrors.join(' ')} If modifications are required, please use the "Request Modification" option.`);
      }
      
      // Prepare batch
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();
      
      plans.forEach(plan => {
        // Create a unique ID for the plan
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

      // Commit batch with timeout
      console.log("Committing batch to Firestore...");
      await batch.commit();
      console.log("Batch committed successfully");

      // Send email confirmations in background (don't wait for them)
      if (plans.length > 0 && GAS_WORKER_URL && !GAS_WORKER_URL.includes('placeholder')) {
        this.sendEmailConfirmations(plans);
      }
      
      console.log("Submission completed successfully");
      
    } catch (error: any) {
      console.error("Submission error in submitMultiplePlans:", error);
      if (error.message?.includes('DUPLICATE_SUBMISSION')) {
        throw error;
      }
      throw new Error(`Failed to submit lesson plans: ${error.message || 'Unknown error'}`);
    }
  },

  async requestResubmission(planId: string, teacherEmail: string, teacherName: string, weekRange: string): Promise<void> {
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) {
      console.warn("GAS_WORKER_URL not configured, skipping email notification");
      return;
    }
    
    try {
      // Update the plan status in Firebase
      const planRef = doc(db, "lessonPlans", planId);
      await updateDoc(planRef, {
        resubmissionStatus: 'pending',
        updatedAt: serverTimestamp()
      });

      // Send request to GAS for email notifications
      const resubmitPayload = {
        action: 'request_resubmit',
        planId: planId,
        teacherEmail: teacherEmail,
        teacherName: teacherName,
        weekRange: weekRange
      };

      this.sendToGAS(resubmitPayload);
    } catch (error) {
      console.error("Error requesting resubmission:", error);
      throw new Error("Failed to submit resubmission request. Please try again.");
    }
  },

  async addTeacher(teacher: Teacher): Promise<void> {
    try {
      // Use email as document ID for easy lookup
      const teacherRef = doc(db, "teachers", teacher.email);
      await setDoc(teacherRef, {
        ...teacher,
        id: teacher.email, // Ensure id matches email
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`Teacher ${teacher.email} added successfully`);
    } catch (error) {
      console.error("Error adding teacher:", error);
      throw new Error("Failed to add teacher.");
    }
  },

  async updateTeacher(email: string, updates: Partial<Teacher>): Promise<void> {
    try {
      const teacherRef = doc(db, "teachers", email);
      await updateDoc(teacherRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log(`Teacher ${email} updated successfully`);
    } catch (error) {
      console.error("Error updating teacher:", error);
      throw new Error("Failed to update teacher.");
    }
  },

  async removeTeacher(email: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "teachers", email));
      console.log(`Teacher ${email} removed successfully`);
    } catch (error) {
      console.error("Error removing teacher:", error);
      throw new Error("Failed to remove teacher.");
    }
  },

  async syncInitialTeachers(teachers: Teacher[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();
      
      teachers.forEach((teacher) => {
        // Use email as document ID for consistency
        const teacherRef = doc(db, "teachers", teacher.email);
        batch.set(teacherRef, {
          ...teacher,
          id: teacher.email, // Ensure id is email for consistency
          password: teacher.password, // Ensure password is included
          createdAt: timestamp,
          updatedAt: timestamp
        });
      });
      
      await batch.commit();
      console.log(`Successfully synced ${teachers.length} teachers to Firestore`);
    } catch (error) {
      console.error("Error syncing teachers:", error);
      throw new Error(`Failed to sync teachers: ${error}`);
    }
  },

  async checkDatabaseSeeded(): Promise<boolean> {
    try {
      const teachers = await this.fetchTeachers();
      return teachers.length > 0;
    } catch (error) {
      console.error("Error checking database seed status:", error);
      return false;
    }
  },

  async logLoginActivity(user: { email: string; name: string }): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const id = `${user.email}_${timestamp}`.replace(/[@.]/g, '_');
      
      const logData = {
        id,
        email: user.email,
        name: user.name,
        timestamp,
        ip: await this.getClientIP(),
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, "loginLogs", id), logData);
      console.log(`Logged login activity for ${user.email}`);
    } catch (error) {
      console.error("Error logging login activity:", error);
      // Don't throw - login logging shouldn't block user login
    }
  },

  async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'Unknown';
    } catch {
      return 'Unknown';
    }
  },

  // Helper method to send to GAS
  sendToGAS(payload: any): void {
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) return;
    
    fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(error => console.debug("GAS request sent (background):", error));
  },

  // Helper method to send email confirmations
  async sendEmailConfirmations(plans: any[]): Promise<void> {
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) return;
    
    const uniqueTeachers = Array.from(new Set(plans.map(p => p.teacherId)));
    
    uniqueTeachers.forEach(teacherEmail => {
      const teacherPlans = plans.filter(p => p.teacherId === teacherEmail);
      const emailPayload = {
        action: 'submission_alert',
        teacherEmail: teacherEmail,
        teacherName: teacherPlans[0].teacherName,
        weekRange: teacherPlans[0].weekLabel,
        summary: teacherPlans.map(p => `${p.className}-${p.section} (${p.subject})`).join(', ')
      };

      // Send in background, don't wait
      this.sendToGAS(emailPayload);
    });
  },

  // Helper to get teacher by email
  async getTeacherByEmail(email: string): Promise<Teacher | null> {
    try {
      const teachers = await this.fetchTeachers();
      const normalizedEmail = email.toLowerCase().trim();
      return teachers.find(t => t.email.toLowerCase().trim() === normalizedEmail) || null;
    } catch (error) {
      console.error("Error getting teacher by email:", error);
      return null;
    }
  }
};
