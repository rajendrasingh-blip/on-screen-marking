import mongoose, { Schema } from "mongoose";
import { IExam, IQuestion } from "../types/globalTypes";

const questionSchema = new Schema<IQuestion>(
    {
        qNo: {
            type: String,
            required: true
        },
        subPart: {
            type: String,
            default: ""
        },
        title: {
            type: String,
            required: true
        },
        maxMarks: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        _id: false
    }
);

const examSchema = new Schema<IExam>({
    name: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true
    },
    answerSheet: {
        width: {
            type: Number,
            required: true
        },
        height: {
            type: Number,
            required: true
        }
    },
    questions: {
        type: [questionSchema],
        required: true
    }
}, { timestamps: true });

export const Exam = mongoose.model<IExam>("Exam", examSchema);