import { Request, Response } from "express";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";

import { Exam } from "../models/Exam";
import {
  StudentAnswerSheet,
} from "../models/StudentAnswerSheet";

import {
  answerSheetQueue,
} from "../queues/answerSheet.queue";

async function processAnswerSheetUpload(
  file: Express.Multer.File,
  data: {
    examId: string;
    board: string;
    className: string;
    subject: string;
    stream?: string;
  }
) {
  const {
    examId,
    board,
    className,
    subject,
    stream,
  } = data;

  const pdfId = crypto.randomUUID();

  const uploadDir = path.join(
    process.cwd(),
    "storage",
    "answer-sheets",
    examId
  );

  await fs.mkdir(uploadDir, {
    recursive: true,
  });

  const filePath = path.join(
    uploadDir,
    `${pdfId}.pdf`
  );

  let answerSheet: any;

  try {
    // Save PDF
    await fs.writeFile(filePath, file.buffer);

    // Create DB Record
    answerSheet = await StudentAnswerSheet.create({
      examId,

      board,
      className,
      stream: stream || undefined,
      subject,

      pdfId,

      originalFileName: file.originalname,

      filePath,

      processingStatus: "uploaded",
      processingProgress: 0,
    });

    // Add BullMQ Job
    await answerSheetQueue.add(
      "process-answer-sheet",
      {
        answerSheetId: answerSheet._id.toString(),
        pdfId,
        examId,
      },
      {
        jobId: pdfId,
      }
    );

    return {
      success: true,
      pdfId,
      answerSheetId: answerSheet._id,
      originalFileName: file.originalname,
      processingStatus: "processing",
      processingProgress: 0,
    };

  } catch (error) {
    // Cleanup on failure
    if (answerSheet?._id) {
      await StudentAnswerSheet.findByIdAndDelete(
        answerSheet._id
      ).catch(() => { });
    }

    await fs.unlink(filePath).catch(() => { });

    throw error;
  }
}


// --------------------------------
// Common Validation
// --------------------------------

function validateUploadData(body: any) {
  const {
    examId,
    board,
    class: className,
    subject,
    stream,
  } = body;

  if (!examId || !board || !className || !subject) {
    return {
      valid: false,
      message: "Exam, Board, Class and Subject are required",
    };
  }

  if (
    ["11", "12"].includes(String(className)) &&
    !stream
  ) {
    return {
      valid: false,
      message: "Stream is required for Class 11 and 12",
    };
  }

  return {
    valid: true,
    data: {
      examId,
      board,
      className: String(className),
      subject,
      stream,
    },
  };
}


// --------------------------------
// Single PDF Upload
// --------------------------------

export async function uploadStudentAnswerSheet(
  req: Request,
  res: Response
) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    if (
      file.mimetype !== "application/pdf" ||
      path.extname(file.originalname).toLowerCase() !== ".pdf"
    ) {
      return res.status(400).json({
        success: false,
        message: "Only PDF files are allowed",
      });
    }

    const validation = validateUploadData(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const { examId } = validation.data!;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const result = await processAnswerSheetUpload(
      file,
      validation.data!
    );

    return res.status(201).json({
      success: true,
      message: "Answer sheet uploaded and processing started",
      data: result,
    });

  } catch (error) {
    console.error("Single upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload answer sheet",
    });
  }
}


// --------------------------------
// Bulk PDF Upload
// --------------------------------

export async function uploadBulkStudentAnswerSheets(
  req: Request,
  res: Response
) {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one PDF file is required",
      });
    }

    const validation = validateUploadData(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    // Validate all files before processing
    const invalidFile = files.find(
      (file) =>
        file.mimetype !== "application/pdf" ||
        path.extname(file.originalname).toLowerCase() !== ".pdf"
    );

    if (invalidFile) {
      return res.status(400).json({
        success: false,
        message: `Invalid PDF file: ${invalidFile.originalname}`,
      });
    }

    const { examId } = validation.data!;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const uploaded: any[] = [];
    const failed: any[] = [];

    // Process each PDF independently
    for (const file of files) {
      try {
        const result = await processAnswerSheetUpload(
          file,
          validation.data!
        );

        uploaded.push(result);

      } catch (error) {
        console.error(
          `Failed to upload ${file.originalname}:`,
          error
        );

        failed.push({
          fileName: file.originalname,
          message: "Upload or job creation failed",
        });
      }
    }

    return res.status(
      uploaded.length > 0 ? 201 : 500
    ).json({
      success: uploaded.length > 0,
      message: "Bulk upload completed",
      data: {
        totalFiles: files.length,
        uploadedCount: uploaded.length,
        failedCount: failed.length,
        uploaded,
        failed,
      },
    });

  } catch (error) {
    console.error("Bulk upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload answer sheets",
    });
  }
}

export const getAllAnswerSheets = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const answerSheets = await StudentAnswerSheet
      .find({})
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Records fetched successfully",
      data: answerSheets,
    });

  } catch (error: any) {
    console.error("GET ALL ANSWER SHEETS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch records",
    });
  }
};