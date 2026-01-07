import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0"

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    
    // Run on Thursday, Friday, Saturday at 1 PM
    const dayOfWeek = new Date().getDay()
    if (![4, 5, 6].includes(dayOfWeek)) {
      return new Response('Not scheduled day', { status: 200 })
    }
    
    // Get upcoming Monday
    const today = new Date()
    const day = today.getDay()
    const diff = day === 0 ? 1 : (8 - day) % 7
    const upcomingMonday = new Date(today)
    upcomingMonday.setDate(today.getDate() + diff)
    upcomingMonday.setHours(0, 0, 0, 0)
    
    // Get teachers and lesson plans
    const [{ data: teachers }, { data: lessonPlans }] = await Promise.all([
      supabase.from('teachers').select('*'),
      supabase.from('lesson_plans').select('*')
        .eq('week_starting', upcomingMonday.toISOString())
    ])
    
    const submittedTeachers = new Set(lessonPlans?.map(p => p.teacher_id) || [])
    const defaulters = teachers?.filter(t => !submittedTeachers.has(t.email)) || []
    
    // Send emails
    const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dayOfWeek]
    const weekRange = formatWeekRange(upcomingMonday)
    
    for (const teacher of defaulters.slice(0, 50)) { // Limit to 50 per run
      const email = {
        from: 'Sacred Heart <portal@sacredheart.edu>',
        to: teacher.email,
        subject: `${dayOfWeek === 6 ? 'URGENT: ' : ''}Reminder: Lesson Plan Submission - ${weekRange}`,
        html: createReminderEmail(teacher.name, weekRange, dayName)
      }
      
      await resend.emails.send(email)
      await new Promise(resolve => setTimeout(resolve, 100)) // Rate limiting
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: defaulters.length,
        day: dayName 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function formatWeekRange(date: Date): string {
  const start = new Date(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${start.getDate().toString().padStart(2, '0')}-${(start.getMonth() + 1).toString().padStart(2, '0')}-${start.getFullYear()} to ${end.getDate().toString().padStart(2, '0')}-${(end.getMonth() + 1).toString().padStart(2, '0')}-${end.getFullYear()}`
}

function createReminderEmail(name: string, weekRange: string, dayName: string): string {
  return `... email HTML ...`
}
