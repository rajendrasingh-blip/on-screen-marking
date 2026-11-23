import { Router } from "express";
import multer from "multer";

import {
  getAllAnswerSheets,
  uploadStudentAnswerSheet,
} from "../controllers/student.controller";
import { getAllAnswerSheetPdf, getAnsweredQuestionData, getAnswerSheetPdf, getExaminerAnswerSheet, saveExaminerMark } from "../controllers/examiner.controller";
import { createExam, getAllExam } from "../controllers/exam.controller";

const router = Router();

router.get("/answer-sheet/:answerSheetId", getExaminerAnswerSheet);
router.get("/answer-sheet/:answerSheetId/pdf", getAnswerSheetPdf);
router.post("/create-exam", createExam);
router.get("/exam", getAllExam);
router.get("/answerSheet", getAllAnswerSheets);
router.get("/answerSheetPdf", getAllAnswerSheetPdf);
// router.get("/mapped-pdf", getAllReadyStatusAnswerSheetPdfIds);

router.post(
  "/mark",
  saveExaminerMark
);

router.get("/allMark", getAnsweredQuestionData);


const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize:
      100 * 1024 * 1024,
  },
});

router.post(
  "/upload",
  upload.single("file"),
  uploadStudentAnswerSheet
);

export default router;