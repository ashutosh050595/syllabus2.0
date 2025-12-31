
/**
 * SACRED HEART SCHOOL - AUTOMATED DISPATCH ENGINE
 * -----------------------------------------------
 * This script handles PDF generation and Email distribution.
 */

const DB_SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';

function getDb() {
  return SpreadsheetApp.openById(DB_SHEET_ID);
}

function getOrCreateSheet(name) {
  const ss = getDb();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === 'Teachers') sheet.appendRow(['id', 'name', 'email', 'phone', 'data']);
    if (name === 'LessonPlans') sheet.appendRow(['id', 'teacherId', 'teacherName', 'className', 'section', 'subject', 'dateFrom', 'dateTo', 'chapter', 'topics', 'homework', 'weekStarting', 'submittedAt']);
  }
  return sheet;
}

// --- NEW: PDF GENERATION ENGINE ---

function generateClassReportHtml(className, weekStarting) {
  const planSheet = getOrCreateSheet('LessonPlans');
  const plans = planSheet.getDataRange().getValues().slice(1);
  
  const classPlans = plans.filter(row => row[3] === className && row[11] === weekStarting);
  
  let rowsHtml = '';
  classPlans.forEach(p => {
    rowsHtml += `
      <tr>
        <td style="border: 1px solid #334155; padding: 12px; font-weight: bold; color: #4f46e5;">${p[5]}</td>
        <td style="border: 1px solid #334155; padding: 12px;">${p[2]}</td>
        <td style="border: 1px solid #334155; padding: 12px; font-weight: 800; font-style: italic;">${p[8]}</td>
        <td style="border: 1px solid #334155; padding: 12px; font-size: 11px; line-height: 1.5;">${p[9]}</td>
      </tr>
    `;
  });

  return `
    <html>
      <body style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <div style="text-align: center; border-bottom: 4px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">Sacred Heart School Koderma</h1>
          <p style="margin: 5px 0; color: #6366f1; font-weight: bold; letter-spacing: 4px; font-size: 10px;">WEEKLY ACADEMIC BLUEPRINT</p>
          <div style="display: inline-block; background: #1e293b; color: white; padding: 8px 20px; border-radius: 20px; margin-top: 15px; font-size: 12px; font-weight: bold;">
            CLASS: ${className} | WEEK STARTING: ${weekStarting.split('T')[0]}
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 2px solid #1e293b;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="border: 1px solid #334155; padding: 12px; text-align: left; font-size: 10px; text-transform: uppercase;">Subject</th>
              <th style="border: 1px solid #334155; padding: 12px; text-align: left; font-size: 10px; text-transform: uppercase;">Faculty</th>
              <th style="border: 1px solid #334155; padding: 12px; text-align: left; font-size: 10px; text-transform: uppercase;">Chapter</th>
              <th style="border: 1px solid #334155; padding: 12px; text-align: left; font-size: 10px; text-transform: uppercase;">Topics</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="4" style="text-align:center; padding: 40px; color: #94a3b8;">No data submitted for this week.</td></tr>'}
          </tbody>
        </table>
        <div style="margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; letter-spacing: 2px;">
          GENERTATED BY SACRED HEART CLOUD INFRASTRUCTURE
        </div>
      </body>
    </html>
  `;
}

/**
 * Main function to dispatch reports. 
 * Can be run manually or by trigger.
 */
function dispatchWeeklyReports() {
  const teacherSheet = getOrCreateSheet('Teachers');
  const teachers = teacherSheet.getDataRange().getValues().slice(1).map(row => JSON.parse(row[4]));
  
  // Calculate upcoming Monday
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
  const nextMonday = new Date(d.setDate(diff));
  nextMonday.setHours(0, 0, 0, 0);
  const weekKey = nextMonday.toISOString();

  const classes = ['V', 'VI', 'VII']; // Configured classes
  
  classes.forEach(cls => {
    const html = generateClassReportHtml(cls, weekKey);
    const pdfBlob = HtmlService.createHtmlOutput(html).getAs('application/pdf').setName(`SacredHeart_Class_${cls}_Report.pdf`);
    
    // Find teachers involved in this class to email them
    const classTeachers = teachers.filter(t => 
      t.isClassTeacher && t.classTeacherOf.className === cls
    );
    
    classTeachers.forEach(teacher => {
      try {
        GmailApp.sendEmail(teacher.email, `Weekly Academic Digest: Class ${cls}`, 
          `Dear ${teacher.name},\n\nPlease find attached the Weekly Lesson Plan Digest for Class ${cls} for the week starting ${weekKey.split('T')[0]}.\n\nRegards,\nSacred Heart Admin Hub`, 
          {
            attachments: [pdfBlob],
            name: 'Sacred Heart Admin'
          }
        );
      } catch (e) {
        Logger.log(`Failed to email ${teacher.email}: ${e.message}`);
      }
    });
  });
  
  return "Dispatch Completed Successfully";
}

// --- WEB INTERFACE HANDLERS ---

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'test') return ContentService.createTextOutput("Connection Active");
  
  if (action === 'getAllData') {
    const teacherSheet = getOrCreateSheet('Teachers');
    const planSheet = getOrCreateSheet('LessonPlans');
    const teachers = teacherSheet.getDataRange().getValues().slice(1).map(row => JSON.parse(row[4]));
    const plans = planSheet.getDataRange().getValues().slice(1).map(row => ({
      id: row[0], teacherId: row[1], teacherName: row[2], className: row[3],
      section: row[4], subject: row[5], dateFrom: row[6], dateTo: row[7],
      chapter: row[8], topics: row[9], homework: row[10], weekStarting: row[11],
      submittedAt: row[12]
    }));
    return ContentService.createTextOutput(JSON.stringify({ teachers, lessonPlans: plans })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const { action, data } = body;
  
  if (action === 'savePlans') {
    const sheet = getOrCreateSheet('LessonPlans');
    data.forEach(p => {
      sheet.appendRow([p.id, p.teacherId, p.teacherName, p.className, p.section, p.subject, p.dateFrom, p.dateTo, p.chapter, p.topics, p.homework, p.weekStarting, p.submittedAt]);
    });
    return ContentService.createTextOutput(JSON.stringify({status: 'ok'}));
  } 
  
  if (action === 'updateTeacher') {
    const sheet = getOrCreateSheet('Teachers');
    const values = sheet.getDataRange().getValues();
    let found = false;
    for(let i=1; i<values.length; i++) {
      if(values[i][0] === data.id) {
        sheet.getRange(i+1, 1, 1, 5).setValues([[data.id, data.name, data.email, data.phone, JSON.stringify(data)]]);
        found = true;
        break;
      }
    }
    if(!found) sheet.appendRow([data.id, data.name, data.email, data.phone, JSON.stringify(data)]);
    return ContentService.createTextOutput(JSON.stringify({status: 'ok'}));
  }

  if (action === 'triggerDispatch') {
    const result = dispatchWeeklyReports();
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: result })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * RUN THIS ONCE MANUALLY TO SETUP AUTOMATION
 */
function setupAutomatedTrigger() {
  // Delete existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  
  // Schedule for every Sunday at 6:00 PM
  ScriptApp.newTrigger('dispatchWeeklyReports')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(18)
    .create();
}
