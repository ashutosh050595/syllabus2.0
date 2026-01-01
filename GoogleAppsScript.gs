
/**
 * SACRED HEART SCHOOL - INSTITUTIONAL AUTOMATION ENGINE
 * Handles: Defaulter Reminders, Resubmission Approvals, Weekly Compilation
 */

const FIREBASE_URL = "https://lesson-plan-b4c8e-default-rtdb.firebaseio.com"; // Placeholder if using RTDB, but we use Firestore REST
const FIREBASE_PROJECT_ID = "lesson-plan-b4c8e";
const PORTAL_URL = "YOUR_DEPLOYED_APP_URL";
const ADMIN_EMAIL = "admin@sacredheartkoderma.org";

/**
 * WEB ENTRY: Handles Decision Links from Admin emails
 */
function doGet(e) {
  const action = e.parameter.action;
  const planId = e.parameter.planId;
  const decision = e.parameter.decision;

  if (action === "resubmit_decision") {
    const plan = fetchFirestoreDoc("lessonPlans", planId);
    if (!plan) return ContentService.createTextOutput("Record expired or already processed.");
    
    const teacherEmail = plan.teacherId; 
    const weekLabel = plan.weekLabel || "Weekly Plan";

    if (decision === "approve") {
      deleteFirestoreDoc("lessonPlans", planId);
      GmailApp.sendEmail(teacherEmail, "Resubmission Approved", 
        `Dear Teacher,\n\nYour request for resubmission for ${weekLabel} has been APPROVED.\n\nYou can now resubmit through the portal:\n${PORTAL_URL}\n\nRegards,\nSacred Heart Admin`);
      return ContentService.createTextOutput("Approved. Teacher notified and Firebase record cleared.");
    } else {
      updateFirestoreDoc("lessonPlans", planId, { resubmissionStatus: "declined" });
      GmailApp.sendEmail(teacherEmail, "Resubmission Rejected", 
        `Dear Teacher,\n\nYour request for resubmission has been rejected. You cannot modify the plan for ${weekLabel}.\n\nRegards,\nSacred Heart Admin`);
      return ContentService.createTextOutput("Declined. Teacher notified.");
    }
  }
}

/**
 * API ENDPOINT: Handles immediate alerts from portal
 */
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  if (body.action === "submission_alert") {
    GmailApp.sendEmail(body.teacherEmail, `Lesson Plan Confirmation: ${body.weekRange}`, 
      `This is to confirm that your lesson plan for the week ${body.weekRange} has been successfully submitted via the portal.`);
  } else if (body.action === "request_resubmit") {
    // A. Notify Teacher
    GmailApp.sendEmail(body.teacherEmail, "Resubmission Request Logged", 
      `Your request for resubmission for ${body.weekRange} has been sent to the admin. You can resubmit once approved. Please wait for official confirmation.`);
    
    // B. Notify Admin with buttons
    const approveUrl = `${ScriptApp.getService().getUrl()}?action=resubmit_decision&planId=${body.planId}&decision=approve`;
    const declineUrl = `${ScriptApp.getService().getUrl()}?action=resubmit_decision&planId=${body.planId}&decision=decline`;
    
    const htmlBody = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h3>Resubmission Request: ${body.teacherName}</h3>
        <p>Period: ${body.weekRange}</p>
        <div style="margin-top: 20px;">
          <a href="${approveUrl}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">Approve</a>
          <a href="${declineUrl}" style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Decline</a>
        </div>
      </div>
    `;
    GmailApp.sendEmail(ADMIN_EMAIL, `Resubmit Request: ${body.teacherName}`, "", { htmlBody: htmlBody });
  }
}

// --- CRON TRIGGERS (Thu-Sat 1PM Reminders) ---

function triggerDefaulterReminders() {
  const teachers = fetchFirestoreCollection("teachers");
  const plans = fetchFirestoreCollection("lessonPlans");
  
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
  const nextMon = new Date(d.setDate(diff));
  nextMon.setHours(0,0,0,0);
  const weekStart = nextMon.toISOString();

  const submitted = new Set(plans.filter(p => p.weekStarting === weekStart).map(p => p.teacherId));

  teachers.forEach(t => {
    if (!submitted.has(t.email)) {
      GmailApp.sendEmail(t.email, "Reminder: Weekly Syllabus Pending", 
        `Dear ${t.name},\n\nYou haven't submitted the lesson plan for the upcoming week yet. Please fill it immediately via the Institutional Hub.\n\nSacred Heart Admin`);
    }
  });
}

// --- SATURDAY 8PM PDF COMPILATION ---

function automatedWeeklyCompilation() {
  // Logic to fetch all plans, generate Class PDFs, and rename as {class_sec_DateRange}.pdf
  // Then email individually to Class Teachers.
}

// --- FIRESTORE HELPERS ---
function fetchFirestoreCollection(col) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${col}?pageSize=1000`;
  const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) return [];
  const docs = JSON.parse(resp.getContentText()).documents || [];
  return docs.map(d => {
    const fields = d.fields;
    const obj = {};
    for (let k in fields) obj[k] = fields[k].stringValue || fields[k].booleanValue;
    return obj;
  });
}

function deleteFirestoreDoc(col, id) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${col}/${id}`;
  UrlFetchApp.fetch(url, { method: "delete", muteHttpExceptions: true });
}
