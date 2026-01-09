import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Initializing Supabase client...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
  db: { schema: 'public' }
});

// Helper function to format date to DD-Mon-YYYY format
const formatDate = (dateString: string): string => {
  try {
    // Try multiple date formats
    let date: Date;
    
    if (dateString.includes('T')) {
      // ISO format: 2024-01-01T00:00:00.000Z
      date = new Date(dateString);
    } else if (dateString.includes('-')) {
      // Try different dash formats
      const parts = dateString.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          date = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
        } else {
          // DD-MM-YYYY or DD-Mon-YYYY
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      // If still invalid, return current date
      date = new Date();
    }
    
    // Format to DD-Mon-YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[today.getMonth()];
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  }
};

// Helper function to create week range from a date
const createWeekRange = (dateString: string): string => {
  try {
    const startDate = formatDate(dateString);
    const startDateObj = new Date(startDate);
    
    // Add 6 days for end date
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + 6);
    
    const endDay = endDateObj.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const endMonth = monthNames[endDateObj.getMonth()];
    const endYear = endDateObj.getFullYear();
    const endDate = `${endDay}-${endMonth}-${endYear}`;
    
    return `${startDate} to ${endDate}`;
  } catch (error) {
    console.error('Error creating week range:', dateString, error);
    return `${formatDate(new Date().toString())} to ${formatDate(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toString())}`;
  }
};

// Helper functions to convert between database and frontend formats
const convertTeacherToFrontend = (dbTeacher: any) => ({
  id: dbTeacher.id,
  name: dbTeacher.name,
  email: dbTeacher.email,
  phone: dbTeacher.phone || '',
  password: dbTeacher.password,
  isClassTeacher: dbTeacher.is_class_teacher || false,
  classTeacherOf: dbTeacher.class_teacher_of || null,
  assignments: dbTeacher.assignments || []
});

const convertTeacherToDatabase = (frontendTeacher: any) => ({
  name: frontendTeacher.name,
  email: frontendTeacher.email,
  phone: frontendTeacher.phone || '',
  password: frontendTeacher.password,
  is_class_teacher: frontendTeacher.isClassTeacher || false,
  class_teacher_of: frontendTeacher.classTeacherOf || null,
  assignments: frontendTeacher.assignments || []
});

const convertLessonPlanToFrontend = (dbPlan: any) => {
  // Create week range from week_starting
  const weekRange = dbPlan.week_range || createWeekRange(dbPlan.week_starting || new Date().toString());
  
  return {
    id: dbPlan.id,
    teacherId: dbPlan.teacher_id,
    className: dbPlan.class_name || 'Class',
    section: dbPlan.section || '',
    subject: dbPlan.subject || 'Subject',
    weekRange: weekRange,
    topics: dbPlan.topics,
    objectives: dbPlan.objectives,
    activities: dbPlan.activities,
    resources: dbPlan.resources,
    assessment: dbPlan.assessment,
    status: dbPlan.status || 'submitted',
    resubmissionStatus: dbPlan.resubmission_status || 'none',
    submittedAt: dbPlan.submitted_at || dbPlan.created_at,
    createdAt: dbPlan.created_at,
    updatedAt: dbPlan.updated_at
  };
};

const convertLessonPlanToDatabase = (frontendPlan: any) => {
  // Extract start date from weekRange (first part before " to ")
  const weekRangeParts = frontendPlan.weekRange?.split(' to ') || [];
  const weekStarting = weekRangeParts[0] || formatDate(new Date().toString());
  
  return {
    teacher_id: frontendPlan.teacherId,
    class_name: frontendPlan.className,
    section: frontendPlan.section,
    subject: frontendPlan.subject,
    week_starting: weekStarting,
    week_range: frontendPlan.weekRange,
    topics: frontendPlan.topics,
    objectives: frontendPlan.objectives,
    activities: frontendPlan.activities,
    resources: frontendPlan.resources,
    assessment: frontendPlan.assessment,
    status: frontendPlan.status || 'submitted',
    resubmission_status: frontendPlan.resubmissionStatus || 'none',
    submitted_at: frontendPlan.submittedAt || new Date().toISOString()
  };
};

export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing Supabase connection...');
    const { data, error } = await supabase
      .from('teachers')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
};

export class APIService {
  // ===================== TEACHER METHODS =====================
  static async fetchTeachers(): Promise<any[]> {
    console.log('👨‍🏫 Fetching teachers...');
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching teachers:', error);
      throw error;
    }
    
    console.log(`✅ Fetched ${data?.length || 0} teachers`);
    return (data || []).map(convertTeacherToFrontend);
  }

  static async getTeacherByEmail(email: string): Promise<any | null> {
    console.log('🔍 Finding teacher by email:', email);
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Error finding teacher:', error);
      throw error;
    }
    
    return data ? convertTeacherToFrontend(data) : null;
  }

  static async addTeacher(teacher: any): Promise<any> {
    console.log('➕ Adding teacher:', teacher.name);
    const dbTeacher = convertTeacherToDatabase(teacher);
    
    const { data, error } = await supabase
      .from('teachers')
      .insert([dbTeacher])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error adding teacher:', error);
      throw error;
    }
    
    console.log('✅ Teacher added:', data.id);
    return convertTeacherToFrontend(data);
  }

  static async updateTeacher(id: string, updates: any): Promise<any> {
    console.log('✏️ Updating teacher:', id);
    const dbUpdates = convertTeacherToDatabase(updates);
    
    const { data, error } = await supabase
      .from('teachers')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating teacher:', error);
      throw error;
    }
    
    console.log('✅ Teacher updated');
    return convertTeacherToFrontend(data);
  }

  static async removeTeacher(id: string): Promise<void> {
    console.log('🗑️ Removing teacher:', id);
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error removing teacher:', error);
      throw error;
    }
    
    console.log('✅ Teacher removed');
  }

  static async syncInitialTeachers(teachers: any[]): Promise<void> {
    console.log('🔄 Syncing initial teachers...');
    const dbTeachers = teachers.map(convertTeacherToDatabase);
    
    const { error } = await supabase
      .from('teachers')
      .upsert(dbTeachers, { onConflict: 'email' });
    
    if (error) {
      console.error('❌ Error syncing teachers:', error);
      throw error;
    }
    
    console.log(`✅ Synced ${teachers.length} teachers`);
  }

  static async clearTeachersCollection(): Promise<void> {
    console.log('🧹 Clearing teachers collection...');
    const { error } = await supabase
      .from('teachers')
      .delete()
      .neq('id', '0');
    
    if (error) {
      console.error('❌ Error clearing teachers:', error);
      throw error;
    }
    
    console.log('✅ Teachers collection cleared');
  }

  // ===================== LESSON PLAN METHODS =====================
  static async fetchLessonPlans(): Promise<any[]> {
    console.log('📚 Fetching lesson plans...');
    const { data, error } = await supabase
      .from('lesson_plans')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching lesson plans:', error);
      throw error;
    }
    
    console.log(`✅ Fetched ${data?.length || 0} lesson plans`);
    return (data || []).map(convertLessonPlanToFrontend);
  }

  static async submitLessonPlan(plan: any): Promise<any> {
    console.log('📝 Submitting lesson plan...');
    const dbPlan = convertLessonPlanToDatabase({
      ...plan,
      submittedAt: new Date().toISOString(),
      status: 'submitted'
    });
    
    const { data, error } = await supabase
      .from('lesson_plans')
      .insert([dbPlan])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error submitting lesson plan:', error);
      throw error;
    }
    
    console.log('✅ Lesson plan submitted:', data.id);
    return convertLessonPlanToFrontend(data);
  }

  // ===================== LOGIN LOGS =====================
  static async fetchLoginLogs(): Promise<any[]> {
    console.log('🔐 Fetching login logs...');
    const { data, error } = await supabase
      .from('login_logs')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching login logs:', error);
      throw error;
    }
    
    console.log(`✅ Fetched ${data?.length || 0} login logs`);
    return data || [];
  }

  static async logLoginActivity(user: { email: string; name: string }): Promise<void> {
    console.log('📝 Logging login activity:', user.email);
    const { error } = await supabase
      .from('login_logs')
      .insert([{
        email: user.email,
        name: user.name,
        timestamp: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('❌ Error logging login activity:', error);
    } else {
      console.log('✅ Login activity logged');
    }
  }

  // ===================== DATABASE STATUS =====================
  static async getDatabaseStatus(): Promise<{ seeded: boolean; teacherCount: number }> {
    console.log('📊 Checking database status...');
    try {
      const { count, error } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('❌ Error checking database status:', error);
        return { seeded: false, teacherCount: 0 };
      }
      
      const seeded = (count || 0) > 0;
      console.log(`📊 Database: ${seeded ? 'Seeded' : 'Not Seeded'} (${count} teachers)`);
      
      return { seeded, teacherCount: count || 0 };
    } catch (error) {
      console.error('❌ Error in getDatabaseStatus:', error);
      return { seeded: false, teacherCount: 0 };
    }
  }

  // ===================== RESUBMISSION REQUESTS =====================
  static async createResubmissionRequest(data: any): Promise<any> {
    console.log('📝 Creating resubmission request for:', data.teacher_name);
    
    const requestData = {
      teacher_id: data.teacher_id,
      teacher_name: data.teacher_name,
      teacher_email: data.teacher_email,
      week_range: data.week_range,
      classes: data.classes,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: request, error } = await supabase
      .from('resubmission_requests')
      .insert([requestData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating resubmission request:', error);
      throw error;
    }
    
    console.log('✅ Resubmission request created:', request.id);
    return request;
  }

  static async getResubmissionRequests(teacherEmail: string, weekRange?: string): Promise<any[]> {
    console.log('🔍 Fetching resubmission requests for:', teacherEmail);
    
    let query = supabase
      .from('resubmission_requests')
      .select('*')
      .eq('teacher_email', teacherEmail);
    
    if (weekRange) {
      query = query.eq('week_range', weekRange);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching resubmission requests:', error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} requests`);
    return data || [];
  }

  static async getAllResubmissionRequests(): Promise<any[]> {
    console.log('📋 Fetching all resubmission requests');
    
    const { data, error } = await supabase
      .from('resubmission_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching all resubmission requests:', error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} total requests`);
    return data || [];
  }

  static async updateResubmissionRequest(id: string, updates: any): Promise<any> {
    console.log('🔄 Updating resubmission request:', id);
    
    const { data, error } = await supabase
      .from('resubmission_requests')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating resubmission request:', error);
      throw error;
    }
    
    console.log('✅ Resubmission request updated');
    return data;
  }

  static async deleteTeacherSubmissions(teacherId: string, weekRange: string, classes: any[]): Promise<boolean> {
    console.log('🗑️ Deleting teacher submissions for:', teacherId, weekRange);
    
    // Extract class names from classes array
    const classNames = classes.map((c: any) => c.className);
    
    console.log('Deleting classes:', classNames);
    
    const { error } = await supabase
      .from('lesson_plans')
      .delete()
      .eq('teacher_id', teacherId)
      .eq('week_range', weekRange)
      .in('class_name', classNames);
    
    if (error) {
      console.error('❌ Error deleting teacher submissions:', error);
      throw error;
    }
    
    console.log('✅ Teacher submissions deleted');
    return true;
  }

  static async getTeacherSubmissionsForWeek(teacherId: string, weekRange: string): Promise<any[]> {
    console.log('📄 Fetching teacher submissions for week:', teacherId, weekRange);
    
    const { data, error } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('week_range', weekRange);
    
    if (error) {
      console.error('❌ Error fetching teacher submissions:', error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} submissions`);
    return (data || []).map(convertLessonPlanToFrontend);
  }

  // ===================== EMAIL LOGGING =====================
  static async logEmail(recipient: string, subject: string, type: string, status: string = 'sent'): Promise<void> {
    console.log('📧 Logging email:', { recipient, subject, type, status });
    
    const { error } = await supabase
      .from('email_logs')
      .insert([{
        recipient,
        subject,
        type,
        status,
        sent_at: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('❌ Error logging email:', error);
    } else {
      console.log('✅ Email logged successfully');
    }
  }

  // ===================== DEFALTER REMINDERS =====================
  static async getDefaultersForWeek(weekRange: string): Promise<any[]> {
    console.log('🔍 Finding defaulters for week:', weekRange);
    
    // Get all teachers
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('*');
    
    if (teachersError) throw teachersError;
    
    // Get submissions for this week
    const { data: submissions, error: subsError } = await supabase
      .from('lesson_plans')
      .select('teacher_id')
      .eq('week_range', weekRange);
    
    if (subsError) throw subsError;
    
    const submittedTeacherIds = submissions?.map(s => s.teacher_id) || [];
    const defaulters = teachers?.filter(t => !submittedTeacherIds.includes(t.email)) || [];
    
    console.log(`✅ Found ${defaulters.length} defaulters for ${weekRange}`);
    return defaulters.map(convertTeacherToFrontend);
  }

  // ===================== PDF GENERATION =====================
  static async getClassTeachers(): Promise<any[]> {
    console.log('👨‍🏫 Fetching class teachers');
    
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('is_class_teacher', true);
    
    if (error) {
      console.error('❌ Error fetching class teachers:', error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} class teachers`);
    return (data || []).map(convertTeacherToFrontend);
  }

  static async getLessonPlansForClass(className: string, section: string, weekRange: string): Promise<any[]> {
    console.log('📚 Fetching lesson plans for:', `${className}-${section}`, weekRange);
    
    const { data, error } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('class_name', className)
      .eq('section', section)
      .eq('week_range', weekRange);
    
    if (error) {
      console.error('❌ Error fetching lesson plans:', error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} lesson plans`);
    return (data || []).map(convertLessonPlanToFrontend);
  }

  // ===================== UTILITY METHODS =====================
  static async getTeacherAssignments(email: string): Promise<any[]> {
    console.log('📋 Fetching teacher assignments for:', email);
    
    const { data, error } = await supabase
      .from('teachers')
      .select('assignments')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('❌ Error fetching teacher assignments:', error);
      throw error;
    }
    
    return data?.assignments || [];
  }

  static async getClassTeacherOf(email: string): Promise<any | null> {
    console.log('🏫 Fetching class teacher info for:', email);
    
    const { data, error } = await supabase
      .from('teachers')
      .select('class_teacher_of')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('❌ Error fetching class teacher info:', error);
      return null;
    }
    
    return data?.class_teacher_of;
  }

  static async getRecentActivity(limit: number = 50): Promise<any[]> {
    console.log('📈 Fetching recent activity');
    
    const { data, error } = await supabase
      .from('login_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('❌ Error fetching recent activity:', error);
      throw error;
    }
    
    return data || [];
  }

  // ===================== WEEK RANGE UTILITIES =====================
  static async getCurrentWeekRange(): Promise<string> {
    const today = new Date();
    const startDate = formatDate(today.toString());
    
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 6);
    const endDateFormatted = formatDate(endDate.toString());
    
    return `${startDate} to ${endDateFormatted}`;
  }

  static async getNextWeekRange(): Promise<string> {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const startDate = formatDate(nextWeek.toString());
    
    const endDate = new Date(nextWeek);
    endDate.setDate(endDate.getDate() + 6);
    const endDateFormatted = formatDate(endDate.toString());
    
    return `${startDate} to ${endDateFormatted}`;
  }
}
