import { supabase } from './supabase';
import { Teacher, LessonPlan, LoginLog } from '../types';
import { DEFAULT_TEACHER_PASSWORD } from '../constants';

// Email normalization helper
const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const APIService = {
  // Fetch all teachers
  async fetchTeachers(): Promise<Teacher[]> {
    try {
      console.log('📡 Fetching teachers from Supabase...');
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching teachers:', error);
        throw error;
      }
      
      console.log(`✅ Fetched ${data?.length || 0} teachers`);
      
      return (data || []).map(teacher => ({
        id: teacher.email,
        email: teacher.email,
        name: teacher.name,
        phone: teacher.phone || '',
        password: teacher.password || DEFAULT_TEACHER_PASSWORD,
        isClassTeacher: teacher.is_class_teacher || false,
        classTeacherOf: teacher.class_teacher_of || null,
        assignments: teacher.assignments || []
      } as Teacher));
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      return [];
    }
  },

  // Fetch lesson plans
  async fetchLessonPlans(): Promise<LessonPlan[]> {
    try {
      const { data, error } = await supabase
        .from('lesson_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(plan => ({
        id: plan.id,
        teacherId: plan.teacher_id,
        className: plan.class_name,
        section: plan.section,
        subject: plan.subject,
        weekStarting: plan.week_starting,
        topics: plan.topics || '',
        objectives: plan.objectives || '',
        activities: plan.activities || '',
        resources: plan.resources || '',
        assessment: plan.assessment || '',
        status: plan.status || 'draft',
        resubmissionStatus: plan.resubmission_status || 'none',
        submittedAt: plan.submitted_at,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at
      } as LessonPlan));
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
      return [];
    }
  },

  // Fetch login logs
  async fetchLoginLogs(): Promise<LoginLog[]> {
    try {
      const { data, error } = await supabase
        .from('login_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(log => ({
        id: log.id,
        email: log.email,
        name: log.name,
        timestamp: log.timestamp,
        deviceInfo: log.device_info
      } as LoginLog));
    } catch (error) {
      console.error('Error fetching login logs:', error);
      return [];
    }
  },

  // Add teacher
  async addTeacher(teacher: Teacher): Promise<void> {
    try {
      const normalizedEmail = normalizeEmail(teacher.email);
      
      const { error } = await supabase
        .from('teachers')
        .upsert({
          email: normalizedEmail,
          name: teacher.name,
          phone: teacher.phone,
          password: teacher.password || DEFAULT_TEACHER_PASSWORD,
          is_class_teacher: teacher.isClassTeacher,
          class_teacher_of: teacher.classTeacherOf,
          assignments: teacher.assignments || [],
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        });
      
      if (error) throw error;
      console.log(`✅ Added teacher: ${teacher.name}`);
    } catch (error) {
      console.error('Error adding teacher:', error);
      throw new Error('Failed to add teacher');
    }
  },

  // Update teacher
  async updateTeacher(email: string, updates: Partial<Teacher>): Promise<void> {
    try {
      const normalizedEmail = normalizeEmail(email);
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if ('name' in updates) updateData.name = updates.name;
      if ('phone' in updates) updateData.phone = updates.phone;
      if ('password' in updates) updateData.password = updates.password;
      if ('isClassTeacher' in updates) updateData.is_class_teacher = updates.isClassTeacher;
      if ('classTeacherOf' in updates) updateData.class_teacher_of = updates.classTeacherOf;
      if ('assignments' in updates) updateData.assignments = updates.assignments;
      if ('email' in updates && updates.email) {
        updateData.email = normalizeEmail(updates.email);
      }
      
      const { error } = await supabase
        .from('teachers')
        .update(updateData)
        .eq('email', normalizedEmail);
      
      if (error) throw error;
      console.log(`✅ Updated teacher: ${email}`);
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw new Error('Failed to update teacher');
    }
  },

  // Remove teacher
  async removeTeacher(email: string): Promise<void> {
    try {
      const normalizedEmail = normalizeEmail(email);
      
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('email', normalizedEmail);
      
      if (error) throw error;
      console.log(`✅ Removed teacher: ${email}`);
    } catch (error) {
      console.error('Error removing teacher:', error);
      throw new Error('Failed to remove teacher');
    }
  },

  // Seed initial teachers
  async syncInitialTeachers(teachers: Teacher[]): Promise<void> {
    try {
      console.log(`🌱 Seeding ${teachers.length} teachers to Supabase...`);
      
      const teachersData = teachers.map(teacher => ({
        email: normalizeEmail(teacher.email),
        name: teacher.name,
        phone: teacher.phone,
        password: teacher.password || DEFAULT_TEACHER_PASSWORD,
        is_class_teacher: teacher.isClassTeacher || false,
        class_teacher_of: teacher.classTeacherOf || null,
        assignments: teacher.assignments || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('teachers')
        .upsert(teachersData, {
          onConflict: 'email'
        });
      
      if (error) throw error;
      console.log(`✅ Successfully seeded ${teachers.length} teachers`);
    } catch (error) {
      console.error('Error syncing teachers:', error);
      throw new Error('Failed to seed teachers database');
    }
  },

  // Submit lesson plan
  async submitLessonPlan(plan: Omit<LessonPlan, 'id' | 'submittedAt'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('lesson_plans')
        .insert({
          teacher_id: plan.teacherId,
          class_name: plan.className,
          section: plan.section,
          subject: plan.subject,
          week_starting: plan.weekStarting,
          topics: plan.topics,
          objectives: plan.objectives,
          activities: plan.activities,
          resources: plan.resources,
          assessment: plan.assessment,
          status: plan.status || 'submitted',
          resubmission_status: plan.resubmissionStatus || 'none',
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      console.log(`✅ Submitted lesson plan for ${plan.teacherId}`);
    } catch (error) {
      console.error('Error submitting lesson plan:', error);
      throw new Error('Failed to submit lesson plan');
    }
  },

  // Log login activity
  async logLoginActivity(user: { email: string; name: string }): Promise<void> {
    try {
      await supabase
        .from('login_logs')
        .insert({
          email: normalizeEmail(user.email),
          name: user.name,
          timestamp: new Date().toISOString(),
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform
          }
        });
    } catch (error) {
      console.error('Error logging login activity:', error);
    }
  },

  // Get teacher by email
  async getTeacherByEmail(email: string): Promise<Teacher | null> {
    try {
      const normalizedEmail = normalizeEmail(email);
      
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', normalizedEmail)
        .single();
      
      if (error || !data) return null;
      
      return {
        id: data.email,
        email: data.email,
        name: data.name,
        phone: data.phone || '',
        password: data.password || DEFAULT_TEACHER_PASSWORD,
        isClassTeacher: data.is_class_teacher || false,
        classTeacherOf: data.class_teacher_of || null,
        assignments: data.assignments || []
      } as Teacher;
    } catch (error) {
      console.error('Error getting teacher by email:', error);
      return null;
    }
  },

  // Clear teachers
  async clearTeachersCollection(): Promise<void> {
    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .neq('email', 'dummy');
      
      if (error) throw error;
      console.log('✅ Cleared all teachers from database');
    } catch (error) {
      console.error('Error clearing teachers:', error);
      throw new Error('Failed to clear teachers');
    }
  },

  // Get database status
  async getDatabaseStatus(): Promise<{ seeded: boolean; teacherCount: number }> {
    try {
      const teachers = await this.fetchTeachers();
      return {
        seeded: teachers.length > 0,
        teacherCount: teachers.length
      };
    } catch (error) {
      console.error('Error getting database status:', error);
      return { seeded: false, teacherCount: 0 };
    }
  }
};
