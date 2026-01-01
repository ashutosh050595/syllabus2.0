
/**
 * SACRED HEART SCHOOL - FIREBASE EMAIL & AUTOMATION WORKER
 * Deployed as a Web App to handle institutional notifications.
 */

const FIREBASE_PROJECT_ID = "lesson-plan-b4c8e";
const APP_PORTAL_URL = "YOUR_APP_DEPLOY_URL"; // Portal address for resubmission
const ADMIN_EMAIL = "admin@sacredheartkoderma.org";

/**
 * WEB INTERFACE: Handles Resubmission Decision Links
 */
function doGet(e) {
  const action = e.parameter.action;
  const planId = e.parameter.planId;
  const decision = e.parameter.decision;

  if (action === "resubmit_decision") {
    return processResubmission(planId, decision);
  }
  
  return ContentService.createTextOutput("Invalid Action");
}

/**
 * API ENDPOINT: Handles immediate post-submission alerts and resubmission requests
 */
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;

  if (action === "submission_alert") {
    sendSubmissionAlert(body.teacherEmail, body.weekRange);
  } else if (action === "request_resubmit") {
    handleResubmissionRequest(body.teacherName, body.teacherEmail, body.planId, body.weekRange);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "processed" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- EMAIL LOGIC ---

function sendSubmissionAlert(email, weekRange) {
  const subject = `Lesson Plan Confirmation: Week ${weekRange}`;
  const body = `Dear Teacher,\n\nYour lesson plan for the period ${weekRange} has been successfully submitted via the portal.\n\nInstitutional Hub,\nSacred Heart Koderma`;
  GmailApp.sendEmail(email, subject, body);
}

function handleResubmissionRequest(name, email, planId, weekRange) {
  // A. Notify Teacher
  GmailApp.sendEmail(email, "Resubmission Request Received", 
    `Dear ${name},\n\nYour request for resubmission for the week ${weekRange} has been sent to the admin. You can resubmit once the admin approves it. Please wait for the official approval.\n\nRegards,\nSacred Heart Admin`);

  // B. Notify Admin with decision buttons
  const approveUrl = `${ScriptApp.getService().getUrl()}?action=resubmit_decision&planId=${planId}&decision=approve`;
  const declineUrl = `${ScriptApp.getService().getUrl()}?action=resubmit_decision&planId=${planId}&decision=decline`;
  
  const htmlBody = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
      <h3 style="color: #4f46e5;">Resubmission Approval Required</h3>
      <p>Teacher <b>${name}</b> has requested to resubmit their lesson plan for <b>${weekRange}</b>.</p>
      <p>Please select an action below:</p>
      <div style="margin-top: 30px;">
        <a href="${approveUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 15px;">Approve Request</a>
        <a href="${declineUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Decline Request</a>
      </div>
    </div>
  `;
  
  GmailApp.sendEmail(ADMIN_EMAIL, `Resubmission Request: ${name}`, "", { htmlBody: htmlBody });
}

function processResubmission(planId, decision) {
  // 1. Fetch Plan details from Firebase REST API
  const plan = getFirestoreDoc("lessonPlans", planId);
  if (!plan) return ContentService.createTextOutput("Error: Plan record not found.");

  const teacherEmail = plan.teacherId; // Adjusted if your ID is email
  const weekLabel = plan.weekLabel || "Selected Week";

  if (decision === "approve") {
    // A. Delete from Firebase
    deleteFirestoreDoc("lessonPlans", planId);
    
    // B. Email Teacher with link
    GmailApp.sendEmail(teacherEmail, "Resubmission Approved", 
      `Dear Teacher,\n\nYour request for resubmission has been approved. You can now resubmit your lesson plan through the link below:\n\n${APP_PORTAL_URL}\n\nRegards,\nSacred Heart Admin`);
    
    return ContentService.createTextOutput("Resubmission APPROVED. Teacher notified and record cleared from Firebase.");
  } else {
    // A. Mark as Declined in Firebase (Optional, but good for UI)
    updateFirestoreDoc("lessonPlans", planId, { resubmissionStatus: "declined" });

    // B. Email Teacher rejection
    GmailApp.sendEmail(teacherEmail, "Resubmission Request Rejected", 
      `Dear Teacher,\n\nYour request for resubmission has been rejected. You cannot resubmit the lesson plan for the period ${weekLabel}.\n\nRegards,\nSacred Heart Admin`);
    
    return ContentService.createTextOutput("Resubmission DECLINED. Teacher notified.");
  }
}

// --- AUTOMATED REMINDERS (THU, FRI, SAT 1 PM) ---

function triggerDefaulterReminders() {
  const teachers = getFirestoreCollection("teachers");
  const plans = getFirestoreCollection("lessonPlans");
  
  // Calculate Target Week Starting Date (Next Monday)
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
  const nextMon = new Date(d.setDate(diff));
  nextMon.setHours(0,0,0,0);
  const targetWeek = nextMon.toISOString();

  const submittedTeacherIds = new Set(plans
    .filter(p => p.weekStarting === targetWeek)
    .map(p => p.teacherId));

  teachers.forEach(t => {
    if (!submittedTeacherIds.has(t.id)) {
      GmailApp.sendEmail(t.email, "Reminder: Lesson Plan Pending", 
        `Dear ${t.name},\n\nInstitutional records show that you haven't submitted the lesson plan for the upcoming week yet. Please fill it immediately via the portal.\n\nRegards,\nSacred Heart Admin`);
    }
  });
}

// --- SATURDAY COMPILATION (SAT 8 PM) ---

function automatedWeeklyCompilation() {
  const teachers = getFirestoreCollection("teachers");
  const plans = getFirestoreCollection("lessonPlans");
  
  const d = new Date();
  const diff = d.getDate() + (d.getDay() === 0 ? 1 : 8 - d.getDay());
  const nextMon = new Date(d.setDate(diff));
  const weekLabel = `${nextMon.getDate()}-${nextMon.getMonth()+1}-${nextMon.getFullYear()}`;

  // Find all Class Teachers
  const classTeachers = teachers.filter(t => t.isClassTeacher);

  classTeachers.forEach(ct => {
    const className = ct.classTeacherOf.className;
    const section = ct.classTeacherOf.section;
    const fileName = `${className}_${section}_${weekLabel}`;
    
    // Generate PDF (Simplified HTML to PDF)
    const html = generateCompilationHtml(className, section, plans, teachers, nextMon);
    const pdfBlob = HtmlService.createHtmlOutput(html).getAs('application/pdf').setName(`${fileName}.pdf`);

    GmailApp.sendEmail(ct.email, `Weekly Compilation: ${className}-${section} (${weekLabel})`, 
      `Dear ${ct.name},\n\nPlease find attached the weekly syllabus digest for your class ${className}-${section}.\n\nRegards,\nSacred Heart Admin`, 
      { attachments: [pdfBlob] });
  });
}

// --- FIRESTORE REST HELPERS ---

function getFirestoreCollection(colName) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${colName}?pageSize=1000`;
  const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) return [];
  const data = JSON.parse(resp.getContentText());
  return (data.documents || []).map(doc => {
    const fields = doc.fields;
    const obj = {};
    for (let key in fields) {
      obj[key] = fields[key].stringValue || fields[key].booleanValue || fields[key].integerValue;
    }
    return obj;
  });
}

function getFirestoreDoc(col, id) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${col}/${id}`;
  const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) return null;
  const data = JSON.parse(resp.getContentText());
  const fields = data.fields;
  const obj = {};
  for (let key in fields) obj[key] = fields[key].stringValue || fields[key].booleanValue || fields[key].integerValue;
  return obj;
}

function deleteFirestoreDoc(col, id) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${col}/${id}`;
  UrlFetchApp.fetch(url, { method: "delete", muteHttpExceptions: true });
}

function updateFirestoreDoc(col, id, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${col}/${id}?updateMask.fieldPaths=resubmissionStatus`;
  // Simple partial update via REST logic...
}

function generateCompilationHtml(cls, sec, plans, teachers, monday) {
  // Logic to build a basic table matching your PrintableReport.tsx structure...
  return "<html><body><h1>Class Compilation</h1></body></html>";
}

/**
 * TRIGGER SETUP: Run this once manually
 */
function setupInstitutionalTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));

  // Reminders: Thu, Fri, Sat @ 1 PM
  [ScriptApp.WeekDay.THURSDAY, ScriptApp.WeekDay.FRIDAY, ScriptApp.WeekDay.SATURDAY].forEach(day => {
    ScriptApp.newTrigger('triggerDefaulterReminders').timeBased().onWeekDay(day).atHour(13).create();
  });

  // Compilation: Sat @ 8 PM
  ScriptApp.newTrigger('automatedWeeklyCompilation').timeBased().onWeekDay(ScriptApp.WeekDay.SATURDAY).atHour(20).create();
}
