import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==========================================
// CONFIGURATION
// Ensure 'Kruti_Dev_010.ttf' is in your public/fonts/ folder
// ==========================================
const HINDI_FONT_URL = '/fonts/Kruti_Dev_010.ttf'; 

export class PDFGenerator {
  
  // ==========================================
  // SECTION 1: FONT HANDLING & TEXT UTILITIES
  // ==========================================

  /**
   * Loads the Kruti Dev font asynchronously and registers it with jsPDF.
   * Handles large file sizes by processing in chunks to avoid stack overflow.
   * This is crucial for ensuring the custom font works in the browser.
   */
  private static async addHindiFontToDoc(doc: jsPDF): Promise<string> {
    try {
      // console.log(`📥 Fetching font from: ${HINDI_FONT_URL}`);
      const response = await fetch(HINDI_FONT_URL);
      
      if (!response.ok) {
        throw new Error(`Font fetch failed: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      
      // Convert ArrayBuffer to Binary String carefully using chunks
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      const CHUNK_SIZE = 8192;
      
      // Process in chunks to avoid stack overflow errors on large fonts
      for (let i = 0; i < len; i += CHUNK_SIZE) {
        binary += String.fromCharCode.apply(
          null, 
          Array.from(bytes.subarray(i, Math.min(i + CHUNK_SIZE, len)))
        );
      }
      
      const base64Font = window.btoa(binary);
      
      // Register font in jsPDF VFS (Virtual File System)
      doc.addFileToVFS('Kruti_Dev_010.ttf', base64Font);
      doc.addFont('Kruti_Dev_010.ttf', 'KrutiDev', 'normal');
      
      return 'KrutiDev';
    } catch (error) {
      console.warn('⚠️ Could not load Kruti Dev font, using fallback to Helvetica', error);
      return 'helvetica';
    }
  }

  /**
   * Checks if a string contains Hindi (Devanagari) characters.
   * Used to decide when to switch fonts between Helvetica and Kruti Dev.
   */
  private static hasHindi(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    return /[\u0900-\u097F]/.test(text);
  }

  /**
   * Converts Unicode Hindi text to Kruti Dev encoding.
   * Essential for rendering 'Matras' and 'Half-characters' correctly.
   * Includes specific fixes for: Adhyapak, Vishay, Home Assignment, Brackets, Sacred.
   */
  private static toKrutiDev(text: string): string {
    if (!text) return '';
    
    // 1. EXACT DICTIONARY MAPPING
    // Using Hex Codes to ensure absolute correctness irrespective of file encoding
    const dictionary: { [key: string]: string } = {
      // Headers
      "साप्ताहिक": "lkIrkfgd",
      "पाठ्यक्रम": "ikB~;\xD8e", // Fixed: Uses Ø (\xD8) for Kra
      "विषय-वस्तु": "fo\"k; oLrq", // Double quote for 'Sha'
      "विषय": "fo\"k;",           // Double quote for 'Sha'
      "अध्यापक": "v/;kid",        // 'i' for 'pa'
      "अध्याय": "v/;k;",
      
      // FIXED: Grih Karya using Backtick (\x60) for Ri Matra
      "गृह कार्य": "x\x60g dk;Z", 
      
      // FIXED: Sacred Heart School using Ø (\xD8) for Kra
      "सैक्रेड हार्ट स्कूल": "lS\xD8sM gkVZ Ldwy", 
      "सैक्रेड": "lS\xD8sM",

      // Signatures - Explicitly removing colons from the value to prevent 'Ru'
      "हस्ताक्षर": "gLrk{kj",
      "कक्षा अध्यापक के हस्ताक्षर": "d{kk v/;kid ds gLrk{kj",
      "प्राचार्य के हस्ताक्षर": "izkpk;Z ds gLrk{kj",

      // Common Words
      "प्राचार्य": "izkpk;Z",
      "कक्षा": "d{kk",
      "हार्ट": "gkVZ",
      "स्कूल": "Ldwy",
      "नहीं": "ugha",
      "दिया": "fn;k",
      "गया": "x;k",
      "दिनांक": "fnukad",
      "सत्र": "l=",
      
      // Full Phrases with Fixed Brackets using Hex \xBC (¼) and \xBD (½)
      "(गृह कार्य नहीं दिया गया)": "\xBCx\x60g dk;Z ugha fn;k x;k\xBD", 
      
      "Not Submitted": "Not Submitted" // Keep English as is
    };

    let processed = text;
    
    // Apply Dictionary replacements
    for (const [word, replacement] of Object.entries(dictionary)) {
      // Escape regex special characters
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      processed = processed.replace(new RegExp(escapedWord, 'g'), replacement);
    }

    // If fully handled by dictionary or no Hindi left, return
    if (!this.hasHindi(processed)) return processed;

    // 2. CHARACTER MAPPING (Fallback for dynamic names)
    const mapping: { [key: string]: string } = {
      // Matras
      '‘': '^', '’': '*', '“': 'Þ', '”': 'ß',
      'ा': 'k', 'ि': 'f', 'ी': 'h', 'ु': 'q', 'ू': 'w', 
      'ृ': "\x60", // Backtick for Ri Matra
      'े': 's', 'ै': 'S', 'ो': 'ks', 'ौ': 'kS', 'ं': 'a', 'ँ': '¡', 'ः': '%',
      '्': '~', 
      
      // Vowels
      'अ': 'v', 'आ': 'vk', 'इ': 'b', 'ई': 'bZ', 'उ': 'm', 'ऊ': 'Å',
      'ए': ',', 'ऐ': ',s', 'ओ': 'vks', 'औ': 'vkS',
      
      // Consonants
      'क': 'd', 'ख': '[k', 'ग': 'x', 'घ': '?', 'ङ': '³',
      'च': 'p', 'छ': 'N', 'ज': 't', 'झ': '>', 'ञ': '¥',
      'ट': 'V', 'ठ': 'B', 'ड': 'M', 'ढ': '<', 'ण': '.k',
      'त': 'r', 'थ': 'F', 'द': 'n', 'ध': '/k', 'न': 'u',
      'प': 'i', 'फ': 'Q', 'ब': 'c', 'भ': 'H', 'म': 'e',
      'य': ';', 'र': 'j', 'ल': 'y', 'व': 'o',
      'श': "'k", 'ष': '"k', 'स': 'l', 'ह': 'g',
      'क्ष': '{k', 'त्र': '=', 'ज्ञ': 'K', 'श्र': 'J',
      
      // Symbols & Brackets Fix
      '(': '\xBC', // Hex for Open Bracket (¼)
      ')': '\xBD', // Hex for Close Bracket (½)
      ':': ''      // Remove colon to prevent garbage
    };

    let result = '';
    for (let i = 0; i < processed.length; i++) {
      const char = processed[i];
      result += mapping[char] || char;
    }
    return result;
  }

  // ==========================================
  // SECTION 2: MAIN PDF GENERATION LOGIC
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
    doc.setTextColor(0, 51, 102); // Dark Blue
    doc.text('SACRED HEART SCHOOL', 105, 20, { align: 'center' });

    // School Name (Hindi)
    doc.setFontSize(16);
    doc.setFont(hindiFontName, 'normal'); // Switch to Kruti Dev
    // Using corrected mapping for Sacred (lS\xD8sM)
    doc.text(this.toKrutiDev('सैक्रेड हार्ट स्कूल'), 105, 28, { align: 'center' });

    // Affiliation (English)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal'); 
    doc.setTextColor(100, 100, 100); // Grey
    doc.text('(Affiliated to CBSE, New Delhi, upto +2 Level)', 105, 36, { align: 'center' });

    // Title (English)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0); // Dark Red
    doc.text('WEEKLY SYLLABUS', 105, 48, { align: 'center' });

    // Title (Hindi)
    doc.setFontSize(14);
    doc.setFont(hindiFontName, 'normal');
    // Using corrected mapping for Pathyakram
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

    // Filter teachers assigned to this class/section
    const assignedTeachers = allTeachers.filter(teacher => {
      if (!teacher.assignments) return false;
      return teacher.assignments.some((assignment: any) => 
        assignment.className === className && 
        assignment.sections?.includes(section)
      );
    });

    // Identify who submitted plans
    const submittedTeachers = assignedTeachers.filter(teacher => 
      allLessonPlans.some(plan => 
        plan.teacherId === teacher.email && 
        plan.className === className && 
        plan.section === section && 
        plan.weekRange === weekRange
      )
    );

    // Identify missing
    const missingTeachers = assignedTeachers.filter(teacher => 
      !submittedTeachers.includes(teacher)
    );

    console.log(`👨‍🏫 Total: ${assignedTeachers.length}, Submitted: ${submittedTeachers.length}, Missing: ${missingTeachers.length}`);

    // =========== TABLE DATA PREPARATION ===========
    
    // IMPORTANT: We use '|||' to separate English (Top) and Hindi (Bottom)
    // The dictionary now contains completely corrected spellings
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

      // Handle Teacher Name (If Hindi, mark with |||)
      let tName = teacher.name;
      if (this.hasHindi(tName)) {
        tName = '|||' + this.toKrutiDev(tName);
      }

      if (isSubmitted) {
        const lessonPlan = allLessonPlans.find(plan => 
          plan.teacherId === teacher.email && 
          plan.className === className && 
          plan.section === section && 
          plan.weekRange === weekRange
        );

        // Helper to check/convert each field
        const check = (txt: string) => this.hasHindi(txt) ? '|||' + this.toKrutiDev(txt) : txt;

        tableRows.push([
          check(subject),
          tName,
          check(lessonPlan?.topics?.split('\n')[0]?.substring(0, 30) || '---'),
          check(lessonPlan?.topics?.substring(0, 50) || '---'),
          check(lessonPlan?.assessment?.substring(0, 50) || '---')
        ]);
      } else {
        // Missing Submission Row - MIXED TEXT
        // "Homework Not Submitted" has Hindi translation with fixed brackets
        tableRows.push([
          subject, // English
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
        
        // Default Styles (English/Helvetica)
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [0, 0, 0],
          valign: 'top',
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          overflow: 'linebreak'
        },
        
        // Header Styles
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          halign: 'center',
          valign: 'middle',
          minCellHeight: 12
        },
        
        // Column Widths
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
          
          // If separator exists, split it for manual drawing
          if (raw.includes('|||')) {
             const parts = raw.split('|||');
             (data.cell as any)._rawParts = parts; // Store parts for drawing
             data.cell.text = parts.map(() => ''); // Clear default text
          }
          
          // Color logic for Missing Submissions
          if (raw.includes('Not Submitted')) {
             data.cell.styles.textColor = [220, 0, 0]; // Red
          }
        },

        // 2. MANUAL DRAW: The Magic Fix for Mixed Fonts
        didDrawCell: (data: any) => {
            const parts = (data.cell as any)._rawParts;
            if (parts) {
                const cell = data.cell;
                const x = cell.x + cell.padding('left');
                let y = cell.y + cell.padding('top') + 3; // +3 approx for baseline
                const lineHeight = 4;

                // Part 0: English (Helvetica)
                if (parts[0]) {
                    doc.setFont('helvetica', data.section === 'head' ? 'bold' : 'normal');
                    
                    // Set color (Red if missing, White if header, else Black)
                    if (parts[0].includes('Not Submitted')) doc.setTextColor(220, 0, 0);
                    else if (data.section === 'head') doc.setTextColor(255, 255, 255);
                    else doc.setTextColor(0, 0, 0);
                    
                    // Center align for headers, else left
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

        // Footer Page Numbers
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
      // CALL FALLBACK IF AUTOTABLE FAILS
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
        
        // "Lesson Plan Not Submitted" is English
        doc.setFont('helvetica', 'italic');
        doc.text('(Lesson Plan Not Submitted)', 25, summaryY + 32);
      }

      // =========== SIGNATURES ===========
      const sigY = Math.min(finalY + 65, 270);
      doc.setTextColor(0, 0, 0); // Black
      
      // Class Teacher
      doc.setFont('helvetica', 'normal');
      doc.text('Signature of Class Teacher:', 30, sigY);
      
      // Hindi Signature (Fixed: No colon)
      doc.setFont(hindiFontName, 'normal');
      doc.text(this.toKrutiDev('कक्षा अध्यापक के हस्ताक्षर'), 30, sigY + 6); 
      
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(30, sigY + 8, 80, sigY + 8);
      
      // Principal
      doc.setFont('helvetica', 'normal');
      doc.text('Signature of Principal:', 120, sigY);
      
      // Hindi Signature (Fixed: No colon)
      doc.setFont(hindiFontName, 'normal');
      doc.text(this.toKrutiDev('प्राचार्य के हस्ताक्षर'), 120, sigY + 6); 
      
      doc.line(120, sigY + 8, 170, sigY + 8);
      
      // Generation Date
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
  // SECTION 3: FALLBACK TABLE GENERATOR (Manual Drawing)
  // This is used if autoTable crashes - Full Implementation
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
      // Split header by |||
      const parts = col.header.split('|||');
      
      // English Part
      if (parts[0]) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(parts[0], x, y + 4);
      }
      
      // Hindi Part
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
      // Page Break Check
      if (y > 270) {
        doc.addPage();
        y = 20;
        // Redraw Header
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
      
      // Zebra Striping
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(startX, y, totalWidth, 10, 'F');
      }
      
      x = startX + 5;
      row.forEach((cell, cellIndex) => {
        const rawText = String(cell);
        const parts = rawText.includes('|||') ? rawText.split('|||') : [rawText];
        
        let localY = y + 5;
        
        // Draw Parts (English then Hindi)
        parts.forEach((part, pIdx) => {
            if (!part) return;
            
            // Check font
            if (this.hasHindi(part) || pIdx === 1) { // Usually 2nd part is Hindi
                doc.setFont(fontName, 'normal');
            } else {
                doc.setFont('helvetica', 'normal');
            }
            
            // Color Logic
            if (part.includes('Not Submitted')) {
                doc.setTextColor(220, 0, 0);
            } else {
                doc.setTextColor(0, 0, 0);
            }
            
            doc.text(part.substring(0, 25), x, localY);
            localY += 4;
        });
        
        x += columns[cellIndex].width;
      });
      
      y += 12; // Row Height
    });
  }

  // ==========================================
  // SECTION 4: BATCH GENERATION & HELPER WRAPPERS
  // ==========================================

  // Batch Generation for All Classes
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
        if (!teacher.classTeacherOf) {
          console.warn(`⚠️ ${teacher.name} skipped: No class assigned`);
          continue;
        }
        
        const { className, section } = teacher.classTeacherOf;
        
        // Await generation
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
        
        console.log(`✅ Success: ${className}-${section}`);
      } catch (error: any) {
        console.error(`❌ Failed for ${teacher.name}:`, error.message);
      }
    }
    
    return results;
  }

  // Utility: Calculate current week range
  static getWeekRangeFromDate(date: Date = new Date()): string {
    const start = new Date(date);
    const day = start.getDay();
    // Adjust to Monday (assuming week starts Mon)
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

  // Simple Wrapper (Adapter for simplified calls)
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
    // Adapter logic to convert simple data structure to expected full structure
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

  // Browser Download Helper
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
      // Last resort fallback
      const pdfWindow = window.open();
      if (pdfWindow) {
        pdfWindow.document.write(
          `<iframe width='100%' height='100%' src='data:application/pdf;base64,${base64String}'></iframe>`
        );
      }
    }
  }

  // One-step Generate and Download
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

// Alias for backward compatibility with old code
export const Rd = PDFGenerator;
