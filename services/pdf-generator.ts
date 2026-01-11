import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==========================================
// CONFIGURATION
// स्टेप: Google से 'Kruti_Dev_010.ttf' डाउनलोड करें 
// और इसे public/fonts/ फोल्डर में रखें।
// ==========================================
const HINDI_FONT_URL = '/fonts/Kruti_Dev_010.ttf'; 

export class PDFGenerator {
  
  // 1. ASYNC FONT LOADER (Kruti Dev)
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
      // Kruti Dev font registration
      doc.addFileToVFS('Kruti_Dev_010.ttf', base64Font);
      doc.addFont('Kruti_Dev_010.ttf', 'KrutiDev', 'normal');
      
      return 'KrutiDev';
    } catch (error) {
      console.warn('⚠️ Could not load Kruti Dev font, using fallback', error);
      return 'helvetica';
    }
  }

  // 2. UNICODE TO KRUTI DEV CONVERTER
  // यह आधे अक्षरों और मात्राओं को सही करने के लिए बहुत जरूरी है
  private static convertToKrutiDev(text: string): string {
    if (!text) return '';
    // अगर हिंदी नहीं है, तो वैसा ही रहने दें
    if (!/[\u0900-\u097F]/.test(text)) return text;

    // A. विशिष्ट शब्दकोश (Common words fix)
    const dictionary: { [key: string]: string } = {
      "साप्ताहिक": "lkIrkfgd",
      "पाठ्यक्रम": "ikB~;Øe",
      "विषय": "fo'k;",
      "अध्यापक": "v/;kwd",
      "अध्याय": "v/;k;",
      "गृह कार्य": "x'g dk;Z",
      "हस्ताक्षर": "gLrk{kj",
      "प्राचार्य": "izkpk;Z",
      "कक्षा": "d{kk",
      "सैक्रेड": "lSdZSM",
      "हार्ट": "gkVZ",
      "स्कूल": "Ldwy",
      "वस्तु": "oLrq",
      "नहीं": "ugha",
      "दिया": "fn;k",
      "गया": "x;k",
      "दिनांक": "fnukad",
      "सत्र": "l=",
      "Not Submitted": "Not Submitted" // English keep same
    };

    let processed = text;
    for (const [word, replacement] of Object.entries(dictionary)) {
      processed = processed.replace(new RegExp(word, 'g'), replacement);
    }

    // B. मात्रा और अक्षर मैपिंग (Basic Mapping for dynamic text)
    // यह डायनामिक नामों के लिए बेसिक कन्वर्ज़न करेगा
    const mapping: { [key: string]: string } = {
      // मात्राएँ (Matras)
      '‘': '^', '’': '*', '“': 'Þ', '”': 'ß',
      'ा': 'k', 'ि': 'f', 'ी': 'h', 'ु': 'q', 'ू': 'w', 'ृ': "'", 
      'े': 's', 'ै': 'S', 'ो': 'ks', 'ौ': 'kS', 'ं': 'a', 'ँ': '¡', 'ः': '%',
      '्': '~', // Halant

      // स्वर (Vowels)
      'अ': 'v', 'आ': 'vk', 'इ': 'b', 'ई': 'bZ', 'उ': 'm', 'ऊ': 'Å', 
      'ए': ',', 'ऐ': ',s', 'ओ': 'vks', 'औ': 'vkS',

      // व्यंजन (Consonants)
      'क': 'd', 'ख': '[k', 'ग': 'x', 'घ': '?', 'ङ': '³',
      'च': 'p', 'छ': 'N', 'ज': 't', 'झ': '>', 'ञ': '¥',
      'ट': 'V', 'ठ': 'B', 'ड': 'M', 'ढ': '<', 'ण': '.k',
      'त': 'r', 'थ': 'F', 'द': 'n', 'ध': '/k', 'न': 'u',
      'प': 'i', 'फ': 'Q', 'ब': 'c', 'भ': 'H', 'म': 'e',
      'य': ';', 'र': 'j', 'ल': 'y', 'व': 'o',
      'श': "'k", 'ष': '"k', 'स': 'l', 'ह': 'g',
      'क्ष': '{k', 'त्र': '=', 'ज्ञ': 'K', 'श्र': 'J'
    };

    // Note: 'chhoti ee' (ि) needs to be moved before the character in Kruti Dev
    // This is a complex logic, for now dictionary covers main headers.
    // For dynamic names, we apply simple mapping.
    
    // अगर डिक्शनरी से शब्द नहीं बदला, तो कैरेक्टर मैप करें
    if (processed === text) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            result += mapping[char] || char;
        }
        return result;
    }

    return processed;
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
    console.log(`📊 Generating PDF for ${className}-${section}`);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // 1. लोड कृति देव
    const fontName = await this.addHindiFontToDoc(doc);
    
    // टेक्स्ट कनवर्टर हेल्पर
    const toHindi = (t: string) => this.convertToKrutiDev(t);

    // =========== HEADER ===========
    doc.setFontSize(22);
    // English Text - Helvetica
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('SACRED HEART SCHOOL', 105, 20, { align: 'center' });

    // Hindi Text - Kruti Dev
    doc.setFontSize(16);
    doc.setFont(fontName, 'normal');
    // "सैक्रेड हार्ट स्कूल"
    doc.text(toHindi('सैक्रेड हार्ट स्कूल'), 105, 28, { align: 'center' });

    // English Text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('(Affiliated to CBSE, New Delhi, upto +2 Level)', 105, 36, { align: 'center' });

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0);
    doc.text('WEEKLY SYLLABUS', 105, 48, { align: 'center' });

    // Hindi Text
    doc.setFontSize(14);
    doc.setFont(fontName, 'normal');
    // "साप्ताहिक पाठ्यक्रम"
    doc.text(toHindi('साप्ताहिक पाठ्यक्रम'), 105, 56, { align: 'center' });

    doc.setLineWidth(0.8);
    doc.setDrawColor(139, 0, 0);
    doc.line(50, 58, 160, 58);

    // =========== INFO ===========
    const infoY = 70;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // Labels in English
    doc.setFont('helvetica', 'normal');
    doc.text('Date:', 20, infoY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${weekRange}`, 40, infoY);

    doc.setFont('helvetica', 'normal');
    doc.text('Class & Section:', 20, infoY + 8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${className} - ${section}`, 60, infoY + 8);

    doc.setFont('helvetica', 'normal');
    doc.text('Class Teacher:', 20, infoY + 16);
    
    // टीचर का नाम (अगर हिंदी में है तो कृति देव, वरना इंग्लिश)
    if (/[\u0900-\u097F]/.test(classTeacherName)) {
      doc.setFont(fontName, 'normal');
      doc.text(toHindi(classTeacherName), 60, infoY + 16);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.text(classTeacherName, 60, infoY + 16);
    }

    // =========== DATA LOGIC ===========
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

    // =========== TABLE ===========
    
    // Table Headers: हम English और Hindi (Kruti) दोनों को एक स्ट्रिंग में जोड़कर दिखाएंगे
    // लेकिन AutoTable में अलग फॉन्ट यूज़ करना मुश्किल है।
    // Trick: हम पूरे कॉलम को Kruti Dev फॉन्ट देंगे। Kruti Dev में English अक्षर भी होते हैं (Times Roman जैसे)।
    
    const tableColumns = [
      { header: 'Subject\n' + toHindi('विषय'), dataKey: 'subject', width: 30 },
      { header: 'Teacher\n' + toHindi('अध्यापक'), dataKey: 'teacher', width: 35 },
      { header: 'Chapter\n' + toHindi('अध्याय'), dataKey: 'chapter', width: 35 },
      { header: 'Topics\n' + toHindi('विषय-वस्तु'), dataKey: 'topics', width: 50 },
      { header: 'Home Assignment\n' + toHindi('गृह कार्य'), dataKey: 'homework', width: 40 }
    ];

    const tableRows: any[][] = [];
    const sortedTeachers = [...assignedTeachers].sort((a, b) => a.name.localeCompare(b.name));

    sortedTeachers.forEach(teacher => {
      const assignment = teacher.assignments?.find((a: any) => 
        a.className === className && a.sections?.includes(section)
      );
      const subject = assignment?.subject || '---';
      const isSubmitted = submittedTeachers.some(st => st.email === teacher.email);

      if (isSubmitted) {
        const lessonPlan = allLessonPlans.find(plan => 
          plan.teacherId === teacher.email && 
          plan.className === className && 
          plan.section === section && 
          plan.weekRange === weekRange
        );
        tableRows.push([
          subject,
          teacher.name,
          lessonPlan?.topics?.split('\n')[0]?.substring(0, 30) || '---',
          lessonPlan?.topics?.substring(0, 50) || '---',
          lessonPlan?.assessment?.substring(0, 50) || '---'
        ]);
      } else {
        // Missing - Mixed Text
        tableRows.push([
          subject,
          teacher.name,
          'Lesson Plan Not Submitted',
          'Lesson Plan Not Submitted',
          'Homework Not Submitted\n' + toHindi('(गृह कार्य नहीं दिया गया)')
        ]);
      }
    });

    try {
      autoTable(doc, {
        startY: infoY + 30,
        head: [tableColumns.map(col => col.header)],
        body: tableRows,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: [0, 0, 0],
          overflow: 'linebreak',
          font: fontName, // Table Body Font -> Kruti Dev (Supports Eng + Hindi codes)
          valign: 'top'
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          font: fontName, // Header Font -> Kruti Dev
          halign: 'center',
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 50 },
          4: { cellWidth: 40 }
        },
        didParseCell: (data: any) => {
          const text = String(data.cell.text);
          // Red Color for Missing
          if (text.includes('Not Submitted')) {
             data.cell.styles.textColor = [220, 0, 0];
          }
        },
        didDrawPage: (data: any) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic'); // Footer English
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
      console.error('❌ AutoTable Error:', error);
      // Fallback
      this.generateSimpleTableFallback(doc, tableColumns, tableRows, infoY + 30, fontName);
    }

    // =========== SUMMARY ===========
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    
    if (finalY < 250) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Summary:', 20, finalY + 15);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`• Total Teachers: ${assignedTeachers.length}`, 25, finalY + 25);
      doc.text(`• Submitted: ${submittedTeachers.length}`, 25, finalY + 33);
      
      if (missingTeachers.length > 0) {
        doc.setTextColor(220, 0, 0);
        doc.text(`• Missing: ${missingTeachers.length}`, 25, finalY + 41);
        doc.setFont(fontName, 'normal');
        doc.text(toHindi('(Lesson Plan Not Submitted)'), 25, finalY + 49);
      }

      // Signatures
      const sigY = Math.min(finalY + 65, 270);
      doc.setTextColor(0,0,0);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Signature of Class Teacher:', 30, sigY);
      doc.setFont(fontName, 'normal');
      doc.text(toHindi('कक्षा अध्यापक के हस्ताक्षर:'), 30, sigY + 6);
      doc.line(30, sigY + 8, 80, sigY + 8);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Signature of Principal:', 120, sigY);
      doc.setFont(fontName, 'normal');
      doc.text(toHindi('प्राचार्य के हस्ताक्षर:'), 120, sigY + 6);
      doc.line(120, sigY + 8, 170, sigY + 8);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 30, sigY + 20);
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100,100,100);
    doc.text('Generated by Sacred Heart School Management System', 105, 285, { align: 'center' });

    try {
      return doc.output('datauristring').split(',')[1];
    } catch (e: any) {
      throw new Error(e.message);
    }
  }

  // ==========================================
  // FULLY RESTORED: FALLBACK TABLE
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
    
    // Header
    doc.setFillColor(41, 128, 185);
    // Calculate total width based on columns
    const totalWidth = columns.reduce((acc, col) => acc + col.width, 0);
    doc.rect(startX, y, totalWidth, 10, 'F');
    
    doc.setFontSize(10);
    doc.setFont(fontName, 'normal'); // Use Kruti Dev
    doc.setTextColor(255, 255, 255);
    
    let x = startX + 5;
    columns.forEach(col => {
      doc.text(col.header.split('\n')[0], x, y + 7);
      x += col.width;
    });
    
    y += 12;
    
    // Body
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    rows.forEach((row, rowIndex) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
        // Header repeat
        doc.setFillColor(41, 128, 185);
        doc.rect(startX, y, totalWidth, 10, 'F');
        doc.setTextColor(255, 255, 255);
        x = startX + 5;
        columns.forEach(col => {
          doc.text(col.header.split('\n')[0], x, y + 7);
          x += col.width;
        });
        doc.setTextColor(0,0,0);
        y += 12;
      }
      
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(startX, y, totalWidth, 10, 'F');
      }
      
      x = startX + 5;
      row.forEach((cell, cellIndex) => {
        const text = String(cell);
        if (text.includes('Not Submitted')) doc.setTextColor(220, 0, 0);
        
        doc.text(text.substring(0, 25), x, y + 6);
        doc.setTextColor(0, 0, 0);
        x += columns[cellIndex].width;
      });
      
      y += 12;
    });
  }

  // ==========================================
  // FULLY RESTORED: BATCH GENERATOR
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
        
        // AWAIT here
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
  // FULLY RESTORED: DATE HELPER
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
  // FULLY RESTORED: SIMPLE PDF WRAPPER
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
  // FULLY RESTORED: DOWNLOAD HELPER
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
  // FULLY RESTORED: GENERATE & DOWNLOAD WRAPPER
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
