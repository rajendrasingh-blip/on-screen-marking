
import { Router } from "express";

import {
    createExam,
    getAllExams,
    getExamById,
} from "../controllers/exam.controller";

import {
    createExamQuestions,
    getQuestionsByExam,
    getQuestionsBySubject,
} from "../controllers/exam.controller";

const router = Router();

// Exam APIs
router.post("/create", createExam);
router.get("/all", getAllExams);
router.get("/:examId", getExamById);

// Subject Questions APIs
router.post("/questions-create", createExamQuestions);

router.get(
    "/questions/:examId",
    getQuestionsByExam
);

router.get(
    "/questions/:examId/:subject",
    getQuestionsBySubject
);

export default router;
