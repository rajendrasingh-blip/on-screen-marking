
"use client";

import { useEffect, useMemo, useState } from "react";
import {
    createExamApi,
    getAllExamApi,
    createExamQuestionsApi,
} from "@/api/apiCall";
import { SUBJECT_CONSTANT } from "@/components/constant/subject";

type SubQuestionItem = {
    subPart: string;
    title: string;
    maxMarks: number;
};

type QuestionItem = {
    qNo: number;
    title: string;
    maxMarks: number;
    subQuestions: SubQuestionItem[];
};

const initialQuestion: QuestionItem = {
    qNo: 1,
    title: "",
    maxMarks: 0,
    subQuestions: [],
};

const createEmptyQuestion = (qNo: number): QuestionItem => ({
    qNo,
    title: "",
    maxMarks: 0,
    subQuestions: [
        {
            subPart: "",
            title: "",
            maxMarks: 1,
        },
    ],
});

type ExamForm = {
    name: string;
    board: string;
    className: string;
    stream: string;
    subjects: string[];
    answerSheet: {
        width: number;
        height: number;
    };
};

type Exam = {
    _id: string;
    name: string;
    board: string;
    className: string;
    stream?: string;
    subjects: string[];
    answerSheet: {
        width: number;
        height: number;
    };
};

const initialExamForm: ExamForm = {
    name: "",
    board: "",
    className: "",
    stream: "",
    subjects: [],
    answerSheet: {
        width: 1047,
        height: 1566,
    },
};


export default function CreateExamPage() {
    // --------------------------------
    // EXAM STATE
    // --------------------------------

    const [examForm, setExamForm] =
        useState<ExamForm>(initialExamForm);

    const [examLoading, setExamLoading] = useState(false);

    const [exams, setExams] = useState<Exam[]>([]);

    const [examError, setExamError] = useState("");
    const [examSuccess, setExamSuccess] = useState("");

    // --------------------------------
    // QUESTION STATE
    // --------------------------------

    const [selectedExamId, setSelectedExamId] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");

    const [questions, setQuestions] = useState<QuestionItem[]>([
        { ...initialQuestion },
    ]);

    const [bulkCount, setBulkCount] = useState(5);

    const [questionLoading, setQuestionLoading] = useState(false);
    const [questionError, setQuestionError] = useState("");
    const [questionSuccess, setQuestionSuccess] = useState("");

    // --------------------------------
    // CONSTANTS
    // --------------------------------

    const boards = [
        { value: "UP", label: "UP Board" },
        { value: "PSEB", label: "Punjab Board" },
        { value: "RBSE", label: "Rajasthan Board" },
    ];

    const classes = [5, 6, 7, 8, 9, 10, 11, 12];

    const streams = ["Science", "Commerce", "Arts"];

    const hasStream = ["11", "12"].includes(
        examForm.className
    );

    // --------------------------------
    // SUBJECT HELPER
    // --------------------------------

    const getSubjects = (
        board: string,
        classNo: number,
        stream?: string
    ) => {
        const selectedBoard = SUBJECT_CONSTANT.find(
            (item) => item.board === board
        );

        if (!selectedBoard) return [];

        const selectedClass = selectedBoard.classes.find(
            (item) => item.class === classNo
        );

        if (!selectedClass) return [];

        if ("streams" in selectedClass) {
            return (
                selectedClass.streams.find(
                    (item) => item.stream === stream
                )?.subjects || []
            );
        }

        return selectedClass.subjects;
    };

    // Subjects available while creating exam
    const examSubjectOptions = useMemo(() => {
        if (!examForm.board || !examForm.className) {
            return [];
        }

        if (hasStream && !examForm.stream) {
            return [];
        }

        return getSubjects(
            examForm.board,
            Number(examForm.className),
            examForm.stream
        );
    }, [
        examForm.board,
        examForm.className,
        examForm.stream,
    ]);

    // Selected exam
    const selectedExam = exams.find(
        (exam) => exam._id === selectedExamId
    );

    // Subjects available for question creation
    const questionSubjectOptions = useMemo(() => {
        if (!selectedExam) return [];

        return getSubjects(
            selectedExam.board,
            Number(selectedExam.className),
            selectedExam.stream
        ).filter((subject) =>
            selectedExam.subjects.includes(String(subject.id))
        );
    }, [selectedExam]);

    // --------------------------------
    // FETCH EXAMS
    // --------------------------------

    const fetchExams = async () => {
        try {
            const res = await getAllExamApi();

            const examList = res?.data?.data || [];

            setExams(examList);
        } catch (error) {
            console.error("Fetch exams error:", error);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    // --------------------------------
    // EXAM FORM HANDLERS
    // --------------------------------

    const handleExamChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setExamForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleExamSelectChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setExamForm((prev) => {
            if (name === "board") {
                return {
                    ...prev,
                    board: value,
                    className: "",
                    stream: "",
                    subjects: [],
                };
            }

            if (name === "className") {
                return {
                    ...prev,
                    className: value,
                    stream: "",
                    subjects: [],
                };
            }

            if (name === "stream") {
                return {
                    ...prev,
                    stream: value,
                    subjects: [],
                };
            }

            return prev;
        });
    };

    const handleAnswerSheetChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setExamForm((prev) => ({
            ...prev,
            answerSheet: {
                ...prev.answerSheet,
                [name]: Number(value),
            },
        }));
    };

    // --------------------------------
    // SUBJECT SELECTION
    // --------------------------------

    const handleSubjectToggle = (subjectId: string) => {
        setExamForm((prev) => ({
            ...prev,
            subjects: prev.subjects.includes(subjectId)
                ? prev.subjects.filter(
                    (id) => id !== subjectId
                )
                : [...prev.subjects, subjectId],
        }));
    };

    // --------------------------------
    // CREATE EXAM
    // --------------------------------

    const handleCreateExam = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setExamError("");
        setExamSuccess("");

        if (!examForm.name.trim()) {
            setExamError("Please enter exam name");
            return;
        }

        if (!examForm.board) {
            setExamError("Please select board");
            return;
        }

        if (!examForm.className) {
            setExamError("Please select class");
            return;
        }

        if (hasStream && !examForm.stream) {
            setExamError("Please select stream");
            return;
        }

        if (examForm.subjects.length === 0) {
            setExamError("Please select at least one subject");
            return;
        }

        if (
            examForm.answerSheet.width <= 0 ||
            examForm.answerSheet.height <= 0
        ) {
            setExamError("Invalid answer sheet dimensions");
            return;
        }

        try {
            setExamLoading(true);

            const res = await createExamApi(examForm);

            const createdExam = res?.data?.data;

            setExamSuccess("Exam created successfully!");

            setExamForm({ ...initialExamForm });

            // Refresh exam dropdown after successful creation
            await fetchExams();

            // Automatically select newly created exam
            if (createdExam?._id) {
                setSelectedExamId(createdExam._id);
                setSelectedSubject("");
                setQuestions([createEmptyQuestion(1)]);
            }
        } catch (error: any) {
            console.error(error);

            setExamError(
                error?.response?.data?.message ||
                "Failed to create exam"
            );
        } finally {
            setExamLoading(false);
        }
    };

    // --------------------------------
    // EXAM SELECTION FOR QUESTIONS
    // --------------------------------

    const handleQuestionExamChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        setSelectedExamId(e.target.value);

        setSelectedSubject("");
        setQuestions([createEmptyQuestion(1)]);

        setQuestionError("");
        setQuestionSuccess("");
    };

    // --------------------------------
    // QUESTION HANDLERS
    // --------------------------------

    const handleQuestionChange = (
        index: number,
        field: "qNo" | "title" | "maxMarks",
        value: string
    ) => {
        setQuestions((prev) =>
            prev.map((question, i) =>
                i === index
                    ? {
                        ...question,
                        [field]:
                            field === "qNo" || field === "maxMarks"
                                ? Number(value)
                                : value,
                    }
                    : question
            )
        );
    };

    // ADD ONE MAIN QUESTION
    const addQuestion = () => {
        setQuestions((prev) => {
            const lastQNo = Math.max(
                0,
                ...prev.map((q) => q.qNo || 0)
            );

            return [
                ...prev,
                createEmptyQuestion(lastQNo + 1),
            ];
        });
    };


    // ADD MULTIPLE MAIN QUESTIONS
    const addQuestions = () => {
        const count = Math.min(
            Math.max(Number(bulkCount) || 1, 1),
            100
        );

        setQuestions((prev) => {
            const lastQNo = Math.max(
                0,
                ...prev.map((q) => q.qNo || 0)
            );

            const newQuestions = Array.from(
                { length: count },
                (_, index) => createEmptyQuestion(lastQNo + index + 1)
            );

            return [...prev, ...newQuestions];
        });
    };


    // REMOVE MAIN QUESTION
    const removeQuestion = (index: number) => {
        setQuestions((prev) =>
            prev.length <= 1
                ? prev
                : prev.filter((_, i) => i !== index)
        );
    };


    // ADD SUB PART
    const addSubPart = (questionIndex: number) => {
        setQuestions((prev) =>
            prev.map((question, index) => {
                if (index !== questionIndex) return question;

                return {
                    ...question,
                    subQuestions: [
                        ...question.subQuestions,
                        {
                            subPart: "",
                            title: "",
                            maxMarks: 0,
                        },
                    ],
                };
            })
        );
    };


    // UPDATE SUB PART
    const handleSubPartChange = (
        questionIndex: number,
        subIndex: number,
        field: keyof SubQuestionItem,
        value: string
    ) => {
        setQuestions((prev) =>
            prev.map((question, index) => {
                if (index !== questionIndex) return question;

                const updatedSubQuestions = question.subQuestions.map(
                    (sub, i) =>
                        i === subIndex
                            ? {
                                ...sub,
                                [field]:
                                    field === "maxMarks"
                                        ? Number(value)
                                        : value,
                            }
                            : sub
                );

                return {
                    ...question,
                    subQuestions: updatedSubQuestions,
                    maxMarks: updatedSubQuestions.reduce(
                        (total, sub) =>
                            total + Number(sub.maxMarks || 0),
                        0
                    ),
                };
            })
        );
    };


    // REMOVE SUB PART
    const removeSubPart = (
        questionIndex: number,
        subIndex: number
    ) => {
        setQuestions((prev) =>
            prev.map((question, index) => {
                if (index !== questionIndex) return question;

                const updatedSubQuestions =
                    question.subQuestions.filter(
                        (_, i) => i !== subIndex
                    );

                return {
                    ...question,
                    subQuestions: updatedSubQuestions,
                    maxMarks: updatedSubQuestions.reduce(
                        (total, sub) =>
                            total + Number(sub.maxMarks || 0),
                        0
                    ),
                };
            })
        );
    };

    // --------------------------------
    // QUESTION SUMMARY
    // --------------------------------

    const totalQuestions = questions.length;

    const totalSubQuestions = questions.reduce(
        (total, question) =>
            total + question.subQuestions.length,
        0
    );

    const totalMarks = questions.reduce(
        (total, question) =>
            total +
            question.subQuestions.reduce(
                (subTotal, sub) =>
                    subTotal + Number(sub.maxMarks || 0),
                0
            ),
        0
    );

    // --------------------------------
    // CREATE SUBJECT QUESTIONS
    // --------------------------------
    const handleCreateQuestions = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setQuestionError("");
        setQuestionSuccess("");

        if (!selectedExam) {
            setQuestionError("Please select exam");
            return;
        }

        if (!selectedSubject) {
            setQuestionError("Please select subject");
            return;
        }

        try {
            setQuestionLoading(true);
            const payload = {
                examId: selectedExam._id,
                subject: selectedSubject,

                questions: questions.map((question) => ({
                    qNo: Number(question.qNo),
                    title: question.title.trim(),

                    maxMarks: question.subQuestions.reduce(
                        (total, sub) =>
                            total + Number(sub.maxMarks || 0),
                        0
                    ),

                    subQuestions: question.subQuestions.map((sub) => ({
                        subPart: sub.subPart.trim(),
                        title: sub.title.trim(),
                        maxMarks: Number(sub.maxMarks),
                    })),
                })),
            };

            const res = await createExamQuestionsApi(payload);

            setQuestionSuccess(
                res?.data?.message || "Questions saved successfully!"
            );

            setQuestions([createEmptyQuestion(1)]);
            setSelectedSubject("");

        } catch (error: any) {
            console.error(error);

            setQuestionError(
                error?.response?.data?.message ||
                "Failed to create questions"
            );
        } finally {
            setQuestionLoading(false);
        }
    };

    // --------------------------------
    // UI
    // --------------------------------

    return (
        <div className="min-h-screen space-y-6 bg-slate-100 p-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-800">
                        1. Create Exam
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Create an exam and assign multiple subjects.
                        Questions will be configured separately.
                    </p>
                </div>

                <form
                    onSubmit={handleCreateExam}
                    className="space-y-5"
                >

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        {/* Exam Name */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Exam Name *
                            </label>

                            <input
                                type="text"
                                name="name"
                                value={examForm.name}
                                onChange={handleExamChange}
                                placeholder="Enter exam name"
                                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* Board */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Board *
                            </label>

                            <select
                                name="board"
                                value={examForm.board}
                                onChange={handleExamSelectChange}
                                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
                            >
                                <option value="">Select Board</option>

                                {boards.map((board) => (
                                    <option
                                        key={board.value}
                                        value={board.value}
                                    >
                                        {board.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Class */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Class *
                            </label>

                            <select
                                name="className"
                                value={examForm.className}
                                onChange={handleExamSelectChange}
                                disabled={!examForm.board}
                                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:opacity-50"
                            >
                                <option value="">Select Class</option>

                                {classes.map((cls) => (
                                    <option key={cls} value={String(cls)}>
                                        Class {cls}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Stream */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Stream
                            </label>

                            <select
                                name="stream"
                                value={examForm.stream}
                                onChange={handleExamSelectChange}
                                disabled={!hasStream}
                                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:opacity-50"
                            >
                                <option value="">
                                    {hasStream
                                        ? "Select Stream"
                                        : "Not Required"}
                                </option>

                                {streams.map((stream) => (
                                    <option key={stream} value={stream}>
                                        {stream}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Width */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Answer Sheet Width (px) *
                            </label>

                            <input
                                type="number"
                                min="1"
                                name="width"
                                value={examForm.answerSheet.width}
                                onChange={handleAnswerSheetChange}
                                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* Height */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Answer Sheet Height (px) *
                            </label>

                            <input
                                type="number"
                                min="1"
                                name="height"
                                value={examForm.answerSheet.height}
                                onChange={handleAnswerSheetChange}
                                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                    </div>

                    {/* SUBJECTS */}
                    <div className="border-t border-slate-200 pt-5">

                        <h3 className="mb-1 text-sm font-bold text-slate-800">
                            Select Subjects *
                        </h3>

                        <p className="mb-4 text-xs text-slate-500">
                            Multiple subjects can be assigned to one exam.
                        </p>

                        {!examForm.board ||
                            !examForm.className ||
                            (hasStream && !examForm.stream) ? (

                            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                                Please select Board, Class and Stream (if required).
                            </div>

                        ) : examSubjectOptions.length === 0 ? (

                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                                No subjects found for this selection.
                            </div>

                        ) : (

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

                                {examSubjectOptions.map((subject) => (
                                    <label
                                        key={subject.id}
                                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${examForm.subjects.includes(
                                            String(subject.id)
                                        )
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-slate-200 hover:border-blue-300"
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={examForm.subjects.includes(
                                                String(subject.id)
                                            )}
                                            onChange={() =>
                                                handleSubjectToggle(
                                                    String(subject.id)
                                                )
                                            }
                                            className="h-4 w-4 accent-blue-600"
                                        />

                                        <span className="text-sm font-medium text-slate-700">
                                            {subject.name}
                                        </span>
                                    </label>
                                ))}

                            </div>
                        )}

                        <p className="mt-3 text-xs font-medium text-slate-500">
                            Selected Subjects: {examForm.subjects.length}
                        </p>

                    </div>

                    {/* EXAM ERRORS */}
                    {examError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {examError}
                        </div>
                    )}

                    {examSuccess && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                            {examSuccess}
                        </div>
                    )}

                    {/* CREATE EXAM BUTTON */}
                    <div className="flex justify-end border-t border-slate-200 pt-5">

                        <button
                            type="submit"
                            disabled={examLoading}
                            className="rounded-lg bg-blue-600 cursor-pointer px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {examLoading
                                ? "Creating Exam..."
                                : "Create Exam"}
                        </button>

                    </div>

                </form>
            </div>

            {/* ================================= */}
            {/* CREATE QUESTIONS FORM */}
            {/* ================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-800">
                        2. Subject-wise Question Configuration
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Select an existing exam and configure questions for each subject.
                    </p>
                </div>

                <form
                    onSubmit={handleCreateQuestions}
                    className="space-y-6"
                >

                    {/* EXAM DETAILS */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        {/* Exam */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Exam *
                            </label>

                            <select
                                value={selectedExamId}
                                onChange={handleQuestionExamChange}
                                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
                            >
                                <option value="">Select Exam</option>

                                {exams.map((exam) => (
                                    <option
                                        key={exam._id}
                                        value={exam._id}
                                    >
                                        {exam.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Board */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Board
                            </label>

                            <input
                                value={
                                    boards.find(
                                        (b) => b.value === selectedExam?.board
                                    )?.label || selectedExam?.board || ""
                                }
                                readOnly
                                placeholder="Auto selected from exam"
                                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600"
                            />
                        </div>

                        {/* Class */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Class
                            </label>

                            <input
                                value={selectedExam?.className || ""}
                                readOnly
                                placeholder="Auto selected from exam"
                                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600"
                            />
                        </div>

                        {/* Stream */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Stream
                            </label>

                            <input
                                value={selectedExam?.stream || "Not Required"}
                                readOnly
                                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600"
                            />
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Subject *
                            </label>

                            <select
                                value={selectedSubject}
                                onChange={(e) => {
                                    setSelectedSubject(e.target.value);
                                    setQuestions([{ ...initialQuestion }]);
                                    setQuestionError("");
                                    setQuestionSuccess("");
                                }}
                                disabled={!selectedExam}
                                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:opacity-50"
                            >
                                <option value="">Select Subject</option>

                                {questionSubjectOptions.map((subject) => (
                                    <option
                                        key={subject.id}
                                        value={String(subject.id)}
                                    >
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>

                    {/* QUESTION CONFIGURATION */}
                    {selectedExam && selectedSubject && (
                        <>

                            <div className="border-t border-slate-200 pt-5">

                                <div className="flex flex-wrap items-center justify-between gap-4">

                                    <div>
                                        <h3 className="text-base font-bold text-slate-800">
                                            {questionSubjectOptions.find(
                                                (s) =>
                                                    String(s.id) === selectedSubject
                                            )?.name}
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Add questions for the selected subject.
                                        </p>
                                    </div>

                                    <div className="flex gap-3">

                                        <div className="rounded-lg bg-blue-50 px-4 py-2 text-center">
                                            <p className="text-xs text-blue-600">
                                                Total Questions
                                            </p>
                                            <p className="text-lg font-bold text-blue-700">
                                                {totalQuestions}
                                            </p>
                                        </div>

                                        <div className="rounded-lg bg-emerald-50 px-4 py-2 text-center">
                                            <p className="text-xs text-emerald-600">
                                                Total Marks
                                            </p>
                                            <p className="text-lg font-bold text-emerald-700">
                                                {totalMarks}
                                            </p>
                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* BULK ADD */}
                            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">

                                <div className="flex flex-wrap items-end gap-4">

                                    <div className="flex-1">
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Add Multiple Questions
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={bulkCount}
                                            onChange={(e) =>
                                                setBulkCount(
                                                    Number(e.target.value)
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm sm:max-w-xs"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addQuestions}
                                        disabled={!bulkCount || bulkCount < 1}
                                        className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        + Add {bulkCount || 0} Questions
                                    </button>

                                    <button
                                        type="button"
                                        onClick={addQuestion}
                                        className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        + Add One Question
                                    </button>

                                </div>

                            </div>

                            {/* QUESTIONS LIST */}
                            <div className="space-y-4">
                                {questions.map((question, index) => (
                                    <div
                                        key={index}
                                        className="rounded-xl border border-slate-200 bg-white p-4 mb-4"
                                    >
                                        {/* Main Question */}
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">

                                            <div className="md:col-span-2">
                                                <label className="mb-2 block text-xs font-semibold text-slate-600">
                                                    Question No.
                                                </label>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={question.qNo}
                                                    onChange={(e) =>
                                                        handleQuestionChange(index, "qNo", e.target.value)
                                                    }
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
                                                />
                                            </div>

                                            <div className="md:col-span-8">
                                                <label className="mb-2 block text-xs font-semibold text-slate-600">
                                                    Question Title
                                                </label>

                                                <input
                                                    type="text"
                                                    value={question.title}
                                                    onChange={(e) =>
                                                        handleQuestionChange(index, "title", e.target.value)
                                                    }
                                                    placeholder="Enter main question title"
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="mb-2 block text-xs font-semibold text-slate-600">
                                                    Maximum Marks
                                                </label>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={
                                                        question.subQuestions.length > 0
                                                            ? question.subQuestions.reduce(
                                                                (total, sub) => total + Number(sub.maxMarks || 0),
                                                                0
                                                            )
                                                            : question.maxMarks
                                                    }
                                                    readOnly={question.subQuestions.length > 0}
                                                    onChange={(e) =>
                                                        handleQuestionChange(index, "maxMarks", e.target.value)
                                                    }
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Sub Parts */}
                                        <div className="mt-4 border-t border-slate-200 pt-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-slate-700">
                                                    Sub Questions
                                                </h4>

                                                <button
                                                    type="button"
                                                    onClick={() => addSubPart(index)}
                                                    className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                                                >
                                                    + Add Sub Part
                                                </button>
                                            </div>

                                            {question.subQuestions?.map((sub, subIndex) => (
                                                <div
                                                    key={subIndex}
                                                    className="mb-3 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 md:grid-cols-12"
                                                >
                                                    <div className="md:col-span-2">
                                                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                                                            Sub Part
                                                        </label>

                                                        <input
                                                            type="text"
                                                            value={sub.subPart}
                                                            onChange={(e) =>
                                                                handleSubPartChange(
                                                                    index,
                                                                    subIndex,
                                                                    "subPart",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="a, b, i, ii"
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                        />
                                                    </div>

                                                    <div className="md:col-span-8">
                                                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                                                            Sub Question
                                                        </label>

                                                        <input
                                                            type="text"
                                                            value={sub.title}
                                                            onChange={(e) =>
                                                                handleSubPartChange(
                                                                    index,
                                                                    subIndex,
                                                                    "title",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Enter sub question"
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                        />
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                                                            Marks
                                                        </label>

                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={sub.maxMarks}
                                                                onChange={(e) =>
                                                                    handleSubPartChange(
                                                                        index,
                                                                        subIndex,
                                                                        "maxMarks",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                                                            />

                                                            <button
                                                                type="button"
                                                                onClick={() => removeSubPart(index, subIndex)}
                                                                className="rounded-lg px-2 text-red-500 hover:bg-red-50"
                                                                title="Remove sub part"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* SUMMARY */}
                            <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5">

                                <p className="text-sm text-slate-500">
                                    {totalQuestions} questions configured
                                </p>

                                <p className="text-sm font-bold text-slate-800">
                                    Subject Maximum Marks: {totalMarks}
                                </p>

                            </div>

                            {/* QUESTION MESSAGES */}
                            {questionError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {questionError}
                                </div>
                            )}

                            {questionSuccess && (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                                    {questionSuccess}
                                </div>
                            )}

                            {/* SAVE QUESTIONS */}
                            <div className="flex justify-end border-t border-slate-200 pt-5">

                                <button
                                    type="submit"
                                    disabled={questionLoading}
                                    className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {questionLoading
                                        ? "Creating Questions..."
                                        : "Create Questions"}
                                </button>

                            </div>

                        </>
                    )}

                    {!selectedExam && (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                            First create an exam or select an existing exam to configure questions.
                        </div>
                    )}

                    {selectedExam && !selectedSubject && (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                            Please select a subject to add questions.
                        </div>
                    )}

                    {questionError && !selectedSubject && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {questionError}
                        </div>
                    )}

                </form>

            </div>

        </div>
    );
}
