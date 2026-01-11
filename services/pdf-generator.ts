import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==========================================
// CONFIGURATION
// यह फाइल public/fonts/ फोल्डर में होनी चाहिए
// ==========================================
const HINDI_FONT_URL = '/fonts/NotoSansDevanagari-Regular.ttf'; 

export class PDFGenerator {
  
  // 1. ASYNC FONT LOADER: लोड होने के बाद फॉन्ट का नाम रिटर्न करता है
  private static async addHindiFontToDoc(doc: jsPDF): Promise<string> {
    try {
      const response = await fetch(HINDI_FONT_URL);
      if (!response.ok) {
        throw new Error(`Font fetch failed: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      
      const base64Font = window.btoa(binary);
      const fontFileName = 'HindiFont.ttf';
      const fontName = 'HindiFont';

      doc.addFileToVFS(fontFileName, base64Font);
      doc.addFont(fontFileName, fontName, 'normal');
      
      return fontName;
    } catch (error) {
      console.warn('⚠️ Could not load custom fonts, using built-in fonts', error);
      return 'helvetica'; // Fallback
    }
  }

  // 2. HINDI TEXT FIXER: मात्राओं को सही जगह पर सेट करता है
  // (विशेषकर छोटी 'इ' की मात्रा के लिए जो jsPDF में गलत दिखती है)
  private static processHindiText(text: string): string {
    if (!text) return '';
    const str = String(text);
    
    // अगर हिंदी नहीं है तो छेड़छाड़ न करें
    if (!/[\u0900-\u097F]/.test(str)) return str;

    const chars = str.split('');
    for (let i = 0; i < chars.length; i++) {
      // अगर यह छोटी 'इ' (u093F) की मात्रा है
      if (chars[i] === '\u093F') {
        // इसे पिछले अक्षर से बदल दें (Swap)
        if (i > 0) {
          const temp = chars[i];
          chars[i] = chars[i - 1];
          chars[i - 1] = temp;
        }
      }
    }
    return chars.join('');
  }

  // Helper: Check if text contains Hindi (kept for compatibility)
  private static containsHindi(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    return /[\u0900-\u097F]/.test(text);
  }

  // ==========================================
  // MAIN GENERATION FUNCTION
  // ==========================================
  static async generatePDFFromLessonPlans(
    className: string,
    section: string,
    weekRange: string,
    classTeacherName: string,
    allLessonPlans: any[],
    allTeachers: any[]
  ): Promise<string> {
    console.log(`📊 Generating PDF for ${className}-${section}, Week: ${weekRange}`);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // फॉन्ट लोड करें
    const fontName = await this.addHindiFontToDoc(doc);
    
    // टेक्स्ट प्रोसेसिंग हेल्पर
    const txt = (t: string) => this.processHindiText(t);

    // =========== PAGE 1: HEADER ===========
    
    // School Name (English)
    doc.setFontSize(22);
    doc.setFont(fontName, 'normal'); // Custom font use करें
    doc.setTextColor(0, 51, 102);
    doc.text('SACRED HEART SCHOOL', 105, 20, { align: 'center' });

    // School Name (Hindi)
    doc.setFontSize(16);
    doc.text(txt('सैक्रेड हार्ट स्कूल'), 105, 28, { align: 'center' });

    // CBSE Affiliation
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('(Affiliated to CBSE, New Delhi, upto +2 Level)', 105, 36, { align: 'center' });

    // Weekly Syllabus Title (English)
    doc.setFontSize(18);
    doc.setTextColor(139, 0, 0);
    doc.text('WEEKLY SYLLABUS', 105, 48, { align: 'center' });

    // Weekly Syllabus Title (Hindi)
    doc.setFontSize(14);
    doc.text(txt('साप्ताहिक पाठ्यक्रम'), 105, 56, { align: 'center' });

    // Underline
    doc.setLineWidth(0.8);
    doc.setDrawColor(139, 0, 0);
    doc.line(50, 58, 160, 58);

    // =========== INFORMATION SECTION ===========
    
    const infoY = 70;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // Date
    doc.text('Date:', 20, infoY);
    doc.text(`${weekRange}`, 40, infoY);

    // Class & Section
    doc.text('Class & Section:', 20, infoY + 8);
    doc.text(`${className} - ${section}`, 55, infoY + 8);

    // Class Teacher
    doc.text('Class Teacher:', 20, infoY + 16);
    doc.text(txt(classTeacherName), 55, infoY + 16); // हिंदी नाम हो सकता है

    // =========== DATA PROCESSING ===========
    
    const assignedTeachers = allTeachers.filter(teacher => {
      if (!teacher.assignments) return false;
      return teacher.assignments.some((assignment: any) => 
        assignment.className === className && 
        assignment.sections?.includes(section)
      );
    });

    const submittedTeachers = assignedTeachers.filter(teacher => 
      allLessonPlans.some(plan => 
        plan.teacherId === teacher.email && 
        plan.className === className && 
        plan.section === section && 
        plan.weekRange === weekRange
      )
    );

    const missingTeachers = assignedTeachers.filter(teacher => 
      !submittedTeachers.includes(teacher)
    );

    console.log(`👨‍🏫 Total: ${assignedTeachers.length}, Submitted: ${submittedTeachers.length}, Missing: ${missingTeachers.length}`);

    // =========== PREPARE TABLE DATA ===========
    
    const tableColumns = [
      { header: txt('Subject\nविषय'), dataKey: 'subject', width: 30 },
      { header: txt('Teacher\nअध्यापक'), dataKey: 'teacher', width: 35 },
      { header: txt('Chapter\nअध्याय'), dataKey: 'chapter', width: 35 },
      { header: txt('Topics\nविषय-वस्तु'), dataKey: 'topics', width: 50 },
      { header: txt('Home Assignment\nगृह कार्य'), dataKey: 'homework', width: 40 }
    ];

    const tableRows: any[][] = [];
    
    // Sort teachers alphabetically
    const sortedTeachers = [...assignedTeachers].sort((a, b) => 
      a.name.localeCompare(b.name, 'hi')
    );

    sortedTeachers.forEach(teacher => {
      // Find teacher's subject
      const assignment = teacher.assignments?.find((a: any) => 
        a.className === className && a.sections?.includes(section)
      );
      
      const subject = assignment?.subject || '---';

      // Check if submitted
      const isSubmitted = submittedTeachers.some(st => st.email === teacher.email);

      if (isSubmitted) {
        // Get lesson plan
        const lessonPlan = allLessonPlans.find(plan => 
          plan.teacherId === teacher.email && 
          plan.className === className && 
          plan.section === section && 
          plan.weekRange === weekRange
        );

        tableRows.push([
          subject,
          txt(teacher.name),
          txt(lessonPlan?.topics?.split('\n')[0]?.substring(0, 30) || '---'),
          txt(lessonPlan?.topics?.substring(0, 50) || '---'),
          txt(lessonPlan?.assessment?.substring(0, 50) || '---')
        ]);
      } else {
        // ✅ CORRECTED LOGIC: Missing submission text in all relevant columns
        tableRows.push([
          subject,
          txt(teacher.name),
          'Lesson Plan Not Submitted',
          'Lesson Plan Not Submitted',
          txt('Homework Not Submitted\n(गृह कार्य नहीं दिया गया)')
        ]);
      }
    });

    // =========== GENERATE TABLE ===========
    
    try {
      autoTable(doc, {
        startY: infoY + 30,
        head: [tableColumns.map(col => col.header)],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'normal', // Bold often breaks custom fonts
          fontSize: 10,
          font: fontName,      // Header font
          halign: 'center',
          valign: 'middle',
          minCellHeight: 12
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: [0, 0, 0],
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
          overflow: 'linebreak',
          cellWidth: 'wrap',
          font: fontName       // Body font
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        columnStyles: {
          0: { cellWidth: 30, halign: 'center' },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 35, halign: 'center' },
          3: { cellWidth: 50, halign: 'left' },
          4: { cellWidth: 40, halign: 'left' }
        },
        margin: { left: 10, right: 10 },
        didParseCell: (data: any) => {
          // Highlight missing submissions in red
          if (data.row.index >= 0 && data.cell.text) {
             const cellText = Array.isArray(data.cell.text) 
              ? data.cell.text.join(' ') 
              : String(data.cell.text);

             const isMissingData = cellText.includes('Not Submitted') || 
                                   cellText.includes('Lesson Plan Not Submitted');
            
             // Apply red color to Chapter(2), Topics(3), and Homework(4) columns
             if (isMissingData && (data.column.index === 2 || data.column.index === 3 || data.column.index === 4)) {
               data.cell.styles.textColor = [220, 0, 0];
             }
          }
        },
        didDrawPage: (data: any) => {
          // Page number
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(9);
          doc.setFont(fontName, 'normal');
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            doc.internal.pageSize.width - 20,
            doc.internal.pageSize.height - 10
          );
        }
      });
      
      console.log('✅ Table generated successfully');
    } catch (error: any) {
      console.error('❌ AutoTable error, using fallback:', error.message);
      this.generateSimpleTableFallback(doc, tableColumns, tableRows, infoY + 30, fontName);
    }

    // =========== SUMMARY SECTION ===========
    
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    
    if (finalY < 250) {
      // Summary
      doc.setFontSize(11);
      doc.setFont(fontName, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Summary:', 20, finalY + 15);
      
      doc.setFontSize(10);
      doc.text(`• Total Teachers: ${assignedTeachers.length}`, 25, finalY + 25);
      doc.text(`• Submitted: ${submittedTeachers.length}`, 25, finalY + 33);
      
      if (missingTeachers.length > 0) {
        doc.setTextColor(220, 0, 0);
        doc.text(`• Missing: ${missingTeachers.length}`, 25, finalY + 41);
        doc.text(txt('(Lesson Plan Not Submitted)'), 25, finalY + 49);
      }

      // Signatures
      const signatureY = Math.min(finalY + 60, 260);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Class Teacher
      doc.text('Signature of Class Teacher:', 30, signatureY);
      doc.text(txt('कक्षा अध्यापक के हस्ताक्षर:'), 30, signatureY + 6);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(30, signatureY + 8, 80, signatureY + 8);
      
      // Principal
      doc.text('Signature of Principal:', 120, signatureY);
      doc.text(txt('प्राचार्य के हस्ताक्षर:'), 120, signatureY + 6);
      doc.line(120, signatureY + 8, 170, signatureY + 8);
      
      // Date
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 30, signatureY + 20);
    }

    // =========== FOOTER ===========
    
    doc.setFontSize(8);
    doc.setFont(fontName, 'normal');
    doc.setTextColor(100, 100, 100);
    
    doc.text(
      'Generated by Sacred Heart School Management System',
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );

    // =========== RETURN PDF ===========
    
    try {
      const pdfOutput = doc.output('datauristring');
      const base64String = pdfOutput.split(',')[1];
      console.log('✅ PDF generated successfully');
      return base64String;
    } catch (error: any) {
      console.error('❌ Error generating PDF output:', error);
      throw new Error(`PDF Generation Failed: ${error.message}`);
    }
  }

  // ==========================================
  // RESTORED: FALLBACK TABLE
  // ==========================================
  private static generateSimpleTableFallback(
    doc: jsPDF,
    columns: any[],
    rows: any[][],
    startY: number,
    fontName: string
  ) {
    console.log('📋 Using simple table fallback');
    
    let y = startY;
    const startX = 15;
    
    // Draw headers
    doc.setFillColor(41, 128, 185);
    const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
    doc.rect(startX, y, totalWidth, 10, 'F');
    
    doc.setFontSize(10);
    doc.setFont(fontName, 'normal');
    doc.setTextColor(255, 255, 255);
    
    let x = startX + 5;
    columns.forEach(col => {
      doc.text(col.header, x, y + 7);
      x += col.width;
    });
    
    y += 12;
    
    // Draw rows
    doc.setFontSize(9);
    doc.setFont(fontName, 'normal');
    doc.setTextColor(0, 0, 0);
    
    rows.forEach((row, rowIndex) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
        doc.setFillColor(41, 128, 185);
        doc.rect(startX, y, totalWidth, 10, 'F');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        x = startX + 5;
        columns.forEach(col => {
          doc.text(col.header, x, y + 7);
          x += col.width;
        });
        y += 12;
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
      }
      
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(startX, y, totalWidth, 10, 'F');
      }
      
      x = startX + 5;
      row.forEach((cell, cellIndex) => {
        const cellText = String(cell);
        
        if (cellText.includes('Not Submitted')) {
          doc.setTextColor(220, 0, 0);
        }
        
        const lines = cellText.split('\n');
        lines.forEach((line: string, lineIndex: number) => {
          doc.text(line.substring(0, 40), x, y + 5 + (lineIndex * 4));
        });
        
        doc.setTextColor(0, 0, 0);
        x += columns[cellIndex].width;
      });
      
      y += 12;
    });
  }

  // ==========================================
  // RESTORED: BATCH GENERATOR (ASYNC)
  // ==========================================
  static async generatePDFsForAllClasses(
    weekRange: string,
    teachers: any[],
    lessonPlans: any[]
  ): Promise<Array<{
    className: string;
    section: string;
    pdfBase64: string;
    teacherName: string;
    teacherEmail: string;
  }>> {
    const classTeachers = teachers.filter(t => t.isClassTeacher);
    const results = [];
    
    console.log(`🚀 Generating PDFs for ${classTeachers.length} class teachers`);
    
    for (const teacher of classTeachers) {
      try {
        if (!teacher.classTeacherOf) {
          console.warn(`⚠️ ${teacher.name} has no class assignment`);
          continue;
        }
        
        const { className, section } = teacher.classTeacherOf;
        
        console.log(`📄 Processing ${className}-${section} for ${teacher.name}`);
        
        const pdfBase64 = await this.generatePDFFromLessonPlans(
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
      } catch (error: any) {
        console.error(`❌ Failed for ${teacher.name}:`, error.message);
      }
    }
    
    return results;
  }

  // ==========================================
  // RESTORED: WEEK DATE HELPER
  // ==========================================
  static getWeekRangeFromDate(date: Date = new Date()): string {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const format = (d: Date) => {
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };
    
    return `${format(start)} to ${format(end)}`;
  }

  // ==========================================
  // RESTORED: SIMPLE PDF WRAPPER
  // ==========================================
  static async generateSimplePDF(data: {
    className: string;
    section: string;
    weekRange: string;
    classTeacher: string;
    subjects: Array<{
      subject: string;
      teacher: string;
      chapter: string;
      topics: string;
      homework: string;
      submitted: boolean;
    }>;
  }): Promise<string> {
    const allTeachers = data.subjects.map(subject => ({
      name: subject.teacher,
      email: `${subject.teacher.replace(/\s+/g, '.').toLowerCase()}@school.com`,
      assignments: [{
        className: data.className,
        sections: [data.section],
        subject: subject.subject
      }]
    }));

    const allLessonPlans = data.subjects
      .filter(subject => subject.submitted)
      .map(subject => ({
        teacherId: `${subject.teacher.replace(/\s+/g, '.').toLowerCase()}@school.com`,
        className: data.className,
        section: data.section,
        weekRange: data.weekRange,
        topics: subject.topics || subject.chapter,
        assessment: subject.homework
      }));

    return await this.generatePDFFromLessonPlans(
      data.className,
      data.section,
      data.weekRange,
      data.classTeacher,
      allLessonPlans,
      allTeachers
    );
  }

  // ==========================================
  // RESTORED: DOWNLOAD HELPER
  // ==========================================
  static downloadPDF(base64String: string, fileName: string = 'Weekly_Syllabus.pdf'): void {
    try {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${base64String}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      const pdfWindow = window.open();
      if (pdfWindow) {
        pdfWindow.document.write(
          `<iframe width='100%' height='100%' src='data:application/pdf;base64,${base64String}'></iframe>`
        );
      }
    }
  }

  // ==========================================
  // RESTORED: GENERATE & DOWNLOAD WRAPPER
  // ==========================================
  static async generateAndDownload(
    className: string,
    section: string,
    weekRange: string,
    classTeacherName: string,
    allLessonPlans: any[],
    allTeachers: any[],
    fileName?: string
  ): Promise<void> {
    try {
      const pdfBase64 = await this.generatePDFFromLessonPlans(
        className,
        section,
        weekRange,
        classTeacherName,
        allLessonPlans,
        allTeachers
      );
      
      const defaultFileName = `Class_${className}_${section}_${weekRange.replace(/\s+/g, '_')}.pdf`;
      this.downloadPDF(pdfBase64, fileName || defaultFileName);
      
    } catch (error) {
      console.error('Generate and download failed:', error);
      throw error;
    }
  }
}

// Alias for backward compatibility
export const Rd = PDFGenerator;
