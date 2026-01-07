import { supabase } from './supabase';
import { Teacher, LessonPlan, LoginLog, ResubmissionRequest } from '../types';
import { DEFAULT_TEACHER_PASSWORD } from '../constants';
import { EmailService } from './email-service';

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

  // Submit lesson plan with email notification
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
      
      // Send email notification
      const teacher = await this.getTeacherByEmail(plan.teacherId);
      if (teacher) {
        const weekRange = this.formatWeekRange(new Date(plan.weekStarting));
        const emailSent = await EmailService.sendEmail(
          EmailService.createSubmissionConfirmation(
            teacher.name,
            teacher.email,
            weekRange,
            [`${plan.className}-${plan.section}: ${plan.subject}`]
          )
        );
        if (emailSent) {
          console.log(`📧 Email sent to ${teacher.email}`);
        }
      }
    } catch (error) {
      console.error('Error submitting lesson plan:', error);
      throw new Error('Failed to submit lesson plan');
    }
  },

  // Submit multiple lesson plans with single email
  async submitMultipleLessonPlans(plans: Omit<LessonPlan, 'id' | 'submittedAt'>[]): Promise<void> {
    try {
      const teacherId = plans[0]?.teacherId;
      if (!teacherId) throw new Error('No teacher ID found');
      
      // Insert all plans
      const plansData = plans.map(plan => ({
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
      }));
      
      const { error } = await supabase
        .from('lesson_plans')
        .insert(plansData);
      
      if (error) throw error;
      console.log(`✅ Submitted ${plans.length} lesson plans for ${teacherId}`);
      
      // Send single email notification for all submissions
      const teacher = await this.getTeacherByEmail(teacherId);
      if (teacher) {
        const weekRange = this.formatWeekRange(new Date(plans[0].weekStarting));
        const submittedClasses = plans.map(p => `${p.className}-${p.section}: ${p.subject}`);
        
        const emailSent = await EmailService.sendEmail(
          EmailService.createSubmissionConfirmation(
            teacher.name,
            teacher.email,
            weekRange,
            submittedClasses
          )
        );
        
        if (emailSent) {
          console.log(`📧 Summary email sent to ${teacher.email}`);
        }
      }
    } catch (error) {
      console.error('Error submitting multiple lesson plans:', error);
      throw new Error('Failed to submit lesson plans');
    }
  },

  // Request resubmission for multiple classes
  async requestResubmission(
    teacherId: string,
    weekStarting: string,
    classSections: Array<{className: string, section: string, subject: string}>
  ): Promise<string> {
    try {
      const teacher = await this.getTeacherByEmail(teacherId);
      if (!teacher) throw new Error('Teacher not found');
      
      const requestId = `RS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const weekRange = this.formatWeekRange(new Date(weekStarting));
      
      // Update lesson plans to mark as pending resubmission
      for (const classSection of classSections) {
        const { error } = await supabase
          .from('lesson_plans')
          .update({ 
            resubmission_status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('teacher_id', teacherId)
          .eq('week_starting', weekStarting)
          .eq('class_name', classSection.className)
          .eq('section', classSection.section)
          .eq('subject', classSection.subject);
        
        if (error) throw error;
      }
      
      console.log(`🔄 Resubmission requested for ${classSections.length} classes`);
      
      // Send email notifications
      const emailSent = await EmailService.sendEmail(
        EmailService.createResubmissionRequest(
          teacher.name,
          teacher.email,
          weekRange,
          classSections.map(cs => `${cs.className}-${cs.section}: ${cs.subject}`),
          requestId
        )
      );
      
      if (emailSent) {
        console.log(`📧 Resubmission request emails sent`);
      }
      
      // Store request in database
      await supabase
        .from('resubmission_requests')
        .insert({
          id: requestId,
          teacher_id: teacherId,
          teacher_name: teacher.name,
          teacher_email: teacher.email,
          week_starting: weekStarting,
          class_sections: classSections,
          status: 'pending',
          created_at: new Date().toISOString()
        });
      
      return requestId;
    } catch (error) {
      console.error('Error requesting resubmission:', error);
      throw new Error('Failed to request resubmission');
    }
  },

  // Approve resubmission request
  async approveResubmission(requestId: string): Promise<void> {
    try {
      // Fetch request details
      const { data: request, error: fetchError } = await supabase
        .from('resubmission_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (fetchError || !request) throw new Error('Request not found');
      
      // Delete existing lesson plans for those class sections
      for (const classSection of request.class_sections) {
        const { error: deleteError } = await supabase
          .from('lesson_plans')
          .delete()
          .eq('teacher_id', request.teacher_id)
          .eq('week_starting', request.week_starting)
          .eq('class_name', classSection.className)
          .eq('section', classSection.section)
          .eq('subject', classSection.subject);
        
        if (deleteError) throw deleteError;
      }
      
      // Update request status
      await supabase
        .from('resubmission_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
      
      // Send approval email
      const weekRange = this.formatWeekRange(new Date(request.week_starting));
      const approvalLink = `https://your-app-url.com/teacher/submit?week=${request.week_starting}`;
      
      await EmailService.sendEmail(
        EmailService.createResubmissionApproval(
          request.teacher_name,
          request.teacher_email,
          weekRange,
          approvalLink
        )
      );
      
      console.log(`✅ Resubmission request approved: ${requestId}`);
    } catch (error) {
      console.error('Error approving resubmission:', error);
      throw new Error('Failed to approve resubmission');
    }
  },

  // Decline resubmission request
  async declineResubmission(requestId: string, reason?: string): Promise<void> {
    try {
      // Fetch request details
      const { data: request, error: fetchError } = await supabase
        .from('resubmission_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (fetchError || !request) throw new Error('Request not found');
      
      // Update lesson plans to mark as declined
      for (const classSection of request.class_sections) {
        const { error: updateError } = await supabase
          .from('lesson_plans')
          .update({ 
            resubmission_status: 'declined',
            updated_at: new Date().toISOString()
          })
          .eq('teacher_id', request.teacher_id)
          .eq('week_starting', request.week_starting)
          .eq('class_name', classSection.className)
          .eq('section', classSection.section)
          .eq('subject', classSection.subject);
        
        if (updateError) throw updateError;
      }
      
      // Update request status
      await supabase
        .from('resubmission_requests')
        .update({ 
          status: 'declined',
          decline_reason: reason,
          declined_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
      
      // Send decline email
      const weekRange = this.formatWeekRange(new Date(request.week_starting));
      
      await EmailService.sendEmail(
        EmailService.createResubmissionRejection(
          request.teacher_name,
          request.teacher_email,
          weekRange,
          reason
        )
      );
      
      console.log(`❌ Resubmission request declined: ${requestId}`);
    } catch (error) {
      console.error('Error declining resubmission:', error);
      throw new Error('Failed to decline resubmission');
    }
  },

  // Send defaulter reminders
  async sendDefaulterReminders(defaulters: Teacher[], weekRange: string): Promise<void> {
    try {
      const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      
      for (const teacher of defaulters) {
        await EmailService.sendEmail(
          EmailService.createDefaulterReminder(
            teacher.name,
            teacher.email,
            weekRange,
            dayOfWeek
          )
        );
        console.log(`📧 Reminder sent to ${teacher.email}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`✅ Sent ${defaulters.length} defaulter reminders`);
    } catch (error) {
      console.error('Error sending defaulter reminders:', error);
      throw new Error('Failed to send reminders');
    }
  },

  // Schedule automatic reminders (to be called by a cron job)
  async scheduleAutomaticReminders(): Promise<void> {
    try {
      const dayOfWeek = new Date().getDay(); // 0 = Sunday, 4 = Thursday, 5 = Friday, 6 = Saturday
      
      // Only run on Thursday (4), Friday (5), or Saturday (6) at 1 PM
      if ([4, 5, 6].includes(dayOfWeek)) {
        const upcomingMonday = this.getUpcomingMonday();
        const weekRange = this.formatWeekRange(upcomingMonday);
        
        // Get defaulters
        const [teachers, lessonPlans] = await Promise.all([
          this.fetchTeachers(),
          this.fetchLessonPlans()
        ]);
        
        const submittedTeachers = new Set(
          lessonPlans
            .filter(plan => plan.weekStarting === upcomingMonday.toISOString())
            .map(plan => plan.teacherId)
        );
        
        const defaulters = teachers.filter(teacher => !submittedTeachers.has(teacher.email));
        
        if (defaulters.length > 0) {
          await this.sendDefaulterReminders(defaulters, weekRange);
          console.log(`⏰ Automated reminders sent for ${dayOfWeek === 6 ? 'Saturday' : dayOfWeek === 5 ? 'Friday' : 'Thursday'}`);
        }
      }
    } catch (error) {
      console.error('Error in automatic reminders:', error);
    }
  },

  // Compile weekly PDFs and send to class teachers
  async compileWeeklyPDFs(): Promise<void> {
    try {
      const upcomingMonday = this.getUpcomingMonday();
      const weekRange = this.formatWeekRange(upcomingMonday);
      
      // Get all lesson plans for the upcoming week
      const lessonPlans = await this.fetchLessonPlans();
      const teachers = await this.fetchTeachers();
      
      const weeklyPlans = lessonPlans.filter(
        plan => plan.weekStarting === upcomingMonday.toISOString()
      );
      
      // Group by class and section
      const groupedPlans: Record<string, LessonPlan[]> = {};
      weeklyPlans.forEach(plan => {
        const key = `${plan.className}-${plan.section}`;
        if (!groupedPlans[key]) groupedPlans[key] = [];
        groupedPlans[key].push(plan);
      });
      
      // For each class-section, create PDF and send to class teacher
      for (const [classSection, plans] of Object.entries(groupedPlans)) {
        const [className, section] = classSection.split('-');
        
        // Find class teacher
        const classTeacher = teachers.find(t => 
          t.classTeacherOf === `${className}-${section}`
        );
        
        if (classTeacher) {
          // Here you would generate PDF
          // For now, we'll simulate PDF generation
          const pdfUrl = `https://your-app-url.com/pdf/${className}/${section}/${upcomingMonday.toISOString()}`;
          
          // Get missing teachers for this class-section
          const allTeachersForClass = teachers.filter(t => 
            t.assignments.some(a => a.className === className && a.sections.includes(section))
          );
          
          const submittedTeachers = new Set(plans.map(p => p.teacherId));
          const missingTeachers = allTeachersForClass
            .filter(t => !submittedTeachers.has(t.email))
            .map(t => t.name);
          
          // Send PDF email
          await EmailService.sendEmail(
            EmailService.createWeeklyPDFNotification(
              classTeacher.name,
              classTeacher.email,
              weekRange,
              className,
              section,
              pdfUrl,
              missingTeachers
            )
          );
          
          console.log(`📤 PDF sent to class teacher of ${classSection}`);
        }
      }
      
      console.log(`✅ Weekly PDF compilation completed for ${weekRange}`);
    } catch (error) {
      console.error('Error compiling weekly PDFs:', error);
      throw new Error('Failed to compile PDFs');
    }
  },

  // Get pending resubmission requests
  async getPendingResubmissions(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('resubmission_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending resubmissions:', error);
      return [];
    }
  },

  // Helper: Format week range
  formatWeekRange(date: Date): string {
    const start = new Date(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    return `${start.getDate().toString().padStart(2, '0')}-${(start.getMonth() + 1).toString().padStart(2, '0')}-${start.getFullYear()} to ${end.getDate().toString().padStart(2, '0')}-${(end.getMonth() + 1).toString().padStart(2, '0')}-${end.getFullYear()}`;
  },

  // Helper: Get upcoming Monday
  getUpcomingMonday(): Date {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 1 : (8 - day) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
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
