import mongoose, { Schema } from "mongoose"

interface ISubQuestion {
    subPart: number,
    title: string,
    maxMarks: number
}

interface IQuestion {
    qNo: number,
    title: string,
    subQuestions: ISubQuestion[],
    maxMarks: number
}

interface IExamQuestion extends Document {
    examId: mongoose.Types.ObjectId,
    board: string,
    className: string,
    stream: string,
    subject: string,
    questions: IQuestion[]
}

const subQuestionSchema = new Schema(
    {
        subPart: {
            type: String,
            default: "",
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        maxMarks: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: true }
);

const questionSchema = new Schema<IQuestion>({
    qNo: {
        type: Number,
        required: true,
        min: 1
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    maxMarks: {
        type: Number,
        required: true,
        min: 0
    },
    subQuestions: {
        type: [subQuestionSchema],
        default: []
    },

}, { _id: true });


const examQuestionSchema = new Schema<IExamQuestion>({
    examId: {
        type: Schema.Types.ObjectId,
        ref: "Exam",
        required: true,
    },
    board: {
        type: String,
        required: true
    },
    className: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    stream: {
        type: String,
        default: ""
    },
    questions: {
        type: [questionSchema],
        required: true,
        default: []
    }
}, { timestamps: true });

examQuestionSchema.index(
    { examId: 1, subject: 1 },
    { unique: true }
)

export default mongoose.model<IExamQuestion>("ExamQuestion", examQuestionSchema);