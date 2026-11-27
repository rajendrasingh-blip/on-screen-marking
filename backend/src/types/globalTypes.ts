

export interface IExam extends Document {
    name: string;
    board: string;
    className: string,
    stream: string,
    subjects: string[],
    answerSheet: {
        width: number;
        height: number;
    };
}
