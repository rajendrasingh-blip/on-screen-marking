import { Router } from "express";
import multer from "multer";

import {
  getAllAnswerSheets,
  uploadStudentAnswerSheet,
} from "../controllers/answerSheet.controller";
import { getAllAnswerSheetPdf, getAnsweredQuestionData, getAnswerSheetPdf, getExaminerAnswerSheet, saveExaminerMark } from "../controllers/examiner.controller";

const router = Router();

router.get("/all", getAllAnswerSheets);
router.get("/allPdf", getAllAnswerSheetPdf);


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



router.get("/:answerSheetId", getExaminerAnswerSheet);
router.get("/:answerSheetId/pdf", getAnswerSheetPdf);

export default router;