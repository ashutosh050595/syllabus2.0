import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs, writeBatch, updateDoc } from "firebase/firestore";
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
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Teacher));
    } catch (e) {
      console.warn("Teachers fetch failed, using offline fallback");
      return [];
    }
  },

  async fetchLessonPlans(): Promise<LessonPlan[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "lessonPlans"));
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LessonPlan));
    } catch (e) {
      return [];
    }
  },

  async fetchLoginLogs(): Promise<LoginLog[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "loginLogs"));
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LoginLog));
    } catch (e) {
      return [];
    }
  },

  async submitMultiplePlans(plans: Omit<LessonPlan, 'id' | 'submittedAt'>[]): Promise<void> {
    try {
      // First, check if any of these plans already exist with 'none' status
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
      
      // If we're here, all plans are valid to submit
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();
      
      plans.forEach(plan => {
        // Unique ID to prevent duplication
        const id = `${plan.teacherId}_${plan.className}_${plan.section}_${plan.subject}_${plan.weekStarting}`
          .replace(/[@.]/g, '_')
          .replace(/\s+/g, '');
        
        const planRef = doc(db, "lessonPlans", id);
        batch.set(planRef, {
          ...plan,
          id,
          submittedAt: timestamp,
          resubmissionStatus: plan.resubmissionStatus || 'none'
        });
      });

      await batch.commit();

      // Send email confirmation for each unique teacher
      if (plans.length > 0 && GAS_WORKER_URL && !GAS_WORKER_URL.includes('placeholder')) {
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

          fetch(GAS_WORKER_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload)
          }).catch(() => console.debug("Email background task initiated."));
        });
      }
      
    } catch (error) {
      console.error("Submission error in submitMultiplePlans:", error);
      if (error instanceof Error) {
        // Re-throw with proper error message
        throw new Error(error.message);
      }
      throw new Error("Failed to submit lesson plans. Please check your connection and try again.");
    }
  },

  async requestResubmission(planId: string, teacherEmail: string, teacherName: string, weekRange: string): Promise<void> {
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) return;
    
    try {
      // Update the plan status in Firebase
      const planRef = doc(db, "lessonPlans", planId);
      await updateDoc(planRef, {
        resubmissionStatus: 'pending'
      });

      // Send request to GAS for email notifications
      const resubmitPayload = {
        action: 'request_resubmit',
        planId: planId,
        teacherEmail: teacherEmail,
        teacherName: teacherName,
        weekRange: weekRange
      };

      fetch(GAS_WORKER_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resubmitPayload)
      }).catch(() => console.debug("Resubmission request sent."));
    } catch (error) {
      console.error("Error requesting resubmission:", error);
      throw new Error("Failed to submit resubmission request. Please try again.");
    }
  },

  async approveResubmissionRequest(planId: string, teacherEmail: string, teacherName: string, weekRange: string): Promise<void> {
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) return;
    
    try {
      // Send approval email to teacher
      const approvePayload = {
        action: 'approve_resubmission',
        teacherEmail: teacherEmail,
        teacherName: teacherName,
        weekRange: weekRange,
        planId: planId,
        approvalLink: `${window.location.origin}/teacher/submit`
      };

      fetch(GAS_WORKER_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvePayload)
      }).catch(() => console.debug("Approval email sent."));

      // Update resubmission status to 'approved' (don't delete immediately)
      const planRef = doc(db, "lessonPlans", planId);
      await updateDoc(planRef, {
        resubmissionStatus: 'approved'
      });
    } catch (error) {
      console.error("Error approving resubmission:", error);
      throw new Error("Failed to approve resubmission request.");
    }
  },

  async declineResubmissionRequest(planId: string, teacherEmail: string, teacherName: string, weekRange: string): Promise<void> {
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) return;
    
    try {
      // Send decline email to teacher
      const declinePayload = {
        action: 'decline_resubmission',
        teacherEmail: teacherEmail,
        teacherName: teacherName,
        weekRange: weekRange,
        planId: planId
      };

      fetch(GAS_WORKER_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(declinePayload)
      }).catch(() => console.debug("Decline email sent."));

      // Update resubmission status back to 'none'
      const planRef = doc(db, "lessonPlans", planId);
      await updateDoc(planRef, {
        resubmissionStatus: 'none'
      });
    } catch (error) {
      console.error("Error declining resubmission:", error);
      throw new Error("Failed to decline resubmission request.");
    }
  },

  async deleteLessonPlan(planId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "lessonPlans", planId));
    } catch (error) {
      console.error("Error deleting lesson plan:", error);
      throw new Error("Failed to delete lesson plan.");
    }
  },

  async updateLessonPlan(planId: string, updates: Partial<LessonPlan>): Promise<void> {
    try {
      const planRef = doc(db, "lessonPlans", planId);
      await updateDoc(planRef, updates);
    } catch (error) {
      console.error("Error updating lesson plan:", error);
      throw new Error("Failed to update lesson plan.");
    }
  },

  async addTeacher(teacher: Teacher): Promise<void> {
    await setDoc(doc(db, "teachers", teacher.email), teacher);
  },

  async updateTeacher(id: string, updates: Partial<Teacher>): Promise<void> {
    await setDoc(doc(db, "teachers", id), updates, { merge: true });
  },

  async removeTeacher(id: string): Promise<void> {
    await deleteDoc(doc(db, "teachers", id));
  },

  async syncInitialTeachers(teachers: Teacher[]): Promise<void> {
    const batch = writeBatch(db);
    teachers.forEach((t) => {
      const teacherRef = doc(db, "teachers", t.email);
      batch.set(teacherRef, t);
    });
    await batch.commit();
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

  async sendDefaulterReminders(defaulters: Teacher[], weekLabel: string): Promise<void> {
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) return;
    
    try {
      const defaulterPayload = {
        action: 'defaulter_reminders',
        weekLabel: weekLabel,
        defaulters: defaulters.map(d => ({
          name: d.name,
          email: d.email
        }))
      };

      fetch(GAS_WORKER_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaulterPayload)
      }).catch(() => console.debug("Defaulter reminders sent."));
    } catch (error) {
      console.error("Error sending defaulter reminders:", error);
      throw new Error("Failed to send defaulter reminders.");
    }
  },

  async triggerDefaulterReminders(): Promise<void> {
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) return;
    
    fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'trigger_defaulter_warnings' })
    }).catch(() => {});
  },

  async compileAndSendReports(): Promise<void> {
    if (!GAS_WORKER_URL || GAS_WORKER_URL.includes('placeholder')) return;
    
    fetch(GAS_WORKER_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'compile_reports' })
    }).catch(() => {});
  },

  async getDefaultersForWeek(weekStarting: string): Promise<Teacher[]> {
    try {
      const [teachers, lessonPlans] = await Promise.all([
        this.fetchTeachers(),
        this.fetchLessonPlans()
      ]);

      // Get teachers who have submitted for this week
      const submittedTeachers = new Set(
        lessonPlans
          .filter(plan => plan.weekStarting === weekStarting && plan.resubmissionStatus !== 'pending')
          .map(plan => plan.teacherId)
      );

      // Return teachers who haven't submitted
      return teachers.filter(teacher => !submittedTeachers.has(teacher.email));
    } catch (error) {
      console.error("Error getting defaulters:", error);
      return [];
    }
  },

  async getPendingResubmissionRequests(): Promise<LessonPlan[]> {
    try {
      const lessonPlans = await this.fetchLessonPlans();
      return lessonPlans.filter(plan => plan.resubmissionStatus === 'pending');
    } catch (error) {
      console.error("Error getting pending resubmission requests:", error);
      return [];
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
        ip: await this.getClientIP()
      };

      await setDoc(doc(db, "loginLogs", id), logData);
    } catch (error) {
      console.error("Error logging login activity:", error);
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

  async getTeacherLoginHistory(teacherEmail: string): Promise<LoginLog[]> {
    try {
      const loginLogs = await this.fetchLoginLogs();
      return loginLogs
        .filter(log => log.email === teacherEmail)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error("Error getting teacher login history:", error);
      return [];
    }
  },

  async getTeacherSubmissionHistory(teacherEmail: string): Promise<LessonPlan[]> {
    try {
      const lessonPlans = await this.fetchLessonPlans();
      return lessonPlans
        .filter(plan => plan.teacherId === teacherEmail)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    } catch (error) {
      console.error("Error getting teacher submission history:", error);
      return [];
    }
  },

  async checkExistingSubmission(teacherEmail: string, weekStarting: string): Promise<LessonPlan | null> {
    try {
      const lessonPlans = await this.fetchLessonPlans();
      return lessonPlans.find(plan => 
        plan.teacherId === teacherEmail && 
        plan.weekStarting === weekStarting &&
        plan.resubmissionStatus === 'none'
      ) || null;
    } catch (error) {
      console.error("Error checking existing submission:", error);
      return null;
    }
  }
};
