import mongoose, { Schema } from "mongoose"

export interface IStudent {
    studentId: string,
    name: string
}

const studentSchema = new Schema<IStudent>({
    studentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    }
}, { timestamps: true });


export const Student = mongoose.model<IStudent>("Student", studentSchema);