import { supabase } from './supabase';

export interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: {
    filename: string;
    content: string;
    content_type: string;
    disposition?: string;
  }[];
}

export class EmailService {
  static async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: template
      });
      
      if (error) {
        console.error('Email sending failed:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  static createSubmissionConfirmation(
    teacherName: string,
    teacherEmail: string,
    weekRange: string,
    submittedClasses: string[]
  ): EmailTemplate {
    return {
      to: teacherEmail,
      subject: `✅ Lesson Plan Submitted - ${weekRange}`,
      html: this.getSubmissionConfirmationHTML(teacherName, weekRange, submittedClasses),
      text: `Dear ${teacherName},\n\nYour lesson plan for ${weekRange} has been submitted successfully.\n\nSubmitted classes: ${submittedClasses.join(', ')}\n\nThis is an automated email from Sacred Heart Management System.`
    };
  }

  static createResubmissionRequestTeacher(
    teacherName: string,
    teacherEmail: string,
    weekRange: string,
    classes: string[]
  ): EmailTemplate {
    return {
      to: teacherEmail,
      subject: `🔄 Resubmission Request Submitted - ${weekRange}`,
      html: this.getResubmissionRequestTeacherHTML(teacherName, weekRange, classes),
      text: `Dear ${teacherName},\n\nYour resubmission request for ${weekRange} has been submitted.\n\nClasses: ${classes.join(', ')}\n\nStatus: Pending admin approval. You will be notified when approved.\n\nThis is an automated email from Sacred Heart Management System.`
    };
  }

  static createResubmissionRequestAdmin(
    teacherName: string,
    teacherEmail: string,
    weekRange: string,
    classes: string[],
    requestId: string
  ): EmailTemplate {
    return {
      to: 'admin@sacredheartkoderma.org',
      subject: `🔄 Resubmission Request - ${teacherName} - ${weekRange}`,
      html: this.getResubmissionRequestAdminHTML(teacherName, teacherEmail, weekRange, classes, requestId),
      text: `Resubmission Request\n\nTeacher: ${teacherName} (${teacherEmail})\nWeek: ${weekRange}\nClasses: ${classes.join(', ')}\nRequest ID: ${requestId}\n\nApprove/Decline in admin dashboard.`
    };
  }

  static createResubmissionApproval(
    teacherName: string,
    teacherEmail: string,
    weekRange: string,
    classes: string[]
  ): EmailTemplate {
    return {
      to: teacherEmail,
      subject: `✅ Resubmission Approved - ${weekRange}`,
      html: this.getResubmissionApprovalHTML(teacherName, weekRange, classes),
      text: `Dear ${teacherName},\n\nYour resubmission request for ${weekRange} has been approved.\n\nClasses: ${classes.join(', ')}\n\nYou can now resubmit your lesson plan through the portal.\n\nLogin: https://syllabus2-0.vercel.app\n\nThis is an automated email from Sacred Heart Management System.`
    };
  }

  static createResubmissionRejection(
    teacherName: string,
    teacherEmail: string,
    weekRange: string,
    classes: string[],
    reason?: string
  ): EmailTemplate {
    return {
      to: teacherEmail,
      subject: `❌ Resubmission Rejected - ${weekRange}`,
      html: this.getResubmissionRejectionHTML(teacherName, weekRange, classes, reason),
      text: `Dear ${teacherName},\n\nYour resubmission request for ${weekRange} has been rejected.\n\nClasses: ${classes.join(', ')}\n${reason ? `Reason: ${reason}\n` : ''}\nYou cannot resubmit the lesson plan for this week.\n\nThis is an automated email from Sacred Heart Management System.`
    };
  }

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
      html: this.getDefaulterReminderHTML(teacherName, weekRange, dayOfWeek),
      text: `Dear ${teacherName},\n\nThis is a reminder that you haven't submitted your lesson plan for ${weekRange}.\n\nPlease submit immediately.\n\nLogin: https://syllabus2-0.vercel.app\n\nThis is an automated reminder from Sacred Heart Management System.`
    };
  }

  static createWeeklyPDFNotification(
    teacherName: string,
    teacherEmail: string,
    weekRange: string,
    className: string,
    section: string,
    missingTeachers: string[] = []
  ): EmailTemplate {
    const hasMissing = missingTeachers.length > 0;
    
    return {
      to: teacherEmail,
      subject: `📋 Weekly Syllabus - ${className}-${section} - ${weekRange}`,
      html: this.getWeeklyPDFNotificationHTML(teacherName, weekRange, className, section, missingTeachers),
      text: `Dear ${teacherName},\n\nWeekly syllabus for ${className}-${section} (${weekRange}) has been compiled.\n\n${hasMissing ? `Missing submissions from: ${missingTeachers.join(', ')}\n` : 'All lesson plans submitted.'}\n\nPlease check the portal for details.\n\nThis is an automated email from Sacred Heart Management System.`
    };
  }

  // ✅ NEW METHOD: Auto-send weekly PDF with attachment
  static createWeeklyPDFAutoSend(
    teacherName: string,
    teacherEmail: string,
    weekRange: string,
    className: string,
    section: string,
    pdfBase64: string
  ): EmailTemplate {
    return {
      to: teacherEmail,
      subject: `📋 Weekly Syllabus - ${className}-${section} - ${weekRange}`,
      html: this.getWeeklyPDFAutoSendHTML(teacherName, weekRange, className, section),
      attachments: [{
        filename: `Weekly_Syllabus_${className}_${section}_${weekRange.replace(/ /g, '_')}.pdf`,
        content: pdfBase64,
        content_type: 'application/pdf',
        disposition: 'attachment'
      }]
    };
  }

  private static getSubmissionConfirmationHTML(teacherName: string, weekRange: string, submittedClasses: string[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .info-box { background: white; border-left: 4px solid #4f46e5; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Lesson Plan Submitted</h1>
            <p>Sacred Heart School Management System</p>
          </div>
          <div class="content">
            <p>Dear <strong>${teacherName}</strong>,</p>
            
            <p>Your lesson plan for the week <strong>${weekRange}</strong> has been successfully submitted.</p>
            
            <div class="info-box">
              <p><strong>📅 Week:</strong> ${weekRange}</p>
              <p><strong>👨‍🏫 Submitted for:</strong></p>
              <ul>
                ${submittedClasses.map(cls => `<li>${cls}</li>`).join('')}
              </ul>
              <p><strong>📝 Status:</strong> Submitted</p>
            </div>
            
            <p><strong>Note:</strong> You cannot submit additional lesson plans for this week. If modifications are required, please use the "Request Modification" option.</p>
            
            <p>Best regards,<br>Sacred Heart School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Sacred Heart Management System.</p>
            <p>© ${new Date().getFullYear()} Sacred Heart School. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getResubmissionRequestTeacherHTML(teacherName: string, weekRange: string, classes: string[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .info-box { background: white; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Resubmission Request Submitted</h1>
            <p>Sacred Heart School Management System</p>
          </div>
          <div class="content">
            <p>Dear <strong>${teacherName}</strong>,</p>
            
            <p>Your request for lesson plan modification has been submitted successfully.</p>
            
            <div class="info-box">
              <p><strong>📅 Week:</strong> ${weekRange}</p>
              <p><strong>👨‍🏫 Classes:</strong></p>
              <ul>
                ${classes.map(cls => `<li>${cls}</li>`).join('')}
              </ul>
              <p><strong>📝 Status:</strong> Pending Admin Approval</p>
            </div>
            
            <p><strong>Important:</strong> You can resubmit only after the admin approves your request. You will receive an email notification once approved.</p>
            
            <p>Best regards,<br>Sacred Heart School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Sacred Heart Management System.</p>
            <p>© ${new Date().getFullYear()} Sacred Heart School. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getResubmissionRequestAdminHTML(teacherName: string, teacherEmail: string, weekRange: string, classes: string[], requestId: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .info-box { background: white; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
          .action-box { background: #fef3c7; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
          .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Resubmission Request</h1>
            <p>Sacred Heart School Management System</p>
          </div>
          <div class="content">
            <p><strong>Teacher ${teacherName}</strong> has requested to modify their submitted lesson plan.</p>
            
            <div class="info-box">
              <p><strong>👨‍🏫 Teacher:</strong> ${teacherName}</p>
              <p><strong>📧 Email:</strong> ${teacherEmail}</p>
              <p><strong>📅 Week:</strong> ${weekRange}</p>
              <p><strong>📚 Classes:</strong></p>
              <ul>
                ${classes.map(cls => `<li>${cls}</li>`).join('')}
              </ul>
              <p><strong>🆔 Request ID:</strong> ${requestId}</p>
            </div>
            
            <div class="action-box">
              <h3>Action Required</h3>
              <p>Please review and take action in the admin dashboard:</p>
              <p>
                <a href="https://syllabus2-0.vercel.app/admin" class="button">Go to Admin Dashboard</a>
              </p>
              <p><small>Login required: admin@sacredheartkoderma.org</small></p>
            </div>
            
            <p>Best regards,<br>Sacred Heart School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Sacred Heart Management System.</p>
            <p>Request ID: ${requestId} | ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getResubmissionApprovalHTML(teacherName: string, weekRange: string, classes: string[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .info-box { background: white; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; }
          .action-box { background: #d1fae5; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
          .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Resubmission Approved</h1>
            <p>Sacred Heart School Management System</p>
          </div>
          <div class="content">
            <p>Dear <strong>${teacherName}</strong>,</p>
            
            <p>Your resubmission request has been approved by the administration.</p>
            
            <div class="info-box">
              <p><strong>📅 Week:</strong> ${weekRange}</p>
              <p><strong>👨‍🏫 Classes:</strong></p>
              <ul>
                ${classes.map(cls => `<li>${cls}</li>`).join('')}
              </ul>
              <p><strong>✅ Status:</strong> Approved</p>
              <p><strong>⏰ Note:</strong> Previous submission has been deleted</p>
            </div>
            
            <div class="action-box">
              <h3>You can now resubmit</h3>
              <p>Click the link below to resubmit your lesson plan:</p>
              <p>
                <a href="https://syllabus2-0.vercel.app" class="button">Resubmit Lesson Plan</a>
              </p>
            </div>
            
            <p>Best regards,<br>Sacred Heart School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Sacred Heart Management System.</p>
            <p>© ${new Date().getFullYear()} Sacred Heart School. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getResubmissionRejectionHTML(teacherName: string, weekRange: string, classes: string[], reason?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .info-box { background: white; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
          .warning-box { background: #fee2e2; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Resubmission Rejected</h1>
            <p>Sacred Heart School Management System</p>
          </div>
          <div class="content">
            <p>Dear <strong>${teacherName}</strong>,</p>
            
            <p>Your resubmission request has been rejected by the administration.</p>
            
            <div class="info-box">
              <p><strong>📅 Week:</strong> ${weekRange}</p>
              <p><strong>👨‍🏫 Classes:</strong></p>
              <ul>
                ${classes.map(cls => `<li>${cls}</li>`).join('')}
              </ul>
              <p><strong>❌ Status:</strong> Rejected</p>
              ${reason ? `<p><strong>📝 Reason:</strong> ${reason}</p>` : ''}
            </div>
            
            <div class="warning-box">
              <h3>Important Notice</h3>
              <p>You <strong>cannot resubmit</strong> the lesson plan for this week.</p>
              <p>Your original submission remains as the final version.</p>
            </div>
            
            <p>For any queries, contact: admin@sacredheartkoderma.org</p>
            
            <p>Best regards,<br>Sacred Heart School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Sacred Heart Management System.</p>
            <p>© ${new Date().getFullYear()} Sacred Heart School. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getDefaulterReminderHTML(teacherName: string, weekRange: string, dayOfWeek: string): string {
    const urgency = dayOfWeek === 'Saturday' ? 'URGENT: ' : '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${dayOfWeek === 'Saturday' ? '#ef4444' : '#f59e0b'}; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .warning-box { background: ${dayOfWeek === 'Saturday' ? '#fee2e2' : '#fef3c7'}; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid ${dayOfWeek === 'Saturday' ? '#ef4444' : '#f59e0b'}; }
          .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${urgency}⏰ Lesson Plan Reminder</h1>
            <p>Sacred Heart School Management System</p>
          </div>
          <div class="content">
            <p>Dear <strong>${teacherName}</strong>,</p>
            
            <div class="warning-box">
              <h3>${dayOfWeek === 'Saturday' ? '🚨 FINAL REMINDER' : 'Reminder'}</h3>
              <p>You haven't submitted your lesson plan for the upcoming week:</p>
              <p><strong>📅 Week:</strong> ${weekRange}</p>
              ${dayOfWeek === 'Saturday' ? '<p><strong>⏰ Deadline:</strong> Today, 7:00 PM</p>' : ''}
            </div>
            
            <p>Please submit your lesson plan immediately to avoid being marked as a defaulter.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="https://syllabus2-0.vercel.app" class="button">Submit Now</a>
            </p>
            
            <p><strong>Note:</strong> Defaulters will be notified to the administration.</p>
            
            <p>Best regards,<br>Sacred Heart School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated reminder from Sacred Heart Management System.</p>
            <p>Sent on: ${dayOfWeek} at 1:00 PM</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getWeeklyPDFNotificationHTML(teacherName: string, weekRange: string, className: string, section: string, missingTeachers: string[]): string {
    const hasMissing = missingTeachers.length > 0;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .info-box { background: white; border-left: 4px solid #8b5cf6; padding: 15px; margin: 15px 0; }
          .missing-box { background: #fef3c7; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Weekly Syllabus Compiled</h1>
            <p>Sacred Heart School Management System</p>
          </div>
          <div class="content">
            <p>Dear Class Teacher <strong>${teacherName}</strong>,</p>
            
            <p>The weekly syllabus for your class has been compiled:</p>
            
            <div class="info-box">
              <p><strong>🏫 Class:</strong> ${className}-${section}</p>
              <p><strong>📅 Week:</strong> ${weekRange}</p>
              <p><strong>📄 Document:</strong> ${className}_${section}_${weekRange.replace(/ /g, '_')}.pdf</p>
              <p><strong>⏰ Generated:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            ${hasMissing ? `
            <div class="missing-box">
              <h4>⚠️ Missing Submissions:</h4>
              <p>The following teachers have not submitted lesson plans:</p>
              <ul>
                ${missingTeachers.map(teacher => `<li>${teacher}</li>`).join('')}
              </ul>
              <p><em>Their sections show "Lesson Plan Not Submitted" in the PDF.</em></p>
            </div>
            ` : `
            <p>✅ All lesson plans have been submitted for this class.</p>
            `}
            
            <p>The compiled PDF is available in the admin portal for download and distribution.</p>
            
            <p>Best regards,<br>Sacred Heart School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Sacred Heart Management System.</p>
            <p>Generated every Saturday at 8:00 PM</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ✅ NEW HTML Template for PDF Auto-send
  private static getWeeklyPDFAutoSendHTML(
    teacherName: string,
    weekRange: string,
    className: string,
    section: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .info-box { background: white; border-left: 4px solid #4f46e5; padding: 15px; margin: 15px 0; }
          .note-box { background: #e0f2fe; padding: 15px; margin: 15px 0; border-radius: 8px; border: 1px solid #7dd3fc; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Weekly Syllabus Attached</h1>
            <p>Sacred Heart School - Auto Generated</p>
          </div>
          <div class="content">
            <p>Dear Class Teacher <strong>${teacherName}</strong>,</p>
            
            <p>The weekly syllabus for your class has been <strong>automatically compiled</strong> and is attached to this email.</p>
            
            <div class="info-box">
              <p><strong>🏫 Class:</strong> ${className}-${section}</p>
              <p><strong>📅 Week:</strong> ${weekRange}</p>
              <p><strong>📄 Document:</strong> Weekly_Syllabus_${className}_${section}_${weekRange.replace(/ /g, '_')}.pdf</p>
              <p><strong>⏰ Generated:</strong> Saturday, 8:00 PM (Auto)</p>
            </div>
            
            <div class="note-box">
              <h4>📌 Important:</h4>
              <p>• This is an <strong>automated email</strong> sent every Saturday at 8:00 PM</p>
              <p>• The PDF is generated <strong>exactly as per the standard format</strong> of Sacred Heart School</p>
              <p>• Layout, orientation, and structure match the official template</p>
            </div>
            
            <p><strong>Note:</strong> The attached PDF contains the complete weekly lesson plan as submitted by all subject teachers.</p>
            
            <p>Best regards,<br>Sacred Heart School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated email generated every Saturday at 8:00 PM.</p>
            <p>© ${new Date().getFullYear()} Sacred Heart School. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
