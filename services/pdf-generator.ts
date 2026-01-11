import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export class PDFGenerator {
  
  // Check if text contains Devanagari
  private static isDevanagari(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    return /[\u0900-\u097F\uA8E0-\uA8FF\u1CD0-\u1CFF]/.test(text);
  }

  // Set appropriate font - using standard fonts that support Unicode
  private static setFont(doc: jsPDF, text: string, style: 'normal' | 'bold' = 'normal'): void {
    if (this.isDevanagari(text)) {
      // Use standard fonts that support Unicode Hindi
      // "Times" font in jsPDF supports Devanagari characters
      doc.setFont('times', style);
    } else {
      doc.setFont('helvetica', style);
    }
  }

  // Main PDF generation function
  static generatePDFFromLessonPlans(
    className: string,
    section: string,
    weekRange: string,
    classTeacherName: string,
    allLessonPlans: any[],
    allTeachers: any[]
  ): string {
    console.log(`📊 Generating PDF for ${className}-${section}, Week: ${weekRange}`);

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // =========== PAGE 1: HEADER ===========
    
    // School Name (English)
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('SACRED HEART SCHOOL', 105, 20, { align: 'center' });

    // School Name (Hindi) - Use Unicode-compatible font
    doc.setFontSize(16);
    this.setFont(doc, 'सैक्रेड हार्ट स्कूल', 'bold');
    doc.text('सैक्रेड हार्ट स्कूल', 105, 28, { align: 'center' });

    // CBSE Affiliation
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('(Affiliated to CBSE, New Delhi, upto +2 Level)', 105, 36, { align: 'center' });

    // Weekly Syllabus Title (English)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0);
    doc.text('WEEKLY SYLLABUS', 105, 48, { align: 'center' });

    // Weekly Syllabus Title (Hindi)
    doc.setFontSize(14);
    this.setFont(doc, 'साप्ताहिक पाठ्यक्रम', 'bold');
    doc.text('साप्ताहिक पाठ्यक्रम', 105, 56, { align: 'center' });

    // Underline
    doc.setLineWidth(0.8);
    doc.setDrawColor(139, 0, 0);
    doc.line(50, 58, 160, 58);

    // =========== INFORMATION SECTION ===========
    
    const infoY = 70;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    // Date
    doc.text('Date:', 20, infoY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${weekRange}`, 40, infoY);

    // Class & Section
    doc.setFont('helvetica', 'normal');
    doc.text('Class & Section:', 20, infoY + 8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${className} - ${section}`, 55, infoY + 8);

    // Class Teacher
    doc.setFont('helvetica', 'normal');
    doc.text('Class Teacher:', 20, infoY + 16);
    this.setFont(doc, classTeacherName, 'bold');
    doc.text(classTeacherName, 50, infoY + 16);

    // =========== GET ALL TEACHERS FOR THIS CLASS ===========
    
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
          font: 'helvetica',
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
          cellWidth: 'wrap'
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        columnStyles: {
          0: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 35, halign: 'center' },
          3: { cellWidth: 50, halign: 'left' },
          4: { cellWidth: 40, halign: 'left' }
        },
        margin: { left: 10, right: 10 },
        didParseCell: (data: any) => {
          // Apply Unicode-compatible font for Hindi text
          if (data.row.index > 0) {
            const cellText = data.cell.text[0] || '';
            if (this.isDevanagari(cellText)) {
              // Use "times" font for Hindi text (built-in Unicode support)
              data.cell.styles.font = 'times';
            }
          }

          // Color coding for missing homework
          if (data.column.index === 4 && data.cell.text[0]?.includes('Not Submitted')) {
            data.cell.styles.textColor = [220, 0, 0];
            data.cell.styles.fontStyle = 'italic';
          }
        },
        didDrawPage: (data: any) => {
          // Page number
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
      
      console.log('✅ Table generated successfully');
    } catch (error: any) {
      console.error('❌ AutoTable error:', error.message);
    }

    // =========== SUMMARY SECTION ===========
    
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    
    if (finalY < 250) {
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
        doc.setFont('helvetica', 'italic');
        doc.text('(Homework Not Submitted)', 25, finalY + 49);
      }

      // Signatures
      const signatureY = Math.min(finalY + 60, 260);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Class Teacher
      doc.text('Signature of Class Teacher:', 30, signatureY);
      this.setFont(doc, 'कक्षा अध्यापक के हस्ताक्षर', 'normal');
      doc.text('कक्षा अध्यापक के हस्ताक्षर:', 30, signatureY + 6);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(30, signatureY + 8, 80, signatureY + 8);
      
      // Principal
      doc.setFont('helvetica', 'normal');
      doc.text('Signature of Principal:', 120, signatureY);
      this.setFont(doc, 'प्राचार्य के हस्ताक्षर', 'normal');
      doc.text('प्राचार्य के हस्ताक्षर:', 120, signatureY + 6);
      doc.line(120, signatureY + 8, 170, signatureY + 8);
      
      // Date
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 30, signatureY + 20);
    }

    // =========== FOOTER ===========
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    
    doc.text(
      'Generated by Sacred Heart School Management System • Unicode Hindi Support',
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

  // Simple table fallback if autoTable fails
  private static generateSimpleTableFallback(
    doc: jsPDF,
    columns: any[],
    rows: any[][],
    startY: number
  ) {
    console.log('📋 Using simple table fallback');
    
    let y = startY;
    const startX = 15;
    
    // Draw headers
    doc.setFillColor(41, 128, 185);
    const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
    doc.rect(startX, y, totalWidth, 10, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    
    let x = startX + 5;
    columns.forEach(col => {
      doc.text(col.header.split('\n')[0], x, y + 7);
      x += col.width;
    });
    
    y += 12;
    
    // Draw rows
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    rows.forEach((row, rowIndex) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
        // Redraw headers
        doc.setFillColor(41, 128, 185);
        doc.rect(startX, y, totalWidth, 10, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        x = startX + 5;
        columns.forEach(col => {
          doc.text(col.header.split('\n')[0], x, y + 7);
          x += col.width;
        });
        y += 12;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
      }
      
      // Alternate row color
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(startX, y, totalWidth, 10, 'F');
      }
      
      // Draw cell content
      x = startX + 5;
      row.forEach((cell, cellIndex) => {
        // Use appropriate font for Hindi text
        if (this.isDevanagari(cell.toString())) {
          this.setFont(doc, cell.toString(), 'normal');
        }
        
        // Color for missing homework
        if (cellIndex === 4 && cell.toString().includes('Not Submitted')) {
          doc.setTextColor(220, 0, 0);
          doc.setFont('helvetica', 'italic');
        }
        
        const lines = cell.toString().split('\n');
        lines.forEach((line: string, lineIndex: number) => {
          doc.text(line.substring(0, 40), x, y + 5 + (lineIndex * 4));
        });
        
        // Reset
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        x += columns[cellIndex].width;
      });
      
      y += 12;
    });
  }

  // Generate PDFs for all classes
  static generatePDFsForAllClasses(
    weekRange: string,
    teachers: any[],
    lessonPlans: any[]
  ): Array<{
    className: string;
    section: string;
    pdfBase64: string;
    teacherName: string;
    teacherEmail: string;
  }> {
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
      } catch (error: any) {
        console.error(`❌ Failed for ${teacher.name}:`, error.message);
      }
    }
    
    return results;
  }

  // Helper: Get week range from date
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

  // Download helper
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
    }
  }

  // Simple PDF generation with minimal parameters
  static generateSimplePDF(data: {
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
  }): string {
    console.log('Generating simple PDF...');
    
    // Convert data format
    const allTeachers = data.subjects.map(subject => ({
      name: subject.teacher,
      email: `${subject.subject.toLowerCase().replace(/\s+/g, '_')}@school.com`,
      assignments: [{
        className: data.className,
        sections: [data.section],
        subject: subject.subject
      }]
    }));

    const allLessonPlans = data.subjects
      .filter(subject => subject.submitted)
      .map(subject => ({
        teacherId: `${subject.subject.toLowerCase().replace(/\s+/g, '_')}@school.com`,
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
}
