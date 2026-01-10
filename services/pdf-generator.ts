import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Font URLs
const FONT_URLS = {
  regular: '/fonts/NotoSansDevanagari-Regular.ttf',
  bold: '/fonts/NotoSansDevanagari-Bold.ttf'
};

export class PDFGenerator {
  private static fontsRegistered = false;
  private static fontPromises: Map<string, Promise<string>> = new Map();

  // Load font from public folder
  private static async loadFont(url: string): Promise<string> {
    if (this.fontPromises.has(url)) {
      return this.fontPromises.get(url)!;
    }

    const fontPromise = (async () => {
      try {
        console.log(`📥 Loading font: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch font: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error(`Error loading font: ${error}`);
        throw error;
      }
    })();

    this.fontPromises.set(url, fontPromise);
    return fontPromise;
  }

  // Register fonts
  private static async registerFonts(doc: jsPDF): Promise<boolean> {
    if (this.fontsRegistered) return true;

    try {
      console.log('Registering fonts...');
      
      // Load regular font
      try {
        const regularFont = await this.loadFont(FONT_URLS.regular);
        doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', regularFont);
        doc.addFont('NotoSansDevanagari-Regular.ttf', 'NotoSansDevanagari', 'normal');
        console.log('✅ Regular font registered');
      } catch (error) {
        console.warn('Could not load regular font');
      }

      // Load bold font
      try {
        const boldFont = await this.loadFont(FONT_URLS.bold);
        doc.addFileToVFS('NotoSansDevanagari-Bold.ttf', boldFont);
        doc.addFont('NotoSansDevanagari-Bold.ttf', 'NotoSansDevanagari', 'bold');
        console.log('✅ Bold font registered');
      } catch (error) {
        console.log('Bold font not available');
      }

      this.fontsRegistered = true;
      return true;
      
    } catch (error) {
      console.error('Font registration failed:', error);
      return false;
    }
  }

  // Check for Devanagari text
  private static isDevanagari(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    return /[\u0900-\u097F]/.test(text);
  }

  // Set font
  private static setFont(doc: jsPDF, text: string, style: 'normal' | 'bold' = 'normal'): void {
    if (this.isDevanagari(text) && this.fontsRegistered) {
      try {
        doc.setFont('NotoSansDevanagari', style);
      } catch {
        doc.setFont('helvetica', style);
      }
    } else {
      doc.setFont('helvetica', style);
    }
  }

  // ✅ **FIXED FUNCTION NAME: generatePDFFromLessonPlans**
  static async generatePDFFromLessonPlans(
    className: string,
    section: string,
    weekRange: string,
    classTeacherName: string,
    allLessonPlans: any[],
    allTeachers: any[]
  ): Promise<string> {
    console.log(`📊 Generating PDF for ${className}-${section}`);
    
    try {
      // Create PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Register fonts
      await this.registerFonts(doc);

      // =========== HEADER ===========
      
      // School Name (English)
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text('SACRED HEART SCHOOL', 105, 20, { align: 'center' });

      // School Name (Hindi)
      doc.setFontSize(16);
      this.setFont(doc, 'सैक्रेड हार्ट स्कूल', 'bold');
      doc.text('सैक्रेड हार्ट स्कूल', 105, 28, { align: 'center' });

      // CBSE Affiliation
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('(Affiliated to CBSE, New Delhi, upto +2 Level)', 105, 36, { align: 'center' });

      // Weekly Syllabus
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 0, 0);
      doc.text('WEEKLY SYLLABUS', 105, 48, { align: 'center' });

      // Weekly Syllabus Hindi
      doc.setFontSize(14);
      this.setFont(doc, 'साप्ताहिक पाठ्यक्रम', 'bold');
      doc.text('साप्ताहिक पाठ्यक्रम', 105, 56, { align: 'center' });

      // Underline
      doc.setLineWidth(0.8);
      doc.setDrawColor(139, 0, 0);
      doc.line(50, 58, 160, 58);

      // =========== INFO SECTION ===========
      
      const infoY = 70;
      
      // Date
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Date:', 20, infoY);
      doc.setFont('helvetica', 'bold');
      doc.text(weekRange, 40, infoY);

      // Class & Section
      doc.setFont('helvetica', 'normal');
      doc.text('Class & Section:', 20, infoY + 8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${className} - ${section}`, 55, infoY + 8);

      // Class Teacher
      doc.setFont('helvetica', 'normal');
      doc.text('Class Teacher:', 20, infoY + 16);
      doc.setFont('helvetica', 'bold');
      this.setFont(doc, classTeacherName, 'bold');
      doc.text(classTeacherName, 50, infoY + 16);

      // =========== GET TEACHERS DATA ===========
      
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

      console.log(`Total: ${assignedTeachers.length}, Submitted: ${submittedTeachers.length}, Missing: ${missingTeachers.length}`);

      // =========== TABLE DATA ===========
      
      const tableColumns = [
        { header: 'Subject\nविषय', width: 30 },
        { header: 'Teacher\nअध्यापक', width: 35 },
        { header: 'Chapter\nअध्याय', width: 35 },
        { header: 'Topics\nविषय-वस्तु', width: 50 },
        { header: 'Home Assignment\nगृह कार्य', width: 40 }
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
            teacher.name,
            lessonPlan?.topics?.split('\n')[0]?.substring(0, 30) || '---',
            lessonPlan?.topics?.substring(0, 50) || '---',
            lessonPlan?.assessment?.substring(0, 50) || '---'
          ]);
        } else {
          // Missing submission
          tableRows.push([
            subject,
            teacher.name,
            '---',
            '---',
            'Homework Not Submitted\n(गृह कार्य नहीं दिया गया)'
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
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'center',
            valign: 'middle'
          },
          bodyStyles: {
            fontSize: 9,
            cellPadding: 4,
            lineColor: [200, 200, 200],
            overflow: 'linebreak'
          },
          columnStyles: {
            0: { cellWidth: 30, halign: 'center' },
            1: { cellWidth: 35, halign: 'center' },
            2: { cellWidth: 35, halign: 'center' },
            3: { cellWidth: 50, halign: 'left' },
            4: { cellWidth: 40, halign: 'left' }
          },
          didParseCell: (data: any) => {
            // Apply Hindi font
            const cellText = data.cell.text?.join(' ') || '';
            if (this.isDevanagari(cellText) && this.fontsRegistered) {
              try {
                data.cell.styles.font = 'NotoSansDevanagari';
              } catch {
                // Fallback
              }
            }
            
            // Highlight missing homework
            if (data.column.index === 4 && cellText.includes('Not Submitted')) {
              data.cell.styles.textColor = [220, 0, 0];
              data.cell.styles.fontStyle = 'italic';
            }
          }
        });
      } catch (error) {
        console.error('Table error:', error);
      }

      // =========== SUMMARY ===========
      
      const finalY = (doc as any).lastAutoTable?.finalY || 200;
      
      // Summary
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
      }

      // Signatures
      const signatureY = finalY + 60;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Class Teacher
      doc.text('Signature of Class Teacher:', 30, signatureY);
      this.setFont(doc, 'कक्षा अध्यापक के हस्ताक्षर');
      doc.text('कक्षा अध्यापक के हस्ताक्षर:', 30, signatureY + 6);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(30, signatureY + 8, 80, signatureY + 8);
      
      // Principal
      doc.text('Signature of Principal:', 120, signatureY);
      this.setFont(doc, 'प्राचार्य के हस्ताक्षर');
      doc.text('प्राचार्य के हस्ताक्षर:', 120, signatureY + 6);
      doc.line(120, signatureY + 8, 170, signatureY + 8);
      
      // Date
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 30, signatureY + 20);

      // =========== FOOTER ===========
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(
        'Generated by Sacred Heart School Management System',
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );

      // Return PDF
      const pdfOutput = doc.output('datauristring');
      const base64String = pdfOutput.split(',')[1];
      console.log('✅ PDF generated successfully');
      return base64String;
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw error;
    }
  }

  // ✅ **Alternative function with simpler parameters**
  static async generatePDF(data: {
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
    console.log('Generating PDF with simplified data...');
    
    // Convert to the format expected by generatePDFFromLessonPlans
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
        topics: subject.topics,
        assessment: subject.homework
      }));

    return this.generatePDFFromLessonPlans(
      data.className,
      data.section,
      data.weekRange,
      data.classTeacher,
      allLessonPlans,
      allTeachers
    );
  }

  // Download helper
  static downloadPDF(base64String: string, fileName: string): void {
    try {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${base64String}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    }
  }
}

// ✅ **Alias for backward compatibility**
export const Rd = PDFGenerator;
