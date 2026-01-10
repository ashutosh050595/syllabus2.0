import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Types for lesson plan data
interface LessonPlanData {
  subject: string;
  teacherName: string;
  chapterName: string;
  topics: string;
  homeAssignments: string;
}

interface PDFOptions {
  className: string;
  section: string;
  weekRange: string;
  classTeacherName: string;
  lessonPlans: LessonPlanData[];
  missingTeachers?: string[];
}

export class PDFGenerator {
  // Generate PDF in Sacred Heart format
  static generateWeeklySyllabusPDF(options: PDFOptions): string {
    const {
      className,
      section,
      weekRange,
      classTeacherName,
      lessonPlans,
      missingTeachers = []
    } = options;

    // Create PDF document - A4 size, portrait
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Set font
    doc.setFont('helvetica');
    
    // =========== PAGE 1: HEADER & TABLE ===========
    
    // Sacred Heart School Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SACRED HEART SCHOOL', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('(Affiliated to CBSE, New Delhi, upto +2 Level)', 105, 26, { align: 'center' });
    
    // Weekly Syllabus Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('WEEKLY SYLLABUS', 105, 38, { align: 'center' });
    
    // Underline
    doc.setLineWidth(0.5);
    doc.line(60, 40, 150, 40);
    
    // Date, Class & Teacher Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date           : ${weekRange}`, 20, 50);
    doc.text(`Class & Sec   : ${className} ${section}`, 20, 58);
    doc.text(`Name of Class Teacher : ${classTeacherName}`, 20, 66);
    
    // Table Headers
    const tableColumn = [
      "Subject",
      "Subject Teacher", 
      "Chapter Name",
      "Topics/Sub-Topics",
      "Home Assignments"
    ];
    
    // Prepare table data
    const tableRows = lessonPlans.map(plan => [
      plan.subject || '---',
      plan.teacherName || '---',
      plan.chapterName || '---',
      plan.topics || '---',
      plan.homeAssignments || '---'
    ]);
    
    // Add missing teachers as empty rows
    missingTeachers.forEach(teacher => {
      tableRows.push([
        '---',
        teacher,
        'Lesson Plan Not Submitted',
        '---',
        '---'
      ]);
    });
    
    // Generate table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Subject
        1: { cellWidth: 30 }, // Teacher
        2: { cellWidth: 30 }, // Chapter
        3: { cellWidth: 50 }, // Topics
        4: { cellWidth: 40 }  // Assignments
      },
      margin: { left: 15, right: 15 },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      didDrawPage: function (data) {
        // Page footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(
          `Page ${data.pageNumber} of ${pageCount} - Sacred Heart School Weekly Syllabus`,
          105,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
    });
    
    // =========== PAGE 2: ADDITIONAL INFORMATION ===========
    
    // Add second page if needed
    if (missingTeachers.length > 0) {
      doc.addPage();
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Missing Lesson Plans', 105, 30, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Class: ${className} ${section}`, 20, 45);
      doc.text(`Week: ${weekRange}`, 20, 55);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Teachers who have not submitted:', 20, 70);
      
      doc.setFont('helvetica', 'normal');
      missingTeachers.forEach((teacher, index) => {
        doc.text(`${index + 1}. ${teacher}`, 30, 80 + (index * 7));
      });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(
        'Note: These teachers will be marked as defaulters and notified to administration.',
        20,
        doc.internal.pageSize.height - 30
      );
    }
    
    // Generate PDF filename
    const filename = `${className}_${section}_${weekRange.replace(/ /g, '_')}.pdf`;
    
    // Save PDF
    doc.save(filename);
    
    // Return PDF as base64 string for email attachment
    const pdfOutput = doc.output('datauristring');
    const base64 = pdfOutput.split(',')[1];
    
    return base64;
  }
  
  // Generate PDF from existing lesson plans data
  static generatePDFFromLessonPlans(
    className: string,
    section: string,
    weekRange: string,
    classTeacherName: string,
    lessonPlans: any[],
    allTeachers: any[]
  ): string {
    // Filter lesson plans for this class, section, and week
    const classLessonPlans = lessonPlans.filter(plan => 
      plan.className === className && 
      plan.section === section && 
      plan.weekRange === weekRange
    );
    
    // Get all teachers assigned to this class
    const assignedTeachers = allTeachers.filter(teacher => 
      teacher.assignments?.some((assignment: any) => 
        assignment.className === className && 
        assignment.sections?.includes(section)
      )
    );
    
    // Find missing teachers
    const submittedTeacherIds = classLessonPlans.map(plan => plan.teacherId);
    const missingTeachers = assignedTeachers
      .filter(teacher => !submittedTeacherIds.includes(teacher.email))
      .map(teacher => teacher.name);
    
    // Format lesson plans data for PDF
    const pdfLessonPlans: LessonPlanData[] = classLessonPlans.map(plan => ({
      subject: plan.subject || '---',
      teacherName: plan.teacherName || '---',
      chapterName: plan.topics?.split('\n')[0] || '---',
      topics: plan.topics || '---',
      homeAssignments: plan.assessment || '---'
    }));
    
    // Generate PDF
    return this.generateWeeklySyllabusPDF({
      className,
      section,
      weekRange,
      classTeacherName,
      lessonPlans: pdfLessonPlans,
      missingTeachers
    });
  }
  
  // Generate PDF for all classes (for auto-send)
  static async generatePDFsForAllClasses(
    weekRange: string,
    teachers: any[],
    lessonPlans: any[]
  ): Promise<Array<{className: string; section: string; pdfBase64: string; teacherEmail: string}>> {
    const classTeachers = teachers.filter(t => t.isClassTeacher);
    const results = [];
    
    for (const teacher of classTeachers) {
      try {
        if (!teacher.classTeacherOf) continue;
        
        const { className, section } = teacher.classTeacherOf;
        const pdfBase64 = this.generatePDFFromLessonPlans(
          className,
          section,
          weekRange,
          teacher.name,
          lessonPlans,
          teachers
        );
        
        results.push({
          className,
          section,
          pdfBase64,
          teacherEmail: teacher.email,
          teacherName: teacher.name
        });
      } catch (error) {
        console.error(`Error generating PDF for ${teacher.name}:`, error);
      }
    }
    
    return results;
  }
}
