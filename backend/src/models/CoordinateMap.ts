import mongoose, { Document, Schema } from "mongoose";

export interface IQuestionRegion {
  qNo: string;
  subPart?: string;

  yTop: number;
  yBottom: number;

  confidence?: number;

  detectionMethod:
  | "ocr"
  | "template"
  | "manual"
  | "gemini";

  maxMarks?: number;

  reason?: string;
  verifiedReason?: string | null;
  reasonVerified?: boolean;

  questionNumberBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  geminiDetection?: {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    reason?: string;
  };

  region?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  };
}

export interface IPageCoordinate {
  pageNumber: number;
  width: number;
  height: number;
  regions: IQuestionRegion[];
}

export interface ICoordinateMap extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  examId: mongoose.Types.ObjectId;
  pdfId: string;

  pages: IPageCoordinate[];

  version: number;

  createdAt: Date;
  updatedAt: Date;
}

const questionRegionSchema = new Schema<IQuestionRegion>(
  {
    qNo: {
      type: String,
      required: true,
    },

    subPart: {
      type: String,
      required: false,
    },

    yTop: {
      type: Number,
      required: true,
    },

    yBottom: {
      type: Number,
      required: true,
    },

    confidence: {
      type: Number,
    },

    detectionMethod: {
      type: String,
      enum: ["ocr", "template", "manual", "gemini"],
      required: true,
    },

    maxMarks: {
      type: Number,
      required: false,
    },

    reason: {
      type: String,
      required: false,
    },

    verifiedReason: {
      type: String,
      required: false,
      default: null,
    },

    reasonVerified: {
      type: Boolean,
      default: false,
    },

    questionNumberBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
    },

    geminiDetection: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      confidence: Number,
      reason: String,
    },

    region: {
      x1: Number,
      y1: Number,
      x2: Number,
      y2: Number,
      width: Number,
      height: Number,
    },
  },
  {
    _id: false,
  }
);

const pageCoordinateSchema = new Schema<IPageCoordinate>(
  {
    pageNumber: {
      type: Number,
      required: true,
    },

    width: {
      type: Number,
      required: true,
    },

    height: {
      type: Number,
      required: true,
    },

    regions: {
      type: [questionRegionSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

const coordinateMapSchema = new Schema<ICoordinateMap>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },

    pdfId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    pages: {
      type: [pageCoordinateSchema],
      default: [],
    },

    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export const CoordinateMap =
  mongoose.model<ICoordinateMap>(
    "CoordinateMap",
    coordinateMapSchema
  );