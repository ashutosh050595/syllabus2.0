import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==========================================
// CONFIGURATION
// Ensure 'Kruti_Dev_010.ttf' is in your public/fonts/ folder
// ==========================================
const HINDI_FONT_URL = '/fonts/Kruti_Dev_010.ttf'; 

export class PDFGenerator {
  
  // ==========================================
  // 1. FONT & TEXT UTILITIES
  // ==========================================

  /**
   * Loads the Kruti Dev font asynchronously and registers it with jsPDF.
   */
  private static async addHindiFontToDoc(doc: jsPDF): Promise<string> {
    try {
      const response = await fetch(HINDI_FONT_URL);
      
      if (!response.ok) {
        throw new Error(`Font fetch failed: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      
      // Convert ArrayBuffer to Binary String (Chunked to prevent stack overflow)
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      const CHUNK_SIZE = 8192;
      
      for (let i = 0; i < len; i += CHUNK_SIZE) {
        binary += String.fromCharCode.apply(
          null, 
          Array.from(bytes.subarray(i, Math.min(i + CHUNK_SIZE, len)))
        );
      }
      
      const base64Font = window.btoa(binary);
      
      // Register font
      doc.addFileToVFS('Kruti_Dev_010.ttf', base64Font);
      doc.addFont('Kruti_Dev_010.ttf', 'KrutiDev', 'normal');
      
      return 'KrutiDev';
    } catch (error) {
      console.warn('⚠️ Could not load Kruti Dev font, using fallback to Helvetica', error);
      return 'helvetica';
    }
  }

  // Check if text contains Hindi characters
  private static hasHindi(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    return /[\u0900-\u097F]/.test(text);
  }

  /**
   * Converts Unicode Hindi text to Kruti Dev encoding.
   * FIXES APPLIED: Corrected mappings for 'Adhyapak', 'Vishay'.
   */
  private static toKrutiDev(text: string): string {
    if (!text) return '';
    
    // 1. DIRECT DICTIONARY MAPPING (Corrected Strings)
    const dictionary: { [key: string]: string } = {
      "साप्ताहिक": "lkIrkfgd",
      "पाठ्यक्रम": "ikB~;Øe",
      "विषय-वस्तु": "fo\"k; oLrq", // Fixed: fo"k; (Shatkon Sha)
      "विषय": "fo\"k;",           // Fixed: fo"k; (Shatkon Sha)
      "अध्यापक": "v/;kid",        // Fixed: v/;kid (Use 'i' for 'pa', not 'w')
      "अध्याय": "v/;k;",
      "गृह कार्य": "x'g dk;Z",    // Standard Kruti for Grih Karya
      "हस्ताक्षर": "gLrk{kj",
      "प्राचार्य": "izkpk;Z",
      "कक्षा": "d{kk",
      "सैक्रेड": "lSdZSM",
      "हार्ट": "gkVZ",
      "स्कूल": "Ldwy",
      "नहीं": "ugha",
      "दिया": "fn;k",
      "गया": "x;k",
      "दिनांक": "fnukad",
      "सत्र": "l=",
      "Not Submitted": "Not Submitted"
    };

    let processed = text;
    
    // Apply Dictionary replacements
    for (const [word, replacement] of Object.entries(dictionary)) {
      processed = processed.replace(new RegExp(word, 'g'), replacement);
    }

    // If fully handled by dictionary or no Hindi left, return
    if (!this.hasHindi(processed)) return processed;

    // 2. CHARACTER MAPPING (Fallback for names etc)
    const mapping: { [key: string]: string } = {
      '‘': '^', '’': '*', '“': 'Þ', '”': 'ß',
      'ा': 'k', 'ि': 'f', 'ी': 'h', 'ु': 'q', 'ू': 'w', 'ृ': "'",
      'े': 's', 'ै': 'S', 'ो': 'ks', 'ौ': 'kS', 'ं': 'a', 'ँ': '¡', 'ः': '%',
      '्': '~', 'अ': 'v', 'आ': 'vk', 'इ': 'b', 'ई': 'bZ', 'उ': 'm', 'ऊ': 'Å',
      'ए': ',', 'ऐ': ',s', 'ओ': 'vks', 'औ': 'vkS', 'क': 'd', 'ख': '[k', 'ग': 'x',
      'घ': '?', 'च': 'p', 'छ': 'N', 'ज': 't', 'झ': '>', 'ट': 'V', 'ठ': 'B',
      'ड': 'M', 'ढ': '<', 'ण': '.k', 'त': 'r', 'थ': 'F', 'द': 'n', 'ध': '/k',
      'न': 'u', 'प': 'i', 'फ': 'Q', 'ब': 'c', 'भ': 'H', 'म': 'e', 'य': ';',
      'र': 'j', 'ल': 'y', 'व': 'o', 'श': "'k", 'ष': '"k', 'स': 'l', 'ह': 'g',
      'क्ष': '{k', 'त्र': '=', 'ज्ञ': 'K',
      '(': '¼', ')': '½' // Map Brackets if needed, or keep as is
    };

    let result = '';
    for (let i = 0; i < processed.length; i++) {
      const char = processed[i];
      result += mapping[char] || char;
    }
    return result;
  }

  // ==========================================
  // 2. MAIN GENERATION LOGIC
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

    // Load fonts first
    const hindiFontName = await this.addHindiFontToDoc(doc);
    
    // =========== HEADER SECTION ===========
    
    // School Name (English)
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold'); 
    doc.setTextColor(0, 51, 102);
    doc.text('SACRED HEART SCHOOL', 105, 20, { align: 'center' });

    // School Name (Hindi)
    doc.setFontSize(16);
    doc.setFont(hindiFontName, 'normal');
    doc.text(this.toKrutiDev('सैक्रेड हार्ट स्कूल'), 105, 28, { align: 'center' });

    // Affiliation (English)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal'); 
    doc.setTextColor(100, 100, 100);
    doc.text('(Affiliated to CBSE, New Delhi, upto +2 Level)', 105, 36, { align: 'center' });

    // Title (English)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0);
    doc.text('WEEKLY SYLLABUS', 105, 48, { align: 'center' });

    // Title (Hindi)
    doc.setFontSize(14);
    doc.setFont(hindiFontName, 'normal');
    doc.text(this.toKrutiDev('साप्ताहिक पाठ्यक्रम'), 105, 56, { align: 'center' });

    // Separator Line
    doc.setLineWidth(0.8);
    doc.setDrawColor(139, 0, 0);
    doc.line(50, 58, 160, 58);

    // =========== INFO SECTION ===========
    
    const infoY = 70;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // Helper to draw Label (Eng) + Value (Eng/Hindi)
    const drawField = (label: string, value: string, x: number, y: number) => {
      // Label in English
      doc.setFont('helvetica', 'normal');
      doc.text(label, 20, y);
      
      // Value can be mixed
      if (this.hasHindi(value)) {
        doc.setFont(hindiFontName, 'normal');
        doc.text(this.toKrutiDev(value), x, y);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.text(value, x, y);
      }
    };

    drawField('Date:', weekRange, 40, infoY);
    drawField('Class & Section:', `${className} - ${section}`, 60, infoY + 8);
    drawField('Class Teacher:', classTeacherName, 60, infoY + 16);

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

    // =========== TABLE DATA PREPARATION ===========
    
    // We use '|||' to separate English (Top) and Hindi (Bottom)
    // Updated Dictionary ensures correct spellings for 'Vishay' and 'Adhyapak'
    const tableColumns = [
      { header: 'Subject|||' + this.toKrutiDev('विषय'), dataKey: 'subject', width: 30 },
      { header: 'Teacher|||' + this.toKrutiDev('अध्यापक'), dataKey: 'teacher', width: 35 },
      { header: 'Chapter|||' + this.toKrutiDev('अध्याय'), dataKey: 'chapter', width: 35 },
      { header: 'Topics|||' + this.toKrutiDev('विषय-वस्तु'), dataKey: 'topics', width: 50 },
      { header: 'Home Assignment|||' + this.toKrutiDev('गृह कार्य'), dataKey: 'homework', width: 40 }
    ];

    const tableRows: any[][] = [];
    
    // Sort teachers alphabetically
    const sortedTeachers = [...assignedTeachers].sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    sortedTeachers.forEach(teacher => {
      const assignment = teacher.assignments?.find((a: any) => 
        a.className === className && a.sections?.includes(section)
      );
      
      const subject = assignment?.subject || '---';
      const isSubmitted = submittedTeachers.some(st => st.email === teacher.email);

      let tName = teacher.name;
      if (this.hasHindi(tName)) tName = '|||' + this.toKrutiDev(tName);

      if (isSubmitted) {
        const lessonPlan = allLessonPlans.find(plan => 
          plan.teacherId === teacher.email && 
          plan.className === className && 
          plan.section === section && 
          plan.weekRange === weekRange
        );

        const check = (txt: string) => this.hasHindi(txt) ? '|||' + this.toKrutiDev(txt) : txt;

        tableRows.push([
          check(subject),
          tName,
          check(lessonPlan?.topics?.split('\n')[0]?.substring(0, 30) || '---'),
          check(lessonPlan?.topics?.substring(0, 50) || '---'),
          check(lessonPlan?.assessment?.substring(0, 50) || '---')
        ]);
      } else {
        // Missing Submission Row
        tableRows.push([
          subject, 
          tName,
          'Lesson Plan Not Submitted',
          'Lesson Plan Not Submitted',
          'Homework Not Submitted|||' + this.toKrutiDev('(गृह कार्य नहीं दिया गया)')
        ]);
      }
    });

    // =========== TABLE GENERATION (AutoTable) ===========
    
    try {
      autoTable(doc, {
        startY: infoY + 30,
        head: [tableColumns.map(col => col.header)],
        body: tableRows,
        theme: 'grid',
        
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [0, 0, 0],
          valign: 'top',
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          overflow: 'linebreak'
        },
        
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          halign: 'center',
          valign: 'middle',
          minCellHeight: 12
        },
        
        columnStyles: {
          0: { cellWidth: 30, halign: 'center' },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 35, halign: 'center' },
          3: { cellWidth: 50, halign: 'left' },
          4: { cellWidth: 40, halign: 'left' }
        },

        // 1. PRE-PROCESS CELL: Split by |||
        didParseCell: (data: any) => {
          const raw = String(data.cell.raw || '');
          
          if (raw.includes('|||')) {
             const parts = raw.split('|||');
             (data.cell as any)._rawParts = parts; 
             data.cell.text = parts.map(() => ''); 
          }
          
          if (raw.includes('Not Submitted')) {
             data.cell.styles.textColor = [220, 0, 0];
          }
        },

        // 2. MANUAL DRAW: Mixed Fonts
        didDrawCell: (data: any) => {
            const parts = (data.cell as any)._rawParts;
            if (parts) {
                const cell = data.cell;
                const x = cell.x + cell.padding('left');
                let y = cell.y + cell.padding('top') + 3;
                const lineHeight = 4;

                // Part 0: English (Helvetica)
                if (parts[0]) {
                    doc.setFont('helvetica', data.section === 'head' ? 'bold' : 'normal');
                    
                    if (parts[0].includes('Not Submitted')) doc.setTextColor(220, 0, 0);
                    else if (data.section === 'head') doc.setTextColor(255, 255, 255);
                    else doc.setTextColor(0, 0, 0);
                    
                    doc.text(parts[0], x + (data.section === 'head' ? (cell.width/2 - cell.padding('left')) : 0), y, {
                        align: data.section === 'head' ? 'center' : 'left'
                    });
                    y += lineHeight; 
                }

                // Part 1: Hindi (Kruti Dev)
                if (parts[1]) {
                    doc.setFont(hindiFontName, 'normal');
                    
                    if (parts[1].includes('Not Submitted') || (parts[0] && parts[0].includes('Not Submitted'))) 
                         doc.setTextColor(220, 0, 0);
                    else if (data.section === 'head') doc.setTextColor(255, 255, 255);
                    else doc.setTextColor(0, 0, 0);

                    doc.text(parts[1], x + (data.section === 'head' ? (cell.width/2 - cell.padding('left')) : 0), y, {
                        align: data.section === 'head' ? 'center' : 'left'
                    });
                }
            }
        },

        didDrawPage: (data: any) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            doc.internal.pageSize.width - 20,
            doc.internal.pageSize.height - 10
          );
        }
      });
      console.log('✅ AutoTable generated successfully');
    } catch (error: any) {
      console.error('❌ AutoTable failed, switching to Fallback generator:', error.message);
      this.generateSimpleTableFallback(doc, tableColumns, tableRows, infoY + 30, hindiFontName);
    }

    // =========== SUMMARY SECTION ===========
    
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    
    if (finalY < 250) {
      const summaryY = finalY + 15;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Summary:', 20, summaryY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`• Total Teachers: ${assignedTeachers.length}`, 25, summaryY + 8);
      doc.text(`• Submitted: ${submittedTeachers.length}`, 25, summaryY + 16);
      
      if (missingTeachers.length > 0) {
        doc.setTextColor(220, 0, 0); // Red
        doc.text(`• Missing: ${missingTeachers.length}`, 25, summaryY + 24);
        doc.setFont('helvetica', 'italic');
        doc.text('(Lesson Plan Not Submitted)', 25, summaryY + 32);
      }

      // =========== SIGNATURES ===========
      const sigY = Math.min(finalY + 65, 270);
      doc.setTextColor(0, 0, 0); 
      
      // Class Teacher
      doc.setFont('helvetica', 'normal');
      doc.text('Signature of Class Teacher:', 30, sigY);
      doc.setFont(hindiFontName, 'normal');
      doc.text(this.toKrutiDev('कक्षा अध्यापक के हस्ताक्षर:'), 30, sigY + 6);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(30, sigY + 8, 80, sigY + 8);
      
      // Principal
      doc.setFont('helvetica', 'normal');
      doc.text('Signature of Principal:', 120, sigY);
      doc.setFont(hindiFontName, 'normal');
      doc.text(this.toKrutiDev('प्राचार्य के हस्ताक्षर:'), 120, sigY + 6);
      doc.line(120, sigY + 8, 170, sigY + 8);
      
      // Date
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 30, sigY + 20);
    }

    // =========== FOOTER ===========
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(
      'Generated by Sacred Heart School Management System • Hindi Supported',
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );

    // =========== RETURN PDF STRING ===========
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
  // 3. FALLBACK TABLE GENERATOR (Manual Drawing)
  // ==========================================
  private static generateSimpleTableFallback(
    doc: jsPDF,
    columns: any[],
    rows: any[][],
    startY: number,
    fontName: string
  ) {
    console.log('📋 Using manual table fallback');
    
    let y = startY;
    const startX = 15;
    
    // Draw Headers
    doc.setFillColor(41, 128, 185);
    const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
    doc.rect(startX, y, totalWidth, 10, 'F');
    
    let x = startX + 5;
    columns.forEach(col => {
      const parts = col.header.split('|||');
      if (parts[0]) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(parts[0], x, y + 4);
      }
      if (parts[1]) {
        doc.setFont(fontName, 'normal');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(parts[1], x, y + 8);
      }
      x += col.width;
    });
    
    y += 12;
    
    // Draw Body Rows
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    rows.forEach((row, rowIndex) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
        doc.setFillColor(41, 128, 185);
        doc.rect(startX, y, totalWidth, 10, 'F');
        x = startX + 5;
        columns.forEach(col => {
           const parts = col.header.split('|||');
           if(parts[0]) {
               doc.setFont('helvetica', 'bold');
               doc.setTextColor(255,255,255);
               doc.text(parts[0], x, y+4);
           }
           if(parts[1]) {
               doc.setFont(fontName, 'normal');
               doc.setTextColor(255,255,255);
               doc.text(parts[1], x, y+8);
           }
           x += col.width;
        });
        doc.setTextColor(0, 0, 0);
        y += 12;
      }
      
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(startX, y, totalWidth, 10, 'F');
      }
      
      x = startX + 5;
      row.forEach((cell, cellIndex) => {
        const rawText = String(cell);
        const parts = rawText.includes('|||') ? rawText.split('|||') : [rawText];
        
        let localY = y + 5;
        parts.forEach((part, pIdx) => {
            if (!part) return;
            if (this.hasHindi(part) || pIdx === 1) doc.setFont(fontName, 'normal');
            else doc.setFont('helvetica', 'normal');
            
            if (part.includes('Not Submitted')) doc.setTextColor(220, 0, 0);
            else doc.setTextColor(0, 0, 0);
            
            doc.text(part.substring(0, 25), x, localY);
            localY += 4;
        });
        
        x += columns[cellIndex].width;
      });
      y += 12;
    });
  }

  // ==========================================
  // 4. BATCH & HELPERS
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
    
    console.log(`🚀 Batch generating PDFs for ${classTeachers.length} class teachers`);
    
    for (const teacher of classTeachers) {
      try {
        if (!teacher.classTeacherOf) continue;
        const { className, section } = teacher.classTeacherOf;
        
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
      } catch (error: any) {
        console.error(`❌ Failed for ${teacher.name}:`, error.message);
      }
    }
    return results;
  }

  static getWeekRangeFromDate(date: Date = new Date()): string {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-IN')} to ${end.toLocaleDateString('en-IN')}`;
  }

  static async generateAndDownload(cls: string, sec: string, wk: string, tech: string, plans: any[], teachers: any[]) {
    const pdf = await this.generatePDFFromLessonPlans(cls, sec, wk, tech, plans, teachers);
    this.downloadPDF(pdf, `Syllabus_${cls}_${sec}.pdf`);
  }

  static async generateSimplePDF(data: any) {
    const allTeachers = data.subjects.map((s:any) => ({
      name: s.teacher,
      email: 'temp@school.com',
      assignments: [{ className: data.className, sections: [data.section], subject: s.subject }]
    }));
    const allPlans = data.subjects.filter((s:any) => s.submitted).map((s:any) => ({
      teacherId: 'temp@school.com',
      className: data.className,
      section: data.section,
      weekRange: data.weekRange,
      topics: s.topics,
      assessment: s.homework
    }));
    return await this.generatePDFFromLessonPlans(data.className, data.section, data.weekRange, data.classTeacher, allPlans, allTeachers);
  }

  static downloadPDF(base64: string, name: string) {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = name;
    link.click();
  }
}

export const Rd = PDFGenerator;
