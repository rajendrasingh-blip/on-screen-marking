
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

export interface IStudentAnswerSheet extends Document {

    examId: mongoose.Types.ObjectId;

    board: string;
    className: string;
    stream?: string;
    subject: string;

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
            // Exam Reference
            examId: {
                type: Schema.Types.ObjectId,
                ref: "Exam",
                required: true,
                index: true,
            },

            // Board
            board: {
                type: String,
                required: true,
                enum: ["UP", "PSEB", "RBSE"],
                index: true,
            },

            // Class
            className: {
                type: String,
                required: true,
                index: true,
            },

            // Stream (Class 11 & 12)
            stream: {
                type: String,
                default: null,
            },

            // Subject
            subject: {
                type: String,
                required: true,
                index: true,
            },

            // PDF ID
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

            // Processing Status
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

            // Coordinate Map
            coordinateMapId: {
                type: Schema.Types.ObjectId,
                ref: "CoordinateMap",
            },
        },
        {
            timestamps: true,
        }
    );

// Useful compound indexes
studentAnswerSheetSchema.index({
    examId: 1,
    board: 1,
    className: 1,
    subject: 1,
});

studentAnswerSheetSchema.index({
    examId: 1,
    processingStatus: 1,
});

export const StudentAnswerSheet =
    mongoose.model<IStudentAnswerSheet>(
        "StudentAnswerSheet",
        studentAnswerSheetSchema
    );
