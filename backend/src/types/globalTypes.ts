export interface IQuestion {
    qNo: number;
    subPart?: string;
    title: string;
    maxMarks: number;
}

export interface IExam extends Document {
    name: string;
    subject: string;
    answerSheet: {
        width: number;
        height: number;
    };
    questions: IQuestion[];
    createdAt: Date;
    updatedAt: Date;
}
