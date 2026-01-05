// src/pages/recruiter/ViewApplicants.tsx 
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Download, Mail, Phone, Clock, CheckCircle,
  XCircle, User, Calendar, ArrowLeft, Filter,
  FileText, Star, Send, History, Bell, Brain, Award,
  TrendingUp, TrendingDown, AlertTriangle, X, Loader2, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/dashboard/Sidebar";
import SendCaseStudyModal from './SendCaseStudyModal';
import { useToast } from "@/hooks/use-toast";
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Application {
  id: number;
  job_id: number | null; // Can be null for assessment case studies
  full_name: string;
  email: string;
  phone: string;
  last_job_title: string;
  resume_path: string;
  additional_info: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'case_study_sent' | 'case_study_completed';
  applied_at: string;
  cv_match_score: number | null;
  cv_match_level: string | null;
  cv_match_details: CVMatchDetails | null;
  match_category: string;
  case_study_id?: number; // For assessment case studies
}

interface CVMatchDetails {
  overall_match_score: number;
  match_level: string;
  skills_match: Array<{
    skill_name: string;
    found_in_cv: boolean;
    evidence: string;
    is_required: boolean;
  }>;
  experience_match: number;
  experience_evidence: string;
  education_match: number;
  education_evidence: string;
  strengths: string[];
  gaps: string[];
  summary: string;
  recommendation: string;
}

interface AssessmentResult {
  id: number;
  job_id: number;
  score: number;
  rating: string;
  feedback_text: string;
  feedback_text_ar: string;
  ai_detected: boolean;
  case_study_id: number;
  cv_match_score: number;
  final_recommendation: string;
  submitted_time: string;
  case_study_title: string;
  questions: string[];
  answers: string[];
  question_scores: any[];
  question_scores_ar: any[];
  skill_scores: any[];
  skill_scores_ar: any[];
  result_generated: number;
  applicant_name: string;
  applicant_email: string;
  status: string;
  avg_ai_probability?: number;
}

const extractAnswerContent = (answer: any): string => {
  if (typeof answer === 'string') {
    return answer;
  }
  if (answer && typeof answer === 'object' && 'content' in answer) {
    return answer.content || '';
  }
  return '';
};

const getSubmissionTypeIcon = (answer: any): string => {
  if (typeof answer === 'string') {
    return '📝';
  }
  if (answer && typeof answer === 'object') {
    if (answer.type === 'file') {
      return `📄 (${answer.fileName || 'Document'})`;
    }
    return '📝';
  }
  return '';
};

// ============= HELPER FUNCTIONS FOR REPORTS =============

const generateApplicantsReportCSV = (
  applications: Application[],
  jobTitle: string,
  submissions: Map<string, AssessmentResult>
) => {
  const headers = [
    'Full Name',
    'Email',
    'Phone',
    'Last Job Title',
    'Applied Date',
    'Status',
    'CV Match Score',
    'Match Category',
    'Case Study Score',
    'Case Study Rating',
    'Final Recommendation',
    'Additional Info'
  ];

  const rows = applications.map(app => {
    // For assessments, job_id might be null - try both keys
    const key1 = `${app.email}_${app.job_id}`;
    const key2 = app.job_id ? null : `${app.email}_${app.case_study_id || 'null'}`;
    const submission = submissions.get(key1) || (key2 ? submissions.get(key2) : undefined);
    const caseStudyScore = submission ? Math.round(submission.score) : 'N/A';
    const caseStudyRating = submission ? submission.rating : 'N/A';
    const finalRec = submission ? submission.final_recommendation : 'N/A';

    return [
      app.full_name,
      app.email,
      app.phone,
      app.last_job_title,
      new Date(app.applied_at).toLocaleDateString('en-US'),
      app.status,
      app.cv_match_score !== null ? `${app.cv_match_score}%` : 'Pending',
      app.match_category || 'N/A',
      caseStudyScore,
      caseStudyRating,
      finalRec,
      app.additional_info || 'N/A'
    ];
  });

  const csvContent = [
    ['Job Title', jobTitle],
    ['Report Generated', new Date().toLocaleString('en-US')],
    ['Total Applicants', applications.length.toString()],
    [],
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    )
  ].join('\n');

  return csvContent;
};

const downloadCSVFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};


interface ReportData {
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantJobTitle: string;
  appliedDate: string;
  reportGeneratedDate: string;
  applicationStatus: string;
  assessmentScore: number;
  assessmentRating: string;
  cvMatchScore: number | null;
  cvMatchLevel: string | null;
  finalRecommendation: string;
  aiDetected: boolean;
  feedback: string;
  caseStudyTitle: string;
  avg_ai_probability?: number;
  questionsAnswers: Array<{
    question: string;
    answer: string;
    submissionType: string;
    score: number | string;
    feedback: string;
    ai_suspected: boolean;
    ai_probability: number;
  }>;
  skills: Array<{
    skill_name: string;
    score: number;
    category: string;
    is_required: boolean;
  }>;
}

const sanitizeText = (text: any): string => {
  if (!text || text === 'null' || text === null || text === undefined) {
    return 'N/A';
  }

  let cleaned = String(text).trim();

  // Decode common HTML entities FIRST
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Remove HTML tags SECOND
  cleaned = cleaned.replace(/<[^>]*>?/gm, '');

  // Remove specific artifacts reported by user
  cleaned = cleaned
    .replace(/& p/g, '')
    .replace(/&p/g, '')
    .replace(/& P/g, '')
    .replace(/&P/g, '');

  // Remove control characters and specific corrupt sequences
  cleaned = cleaned
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/[&þ✓§†‡°¡¿]/g, '')
    .replace(/\u0026/g, '') // Explicitly remove &
    .replace(/\s+/g, ' ') // Collapse spaces
    .replace(/â€"/g, '"')
    .replace(/â€˜/g, "'")
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '');

  return cleaned.trim();
};

const colors = {
  primary: [200, 245, 90] as [number, number, number],
  dark: [53, 92, 20] as [number, number, number],
  lightBg: [249, 250, 251] as [number, number, number],
  border: [209, 213, 219] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  error: [239, 68, 68] as [number, number, number],
  info: [59, 130, 246] as [number, number, number],
  text: [31, 41, 55] as [number, number, number],
  textLight: [107, 114, 128] as [number, number, number],
};

const getScoreColor = (score: number): [number, number, number] => {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.info;
  if (score >= 40) return colors.warning;
  return colors.error;
};

const addHeader = (doc: jsPDF, pageWidth: number) => {
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFontSize(20);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSESSMENT REPORT', 15, 18);

  doc.setFontSize(8);
  doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated: ' + new Date().toLocaleString('en-US'), pageWidth - 15, 18, { align: 'right' });
};

const addSectionHeader = (doc: jsPDF, title: string, yPos: number, pageWidth: number, contentMargin: number = 15): number => {
  const contentWidth = pageWidth - (contentMargin * 2);
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(contentMargin, yPos, contentWidth, 7, 'F');

  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.5);
  doc.rect(contentMargin, yPos, contentWidth, 7);

  doc.setFontSize(10);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(title, contentMargin + 3, yPos + 4.5);

  return yPos + 10;
};

const addInfoBox = (
  doc: jsPDF,
  label: string,
  value: string,
  yPos: number,
  xPos: number,
  width: number
): number => {
  const cleanValue = sanitizeText(value);

  doc.setFontSize(7);
  doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(label, xPos, yPos);

  doc.setFontSize(9);
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFont('helvetica', 'bold');

  const lines = doc.splitTextToSize(cleanValue, width - 4);
  lines.slice(0, 1).forEach((line: string, idx: number) => {
    doc.text(line, xPos, yPos + 4 + (idx * 3));
  });

  return yPos;
};

const checkPageBreak = (doc: jsPDF, yPos: number, requiredSpace: number = 15): number => {
  if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - 12) {
    doc.addPage();
    return 15;
  }
  return yPos;
};

export const generateAssessmentReportPDF = async (
  applicant: any,
  submission: any,
  jobTitle: string
) => {
  if (!submission) return null;

  const cleanString = (str: any) => {
    if (!str) return '';
    return sanitizeText(str);
  };

  const formatAnswerForReport = (rawAnswer: any) => {
    if (rawAnswer === null || rawAnswer === undefined) return 'No answer provided';

    // Get a raw text candidate to inspect
    const rawText = typeof rawAnswer === 'string' ? rawAnswer : (rawAnswer?.content ?? rawAnswer?.fileName ?? rawAnswer?.url ?? '');

    // File attachment -> show filename
    if (typeof rawAnswer === 'object' && rawAnswer?.fileName) return `File: ${cleanString(rawAnswer.fileName)}`;

    // Video responses -> indicate video
    if (typeof rawAnswer === 'object' && rawAnswer?.type === 'video') return rawAnswer?.fileName ? `Video: ${cleanString(rawAnswer.fileName)}` : 'Video response';

    // Detect code-like answers (multiple lines and presence of code tokens)
    const lines = String(rawText).split(/\r?\n/).map((l:any) => l.trim()).filter((l:any) => l.length > 0);
    const codeLike = lines.length > 1 && lines.slice(0, 10).some((l:any) => /(\bfunction\b|=>|console\.|import\s|class\s|{|}|;)/.test(l));
    if (codeLike) {
      const snippet = lines.slice(0, 6).map((l:any) => cleanString(l)).join('\n');
      return `Code snippet (truncated):\n${snippet}\n...`;
    }

    // Normal text: clean and truncate if long
    const cleaned = cleanString(rawText);
    if (!cleaned || cleaned === '') return 'No answer provided';
    if (cleaned.length > 400) return cleaned.slice(0, 400) + '... (truncated)';
    return cleaned;
  };

  return {
    jobTitle: cleanString(jobTitle),
    applicantName: cleanString(applicant.full_name),
    applicantEmail: cleanString(applicant.email),
    applicantPhone: cleanString(applicant.phone),
    applicantJobTitle: cleanString(applicant.last_job_title),
    appliedDate: new Date(applicant.applied_at).toLocaleDateString('en-US'),
    reportGeneratedDate: new Date().toLocaleString('en-US'),
    applicationStatus: cleanString(applicant.status),
    assessmentScore: submission.score,
    assessmentRating: cleanString(submission.rating),
    cvMatchScore: applicant.cv_match_score,
    cvMatchLevel: cleanString(applicant.cv_match_level),
    finalRecommendation: cleanString(submission.final_recommendation),
    aiDetected: submission.ai_detected,
    feedback: cleanString(submission.feedback_text),
    caseStudyTitle: cleanString(submission.case_study_title),
    avg_ai_probability: submission.avg_ai_probability,


    questionsAnswers: (submission.custom_question_scores && submission.custom_question_scores.length > 0)
      ? submission.custom_question_scores.map((cq: any) => {
          // Try to find the module answer in submission.custom_answers by question_id
          const moduleAnswer = submission.custom_answers?.find((a: any) => a.question_id === cq.question_id);
          const rawAnswer = moduleAnswer?.answer;
          const formatted = formatAnswerForReport(rawAnswer);
          const submissionType = typeof rawAnswer === 'string'
            ? 'Text'
            : (rawAnswer?.type === 'file' ? 'File' : (rawAnswer?.type === 'video' ? 'Video' : 'Text'));

          return {
            question: cleanString(`Module: ${cq.question_type} (ID:${cq.question_id})`),
            answer: formatted,
            submissionType: submissionType,
            score: cq.score || 'N/A',
            feedback: cleanString(cq.feedback),
            ai_suspected: cq.ai_suspected || false,
            ai_probability: cq.ai_probability || 0
          };
        })
      : (submission.questions?.map((q: string, idx: number) => {
        const rawAnswer = submission.answers?.[idx];
        const formatted = formatAnswerForReport(rawAnswer);
        const submissionType = typeof rawAnswer === 'string' ? 'Text' : (rawAnswer?.type === 'file' ? 'File' : 'Text');

        return {
          question: cleanString(q),
          answer: formatted,
          submissionType: submissionType,
          score: submission.question_scores?.[idx]?.score || 'N/A',
          feedback: cleanString(submission.question_scores?.[idx]?.feedback),
          ai_suspected: submission.question_scores?.[idx]?.ai_suspected || false,
          ai_probability: submission.question_scores?.[idx]?.ai_probability || 0
        };
      }) || []),
    skills: submission.skill_scores?.map((skill: any) => ({
      skill_name: cleanString(skill.skill_name),
      score: skill.score,
      category: cleanString(skill.category),
      is_required: skill.is_required
    })) || []
  };
};

export const downloadAssessmentReportPDF = (
  reportData: ReportData,
  applicantName: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentMargin = 15;
  const contentWidth = pageWidth - (contentMargin * 2);

  // Helper to track Y position
  let finalY = 32;

  // Header
  addHeader(doc, pageWidth);

  // Position Title
  doc.setFontSize(11);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Position: ' + sanitizeText(reportData.jobTitle), contentMargin + 2, finalY);
  finalY += 8;

  // APPLICANT INFORMATION
  autoTable(doc, {
    startY: finalY,
    head: [['APPLICANT INFORMATION', '']],
    body: [
      [`Full Name:\n${sanitizeText(reportData.applicantName)}`, `Email:\n${sanitizeText(reportData.applicantEmail)}`],
      [`Phone:\n${sanitizeText(reportData.applicantPhone)}`, `Previous Job Title:\n${sanitizeText(reportData.applicantJobTitle)}`],
      [`Applied Date:\n${sanitizeText(reportData.appliedDate)}`, `Current Status:\n${sanitizeText(reportData.applicationStatus)}`],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: colors.primary,
      textColor: colors.dark,
      fontSize: 10,
      fontStyle: 'bold',
      font: 'helvetica',
      halign: 'left'
    },
    bodyStyles: {
      fillColor: colors.lightBg,
      textColor: colors.text,
      fontSize: 8,
      cellPadding: 4,
      font: 'helvetica',
      lineColor: colors.border,
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 2 },
      1: { cellWidth: contentWidth / 2 }
    },
    margin: { left: contentMargin, right: contentMargin },
    didParseCell: (data: any) => {
      // Merge header cells
      if (data.section === 'head') {
        if (data.column.index === 0) {
          data.cell.colSpan = 2;
          data.cell.styles.halign = 'left';
        }
      }
    }
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  // ASSESSMENT RESULTS - Score Box (Manual for custom look)
  // Check space for score box
  if (finalY + 35 > pageHeight) {
    doc.addPage();
    finalY = 15;
  }

  // Section Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(contentMargin, finalY, pageWidth - (contentMargin * 2), 7, 'F');
  doc.setFontSize(10);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSESSMENT RESULTS', contentMargin + 3, finalY + 4.5);
  finalY += 7;

  // Score Box
  doc.setFillColor(colors.lightBg[0], colors.lightBg[1], colors.lightBg[2]);
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.1);
  doc.rect(contentMargin, finalY, pageWidth - (contentMargin * 2), 22, 'FD');

  doc.setFontSize(26);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(Math.round(reportData.assessmentScore).toString(), contentMargin + 5, finalY + 13);

  doc.setFontSize(8);
  doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('/100', contentMargin + 16, finalY + 13);
  doc.setFontSize(7);
  doc.text('Overall Score', contentMargin + 5, finalY + 18);

  const scoreColor = getScoreColor(reportData.assessmentScore);
  doc.setFontSize(10);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(reportData.assessmentRating, pageWidth - contentMargin - 5, finalY + 13, { align: 'right' });
  doc.setFontSize(7);
  doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('Rating', pageWidth - contentMargin - 5, finalY + 18, { align: 'right' });

  finalY += 25;

  // Results Details Table
  autoTable(doc, {
    startY: finalY,
    body: [
      [`CV Match Score:\n${reportData.cvMatchScore !== null ? reportData.cvMatchScore + '%' : 'N/A'}`, `CV Match Level:\n${reportData.cvMatchLevel || 'N/A'}`],
      [`Final Recommendation:\n${sanitizeText(reportData.finalRecommendation)}`, `AI Detection:\n${reportData.aiDetected ? 'Yes' : 'No'}`],
      reportData.avg_ai_probability !== undefined ? [`Average AI Probability:\n${reportData.aiDetected ? ((parseFloat(String(reportData.avg_ai_probability)) || 0).toFixed(1) + '%') : 'No AI detected'}`, ''] : []
    ].filter(row => row.length > 0),
    theme: 'grid',
    bodyStyles: {
      fillColor: colors.lightBg,
      textColor: colors.text,
      fontSize: 8,
      cellPadding: 4,
      font: 'helvetica',
      lineColor: colors.border,
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 2 },
      1: { cellWidth: contentWidth / 2 }
    },
    margin: { left: contentMargin, right: contentMargin },
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  // RECRUITER FEEDBACK
  autoTable(doc, {
    startY: finalY,
    head: [['RECRUITER FEEDBACK']],
    body: [[sanitizeText(reportData.feedback)]],
    theme: 'grid',
    headStyles: {
      fillColor: colors.primary,
      textColor: colors.dark,
      fontSize: 10,
      fontStyle: 'bold',
      font: 'helvetica',
      halign: 'left'
    },
    bodyStyles: {
      fillColor: colors.lightBg,
      textColor: colors.text,
      fontSize: 8,
      cellPadding: 4,
      font: 'helvetica',
      lineColor: colors.border,
      lineWidth: 0.1,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: contentWidth }
    },
    margin: { left: contentMargin, right: contentMargin },
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  // CASE STUDY
  autoTable(doc, {
    startY: finalY,
    head: [['CASE STUDY']],
    body: [[`Title: ${sanitizeText(reportData.caseStudyTitle)}`]],
    theme: 'grid',
    headStyles: {
      fillColor: colors.primary,
      textColor: colors.dark,
      fontSize: 10,
      fontStyle: 'bold',
      font: 'helvetica',
      halign: 'left'
    },
    bodyStyles: {
      fillColor: colors.lightBg,
      textColor: colors.text,
      fontSize: 8,
      cellPadding: 4,
      font: 'helvetica',
      lineColor: colors.border,
      lineWidth: 0.1,
      fontStyle: 'bold',
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: contentWidth }
    },
    margin: { left: contentMargin, right: contentMargin },
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  // QUESTIONS & ANSWERS
  // We'll use a single table for all Q&A to handle paging gracefully
  const qaRows: any[] = [];

  reportData.questionsAnswers.forEach((qa, idx) => {
    // Header Row for Question
    qaRows.push([{
      content: `Question ${idx + 1}${qa.ai_suspected ? '   [AI Detected]' : ''}`,
      colSpan: 1,
      styles: {
        fillColor: qa.ai_suspected ? [254, 243, 242] : colors.lightBg,
        textColor: qa.ai_suspected ? colors.error : colors.dark,
        fontStyle: 'bold'
      }
    }]);

    // Question Text
    qaRows.push([{
      content: `Q: ${sanitizeText(qa.question)}`,
      styles: { fontStyle: 'italic', textColor: colors.text }
    }]);

    // Answer Text
    qaRows.push([{
      // qa.answer is already cleaned & truncated by formatAnswerForReport (preserves snippets with newlines)
      content: `A: ${qa.answer}`,
      styles: { fontStyle: 'normal', textColor: colors.text }
    }]);

    // Metadata
    const aiProbText = qa.ai_suspected ? `${(parseFloat(String(qa.ai_probability)) || 0).toFixed(1)}%` : 'No AI detected';
    qaRows.push([{
      content: `Score: ${qa.score}/100 | Submission Type: ${qa.submissionType} | AI Probability: ${aiProbText}`,
      styles: { fontSize: 7, textColor: colors.textLight }
    }]);

    // Feedback
    qaRows.push([{
      content: `Feedback: ${sanitizeText(qa.feedback)}`,
      styles: { textColor: colors.text, fillColor: colors.lightBg }
    }]);

    // Spacer row (empty)
    qaRows.push([{ content: '', styles: { cellPadding: 1, fillColor: [255, 255, 255], lineColor: [255, 255, 255] } }]);
  });

  autoTable(doc, {
    startY: finalY,
    head: [['QUESTIONS & ANSWERS WITH AI ANALYSIS']],
    body: qaRows,
    theme: 'grid',
    headStyles: {
      fillColor: colors.primary,
      textColor: colors.dark,
      fontSize: 10,
      fontStyle: 'bold',
      font: 'helvetica',
      halign: 'left'
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: colors.text,
      fontSize: 8,
      cellPadding: 3,
      font: 'helvetica',
      fontStyle: 'normal',
      lineColor: colors.border,
      lineWidth: 0.1,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: contentWidth }
    },
    margin: { left: contentMargin, right: contentMargin },
    // Custom styling for specific rows is handled in the body data structure
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  // SKILLS EVALUATION
  if (reportData.skills && reportData.skills.length > 0) {
    const skillRows = reportData.skills.map(skill => {
      const score = skill.score || 0;
      // We can't easily do colorful text in one cell with autoTable without hooks, 
      // so we'll just show the text.
      return [
        sanitizeText(skill.skill_name),
        `${score}/10`,
        `${skill.category || ''} | ${skill.is_required ? 'Required' : 'Optional'}`
      ];
    });

    autoTable(doc, {
      startY: finalY,
      head: [['SKILLS EVALUATION', 'Score', 'Category']],
      body: skillRows,
      theme: 'grid',
      headStyles: {
        fillColor: colors.primary,
        textColor: colors.dark,
        fontSize: 10,
        fontStyle: 'bold',
        font: 'helvetica',
        halign: 'left'
      },
      bodyStyles: {
        fillColor: colors.lightBg,
        textColor: colors.text,
        fontSize: 8,
        cellPadding: 3,
        font: 'helvetica',
        lineColor: colors.border,
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: (contentWidth * 0.5) },
        1: { cellWidth: (contentWidth * 0.15), halign: 'right', fontStyle: 'bold' },
        2: { cellWidth: (contentWidth * 0.35), fontSize: 7, textColor: colors.textLight }
      },
      margin: { left: contentMargin, right: contentMargin },
      didParseCell: (data: any) => {
        if (data.section === 'head' && data.column.index === 0) {
          // Header spans are tricky in autoTable if not defined in 'head' array correctly
          // But here we have 3 columns defined in body, so we need 3 columns in head or span them.
          // Let's just keep 3 columns.
        }
      }
    });
  }

  // Footer
  const totalPages = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Page ' + i + ' of ' + totalPages,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Download
  const filename = 'Assessment_Report_' + applicantName.replace(/\s+/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.pdf';
  doc.save(filename);
};



// TopBar Component
function TopBar() {
  const { t } = useTranslation();

  return (
    <header className="h-14 md:h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-10 h-10 md:w-14 md:h-14 bg-merit-dark rounded-lg flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 75 76" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 md:w-8 md:h-8">
            <path d="M16.9671 31.0082C19.0128 36.6402 23.007 41.6008 27.6225 45.3565C32.2724 49.2127 37.8323 52.1652 43.6934 53.6806C45.7814 54.215 47.919 54.5325 50.0722 54.6282C54.1573 54.7851 58.5845 53.9818 61.8633 51.3651C65.9328 48.1145 67.0436 43.1288 65.9987 38.1557C65.343 35.04 63.9875 32.1 62.2179 29.4111C61.8523 28.8502 61.4693 28.3009 61.0695 27.7639C61.0698 27.7591 61.0714 27.7545 61.0742 27.7506C61.077 27.7467 61.0808 27.7437 61.0852 27.7419H61.0978C61.104 27.7419 61.1103 27.7419 61.1166 27.7482L62.3528 29.0189C65.3489 32.1081 67.9654 35.5441 70.1467 39.2538C71.9634 42.3695 73.3565 45.6734 74.0844 49.1185C75.2422 54.6 74.304 60.2445 69.9867 64.107C67.715 66.1401 64.7939 67.3732 61.8602 67.9819C57.7907 68.8197 53.5486 68.6973 49.4195 68.0039C47.3205 67.6525 45.2936 67.1881 43.342 66.6139C35.2594 64.2419 27.6162 60.1787 20.9299 55.0769C16.9025 52.0591 13.2347 48.5892 9.99842 44.7353C6.6945 40.8007 3.86122 36.3547 2.10729 31.5133C0.955784 28.3506 0.306296 24.8364 0.689087 21.5043C1.52683 14.2689 6.90158 10.0394 13.7855 8.76553C17.7546 8.03133 21.9245 8.18193 25.9564 8.88162C30.2491 9.63452 34.4384 10.8898 38.4378 12.6217V12.6342C38.4369 12.6372 38.4353 12.6399 38.4331 12.6421C38.431 12.6443 38.4283 12.6459 38.4253 12.6468H38.4127C35.4815 11.8565 32.441 11.5492 29.4109 11.7369C26.8788 11.8875 24.1836 12.5621 22.0155 13.7951C18.7712 15.6401 16.7757 18.3855 16.0321 22.0314C15.8208 23.1689 15.7481 24.3278 15.8156 25.4828C15.894 27.3026 16.327 29.2417 16.9671 31.0082Z" fill="url(#paint0_linear)" />
            <path d="M57.1175 23.3005C57.1202 23.3334 57.1125 23.3664 57.0955 23.3947C55.649 26.2687 54.1995 29.1428 52.7467 32.0137C51.4164 34.6399 50.4092 36.5225 49.7189 37.6614C47.1342 41.9377 43.9897 45.8493 40.3688 49.2926C40.3565 49.3044 40.341 49.3122 40.3242 49.315C40.3074 49.3178 40.2901 49.3155 40.2747 49.3083C35.338 47.316 30.8515 44.3531 27.081 40.5951C26.6417 40.1559 26.2024 39.6915 25.7632 39.1926C25.754 39.1809 25.7486 39.1667 25.7475 39.1518C25.7475 39.1361 25.7475 39.1204 25.7569 39.1079C27.3061 36.4793 29.0692 33.9827 31.0281 31.6435C33.5638 28.6344 36.4027 25.8944 39.4997 23.4668C40.7798 22.4628 43.861 20.0343 48.7557 16.1781L68.5133 0.606092L68.529 0.600586L68.5447 0.606092C68.5505 0.609805 68.5549 0.615317 68.5572 0.621781C68.5592 0.627908 68.5592 0.634479 68.5572 0.640606L57.1112 23.3005H57.1175Z" fill="#C8F55A" />
            <path d="M6.93747 75.9035C6.94375 75.9035 6.95002 75.9035 6.95316 75.8972L25.2863 61.5269C25.2945 61.5207 25.3011 61.5126 25.3055 61.5033C25.3099 61.494 25.3119 61.4838 25.3114 61.4735C25.3107 61.4632 25.3075 61.4533 25.302 61.4445C25.2965 61.4358 25.289 61.4285 25.28 61.4233C22.4655 59.659 19.7582 57.7291 17.1724 55.6438H17.1536L17.1379 55.6501C17.1324 55.6541 17.128 55.6595 17.1253 55.6658L6.91551 75.8627C6.91358 75.8688 6.91358 75.8754 6.91551 75.8815C6.91551 75.8878 6.91551 75.8941 6.92178 75.8972C6.92709 75.9015 6.93378 75.9037 6.94061 75.9035H6.93747Z" fill="#C8F55A" />
            <defs>
              <linearGradient id="paint0_linear" x1="29.2545" y1="56.4384" x2="14.4089" y2="11.0992" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDFFF8" />
                <stop offset="1" stopColor="#F0FFCC" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl md:text-2xl font-bold text-merit-dark">{t('appName')}</span>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <LanguageSwitcher />

      </div>
    </header>
  );
}

const useLocalizedField = () => {
  const { i18n } = useTranslation();

  const getField = (enValue: any, arValue: any) => {
    if (i18n.language === 'ar' && arValue) {
      return arValue;
    }
    return enValue;
  };

  return { getField };
};

export default function ViewApplicants() {
  const { id, assessmentId } = useParams<{ id?: string; assessmentId?: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { getField } = useLocalizedField();
  const location = useLocation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedApplicants, setSelectedApplicants] = useState<number[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [showCaseStudyModal, setShowCaseStudyModal] = useState(false);
  const [generatingResult, setGeneratingResult] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<Map<string, AssessmentResult>>(new Map());
  const [selectedCVMatch, setSelectedCVMatch] = useState<CVMatchDetails | null>(null);
  const [rankingType, setRankingType] = useState<'cv' | 'case_study'>('cv');
  const [isAssessment, setIsAssessment] = useState(false);

  const token = localStorage.getItem('token');
  const { toast } = useToast();

  useEffect(() => {
    if (assessmentId) {
      setIsAssessment(true);
    }
    fetchApplications();
    fetchJobDetails();
    fetchAllSubmissions();
  }, [id, assessmentId]);
  useEffect(() => {
    if (isAssessment) {
      setRankingType('case_study');
    }
  }, [isAssessment]);
  const fetchApplications = async () => {
    try {
      setLoading(true);
      let res;

      if (assessmentId) {
        // Fetch applicants for assessment
        res = await fetch(`${API_URL}/api/case-study-assessments/${assessmentId}/applications`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept-Language": i18n.language || 'en',
          },
        });
      } else if (id) {
        // Fetch applicants for job
        res = await fetch(`${API_URL}/api/jobs/${id}/applicants`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept-Language": i18n.language || 'en',
          },
        });
      } else {
        throw new Error('No job ID or assessment ID provided');
      }

      if (!res.ok) throw new Error('Failed to fetch applicants');

      const data = await res.json();
      setApplications(data.applicants || []);
      if (data.job_title) {
        setJobTitle(data.job_title);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // Determine active sidebar item based on current route
  const getActiveSidebarItem = () => {
    const path = location.pathname;
    if (path.includes('case-study-assessments')) {
      return 'case-study-assessments';
    }
    if (path.includes('jobs') && path.includes('applicants')) {
      return 'all-jobs';
    }
    return 'all-jobs';
  };
  const fetchJobDetails = async () => {
    try {
      if (assessmentId) {
        // For assessments, job title is already set from fetchApplications
        return;
      }

      if (!id) return;

      const res = await fetch(`${API_URL}/api/jobs/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language || 'en',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch job details');

      const data = await res.json();
      setJobTitle(data.title || 'Job Applicants');
    } catch (err: any) {
      console.error('Error fetching job details:', err);
    }
  };

  const fetchAllSubmissions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/assessments/recruiter/submissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language || 'en',
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      const submissionsMap = new Map<string, AssessmentResult>();

      data.forEach((submission: AssessmentResult) => {
        // For assessments, job_id might be null - use case_study_id instead
        const key = submission.job_id
          ? `${submission.applicant_email}_${submission.job_id}`
          : `${submission.applicant_email}_${submission.case_study_id || 'null'}`;
        submissionsMap.set(key, submission);
      });

      setSubmissions(submissionsMap);
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
    }
  };

  const handleGenerateResult = async (applicantEmail: string) => {
    try {
      const submission = submissions.get(`${applicantEmail}_${id}`);
      if (!submission) {
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('viewApplicants.noSubmissionFound')
        });
        return;
      }

      setGeneratingResult(submission.id);

      const res = await fetch(`${API_URL}/api/assessments/generate-result/${submission.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language || 'en',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || t('viewApplicants.failedToGenerate'));
      }

      toast({
        title: t('success'),
        description: t('viewApplicants.resultGenerated'),
        variant: "default"
      });

      await fetchAllSubmissions();

    } catch (err: any) {
      console.error('Error generating result:', err);
      toast({
        variant: "destructive",
        title: t('error'),
        description: err.message
      });
    } finally {
      setGeneratingResult(null);
    }
  };

  const getCVMatchColor = (score: number | null): string => {
    if (!score) return "bg-gray-100 text-gray-600";
    if (score >= 80) return "bg-green-100 text-green-700 border-green-300";
    if (score >= 60) return "bg-blue-100 text-blue-700 border-blue-300";
    if (score >= 40) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-red-100 text-red-700 border-red-300";
  };

  const getCVMatchIcon = (score: number | null) => {
    if (!score) return <Clock className="w-4 h-4" />;
    if (score >= 80) return <CheckCircle className="w-4 h-4" />;
    if (score >= 60) return <Award className="w-4 h-4" />;
    if (score >= 40) return <AlertTriangle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const getCaseStudyScore = (submission: AssessmentResult | undefined): number | null => {
    if (!submission) return null;
    return Math.round(submission.score);
  };

  const getCaseStudyColor = (score: number | null): string => {
    if (!score) return "bg-gray-100 text-gray-600";
    if (score >= 80) return "bg-green-100 text-green-700 border-green-300";
    if (score >= 60) return "bg-blue-100 text-blue-700 border-blue-300";
    if (score >= 40) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-red-100 text-red-700 border-red-300";
  };

  const getCaseStudyIcon = (score: number | null) => {
    if (!score) return <Clock className="w-4 h-4" />;
    if (score >= 80) return <CheckCircle className="w-4 h-4" />;
    if (score >= 60) return <Award className="w-4 h-4" />;
    if (score >= 40) return <AlertTriangle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const getSortedApplications = () => {
    const filtered = getFilteredApplications();

    if (rankingType === 'case_study') {
      return [...filtered].sort((a, b) => {
        const submissionA = getSubmission(a.email);
        const submissionB = getSubmission(b.email);

        const scoreA = getCaseStudyScore(submissionA) ?? -1;
        const scoreB = getCaseStudyScore(submissionB) ?? -1;

        return scoreB - scoreA;
      });
    }

    return [...filtered].sort((a, b) => {
      const scoreA = a.cv_match_score ?? -1;
      const scoreB = b.cv_match_score ?? -1;
      return scoreB - scoreA;
    });
  };

  const updateStatus = async (appId: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/api/jobs/applications/${appId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      await fetchApplications();
      toast({
        title: "Success",
        description: `Application marked as ${newStatus}`,
        variant: "default"
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message
      });
    }
  };

  const downloadResume = async (appId: number, fullName: string) => {
    try {
      const res = await fetch(`${API_URL}/api/jobs/applications/${appId}/resume`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to download resume');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fullName}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message
      });
    }
  };

  const handleSelectApplicant = (applicantId: number) => {
    setSelectedApplicants(prev =>
      prev.includes(applicantId)
        ? prev.filter(id => id !== applicantId)
        : [...prev, applicantId]
    );
  };

  const handleSelectAll = () => {
    const sorted = getSortedApplications();
    if (selectedApplicants.length === sorted.length) {
      setSelectedApplicants([]);
    } else {
      setSelectedApplicants(sorted.map(a => a.id));
    }
  };

  const getFilteredApplications = () => {
    if (filterStatus === 'all') return applications;
    return applications.filter(app => app.status === filterStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'shortlisted': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'case_study_sent': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'case_study_completed': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pending',
      'reviewed': 'Reviewed',
      'shortlisted': 'Shortlisted',
      'rejected': 'Rejected',
      'case_study_sent': 'Case Study Sent',
      'case_study_completed': 'Completed'
    };
    return labels[status] || status;
  };

  const getSubmission = (email: string) => {
    // For assessments, job_id might be null - try both keys
    const key1 = `${email}_${id}`;
    // Try to find a submission with this email to get case_study_id
    let caseStudyId = null;
    for (const [key, sub] of submissions.entries()) {
      if (sub.applicant_email === email && !sub.job_id) {
        caseStudyId = sub.case_study_id;
        break;
      }
    }
    const key2 = id ? null : `${email}_${caseStudyId || 'null'}`;
    return submissions.get(key1) || (key2 ? submissions.get(key2) : undefined);
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewed: applications.filter(a => a.status === 'reviewed').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    case_study_sent: applications.filter(a => a.status === 'case_study_sent').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const filteredApplications = getFilteredApplications();
  const sortedApplications = getSortedApplications();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 lg:h-24 lg:w-24 border-b-4 border-merit-dark mx-auto"></div>
          <p className="mt-6 text-xl lg:text-[36px] text-gray-600">{t('viewApplicants.loadingApplicants')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
        <div className="text-xl lg:text-[36px] text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e1e4e8' }}>
      <TopBar />
      <div className="flex">
        <Sidebar activeItem={getActiveSidebarItem()} />
        <div className="flex-1 px-6 md:px-12 lg:px-20 py-6">
          <div className="max-w-[1600px] mx-auto">
            {/* Header with Download All Reports Button */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <button
                    onClick={() => {
                      if (isAssessment) {
                        navigate('/recruiter-dashboard/case-study-assessments');
                      } else {
                        navigate('/recruiter-dashboard/my-jobs');
                      }
                    }}
                    className="flex items-center gap-2 text-merit-dark hover:text-merit-green transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>{i18n.language === 'ar' ? 'رجوع' : 'Back'}</span>
                  </button>
                </div>
                <h1 className="text-3xl font-bold text-merit-dark mb-2">{jobTitle}</h1>
                <p className="text-gray-600">{applications.length} {t('viewApplicants.totalApplications')}</p>
              </div>
              {!isAssessment && (
                <button
                  onClick={() => {
                    const csvContent = generateApplicantsReportCSV(applications, jobTitle, submissions);
                    downloadCSVFile(csvContent, `Applicants_Report_${jobTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#C8F55A] rounded-lg hover:bg-[#b8e54a] transition-colors shadow"
                >
                  <Download className="w-5 h-5" strokeWidth={2} />
                  <span className="text-sm font-medium text-merit-dark">{t('viewApplicants.downloadAllReports')}</span>
                </button>
              )}
            </div>

            {/* Stats */}
            {isAssessment ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white border-l-4 border-[#C8F55A] rounded-xl p-4 lg:p-6 shadow-sm">
                  <div className="text-sm lg:text-base text-black opacity-60 mb-2">{t('viewApplicants.total')}</div>
                  <div className="text-2xl lg:text-4xl font-semibold text-merit-dark text-right">{applications.length}</div>
                </div>
                <div className="bg-white border-l-4 border-[#C8F55A] rounded-xl p-4 lg:p-6 shadow-sm">
                  <div className="text-sm lg:text-base text-black opacity-60 mb-2">{t('viewApplicants.pending')}</div>
                  <div className="text-2xl lg:text-4xl font-semibold text-merit-dark text-right">{applications.filter(a => a.status !== 'case_study_sent' && a.status !== 'case_study_completed').length}</div>
                </div>
                <div className="bg-white border-l-4 border-[#C8F55A] rounded-xl p-4 lg:p-6 shadow-sm">
                  <div className="text-sm lg:text-base text-black opacity-60 mb-2">{t('viewApplicants.caseStudySent')}</div>
                  <div className="text-2xl lg:text-4xl font-semibold text-merit-dark text-right">{applications.filter(a => a.status === 'case_study_sent').length}</div>
                </div>
                <div className="bg-white border-l-4 border-[#C8F55A] rounded-xl p-4 lg:p-6 shadow-sm">
                  <div className="text-sm lg:text-base text-black opacity-60 mb-2">{t('viewApplicants.completed')}</div>
                  <div className="text-2xl lg:text-4xl font-semibold text-merit-dark text-right">{applications.filter(a => a.status === 'case_study_completed').length}</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
                <div className="bg-white border-l-4 border-[#C8F55A] rounded-xl p-4 lg:p-6 shadow-sm">
                  <div className="text-sm lg:text-base text-black opacity-60 mb-2">{t('viewApplicants.total')}</div>
                  <div className="text-2xl lg:text-4xl font-semibold text-merit-dark text-right">{stats.total}</div>
                </div>
                <div className="bg-white border-l-4 border-[#C8F55A] rounded-xl p-4 lg:p-6 shadow-sm">
                  <div className="text-sm lg:text-base text-black opacity-60 mb-2">{t('viewApplicants.pending')}</div>
                  <div className="text-2xl lg:text-4xl font-semibold text-merit-dark text-right">{stats.pending}</div>
                </div>
                <div className="bg-white border-l-4 border-[#C8F55A] rounded-xl p-4 lg:p-6 shadow-sm">
                  <div className="text-sm lg:text-base text-black opacity-60 mb-2">{t('viewApplicants.reviewed')}</div>
                  <div className="text-2xl lg:text-4xl font-semibold text-merit-dark text-right">{stats.reviewed}</div>
                </div>
                <div className="bg-white border-l-4 border-[#C8F55A] rounded-xl p-4 lg:p-6 shadow-sm">
                  <div className="text-sm lg:text-base text-black opacity-60 mb-2">{t('viewApplicants.shortlisted')}</div>
                  <div className="text-2xl lg:text-4xl font-semibold text-merit-dark text-right">{stats.shortlisted}</div>
                </div>
                <div className="bg-white border-l-4 border-[#C8F55A] rounded-xl p-4 lg:p-6 shadow-sm">
                  <div className="text-sm lg:text-base text-black opacity-60 mb-2">{t('viewApplicants.caseStudies')}</div>
                  <div className="text-2xl lg:text-4xl font-semibold text-merit-dark text-right">{stats.case_study_sent}</div>
                </div>
                <div className="bg-white border-l-4 border-[#C8F55A] rounded-xl p-4 lg:p-6 shadow-sm">
                  <div className="text-sm lg:text-base text-black opacity-60 mb-2">{t('viewApplicants.rejected')}</div>
                  <div className="text-2xl lg:text-4xl font-semibold text-merit-dark text-right">{stats.rejected}</div>
                </div>
              </div>
            )}

            {/* Filters and Ranking Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
              <div className={`grid grid-cols-1 ${isAssessment ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-5'} gap-6`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('viewApplicants.filterByStatus')}</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-[#C8F55A]"
                  >
                    <option value="all">{t('viewApplicants.all')} ({applications.length})</option>
                    <option value="pending">{t('viewApplicants.pending')} ({stats.pending})</option>
                    <option value="reviewed">{t('viewApplicants.reviewed')} ({stats.reviewed})</option>
                    <option value="shortlisted">{t('viewApplicants.shortlisted')} ({stats.shortlisted})</option>
                    <option value="case_study_sent">{t('viewApplicants.caseStudySent')} ({stats.case_study_sent})</option>
                    <option value="rejected">{t('viewApplicants.rejected')} ({stats.rejected})</option>
                  </select>
                </div>

                {!isAssessment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rank By</label>
                    <select
                      value={rankingType}
                      onChange={(e) => setRankingType(e.target.value as 'cv' | 'case_study')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-[#C8F55A]"
                    >
                      <option value="cv">CV Match Score</option>
                      <option value="case_study">Case Study Score</option>
                    </select>
                  </div>
                )}

                {!isAssessment && (
                  <div className="flex items-end md:col-span-1 lg:col-span-3">
                    <button
                      onClick={handleSelectAll}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${selectedApplicants.length === sortedApplications.length && sortedApplications.length > 0
                        ? 'bg-[#C8F55A] text-merit-dark hover:bg-[#b8e54a] shadow-lg shadow-[#C8F55A]/20'
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-[#b8e54a] border border-gray-200 hover:border-gray-300 shadow-sm'
                        }`}
                    >
                      {selectedApplicants.length === sortedApplications.length && sortedApplications.length > 0 ? (
                        <>
                          <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                          <span>{t('viewApplicants.deselectAll')}</span>
                        </>
                      ) : (
                        <>
                          <User className="w-4 h-4" strokeWidth={2.5} />
                          <span>{t('viewApplicants.selectAll')}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Applicant Cards */}
            {sortedApplications.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('viewApplicants.noApplicantsFound')}</h3>
                <p className="text-base text-gray-600">
                  {filterStatus === 'all'
                    ? t('viewApplicants.noApplicationsYet')
                    : t('viewApplicants.noApplicationsWithStatus', { status: getStatusLabel(filterStatus) })}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedApplications.map((app, index) => {
                  const submission = getSubmission(app.email);
                  const hasSubmission = submission !== undefined;
                  const resultGenerated = submission?.result_generated === 1;
                  const caseStudyScore = getCaseStudyScore(submission);

                  return (
                    <div
                      key={app.id}
                      onClick={() => handleSelectApplicant(app.id)}
                      className={`bg-white rounded-xl p-6 shadow-sm relative cursor-pointer hover:bg-gray-50 transition-colors ${selectedApplicants.includes(app.id) ? 'border-2 border-[#75A400]' : 'border border-transparent'
                        }`}
                    >
                      {/* Ranking Badge */}
                      <div className="absolute top-4 left-4 w-8 h-8 bg-[#C8F55A] border-2 border-[#75A400] rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-[#75A400]">#{index + 1}</span>
                      </div>

                      {selectedApplicants.includes(app.id) && (
                        <div className="absolute top-4 right-4 w-10 h-10 bg-[#C8F55A] border-2 border-[#75A400] rounded-lg flex items-center justify-center pointer-events-none">
                          <CheckCircle className="w-6 h-6 text-[#75A400]" strokeWidth={2.5} />
                        </div>
                      )}

                      {/* Header Section - Applicant Info and Score Badge */}
                      <div className="flex items-start gap-4 mb-6">
                        {/* Profile Avatar */}
                        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <User className="w-7 h-7 text-gray-500" />
                        </div>

                        {/* Applicant Name and Title */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-merit-dark truncate">{app.full_name}</h3>
                            {app.status === 'shortlisted' && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-merit-green text-black rounded-full flex items-center gap-1 flex-shrink-0">
                                <Star className="w-3 h-3" fill="currentColor" />
                                Shortlisted
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{app.last_job_title}</p>
                        </div>

                        {/* Score Badge - Right aligned */}
                        <div className="flex-shrink-0">
                          {(!isAssessment && rankingType === 'cv') ? (
                            <div>
                              {app.cv_match_score !== null && app.cv_match_score > 0 ? (
                                <div className="flex flex-col items-end gap-2">
                                  <div
                                    className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 cursor-pointer hover:shadow-md transition-all ${getCVMatchColor(app.cv_match_score)}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCVMatch(app.cv_match_details);
                                    }}
                                  >
                                    {getCVMatchIcon(app.cv_match_score)}
                                    <div className="text-right">
                                      <div className="text-xs font-medium opacity-70">CV Match</div>
                                      <div className="text-xl font-bold">{app.cv_match_score}%</div>
                                    </div>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getCVMatchColor(app.cv_match_score)}`}>
                                    {app.match_category}
                                  </span>
                                </div>
                              ) : (
                                <div className="px-4 py-2 rounded-lg border-2 bg-gray-50 text-gray-500 flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <div className="text-right">
                                    <div className="text-xs font-medium">CV Match</div>
                                    <div className="text-sm font-semibold">Analyzing...</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              {caseStudyScore !== null ? (
                                <div className="flex flex-col items-end gap-2">
                                  <div
                                    className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 cursor-pointer hover:shadow-md transition-all ${getCaseStudyColor(caseStudyScore)}`}
                                  >
                                    {getCaseStudyIcon(caseStudyScore)}
                                    <div className="text-right">
                                      <div className="text-xs font-medium opacity-70">Case Study</div>
                                      <div className="text-xl font-bold">{caseStudyScore}%</div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getCaseStudyColor(caseStudyScore)}`}>
                                      {submission?.rating || 'Unrated'}
                                    </span>
                                    {submission ? (
                                      <span className="text-xs text-gray-500">
                                        {submission.ai_detected && submission.avg_ai_probability > 0 ? `${typeof submission.avg_ai_probability === 'number' ? submission.avg_ai_probability.toFixed(1) : parseFloat(String(submission.avg_ai_probability || 0)).toFixed(1)}% AI` : 'No AI detected'}
                                      </span>
                                    ) : null}
                                    {submission?.ai_detected && (
                                      <span className="text-xs px-2 py-1 rounded-full font-semibold bg-red-100 text-red-700 border-red-300 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        AI Detected
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="px-4 py-2 rounded-lg border-2 bg-gray-50 text-gray-500 flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <div className="text-right">
                                    <div className="text-xs font-medium">Case Study</div>
                                    <div className="text-sm font-semibold">No Score</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Contact Information Section */}
                      <div className={`grid grid-cols-1 ${isAssessment ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4 mb-6`}>
                        <div>
                          <div className="flex items-center gap-2 text-gray-700 font-medium mb-1">
                            <Mail className="w-5 h-5" strokeWidth={2} />
                            <span className="text-sm">{t('viewApplicants.email')}</span>
                          </div>
                          <p className="text-sm text-gray-600 ml-7">{app.email}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-gray-700 font-medium mb-1">
                            <Calendar className="w-5 h-5" strokeWidth={2} />
                            <span className="text-sm">{t('viewApplicants.submittedOn')}</span>
                          </div>
                          <p className="text-sm text-gray-600 ml-7">
                            {new Date(app.applied_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        {!isAssessment && (
                          <div>
                            <div className="flex items-center gap-2 text-gray-700 font-medium mb-1">
                              <Phone className="w-5 h-5" strokeWidth={2} />
                              <span className="text-sm">{t('viewApplicants.phoneNumber')}</span>
                            </div>
                            <p className="text-sm text-gray-600 ml-7">{app.phone}</p>
                          </div>
                        )}
                      </div>

                      {app.additional_info && (
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          <p className="text-sm text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <strong className="text-blue-900">{t('viewApplicants.additionalInfo')}:</strong>
                            <span className="text-blue-800 ml-2">{app.additional_info}</span>
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 justify-end">
                        {!isAssessment && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadResume(app.id, app.full_name);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#C8F55A] rounded-lg hover:bg-[#b8e54a] transition-colors"
                          >
                            <Download className="w-5 h-5" strokeWidth={2} />
                            <span className="text-sm font-medium text-merit-dark">{t('viewApplicants.downloadResume')}</span>
                          </button>
                        )}
                        {(app.status === 'case_study_completed' || app.status === 'case_study_sent' || app.status === 'shortlisted' || app.status === 'rejected') && hasSubmission && (
                          <>
                            {!resultGenerated ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateResult(app.email);
                                }}
                                disabled={generatingResult === submission.id}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {generatingResult === submission.id ? (
                                  <>
                                    <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
                                    <span className="text-sm font-medium">{t('viewApplicants.generating')}</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-5 h-5" strokeWidth={2} />
                                    <span className="text-sm font-medium">Generating Result</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // For assessments, job_id is null - use 'null' and let AssessmentResultsView handle it
                                    const jobIdParam = isAssessment ? 'null' : (id || 'null');
                                    navigate(`/jobs/${jobIdParam}/assessment/${encodeURIComponent(app.email)}`);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-[#C8F55A] text-black rounded-lg hover:bg-[#b8e54a] transition-colors"
                                >
                                  <Brain className="w-5 h-5" strokeWidth={2} />
                                  <span className="text-sm font-medium text-merit-dark">
                                    {t('viewApplicants.viewResult')}
                                  </span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (submission) {
                                      generateAssessmentReportPDF(app, submission, jobTitle).then(reportData => {
                                        if (reportData) {
                                          downloadAssessmentReportPDF(reportData, app.full_name);
                                        }
                                      });
                                    } else {
                                      toast({
                                        variant: "destructive",
                                        title: "Error",
                                        description: "Could not find submission data for this applicant"
                                      });
                                    }
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <FileText className="w-5 h-5" strokeWidth={2} />
                                  <span className="text-sm font-medium text-merit-dark">{t('viewApplicants.downloadReport')}</span>
                                </button>
                              </>
                            )}
                          </>
                        )}

                        {/* Status Action Buttons - Show appropriate buttons based on status */}
                        {!isAssessment && app.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(app.id, 'reviewed');
                            }}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <CheckCircle className="w-5 h-5" strokeWidth={2} />
                            <span className="text-sm font-medium text-merit-dark">{t('viewApplicants.markAsReviewed')}</span>
                          </button>
                        )}

                        {/* Shortlist button appears for all statuses except rejected */}
                        {!isAssessment && app.status !== 'rejected' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(app.id, 'shortlisted');
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${app.status === 'shortlisted'
                              ? 'bg-[#C8F55A] text-merit-dark hover:bg-[#b8e54a]'
                              : 'border border-gray-300 text-merit-dark hover:bg-gray-50'
                              }`}
                          >
                            <Star className="w-5 h-5" strokeWidth={2} />
                            <span className="text-sm font-medium">
                              {app.status === 'shortlisted' ? 'Shortlisted' : 'Shortlist'}
                            </span>
                          </button>
                        )}

                        {/* Reject button - always available unless already rejected */}
                        {!isAssessment && app.status !== 'rejected' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(app.id, 'rejected');
                            }}
                            className="flex items-center gap-2 px-4 py-2 border border-red-300 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <XCircle className="w-5 h-5" strokeWidth={2} />
                            <span className="text-sm font-medium text-merit-dark">{t('viewApplicants.reject')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Actions Bar */}
      {selectedApplicants.length > 0 && !isAssessment && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="font-medium text-base text-merit-dark">
                  {t('viewApplicants.applicantSelected', { count: selectedApplicants.length })}
                </p>
                <button
                  onClick={() => setSelectedApplicants([])}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {t('viewApplicants.clearSelection')}
                </button>
              </div>

              <button
                onClick={() => setShowCaseStudyModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#C8F55A] rounded-lg hover:bg-[#b8e54a] transition-colors shadow"
              >
                <Send className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm font-medium text-merit-dark">{t('viewApplicants.sendCaseStudy')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedApplicants.length > 0 && <div className="h-16"></div>}

      {/* Case Study Modal */}
      {!isAssessment && (
        <SendCaseStudyModal
          isOpen={showCaseStudyModal}
          onClose={() => setShowCaseStudyModal(false)}
          selectedApplicants={selectedApplicants}
          jobId={parseInt(id || '0')}
          onSuccess={() => {
            setSelectedApplicants([]);
            fetchApplications();
            setShowCaseStudyModal(false);
          }}
        />
      )}

      {/* CV Match Modal */}
      {selectedCVMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ backgroundColor: '#e1e4e8' }}>
            <div className="bg-gradient-to-r from-merit-green to-merit-green text-black p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">CV-Job Match Analysis</h2>
                <p className="text-sm opacity-90 mt-1">AI-Powered Candidate Evaluation</p>
              </div>
              <button
                onClick={() => setSelectedCVMatch(null)}
                className="rounded-full p-2 hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Overall Score */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Overall Match Score</p>
                    <div className="flex items-center gap-3">
                      <p className="text-5xl font-bold text-merit-dark">{selectedCVMatch.overall_match_score}</p>
                      <span className="text-2xl text-gray-400">/100</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-6 py-3 rounded-full text-lg font-bold border-2 ${getCVMatchColor(selectedCVMatch.overall_match_score)}`}>
                      {selectedCVMatch.match_level}
                    </span>
                    <p className="text-sm text-gray-600 mt-2">Recommendation: <strong>{selectedCVMatch.recommendation}</strong></p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${selectedCVMatch.overall_match_score >= 80 ? 'bg-green-500' :
                      selectedCVMatch.overall_match_score >= 60 ? 'bg-blue-500' :
                        selectedCVMatch.overall_match_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    style={{ width: `${selectedCVMatch.overall_match_score}%` }}
                  ></div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Summary
                </h3>
                <p className="text-blue-800">{selectedCVMatch.summary}</p>
              </div>

              {/* Experience & Education Match */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-blue-500" />
                      Experience Match
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getCVMatchColor(selectedCVMatch.experience_match)}`}>
                      {selectedCVMatch.experience_match}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{selectedCVMatch.experience_evidence || 'No evidence provided'}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-500" />
                      Education Match
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getCVMatchColor(selectedCVMatch.education_match)}`}>
                      {selectedCVMatch.education_match}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{selectedCVMatch.education_evidence || 'No evidence provided'}</p>
                </div>
              </div>

              {/* Skills Match */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Skills Assessment
                </h3>
                <div className="space-y-3">
                  {selectedCVMatch.skills_match && selectedCVMatch.skills_match.length > 0 ? (
                    selectedCVMatch.skills_match.map((skill, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        {skill.found_in_cv ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{skill.skill_name}</span>
                            {skill.is_required && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300">
                                Required
                              </span>
                            )}
                          </div>
                          {skill.evidence && (
                            <p className="text-sm text-gray-600 italic">"{skill.evidence}"</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No skill data available</p>
                  )}
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {selectedCVMatch.strengths && selectedCVMatch.strengths.length > 0 ? (
                      selectedCVMatch.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-green-700 italic">No specific strengths identified</li>
                    )}
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Gaps to Address
                  </h3>
                  <ul className="space-y-2">
                    {selectedCVMatch.gaps && selectedCVMatch.gaps.length > 0 ? (
                      selectedCVMatch.gaps.map((gap, idx) => (
                        <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">⚠</span>
                          <span>{gap}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-red-700 italic">No significant gaps identified</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}