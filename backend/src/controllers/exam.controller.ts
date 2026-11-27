import { Request, Response } from "express";
import { Exam } from "../models/Exam";
import mongoose from "mongoose";
import ExamQuestion from "../models/ExamQuestion";

// CREATE EXAM
export const createExam = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            name,
            board,
            className,
            stream,
            subjects,
            answerSheet,
        } = req.body;

        // Validation
        if (!name || !name.trim()) {
            res.status(400).json({
                success: false,
                message: "Exam name is required",
            });
            return;
        }

        if (!board) {
            res.status(400).json({
                success: false,
                message: "Please select board",
            });
            return;
        }

        if (!className) {
            res.status(400).json({
                success: false,
                message: "Please select class",
            });
            return;
        }

        if (
            ["11", "12"].includes(String(className)) &&
            !stream
        ) {
            res.status(400).json({
                success: false,
                message: "Please select stream",
            });
            return;
        }

        if (
            !Array.isArray(subjects) ||
            subjects.length === 0
        ) {
            res.status(400).json({
                success: false,
                message: "Please select at least one subject",
            });
            return;
        }

        if (
            !answerSheet ||
            Number(answerSheet.width) <= 0 ||
            Number(answerSheet.height) <= 0
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid answer sheet dimensions",
            });
            return;
        }

        // Create Exam
        const exam = await Exam.create({
            name: name.trim(),
            board,
            className: String(className),
            stream: stream || "",
            subjects: [...new Set(subjects.map(String))],

            answerSheet: {
                width: Number(answerSheet.width),
                height: Number(answerSheet.height),
            },
        });

        res.status(201).json({
            success: true,
            message: "Exam created successfully",
            data: exam,
        });

    } catch (error: any) {
        console.error("Create exam error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create exam",
        });
    }
};


export const createExamQuestions = async (
    req: Request,
    res: Response
) => {
    try {
        const { examId, subject, questions } = req.body;

        if (!mongoose.Types.ObjectId.isValid(examId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID",
            });
        }

        if (!subject || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Subject and questions are required",
            });
        }

        const exam = await Exam.findById(examId);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Exam not found",
            });
        }

        if (!exam.subjects.includes(String(subject))) {
            return res.status(400).json({
                success: false,
                message: "Subject does not belong to this exam",
            });
        }

        const formattedQuestions = [];
        const usedQuestionNumbers = new Set<number>();

        for (const question of questions) {
            const qNo = Number(question.qNo);

            if (!Number.isInteger(qNo) || qNo < 1) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid question number",
                });
            }

            if (usedQuestionNumbers.has(qNo)) {
                return res.status(400).json({
                    success: false,
                    message: `Duplicate main question number: ${qNo}`,
                });
            }

            usedQuestionNumbers.add(qNo);

            const subQuestions = question.subQuestions || [];

            if (!Array.isArray(subQuestions)) {
                return res.status(400).json({
                    success: false,
                    message: `Question ${qNo}: invalid sub-questions`,
                });
            }

            const usedSubParts = new Set<string>();
            const formattedSubQuestions = [];

            for (const sub of subQuestions) {
                const subPart = String(sub.subPart || "").trim();
                const title = String(sub.title || "").trim();
                const maxMarks = Number(sub.maxMarks);

                if (!title) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${qNo}: sub-question title is required`,
                    });
                }

                if (!Number.isFinite(maxMarks) || maxMarks < 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${qNo}: invalid sub-question marks`,
                    });
                }

                if (usedSubParts.has(subPart)) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${qNo}: duplicate sub-part ${subPart}`,
                    });
                }

                usedSubParts.add(subPart);

                formattedSubQuestions.push({
                    subPart,
                    title,
                    maxMarks,
                });
            }

            // If sub-questions exist, calculate marks from sub-questions.
            // Otherwise, use main question marks.
            const maxMarks = formattedSubQuestions.length > 0
                ? formattedSubQuestions.reduce(
                    (total, sub) => total + sub.maxMarks,
                    0
                )
                : Number(question.maxMarks);

            if (!Number.isFinite(maxMarks) || maxMarks < 0) {
                return res.status(400).json({
                    success: false,
                    message: `Question ${qNo}: invalid maximum marks`,
                });
            }

            formattedQuestions.push({
                qNo,
                title: String(question.title || "").trim(),
                maxMarks,
                subQuestions: formattedSubQuestions,
            });
        }

        const existing = await ExamQuestion.findOne({
            examId: exam._id,
            subject: String(subject),
        });

        const questionMap = new Map<number, any>();

        // Existing questions first
        existing?.questions.forEach((question: any) => {
            questionMap.set(question.qNo, question.toObject());
        });

        // New questions add/update
        formattedQuestions.forEach((question: any) => {
            questionMap.set(question.qNo, question);
        });

        const mergedQuestions = Array.from(questionMap.values()).sort(
            (a, b) => a.qNo - b.qNo
        );

        const result = await ExamQuestion.findOneAndUpdate(
            {
                examId: exam._id,
                subject: String(subject),
            },
            {
                $set: {
                    board: exam.board,
                    className: exam.className,
                    stream: exam.stream || "",
                    questions: mergedQuestions,
                },
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        return res.status(200).json({
            success: true,
            message: "Subject questions saved successfully",
            data: result,
        });

    } catch (error: any) {
        console.error("Create Subject Questions Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};


// GET ALL QUESTIONS BY EXAM
export const getQuestionsByExam = async (
    req: Request,
    res: Response
) => {
    try {
        const { examId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(examId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID",
            });
        }

        const data = await ExamQuestion.find({ examId })
            .sort({ subject: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            data,
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// GET QUESTIONS BY EXAM AND SUBJECT
export const getQuestionsBySubject = async (
    req: Request,
    res: Response
) => {
    try {
        const { examId, subject } = req.params;

        if (!mongoose.Types.ObjectId.isValid(examId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID",
            });
        }

        const data = await ExamQuestion.findOne({
            examId,
            subject,
        }).lean();

        return res.status(200).json({
            success: true,
            data,
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// GET ALL EXAMS
export const getAllExams = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const exams = await Exam.find()
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: exams,
        });

    } catch (error) {
        console.error("Get exams error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch exams",
        });
    }
};


// GET SINGLE EXAM
export const getExamById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { examId } = req.params;

        const exam = await Exam.findById(examId);

        if (!exam) {
            res.status(404).json({
                success: false,
                message: "Exam not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: exam,
        });

    } catch (error) {
        console.error("Get exam error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch exam",
        });
    }
};


export const getAllExam = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const exams = await Exam.find()
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            message: "Exams fetched successfully",
            data: exams,
        });
    } catch (error) {
        console.error("Get all exams error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch exams",
        });
    }
};