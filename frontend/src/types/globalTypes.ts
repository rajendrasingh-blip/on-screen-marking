
export type RoleType = "STUDENT | ADMIN | EXAMINER";
export interface Question {
  qNo: number;
  subPart: string;
  title: string;
  maxMarks: number;
}

export interface ExamForm {
  name: string;
  subject: string;
  answerSheet: {
    width: number;
    height: number;
  };
  questions: Question[];
}

export interface Exam {
  _id: string;
  name: string;
  subject: string;
  answerSheet: {
    width: number;
    height: number;
  };
  questions: {
    qNo: number;
    subPart: string;
    title: string;
    maxMarks: number;
  }[];
}

export interface Region {
  qNo: string;
  subPart?: string;

  yTop: number;
  yBottom: number;

  maxMarks?: number;

  confidence?: number;

  reason?: string;

  region?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  };
}

export interface PageCoordinate {
  pageNumber: number;
  width: number;
  height: number;
  regions: Region[];
}

export interface ExaminerData {
  answerSheet: {
    id: string;
    studentId: string;
    examId: string;
    pdfId: string;
    originalFileName: string;
    totalPages: number;
    processingStatus: string;
  };

  exam: {
    id: string;
    name: string;
    subject: string;

    questions: {
      qNo: number;
      title: string;
      maxMarks: number;
    }[];
  };

  coordinateMap: {
    pages: PageCoordinate[];
  };
}

export interface SelectedQuestion {
  pageNumber: number;

  qNo: string;
  subPart: string;

  maxMarks: number;

  x: number;
  y: number;

  screenX: number;
  screenY: number;
}

export interface SavedMark {
  _id: string;
  pageNumber: number;

  qNo: string;
  subPart: string;

  maxMarks: number;
  awardedMarks: number;

  x: number;
  y: number;
}

export interface User {
  _id: string,
  name: string,
  email: string,
  role: RoleType,
  isActive: boolean
}