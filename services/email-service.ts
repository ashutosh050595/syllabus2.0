// services/email-service.ts
import { supabase } from './supabase';

export interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  // Send email using Supabase Edge Functions
  static async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      // We'll use Supabase's built-in email or connect to Resend/SendGrid
      // For now, we'll log and implement the real service later
      console.log('📧 Email would be sent:', {
        to: template.to,
        subject: template.subject
      });
      
      // In production, uncomment this:
      // const { data, error } = await supabase.functions.invoke('send-email', {
      //   body: template
      // });
      // return !error;
      
      return true; // Simulate success
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  // Template for submission confirmation
  static createSubmissionConfirmation(
    teacherName: string,
    teacherEmail: string,
    weekRange: string,
    submittedClasses: string[]
  ): EmailTemplate {
    const dateStr = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      to: teacherEmail,
      subject: `✅ Lesson Plan Submitted - ${weekRange}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
            .class-list { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            .button { background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Lesson Plan Submitted</h1>
              <p>Sacred Heart Management System</p>
            </div>
            <div class="content">
              <h3>Dear ${teacherName},</h3>
              <p>Your lesson plan has been successfully submitted on <strong>${dateStr}</strong> for the academic week:</p>
              
              <div class="class-list">
                <h4>📅 Week: ${weekRange}</h4>
                <h4>👨‍🏫 Submitted for:</h4>
                <ul>
                  ${submittedClasses.map(cls => `<li>${cls}</li>`).join('')}
                </ul>
              </div>
              
              <p><strong>Note:</strong> You cannot submit additional lesson plans for this week. If modifications are required, please use the "Request Modification" option.</p>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="https://syllabus2-0.vercel.app" class="button">View Submission</a>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email from Sacred Heart Management System.</p>
              <p>© ${new Date().getFullYear()} Sacred Heart School. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Dear ${teacherName},\n\nYour lesson plan for ${weekRange} has been submitted successfully for: ${submittedClasses.join(', ')}.\n\nYou cannot submit additional plans this week. Use "Request Modification" for changes.\n\nView at: https://syllabus2-0.vercel.app`
    };
  }

  // Template for resubmission request
  static createResubmissionRequest(
    teacherName: string,
    teacherEmail: string,
    weekRange: string,
    classes: string[],
    requestId: string
  ): EmailTemplate {
    return {
      to: [teacherEmail, 'admin@sacredheart.edu'], // Send to teacher and admin
      subject: `🔄 Resubmission Request - ${weekRange}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
            .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
            .action-buttons { text-align: center; margin: 30px 0; }
            .button { padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 0 10px; font-weight: bold; }
            .approve { background: #10b981; color: white; }
            .decline { background: #ef4444; color: white; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 Resubmission Request</h1>
              <p>Sacred Heart Management System</p>
            </div>
            
            <div class="content">
              <h3>Resubmission Request Submitted</h3>
              
              <div class="info-box">
                <p><strong>Teacher:</strong> ${teacherName}</p>
                <p><strong>Email:</strong> ${teacherEmail}</p>
                <p><strong>Week:</strong> ${weekRange}</p>
                <p><strong>Classes:</strong> ${classes.join(', ')}</p>
                <p><strong>Request ID:</strong> ${requestId}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <h4>Next Steps:</h4>
              <ul>
                <li>📧 Teacher has been notified that the request is pending approval</li>
                <li>👨‍🏫 Teacher can resubmit only after administrative approval</li>
                <li>⏳ Please review and take action below</li>
              </ul>
              
              <!-- For Admin -->
              <div class="action-buttons">
                <h4>Administrator Action Required:</h4>
                <a href="https://syllabus2-0.vercel.app/admin/approve/${requestId}" class="button approve">✅ Approve Request</a>
                <a href="https://syllabus2-0.vercel.app/admin/decline/${requestId}" class="button decline">❌ Decline Request</a>
              </div>
              
              <p><em>Note: Clicking the buttons will redirect to the admin dashboard for confirmation.</em></p>
            </div>
            
            <div class="footer">
              <p>This is an automated email from Sacred Heart Management System.</p>
              <p>Request ID: ${requestId} | Timestamp: ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  // Template for defaulter reminders
  static createDefaulterReminder(
    teacherName: string,
    teacherEmail: string,
    weekRange: string,
    dayOfWeek: string
  ): EmailTemplate {
    const urgency = dayOfWeek === 'Saturday' ? 'URGENT: ' : '';
    
    return {
      to: teacherEmail,
      subject: `${urgency}⏰ Reminder: Lesson Plan Submission - ${weekRange}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${dayOfWeek === 'Saturday' ? '#ef4444' : '#f59e0b'} 0%, ${dayOfWeek === 'Saturday' ? '#dc2626' : '#d97706'} 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; }
            .urgent { background: #fee2e2; border: 2px solid #ef4444; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .deadline { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .button { background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${dayOfWeek === 'Saturday' ? '🚨 FINAL REMINDER' : '⏰ Reminder'}</h1>
              <p>Lesson Plan Submission - ${weekRange}</p>
            </div>
            
            <div class="content">
              <h3>Dear ${teacherName},</h3>
              
              ${dayOfWeek === 'Saturday' ? `
              <div class="urgent">
                <h4>🚨 URGENT: FINAL DAY FOR SUBMISSION</h4>
                <p><strong>Deadline: Today, 7:00 PM</strong></p>
                <p>This is your final reminder. Please submit immediately to avoid being marked as a defaulter.</p>
              </div>
              ` : `
              <div class="deadline">
                <h4>📅 Submission Due: This Sunday, 11:59 PM</h4>
                <p>Week: ${weekRange}</p>
              </div>
              `}
              
              <p>Our records indicate that you haven't submitted your lesson plan for the upcoming week.</p>
              
              <h4>📋 Action Required:</h4>
              <ol>
                <li>Log in to the Sacred Heart Management Portal</li>
                <li>Navigate to "Weekly Lesson Plan Submission"</li>
                <li>Complete and submit your lesson plan</li>
                ${dayOfWeek === 'Saturday' ? '<li><strong>Submit before 7:00 PM today</strong></li>' : ''}
              </ol>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="https://syllabus2-0.vercel.app/login" class="button">Submit Now</a>
              </p>
              
              <p><strong>Note:</strong> Defaulters will be notified to the administration and may affect performance records.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated reminder from Sacred Heart Management System.</p>
              <p>Sent on: ${dayOfWeek} at 1:00 PM</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  // Template for resubmission approval
  static createResubmissionApproval(
    teacherName: string,
    teacherEmail: string,
    weekRange: string,
    approvalLink: string
  ): EmailTemplate {
    return {
      to: teacherEmail,
      subject: `✅ Resubmission Approved - ${weekRange}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
            .approved-box { background: #d1fae5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; }
            .deadline { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Request Approved</h1>
              <p>You can now resubmit your lesson plan</p>
            </div>
            
            <div class="content">
              <h3>Dear ${teacherName},</h3>
              
              <div class="approved-box">
                <h4>🎉 Your resubmission request has been approved!</h4>
                <p><strong>Week:</strong> ${weekRange}</p>
                <p><strong>Approved By:</strong> Administration</p>
                <p><strong>Approval Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <div class="deadline">
                <h4>📝 Resubmission Instructions:</h4>
                <ol>
                  <li>Click the button below to access the submission form</li>
                  <li>Your previous submission has been cleared</li>
                  <li>Fill out the form with updated content</li>
                  <li>Submit before the weekly deadline</li>
                </ol>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${approvalLink}" class="button">Resubmit Now</a>
              </p>
              
              <p><strong>Important:</strong> This approval is only valid for resubmission of the specified week. All other submission rules apply.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from Sacred Heart Management System.</p>
              <p>If you did not request this, please contact the administration immediately.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  // Template for resubmission rejection
  static createResubmissionRejection(
    teacherName: string,
    teacherEmail: string,
    weekRange: string,
    reason?: string
  ): EmailTemplate {
    return {
      to: teacherEmail,
      subject: `❌ Resubmission Request Declined - ${weekRange}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
            .declined-box { background: #fee2e2; border: 2px solid #ef4444; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .contact-box { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Request Declined</h1>
              <p>Resubmission not approved</p>
            </div>
            
            <div class="content">
              <h3>Dear ${teacherName},</h3>
              
              <div class="declined-box">
                <h4>Your resubmission request has been declined</h4>
                <p><strong>Week:</strong> ${weekRange}</p>
                <p><strong>Decision:</strong> Not Approved</p>
                <p><strong>Decision Time:</strong> ${new Date().toLocaleString()}</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              </div>
              
              <h4>📌 Important Information:</h4>
              <ul>
                <li>Your original submission remains as is</li>
                <li>No further modifications are permitted for this week</li>
                <li>Contact administration for exceptional circumstances</li>
                <li>Future submissions must follow the standard procedure</li>
              </ul>
              
              <div class="contact-box">
                <h4>📞 Need Clarification?</h4>
                <p>If you have questions about this decision, please contact:</p>
                <p><strong>Administration Office:</strong> admin@sacredheart.edu</p>
                <p><strong>Phone:</strong> +91-XXX-XXXXXXX</p>
              </div>
              
              <p><em>Note: This decision is final for the current academic week.</em></p>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from Sacred Heart Management System.</p>
              <p>© ${new Date().getFullYear()} Sacred Heart School</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  // Template for weekly PDF distribution
  static createWeeklyPDFNotification(
    teacherName: string,
    teacherEmail: string,
    weekRange: string,
    className: string,
    section: string,
    pdfUrl: string,
    missingTeachers: string[] = []
  ): EmailTemplate {
    return {
      to: teacherEmail,
      subject: `📋 Weekly Syllabus - ${className}-${section} - ${weekRange}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
            .pdf-box { background: white; border: 2px solid #8b5cf6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .missing-box { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .button { background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 10px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-item { text-align: center; padding: 15px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Weekly Syllabus Compiled</h1>
              <p>Class ${className}-${section} • ${weekRange}</p>
            </div>
            
            <div class="content">
              <h3>Dear Class Teacher ${teacherName},</h3>
              <p>The weekly syllabus for <strong>${className}-${section}</strong> has been compiled and is ready for distribution.</p>
              
              <div class="pdf-box">
                <h4>📄 Compiled Syllabus Document</h4>
                <p>All lesson plans for ${weekRange} have been merged into a single PDF.</p>
                <p style="margin: 25px 0;">
                  <a href="${pdfUrl}" class="button" style="background: #ef4444;">⬇️ Download PDF</a>
                  <a href="https://syllabus2-0.vercel.app/print/${className}/${section}" class="button">🖨️ Print View</a>
                </p>
                <p><em>File: ${className}_${section}_${weekRange.replace(/ /g, '_')}.pdf</em></p>
              </div>
              
              ${missingTeachers.length > 0 ? `
              <div class="missing-box">
                <h4>⚠️ Missing Submissions:</h4>
                <p>The following teachers have not submitted lesson plans:</p>
                <ul>
                  ${missingTeachers.map(teacher => `<li>${teacher}</li>`).join('')}
                </ul>
                <p><em>Their sections show "Lesson Plan Not Submitted"</em></p>
              </div>
              ` : `
              <div class="stats">
                <div class="stat-item">
                  <h3>✅</h3>
                  <p>All Plans Submitted</p>
                </div>
                <div class="stat-item">
                  <h3>📅</h3>
                  <p>Week Complete</p>
                </div>
              </div>
              `}
              
              <h4>📋 Distribution Instructions:</h4>
              <ol>
                <li>Download the PDF file</li>
                <li>Share with relevant department heads</li>
                <li>Display in staff notice board</li>
                <li>Archive for records</li>
              </ol>
              
              <p><strong>Note:</strong> This is an automated weekly compilation generated every Saturday at 8:00 PM.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated email from Sacred Heart Management System.</p>
              <p>Generated: ${new Date().toLocaleString()} • Class: ${className}-${section}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }
}
