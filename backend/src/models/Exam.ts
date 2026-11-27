
import mongoose, { Schema } from "mongoose";
import { IExam } from "../types/globalTypes";

const examSchema = new Schema<IExam>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        board: {
            type: String,
            required: true,
            trim: true,
        },
        className: {
            type: String,
            required: true,
            trim: true,
        },
        stream: {
            type: String,
            default: "",
            trim: true,
        },
        subjects: {
            type: [String],
            required: true,
            validate: {
                validator: (value: string[]) => value.length > 0,
                message: "At least one subject is required",
            },
        },
        answerSheet: {
            width: {
                type: Number,
                required: true,
                min: 1,
            },
            height: {
                type: Number,
                required: true,
                min: 1,
            },
        },
    },
    {
        timestamps: true,
    }
);

export const Exam = mongoose.model<IExam>("Exam", examSchema);
