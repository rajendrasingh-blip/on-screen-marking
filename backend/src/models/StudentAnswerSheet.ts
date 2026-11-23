import mongoose, {
    Document,
    Schema,
} from "mongoose";

export type ProcessingStatus =
    | "uploaded"
    | "processing"
    | "ready"
    | "ready_with_warning"
    | "failed";

export interface IStudentAnswerSheet
    extends Document {
    studentId: mongoose.Types.ObjectId;
    examId: mongoose.Types.ObjectId;

    pdfId: string;
    originalFileName: string;
    filePath: string;

    totalPages?: number;

    processingStatus: ProcessingStatus;
    processingProgress: number;

    processingError?: string;

    coordinateMapId?: mongoose.Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

const studentAnswerSheetSchema =
    new Schema<IStudentAnswerSheet>(
        {
            studentId: {
                type: Schema.Types.ObjectId,
                ref: "Student",
                required: true,
                index: true,
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

            originalFileName: {
                type: String,
                required: true,
            },

            filePath: {
                type: String,
                required: true,
            },

            totalPages: {
                type: Number,
            },

            processingStatus: {
                type: String,
                enum: [
                    "uploaded",
                    "processing",
                    "ready",
                    "ready_with_warning",
                    "failed",
                ],
                default: "uploaded",
                index: true,
            },

            processingProgress: {
                type: Number,
                default: 0,
            },

            processingError: {
                type: String,
            },

            coordinateMapId: {
                type: Schema.Types.ObjectId,
                ref: "CoordinateMap",
            },
        },
        {
            timestamps: true,
        }
    );

export const StudentAnswerSheet =
    mongoose.model<IStudentAnswerSheet>(
        "StudentAnswerSheet",
        studentAnswerSheetSchema
    );