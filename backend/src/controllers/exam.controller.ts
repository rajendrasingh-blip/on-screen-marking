import { Request, Response } from "express";
import { Exam } from "../models/Exam";

export const createExam = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            name,
            subject,
            answerSheet,
            questions,
        } = req.body;

        // Basic validation
        if (!name || !name.trim()) {
            res.status(400).json({
                success: false,
                message: "Exam name is required",
            });
            return;
        }

        if (!subject || !subject.trim()) {
            res.status(400).json({
                success: false,
                message: "Subject is required",
            });
            return;
        }

        if (!answerSheet) {
            res.status(400).json({
                success: false,
                message: "Answer sheet details are required",
            });
            return;
        }

        if (
            !answerSheet.width ||
            !answerSheet.height
        ) {
            res.status(400).json({
                success: false,
                message:
                    "Answer sheet width and height are required",
            });
            return;
        }

        if (
            !Array.isArray(questions) ||
            questions.length === 0
        ) {
            res.status(400).json({
                success: false,
                message: "At least one question is required",
            });
            return;
        }

        // Validate questions
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];

            if (!question.qNo || question.qNo < 1) {
                res.status(400).json({
                    success: false,
                    message: `Invalid question number at question ${i + 1}`,
                });
                return;
            }

            if (
                !question.title ||
                !question.title.trim()
            ) {
                res.status(400).json({
                    success: false,
                    message: `Question title is required at question ${i + 1}`,
                });
                return;
            }

            if (
                question.maxMarks === undefined ||
                question.maxMarks === null ||
                question.maxMarks < 0
            ) {
                res.status(400).json({
                    success: false,
                    message: `Invalid max marks at question ${i + 1}`,
                });
                return;
            }
        }

        // Create exam
        const exam = await Exam.create({
            name: name.trim(),
            subject: subject.trim(),

            answerSheet: {
                width: Number(answerSheet.width),
                height: Number(answerSheet.height),
            },

            questions: questions.map((question: any) => ({
                qNo: Number(question.qNo),
                subPart: question.subPart?.trim() || "",
                title: question.title.trim(),
                maxMarks: Number(question.maxMarks),
            })),
        });

        res.status(201).json({
            success: true,
            message: "Exam created successfully",
            data: exam,
        });
    } catch (error) {
        console.error("Create exam error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create exam",
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