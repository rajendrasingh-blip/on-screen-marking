"use client";
import { useState } from "react";
import { ExamForm, Question } from "@/types/globalTypes";
import { createExamApi } from "@/api/apiCall";

const initialQuestion: Question = {
    qNo: 1,
    subPart: "",
    title: "",
    maxMarks: 1,
};

export default function CreateExamPage() {
    const [form, setForm] = useState<ExamForm>({
        name: "",
        subject: "",
        answerSheet: {
            width: 1047,
            height: 1566,
        },
        questions: [initialQuestion],
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleExamChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAnswerSheetChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            answerSheet: {
                ...prev.answerSheet,
                [name]: Number(value),
            },
        }));
    };

    const handleQuestionChange = (
        index: number,
        field: keyof Question,
        value: string
    ) => {
        setForm((prev) => {
            const questions = [...prev.questions];

            questions[index] = {
                ...questions[index],
                [field]:
                    field === "qNo" || field === "maxMarks"
                        ? Number(value)
                        : value,
            };

            return {
                ...prev,
                questions,
            };
        });
    };

    const addQuestion = () => {
        setForm((prev) => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    qNo: prev.questions.length + 1,
                    subPart: "",
                    title: "",
                    maxMarks: 1,
                },
            ],
        }));
    };

    const removeQuestion = (index: number) => {
        if (form.questions.length === 1) {
            return;
        }

        setForm((prev) => ({
            ...prev,
            questions: prev.questions.filter(
                (_, questionIndex) => questionIndex !== index
            ),
        }));
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!form.name.trim()) {
            setError("Exam name is required");
            return;
        }

        if (!form.subject.trim()) {
            setError("Subject is required");
            return;
        }

        for (const question of form.questions) {
            if (!question.title.trim()) {
                setError(
                    `Question ${question.qNo} title is required`
                );
                return;
            }

            if (question.maxMarks < 0) {
                setError("Max marks cannot be negative");
                return;
            }
        }

        try {
            setLoading(true);

            createExamApi(form);

            setSuccess("Exam created successfully");

            setForm({
                name: "",
                subject: "",
                answerSheet: {
                    width: 1047,
                    height: 1566,
                },
                questions: [
                    {
                        qNo: 1,
                        subPart: "",
                        title: "",
                        maxMarks: 1,
                    },
                ],
            });
        } catch (err: any) {
            console.error(err);

            setError(
                err?.response?.data?.message ||
                "Failed to create exam"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Create Exam
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Create exam and add multiple questions
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    {/* Exam Details */}
                    <div className="rounded-lg bg-white p-6 shadow">
                        <h2 className="mb-5 text-lg font-semibold text-gray-800">
                            Exam Details
                        </h2>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Exam Name */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Exam Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleExamChange}
                                    placeholder="Enter exam name"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Subject
                                </label>

                                <input
                                    type="text"
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleExamChange}
                                    placeholder="Enter subject"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Width */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Answer Sheet Width
                                </label>

                                <input
                                    type="number"
                                    name="width"
                                    value={form.answerSheet.width}
                                    onChange={handleAnswerSheetChange}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Height */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Answer Sheet Height
                                </label>

                                <input
                                    type="number"
                                    name="height"
                                    value={form.answerSheet.height}
                                    onChange={handleAnswerSheetChange}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Questions
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Add questions and their maximum marks
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={addQuestion}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                + Add Question
                            </button>
                        </div>

                        <div className="space-y-4">
                            {form.questions.map(
                                (question, index) => (
                                    <div
                                        key={index}
                                        className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="font-medium text-gray-700">
                                                Question {index + 1}
                                            </h3>

                                            {form.questions.length >
                                                1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeQuestion(
                                                                index
                                                            )
                                                        }
                                                        className="text-sm font-medium text-red-600 hover:text-red-700"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                                            {/* Q No */}
                                            <div className="md:col-span-2">
                                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                                    Q. No.
                                                </label>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={
                                                        question.qNo
                                                    }
                                                    onChange={(e) =>
                                                        handleQuestionChange(
                                                            index,
                                                            "qNo",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            {/* Sub Part */}
                                            <div className="md:col-span-2">
                                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                                    Sub Part
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        question.subPart
                                                    }
                                                    onChange={(e) =>
                                                        handleQuestionChange(
                                                            index,
                                                            "subPart",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="i"
                                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            {/* Title */}
                                            <div className="md:col-span-6">
                                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                                    Question Title
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        question.title
                                                    }
                                                    onChange={(e) =>
                                                        handleQuestionChange(
                                                            index,
                                                            "title",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Enter question"
                                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            {/* Marks */}
                                            <div className="md:col-span-2">
                                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                                    Max Marks
                                                </label>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={
                                                        question.maxMarks
                                                    }
                                                    onChange={(e) =>
                                                        handleQuestionChange(
                                                            index,
                                                            "maxMarks",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-600">
                            {success}
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-md bg-green-600 px-6 py-2.5 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Creating..."
                                : "Create Exam"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}