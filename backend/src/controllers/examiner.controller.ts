import fs from "fs";
import { Request, Response } from "express";
import { StudentAnswerSheet } from "../models/StudentAnswerSheet";
import { CoordinateMap } from "../models/CoordinateMap";
import { Exam } from "../models/Exam";
import { ExaminerMark } from "../models/ExaminerMark";
import mongoose from "mongoose";

export const getExaminerAnswerSheet = async (
  req: Request,
  res: Response
) => {
  try {
    const { answerSheetId } = req.params;

    if (!answerSheetId) {
      return res.status(400).json({
        success: false,
        message: "answerSheetId is required",
      });
    }

    const answerSheet =
      await StudentAnswerSheet.findById(
        answerSheetId
      ).lean();

    if (!answerSheet) {
      return res.status(404).json({
        success: false,
        message: "Answer sheet not found",
      });
    }

    const coordinateMap =
      await CoordinateMap.findOne({
        pdfId: answerSheet.pdfId,
      }).lean();

    if (!coordinateMap) {
      return res.status(404).json({
        success: false,
        message:
          "Coordinate map not found. PDF may still be processing.",
      });
    }

    const exam =
      await Exam.findById(
        answerSheet.examId
      ).lean();

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    return res.status(200).json({
      success: true,

      answerSheet: {
        id: answerSheet._id,
        examId: answerSheet.examId,

        pdfId: answerSheet.pdfId,
        originalFileName:
          answerSheet.originalFileName,

        totalPages:
          answerSheet.totalPages,

        processingStatus:
          answerSheet.processingStatus,

        processingProgress:
          answerSheet.processingProgress,
      },

      exam: {
        id: exam._id,
        name: exam.name,
        subject: exam.subjects,

      },

      coordinateMap: {
        id: coordinateMap._id,
        pdfId: coordinateMap.pdfId,
        pages: coordinateMap.pages,
        version: coordinateMap.version,
      },
    });
  } catch (error) {
    console.error(
      "getExaminerAnswerSheet error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load examiner answer sheet",
    });
  }
};


export const saveExaminerMark = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      answerSheetId,
      pageNumber,
      qNo,
      subPart,
      awardedMarks,
      x,
      y,
    } = req.body;

    if (
      !answerSheetId ||
      pageNumber === undefined ||
      !qNo ||
      awardedMarks === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "answerSheetId, pageNumber, qNo and awardedMarks are required",
      });
    }

    const answerSheet =
      await StudentAnswerSheet.findById(
        answerSheetId
      );

    if (!answerSheet) {
      return res.status(404).json({
        success: false,
        message: "Answer sheet not found",
      });
    }

    const coordinateMap =
      await CoordinateMap.findOne({
        pdfId: answerSheet.pdfId,
      }).lean();

    if (!coordinateMap) {
      return res.status(404).json({
        success: false,
        message: "Coordinate map not found",
      });
    }

    const page =
      coordinateMap.pages.find(
        (p) =>
          p.pageNumber ===
          Number(pageNumber)
      );

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    const normalizedSubPart =
      String(
        subPart ?? "main"
      )
        .trim()
        .toLowerCase() || "main";

    const region =
      page.regions.find(
        (r) =>
          r.qNo === String(qNo) &&
          String(
            r.subPart ?? "main"
          )
            .trim()
            .toLowerCase() ===
          normalizedSubPart
      );

    if (!region) {
      return res.status(404).json({
        success: false,
        message:
          "Question region not found",
      });
    }

    const maxMarks =
      Number(region.maxMarks ?? 0);

    const marks =
      Number(awardedMarks);

    if (
      !Number.isFinite(marks) ||
      marks < 0 ||
      marks > maxMarks
    ) {
      return res.status(400).json({
        success: false,
        message: `Awarded marks must be between 0 and ${maxMarks}`,
      });
    }

    const saved =
      await ExaminerMark.findOneAndUpdate(
        {
          answerSheetId:
            answerSheet._id,

          pageNumber:
            Number(pageNumber),

          qNo: String(qNo),

          subPart:
            normalizedSubPart,
        },
        {
          answerSheetId:
            answerSheet._id,

          examId:
            answerSheet.examId,

          pageNumber:
            Number(pageNumber),

          qNo: String(qNo),

          subPart:
            normalizedSubPart,

          maxMarks,

          awardedMarks: marks,

          x:
            x !== undefined
              ? Number(x)
              : undefined,

          y:
            y !== undefined
              ? Number(y)
              : undefined,
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Marks saved successfully",

      mark: saved,
    });
  } catch (error) {
    console.error(
      "saveExaminerMark error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to save examiner marks",
    });
  }
};

export const getAnswerSheetPdf = async (
  req: Request,
  res: Response
) => {
  try {
    const { answerSheetId } = req.params;

    const answerSheet =
      await StudentAnswerSheet.findById(
        answerSheetId
      );

    if (!answerSheet) {
      return res.status(404).json({
        success: false,
        message: "Answer sheet not found",
      });
    }

    const pdfPath = answerSheet.filePath;

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        message: "PDF file not found",
      });
    }

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      "inline"
    );

    return fs.createReadStream(
      pdfPath
    ).pipe(res);
  } catch (error) {
    console.error(
      "getAnswerSheetPdf error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load PDF",
    });
  }
};

export const getAllAnswerSheetPdf = async (
  req: Request,
  res: Response
) => {
  try {
    const answerSheet =
      await StudentAnswerSheet.find().sort({ createdAt: -1 })

    if (!answerSheet) {
      return res.status(404).json({
        success: false,
        message: "Answer sheet not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Answer sheet data found successfully",
      data: answerSheet
    })
  }
  catch (error) {
    console.log("failed to fetch answer sheet data", error);
    res.status(500).json({
      success: false,
      message: "failed to fetch answer sheet data",
    });
  }
}

export const getAnsweredQuestionData = async (
  req: Request,
  res: Response
) => {
  try {
    const { answerSheetId } = req.query;
  
    if (!answerSheetId) {
      return res.status(400).json({
        success: false,
        message: "answerSheetId is required",
      });
    }

    if (
      typeof answerSheetId !== "string" ||
      !mongoose.Types.ObjectId.isValid(answerSheetId)
    ) {
      
      return res.status(400).json({
        success: false,
        message: "Invalid answerSheetId",
      });
    }

    const saved = await ExaminerMark.find({
      answerSheetId: new mongoose.Types.ObjectId(answerSheetId)
    }).sort({
      pageNumber: 1,
      qNo: 1,
    });
    
    return res.status(200).json({
      success: true,
      data: saved,
    });

  } catch (error) {
    console.error(
      "Failed to fetch answered data:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch answered data",
    });
  }
};
