import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NotoSansDevanagariRegular } from './fonts';

export class PDFGenerator {
  private static setupDevanagariFont(doc: jsPDF): jsPDF {
    try {
      // Remove any newlines from base64 string
      const cleanFont = NotoSansDevanagariRegular.replace(/\s/g, '');
      
      doc.addFileToVFS('NotoSansDevanagari.ttf', cleanFont);
      doc.addFont('NotoSansDevanagari.ttf', 'NotoSansDevanagari', 'normal');
      
      console.log('✅ Font registered, checking if available...');
      
      // Test if font is available
      const fonts = doc.getFontList();
      console.log('Available fonts:', fonts);
      
      return doc;
    } catch (error) {
      console.error('Font registration error:', error);
      return doc;
    }
  }

  static generatePDFFromLessonPlans(
    className: string,
    section: string,
    weekRange: string,
    classTeacherName: string,
    lessonPlans: any[],
    allTeachers: any[]
  ): string {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Setup Devanagari font
    this.setupDevanagariFont(doc);
    
    // =========== SACRED HEART SCHOOL HEADER ===========
    
    // School Name (English)
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102); // Dark blue
    doc.text('SACRED HEART SCHOOL', 105, 20, { align: 'center' });
    
    // School Name (Hindi)
    doc.setFont('NotoSansDevanagari', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('सैक्रेड हार्ट स्कूल', 105, 30, { align: 'center' });
    
    // CBSE Affiliation
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('(Affiliated to CBSE, New Delhi, upto +2 Level)', 105, 38, { align: 'center' });
    
    // Weekly Syllabus Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0); // Dark red
    doc.text('WEEKLY SYLLABUS', 105, 48, { align: 'center' });
    
    // Weekly Syllabus Title (Hindi)
    doc.setFont('NotoSansDevanagari', 'bold');
    doc.setFontSize(12);
    doc.text('साप्ताहिक पाठ्यक्रम', 105, 56, { align: 'center' });
    
    // Underline
    doc.setLineWidth(0.5);
    doc.setDrawColor(139, 0, 0);
    doc.line(60, 58, 150, 58);
    
    // =========== INFORMATION SECTION ===========
    
    // Date
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Date:', 20, 70);
    doc.setFont('helvetica', 'bold');
    doc.text(`${weekRange}`, 40, 70);
    
    // Class & Section
    doc.setFont('helvetica', 'normal');
    doc.text('Class & Section:', 20, 78);
    doc.setFont('helvetica', 'bold');
    doc.text(`${className} - ${section}`, 55, 78);
    
    // Class Teacher (English)
    doc.setFont('helvetica', 'normal');
    doc.text('Class Teacher:', 20, 86);
    doc.setFont('helvetica', 'bold');
    doc.text(`${classTeacherName}`, 50, 86);
    
    // Class Teacher (Hindi) - if name contains Hindi text
    if (this.containsDevanagari(classTeacherName)) {
      doc.setFont('NotoSansDevanagari', 'normal');
      doc.text('कक्षा अध्यापक:', 20, 94);
      doc.setFont('NotoSansDevanagari', 'bold');
      doc.text(`${classTeacherName}`, 50, 94);
    }
    
    // =========== GET ALL TEACHERS FOR THIS CLASS ===========
    
    const assignedTeachers = allTeachers.filter(teacher => {
      return teacher.assignments?.some((assignment: any) => 
        assignment.className === className && 
        assignment.sections?.includes(section)
      );
    });
    
    // =========== PREPARE TABLE DATA ===========
    
    const tableHeaders = [
      { header: 'Subject\nविषय', dataKey: 'subject' },
      { header: 'Subject Teacher\nविषय अध्यापक', dataKey: 'teacher' },
      { header: 'Chapter/Topic\nअध्याय/विषय', dataKey: 'chapter' },
      { header: 'Sub-Topics\nउप-विषय', dataKey: 'topics' },
      { header: 'Home Assignment\nगृह कार्य', dataKey: 'homework' }
    ];
    
    const tableData: any[] = [];
    
    // Sort teachers by name
    const sortedTeachers = [...assignedTeachers].sort((a, b) => 
      a.name.localeCompare(b.name, 'hi')
    );
    
    sortedTeachers.forEach(teacher => {
      const assignment = teacher.assignments?.find((a: any) => 
        a.className === className && a.sections?.includes(section)
      );
      
      const subject = assignment?.subject || '---';
      
      const lessonPlan = lessonPlans.find(plan => 
        plan.teacherId === teacher.email && 
        plan.className === className && 
        plan.section === section && 
        plan.weekRange === weekRange
      );
      
      tableData.push({
        subject: subject,
        teacher: teacher.name,
        chapter: lessonPlan?.topics?.split('\n')[0] || '---',
        topics: lessonPlan?.topics || '---',
        homework: lessonPlan?.assessment || 'Homework Not Submitted\n(गृह कार्य नहीं दिया गया)'
      });
    });
    
    // =========== GENERATE TABLE ===========
    
    autoTable(doc, {
      head: [['Subject\nविषय', 'Subject Teacher\nविषय अध्यापक', 'Chapter/Topic\nअध्याय/विषय', 'Sub-Topics\nउप-विषय', 'Home Assignment\nगृह कार्य']],
      body: tableData.map(row => [
        row.subject,
        row.teacher,
        row.chapter,
        row.topics,
        row.homework
      ]),
      startY: 100,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 51, 102], // Dark blue
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        font: 'helvetica',
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        font: 'NotoSansDevanagari',
        textColor: [0, 0, 0],
        lineWidth: 0.1,
        overflow: 'linebreak'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 50, halign: 'left' },
        4: { cellWidth: 40, halign: 'left' }
      },
      margin: { left: 10, right: 10 },
      didParseCell: function(data) {
        // Handle Devanagari text in cells
        if (data.row.index > 0) { // Skip header row
          data.cell.styles.font = 'NotoSansDevanagari';
        }
      },
      didDrawPage: function(data) {
        // Page number
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(
          `Page ${data.pageNumber}`,
          doc.internal.pageSize.width - 20,
          doc.internal.pageSize.height - 10
        );
      }
    });
    
    // =========== SIGNATURE SECTION ===========
    
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    
    if (finalY < 250) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Class Teacher Signature
      doc.text('Signature of Class Teacher:', 30, finalY + 20);
      doc.text('कक्षा अध्यापक के हस्ताक्षर:', 30, finalY + 26);
      doc.line(30, finalY + 30, 80, finalY + 30);
      
      // Principal Signature
      doc.text('Signature of Principal:', 120, finalY + 20);
      doc.text('प्राचार्य के हस्ताक्षर:', 120, finalY + 26);
      doc.line(120, finalY + 30, 170, finalY + 30);
      
      // Date
      doc.text('Date:', 30, finalY + 40);
      doc.text(new Date().toLocaleDateString('en-IN'), 45, finalY + 40);
    }
    
    // =========== FOOTER ===========
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(
      'Generated by Sacred Heart School Management System • हिंदी संस्कृत समर्थित',
      105,
      doc.internal.pageSize.height - 5,
      { align: 'center' }
    );
    
    // Save and return
    const pdfOutput = doc.output('datauristring');
    return pdfOutput.split(',')[1];
  }
  
  private static containsDevanagari(text: string): boolean {
    // Check if text contains Devanagari Unicode characters
    return /[\u0900-\u097F]/.test(text);
  }
  
  static generatePDFsForAllClasses(
    weekRange: string,
    teachers: any[],
    lessonPlans: any[]
  ): Array<{className: string; section: string; pdfBase64: string; teacherName: string; teacherEmail: string}> {
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
          teacherName: teacher.name,
          teacherEmail: teacher.email
        });
        
        console.log(`✅ PDF generated for ${className}-${section}`);
      } catch (error) {
        console.error(`❌ Error for ${teacher.name}:`, error);
      }
    }
    
    return results;
  }
}
