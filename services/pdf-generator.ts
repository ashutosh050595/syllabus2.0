import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FontLoader } from './utils/FontLoader';

export class PDFGenerator {
  private static fontsRegistered = false;
  private static fonts = {
    notoSansDevanagari: {
      regular: '',
      bold: ''
    }
  };

  // Load and register fonts
  private static async loadAndRegisterFonts(doc: jsPDF): Promise<boolean> {
    if (this.fontsRegistered) return true;

    try {
      console.log('🔄 Loading fonts...');
      
      // Load regular font
      try {
        const regularFont = await FontLoader.loadFont('NotoSansDevanagari-Regular.ttf');
        this.fonts.notoSansDevanagari.regular = regularFont;
        
        doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', regularFont);
        doc.addFont('NotoSansDevanagari-Regular.ttf', 'NotoSansDevanagari', 'normal');
        
        console.log('✅ Regular font registered');
      } catch (error) {
        console.warn('⚠️ Regular font not available');
      }

      // Try to load bold font (optional)
      try {
        const boldFont = await FontLoader.loadFont('NotoSansDevanagari-Bold.ttf');
        this.fonts.notoSansDevanagari.bold = boldFont;
        
        doc.addFileToVFS('NotoSansDevanagari-Bold.ttf', boldFont);
        doc.addFont('NotoSansDevanagari-Bold.ttf', 'NotoSansDevanagari', 'bold');
        
        console.log('✅ Bold font registered');
      } catch (error) {
        console.log('ℹ️ Bold font not available, using regular as bold');
      }

      this.fontsRegistered = true;
      return true;

    } catch (error) {
      console.error('❌ Failed to register fonts:', error);
      return false;
    }
  }

  // Check for Devanagari text
  private static isDevanagari(text: string): boolean {
    if (!text) return false;
    return /[\u0900-\u097F]/.test(text);
  }

  // Set appropriate font
  private static setFont(doc: jsPDF, text: string, style: 'normal' | 'bold' = 'normal'): void {
    if (this.isDevanagari(text) && this.fontsRegistered) {
      try {
        if (style === 'bold') {
          // Try bold font, fallback to regular
          try {
            doc.setFont('NotoSansDevanagari', 'bold');
          } catch {
            doc.setFont('NotoSansDevanagari', 'normal');
          }
        } else {
          doc.setFont('NotoSansDevanagari', 'normal');
        }
      } catch {
        // Fallback to Helvetica
        doc.setFont('helvetica', style);
      }
    } else {
      doc.setFont('helvetica', style);
    }
  }

  // Main PDF generation function (Async version)
  static async generatePDFAsync(
    className: string,
    section: string,
    weekRange: string,
    classTeacherName: string,
    subjectsData: Array<{
      subject: string;
      teacher: string;
      chapter: string;
      topics: string;
      homework: string;
      submitted: boolean;
    }>
  ): Promise<string> {
    console.log(`📊 Generating PDF for ${className}-${section}`);
    
    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Load fonts
    await this.loadAndRegisterFonts(doc);

    // =========== HEADER SECTION ===========
    
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

    // Weekly Syllabus Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0);
    doc.text('WEEKLY SYLLABUS', 105, 48, { align: 'center' });

    // Weekly Syllabus Hindi Title
    doc.setFontSize(14);
    this.setFont(doc, 'साप्ताहिक पाठ्यक्रम', 'bold');
    doc.text('साप्ताहिक पाठ्यक्रम', 105, 56, { align: 'center' });

    // Underline
    doc.setLineWidth(0.8);
    doc.setDrawColor(139, 0, 0);
    doc.line(50, 58, 160, 58);

    // =========== INFORMATION SECTION ===========
    
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

    // =========== TABLE DATA ===========
    
    const tableColumns = [
      { header: 'Subject\nविषय', width: 30 },
      { header: 'Teacher\nअध्यापक', width: 35 },
      { header: 'Chapter\nअध्याय', width: 35 },
      { header: 'Topics\nविषय-वस्तु', width: 50 },
      { header: 'Home Assignment\nगृह कार्य', width: 40 }
    ];

    const tableRows = subjectsData.map(item => [
      item.subject,
      item.teacher,
      item.chapter || '---',
      item.topics || '---',
      item.submitted 
        ? (item.homework || '---')
        : 'Homework Not Submitted\n(गृह कार्य नहीं दिया गया)'
    ]);

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
          lineColor: [200, 200, 200]
        },
        columnStyles: {
          0: { cellWidth: 30, halign: 'center' },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 35, halign: 'center' },
          3: { cellWidth: 50, halign: 'left' },
          4: { cellWidth: 40, halign: 'left' }
        },
        didParseCell: (data: any) => {
          // Apply Hindi font to Hindi text
          const cellText = data.cell.text?.join(' ') || '';
          if (this.isDevanagari(cellText) && this.fontsRegistered) {
            data.cell.styles.font = 'NotoSansDevanagari';
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
    const total = subjectsData.length;
    const submitted = subjectsData.filter(s => s.submitted).length;
    const missing = total - submitted;

    // Summary
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 20, finalY + 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`• Total Teachers: ${total}`, 25, finalY + 25);
    doc.text(`• Submitted: ${submitted}`, 25, finalY + 33);
    
    if (missing > 0) {
      doc.setTextColor(220, 0, 0);
      doc.text(`• Missing: ${missing}`, 25, finalY + 41);
    }

    // Signatures
    const signatureY = finalY + 60;
    doc.setTextColor(0, 0, 0);
    
    // Class Teacher
    doc.text('Signature of Class Teacher:', 30, signatureY);
    this.setFont(doc, 'कक्षा अध्यापक के हस्ताक्षर');
    doc.text('कक्षा अध्यापक के हस्ताक्षर:', 30, signatureY + 6);
    doc.line(30, signatureY + 8, 80, signatureY + 8);
    
    // Principal
    doc.setFont('helvetica', 'normal');
    doc.text('Signature of Principal:', 120, signatureY);
    this.setFont(doc, 'प्राचार्य के हस्ताक्षर');
    doc.text('प्राचार्य के हस्ताक्षर:', 120, signatureY + 6);
    doc.line(120, signatureY + 8, 170, signatureY + 8);

    // Footer
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
    return doc.output('datauristring').split(',')[1];
  }

  // Sync wrapper for compatibility
  static generatePDF(
    className: string,
    section: string,
    weekRange: string,
    classTeacherName: string,
    subjectsData: any[]
  ): string {
    throw new Error('Use generatePDFAsync instead. This function is deprecated.');
  }

  // Download helper
  static downloadPDF(base64String: string, fileName: string = 'Weekly_Syllabus.pdf'): void {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64String}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
