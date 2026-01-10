import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Font URLs - Directly use from public folder
const FONT_URLS = {
  regular: '/fonts/NotoSansDevanagari-Regular.ttf',
  bold: '/fonts/NotoSansDevanagari-Bold.ttf'
};

export class PDFGenerator {
  private static fontsRegistered = false;
  private static fontPromises: Map<string, Promise<string>> = new Map();

  // Load font as binary and convert to base64 dynamically
  private static async loadFont(url: string): Promise<string> {
    if (this.fontPromises.has(url)) {
      return this.fontPromises.get(url)!;
    }

    const fontPromise = (async () => {
      try {
        console.log(`📥 Loading font: ${url}`);
        
        // Fetch font file
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch font: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        // Convert blob to base64
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            // Remove data URL prefix (e.g., "data:application/octet-stream;base64,")
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error(`❌ Error loading font from ${url}:`, error);
        throw error;
      }
    })();

    this.fontPromises.set(url, fontPromise);
    return fontPromise;
  }

  // Register fonts with jsPDF
  private static async registerFonts(doc: jsPDF): Promise<boolean> {
    if (this.fontsRegistered) return true;

    try {
      console.log('🔄 Registering fonts...');
      
      // Load regular font
      try {
        const regularFontBase64 = await this.loadFont(FONT_URLS.regular);
        doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', regularFontBase64);
        doc.addFont('NotoSansDevanagari-Regular.ttf', 'NotoSansDevanagari', 'normal');
        console.log('✅ Regular font registered');
      } catch (error) {
        console.warn('⚠️ Could not load regular font, using fallback');
      }

      // Try to load bold font
      try {
        const boldFontBase64 = await this.loadFont(FONT_URLS.bold);
        doc.addFileToVFS('NotoSansDevanagari-Bold.ttf', boldFontBase64);
        doc.addFont('NotoSansDevanagari-Bold.ttf', 'NotoSansDevanagari', 'bold');
        console.log('✅ Bold font registered');
      } catch (error) {
        console.log('ℹ️ Bold font not available, will use regular for bold text');
      }

      this.fontsRegistered = true;
      return true;
      
    } catch (error) {
      console.error('❌ Font registration failed:', error);
      return false;
    }
  }

  // Check if text contains Devanagari
  private static isDevanagari(text: string): boolean {
    return /[\u0900-\u097F]/.test(text);
  }

  // Set appropriate font
  private static setFont(doc: jsPDF, text: string, style: 'normal' | 'bold' = 'normal'): void {
    if (this.isDevanagari(text) && this.fontsRegistered) {
      try {
        if (style === 'bold') {
          // Try bold, fallback to regular
          try {
            doc.setFont('NotoSansDevanagari', 'bold');
          } catch {
            doc.setFont('NotoSansDevanagari', 'normal');
          }
        } else {
          doc.setFont('NotoSansDevanagari', 'normal');
        }
      } catch {
        doc.setFont('helvetica', style);
      }
    } else {
      doc.setFont('helvetica', style);
    }
  }

  // Main PDF generation function (Async)
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
    console.log('📊 Generating PDF...');
    
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
      doc.text(data.weekRange, 40, infoY);

      // Class & Section
      doc.setFont('helvetica', 'normal');
      doc.text('Class & Section:', 20, infoY + 8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${data.className} - ${data.section}`, 55, infoY + 8);

      // Class Teacher
      doc.setFont('helvetica', 'normal');
      doc.text('Class Teacher:', 20, infoY + 16);
      doc.setFont('helvetica', 'bold');
      this.setFont(doc, data.classTeacher, 'bold');
      doc.text(data.classTeacher, 50, infoY + 16);

      // =========== TABLE ===========
      
      const tableColumns = [
        { header: 'Subject\nविषय', width: 30 },
        { header: 'Teacher\nअध्यापक', width: 35 },
        { header: 'Chapter\nअध्याय', width: 35 },
        { header: 'Topics\nविषय-वस्तु', width: 50 },
        { header: 'Home Assignment\nगृह कार्य', width: 40 }
      ];

      const tableRows = data.subjects.map(subject => [
        subject.subject,
        subject.teacher,
        subject.chapter || '---',
        subject.topics || '---',
        subject.submitted 
          ? (subject.homework || '---')
          : 'Homework Not Submitted\n(गृह कार्य नहीं दिया गया)'
      ]);

      // Generate table
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
          didParseCell: (tableData: any) => {
            // Apply Hindi font
            const cellText = tableData.cell.text?.join(' ') || '';
            if (this.isDevanagari(cellText) && this.fontsRegistered) {
              try {
                tableData.cell.styles.font = 'NotoSansDevanagari';
              } catch {
                // Fallback
              }
            }
            
            // Highlight missing homework
            if (tableData.column.index === 4 && cellText.includes('Not Submitted')) {
              tableData.cell.styles.textColor = [220, 0, 0];
              tableData.cell.styles.fontStyle = 'italic';
            }
          }
        });
      } catch (error) {
        console.error('Table error:', error);
      }

      // =========== SUMMARY ===========
      
      const finalY = (doc as any).lastAutoTable?.finalY || 200;
      const total = data.subjects.length;
      const submitted = data.subjects.filter(s => s.submitted).length;
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
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw error;
    }
  }

  // Download helper
  static downloadPDF(base64String: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64String}`;
    link.download = fileName;
    link.click();
  }

  // One function to generate and download
  static async generateAndDownload(
    data: any,
    fileName: string = 'Weekly_Syllabus.pdf'
  ): Promise<void> {
    try {
      const pdfBase64 = await this.generatePDF(data);
      this.downloadPDF(pdfBase64, fileName);
    } catch (error) {
      console.error('Error:', error);
      alert('PDF generation failed. Please check console for details.');
    }
  }
}
