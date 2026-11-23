import { Request, Response } from "express";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";

import { Student } from "../models/Student";
import { Exam } from "../models/Exam";
import {
  StudentAnswerSheet,
} from "../models/StudentAnswerSheet";

import {
  answerSheetQueue,
} from "../queues/answerSheet.queue";

export async function uploadStudentAnswerSheet(
  req: Request,
  res: Response
) {
  try {
    const file = req.file;

    const {
      studentId,
      studentName,
      examId,
    } = req.body;

    // --------------------------------
    // Validate file
    // --------------------------------

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    if (!studentId || !examId) {
      return res.status(400).json({
        success: false,
        message:
          "studentId and examId are required",
      });
    }

    if (file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message:
          "Only PDF files are allowed",
      });
    }

    // --------------------------------
    // Check Exam
    // --------------------------------

    const exam =
      await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // --------------------------------
    // Find / Create Student
    // --------------------------------

    let student =
      await Student.findOne({
        studentId,
      });

    if (!student) {
      student = await Student.create({
        studentId,
        name: studentName || studentId,
      });
    }

    // --------------------------------
    // Generate PDF ID
    // --------------------------------

    const pdfId =
      crypto.randomUUID();

    // --------------------------------
    // Student storage directory
    // --------------------------------

    const studentDir = path.join(
      process.cwd(),
      "storage",
      "students",
      examId,
      studentId
    );

    await fs.mkdir(studentDir, {
      recursive: true,
    });

    // --------------------------------
    // Original PDF path
    // --------------------------------

    const filePath = path.join(
      studentDir,
      `${pdfId}.pdf`
    );

    // --------------------------------
    // Save original PDF
    // --------------------------------

    await fs.writeFile(
      filePath,
      file.buffer
    );

    // --------------------------------
    // Create DB record
    // --------------------------------

    const answerSheet =
      await StudentAnswerSheet.create({
        studentId: student._id,
        examId: exam._id,

        pdfId,

        originalFileName:
          file.originalname,

        filePath,

        processingStatus:
          "uploaded",

        processingProgress: 0,
      });

    // --------------------------------
    // Add BullMQ Job
    // --------------------------------

    await answerSheetQueue.add(
      "process-answer-sheet",
      {
        answerSheetId:
          answerSheet._id.toString(),

        pdfId,

        studentId:
          student._id.toString(),

        examId:
          exam._id.toString(),
      },
      {
        jobId: pdfId,
      }
    );

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(201).json({
      success: true,

      message:
        "Answer sheet uploaded and processing started",

      data: {
        pdfId,

        answerSheetId:
          answerSheet._id,

        processingStatus:
          "processing",

        processingProgress: 0,
      },
    });

  } catch (error) {

    console.error(
      "Upload answer sheet error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to upload answer sheet",
    });
  }
}

export const getAllAnswerSheets = async (req: Request, res: Response): Promise<void> => {
  try {
    const answerSheet = await StudentAnswerSheet.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, message: "Record fetch successfully", data: answerSheet })
  }
  catch (error) {
    res.status(500).json({ success: false, message: "failed to fetch record" })
  }

}