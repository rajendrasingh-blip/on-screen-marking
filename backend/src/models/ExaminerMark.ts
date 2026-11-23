import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IExaminerMark
  extends Document {
  answerSheetId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;

  pageNumber: number;

  qNo: string;
  subPart: string;

  maxMarks: number;
  awardedMarks: number;

  x?: number;
  y?: number;

  createdAt: Date;
  updatedAt: Date;
}

const examinerMarkSchema =
  new Schema<IExaminerMark>(
    {
      answerSheetId: {
        type: Schema.Types.ObjectId,
        ref: "StudentAnswerSheet",
        required: true,
        index: true,
      },

      examId: {
        type: Schema.Types.ObjectId,
        ref: "Exam",
        required: true,
        index: true,
      },

      studentId: {
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: true,
        index: true,
      },

      pageNumber: {
        type: Number,
        required: true,
      },

      qNo: {
        type: String,
        required: true,
      },

      /**
       * "main" means question has no sub-part.
       *
       * Example:
       * Q1(i)  -> i
       * Q1(ii) -> ii
       * Q2     -> main
       */
      subPart: {
        type: String,
        required: true,
        default: "main",
      },

      maxMarks: {
        type: Number,
        required: true,
        min: 0,
      },

      awardedMarks: {
        type: Number,
        required: true,
        min: 0,
      },

      x: {
        type: Number,
      },

      y: {
        type: Number,
      },
    },
    {
      timestamps: true,
    }
  );

/**
 * One marking record per:
 *
 * answerSheet + page + question + subPart
 */
examinerMarkSchema.index(
  {
    answerSheetId: 1,
    pageNumber: 1,
    qNo: 1,
    subPart: 1,
  },
  {
    unique: true,
  }
);

export const ExaminerMark =
  mongoose.model<IExaminerMark>(
    "ExaminerMark",
    examinerMarkSchema
  );