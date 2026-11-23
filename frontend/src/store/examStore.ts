import { Exam, SavedMark, User } from "@/types/globalTypes";
import { create } from "zustand";

type ExamStore = {
    exam: Exam[];
    setExam: (exam: Exam[]) => void;
};

type answerSheetIdStore = {
    answerId: string | null;
    setAnswerId: (answerId: string) => void;
};

type MarksStore = {
    marks: SavedMark[];
    setMarks: (exam: SavedMark[]) => void;
};

type UsersStore = {
    users: User[];
    setUsers: (exam: User[]) => void;
};

export const examStore = create<ExamStore>((set) => ({
    exam: [],
    setExam: (exam) => set({ exam })
}));

export const answerSheetStore = create<answerSheetIdStore>((set) => ({
    answerId: null,
    setAnswerId: (answerId) => set({ answerId })
}));

export const markStore = create<MarksStore>((set) => ({
    marks: [],
    setMarks: (marks) => set({ marks })
}));

export const usersStore = create<UsersStore>((set) => ({
    users: [],
    setUsers: (users) => set({ users })
}));