/**
 * PDF Export Utility using jsPDF
 *
 * Generates formal Question Paper PDFs and confidential Answer Key PDFs
 * with multi-page pagination, section headers, and exam metadata.
 */

import { jsPDF } from 'jspdf';
import { Question, QuestionPaper, Subject, Unit } from '../types';

interface ExportContext {
  paper: QuestionPaper;
  subject: Subject;
  units: Unit[];
  questionsMap: Map<string, Question>;
  institutionName?: string;
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function formatExamDate(isoOrDateTime?: string): string {
  if (!isoOrDateTime) {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  const d = new Date(isoOrDateTime);
  if (Number.isNaN(d.getTime())) return isoOrDateTime;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function addPageFooters(doc: jsPDF, label: string): void {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.line(15, pageHeight - 16, pageWidth - 15, pageHeight - 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, 15, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 10, {
      align: 'right',
    });
  }
}

/**
 * Generates and downloads the formal Question Paper PDF.
 */
export function downloadQuestionPaperPDF({
  paper,
  subject,
  units,
  questionsMap,
  institutionName = 'NATIONAL INSTITUTE OF ENGINEERING & TECHNOLOGY',
}: ExportContext): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const unitMap = new Map(units.map((u) => [u.id, u]));

  let y = 18;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 24) {
      doc.addPage();
      y = 18;
    }
  };

  // Header Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(institutionName, pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(paper.examName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `${subject.code} — ${subject.name} (${subject.department})`,
    pageWidth / 2,
    y,
    { align: 'center' },
  );
  y += 7;

  // Metadata bar
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Time: ${paper.durationMinutes} Minutes`, margin, y);
  doc.text(
    `Date: ${formatExamDate(paper.releaseDateTime)}`,
    pageWidth / 2,
    y,
    { align: 'center' },
  );
  doc.text(`Maximum Marks: ${paper.totalMarks}`, pageWidth - margin, y, {
    align: 'right',
  });
  y += 3.5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // General Instructions
  if (paper.instructions.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('General Instructions:', margin, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const instrLines = doc.splitTextToSize(paper.instructions, contentWidth);
    doc.text(instrLines, margin, y);
    y += instrLines.length * 4.3 + 4;
  }

  let questionNumber = 1;

  for (const section of paper.sections) {
    ensureSpace(18);
    const sectionTotal = section.questionIds.length * section.marksPerQuestion;

    // Section Banner
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.rect(margin, y, contentWidth, 8, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(section.sectionName, margin + 3, y + 5.3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      `(${section.questionIds.length} x ${section.marksPerQuestion} = ${sectionTotal} Marks)`,
      pageWidth - margin - 3,
      y + 5.3,
      { align: 'right' },
    );
    y += 12;

    for (const qId of section.questionIds) {
      const q = questionsMap.get(qId);
      if (!q) continue;

      const unit = unitMap.get(q.unitId);
      const prefix = `Q${questionNumber}. `;
      const qLines = doc.splitTextToSize(`${prefix}${q.text}`, contentWidth - 22);
      const optionLinesCount =
        q.type === 'MCQ' && q.options ? q.options.length * 4.8 + 2 : 0;

      ensureSpace(qLines.length * 4.8 + optionLinesCount + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(qLines, margin, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `[${q.marks}M${unit ? ` · U${unit.unitNumber}` : ''}]`,
        pageWidth - margin,
        y,
        { align: 'right' },
      );

      y += qLines.length * 4.8 + 1.5;

      if (q.type === 'MCQ' && q.options && q.options.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);
        q.options.forEach((opt, idx) => {
          const optLabel = `(${String.fromCharCode(97 + idx)}) ${opt}`;
          const optWrapped = doc.splitTextToSize(optLabel, contentWidth - 10);
          ensureSpace(optWrapped.length * 4.4);
          doc.text(optWrapped, margin + 6, y);
          y += optWrapped.length * 4.4 + 0.5;
        });
        y += 1.5;
      }

      y += 3;
      questionNumber++;
    }

    y += 3;
  }

  addPageFooters(
    doc,
    `${subject.code} · ${paper.examName} · Official Question Paper`,
  );

  const fileName = `${sanitizeFileName(subject.code)}-${sanitizeFileName(paper.examName)}-question-paper.pdf`;
  doc.save(fileName);
}

/**
 * Generates and downloads the confidential Answer Key & Marking Scheme PDF.
 */
export function downloadAnswerKeyPDF({
  paper,
  subject,
  units,
  questionsMap,
  institutionName = 'NATIONAL INSTITUTE OF ENGINEERING & TECHNOLOGY',
}: ExportContext): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const unitMap = new Map(units.map((u) => [u.id, u]));

  let y = 18;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 24) {
      doc.addPage();
      y = 18;
    }
  };

  // Confidential Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(185, 28, 28);
  doc.text('CONFIDENTIAL — ANSWER KEY & MARKING SCHEME', pageWidth / 2, y, {
    align: 'center',
  });
  y += 6;

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(institutionName, pageWidth / 2, y, { align: 'center' });
  y += 5.5;

  doc.setFontSize(10.5);
  doc.text(`${paper.examName} — Answer Key`, pageWidth / 2, y, {
    align: 'center',
  });
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `${subject.code} · ${subject.name} · Max Marks: ${paper.totalMarks}`,
    pageWidth / 2,
    y,
    { align: 'center' },
  );
  y += 5;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.35);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  let questionNumber = 1;

  for (const section of paper.sections) {
    ensureSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 64, 175);
    doc.text(
      `${section.sectionName} (${section.marksPerQuestion} Marks Each · ${section.difficulty})`,
      margin,
      y,
    );
    y += 6;

    for (const qId of section.questionIds) {
      const q = questionsMap.get(qId);
      if (!q) continue;

      const unit = unitMap.get(q.unitId);
      const qSummary = doc.splitTextToSize(
        `Q${questionNumber}. ${q.text}`,
        contentWidth - 20,
      );
      const ansLines = doc.splitTextToSize(
        `Answer: ${q.answer}`,
        contentWidth - 6,
      );

      ensureSpace(qSummary.length * 4.4 + ansLines.length * 4.5 + 10);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(qSummary, margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `[${q.marks}M${unit ? ` · Unit ${unit.unitNumber}` : ''}]`,
        pageWidth - margin,
        y,
        { align: 'right' },
      );

      y += qSummary.length * 4.4 + 1.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.3);
      doc.setTextColor(30, 41, 59);
      doc.text(ansLines, margin + 4, y);
      y += ansLines.length * 4.5 + 5;

      questionNumber++;
    }

    y += 3;
  }

  addPageFooters(
    doc,
    `CONFIDENTIAL · ${subject.code} · ${paper.examName} · Answer Key`,
  );

  const fileName = `${sanitizeFileName(subject.code)}-${sanitizeFileName(paper.examName)}-answer-key.pdf`;
  doc.save(fileName);
}
