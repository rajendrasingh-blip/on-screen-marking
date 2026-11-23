import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { Job } from "bullmq";

import { StudentAnswerSheet } from "../../models/StudentAnswerSheet";
import { CoordinateMap } from "../../models/CoordinateMap";
import { Exam } from "../../models/Exam";
import { Student } from "../../models/Student";

interface ProcessingJobData {
    answerSheetId: string;
    pdfId: string;
    studentId: string;
    examId: string;
}

interface DetectorQuestion {
    qNo: number;
    subPart?: string | null;

    region?: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        width: number;
        height: number;
    };

    questionNumberBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };

    confidence?: number;

    detectionMethod?: string;

    reason?: string;
    verifiedReason?: string | null;
    reasonVerified?: boolean;

    geminiDetection?: {
        x: number;
        y: number;
        width: number;
        height: number;
        confidence: number;
        reason?: string;
    };
}

interface DetectorResult {
    pageWidth?: number;
    pageHeight?: number;

    normalization?: {
        crop?: {
            left?: number;
            top?: number;
            width?: number;
            height?: number;
        };
    };

    questions: DetectorQuestion[];
}

interface PageRegion {
    qNo: string;
    subPart?: string;

    yTop: number;
    yBottom: number;

    confidence?: number;

    detectionMethod:
    | "ocr"
    | "template"
    | "manual"
    | "gemini";

    maxMarks?: number;

    reason?: string;
    verifiedReason?: string | null;
    reasonVerified?: boolean;

    questionNumberBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };

    geminiDetection?: {
        x: number;
        y: number;
        width: number;
        height: number;
        confidence: number;
        reason?: string;
    };

    region?: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        width: number;
        height: number;
    };
}

interface PageInfo {
    pageNumber: number;
    width: number;
    height: number;
    regions: PageRegion[];
}

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function normalizeSubPart(subPart: unknown): string {
    if (
        subPart === undefined ||
        subPart === null ||
        String(subPart).trim() === ""
    ) {
        return "";
    }

    return String(subPart).trim().toLowerCase();
}

/**
 * IMPORTANT:
 * qNo alone is NOT unique.
 *
 * 1(i)
 * 1(ii)
 * 1(iii)
 *
 * must all remain separate.
 */
function getQuestionKey(
    qNo: number | string,
    subPart?: string | null
): string {
    return `${Number(qNo)}:${normalizeSubPart(subPart) || "main"}`;
}

/**
 * Find max marks from Exam.questions.
 *
 * Current Exam schema:
 * {
 *   qNo: number;
 *   title: string;
 *   maxMarks: number;
 * }
 */
function getMaxMarks(
    exam: any,
    qNo: number
): number | undefined {
    const question = exam.questions?.find(
        (q: any) => Number(q.qNo) === Number(qNo)
    );

    if (!question) {
        return undefined;
    }

    const marks = Number(question.maxMarks);

    return Number.isFinite(marks)
        ? marks
        : undefined;
}

/**
 * Convert detector coordinates back to original
 * rendered PDF page coordinates.
 *
 * Detector may normalize/crop the image before
 * sending it to Gemini.
 *
 * If crop = { left: 20, top: 30 }
 *
 * Gemini x=100,y=200
 *
 * Original:
 * x=120,y=230
 */
function mapDetectorToOriginalCoordinates(
    detection: DetectorQuestion,
    detectorResult: DetectorResult
): DetectorQuestion {
    const cropLeft =
        Number(detectorResult.normalization?.crop?.left) || 0;

    const cropTop =
        Number(detectorResult.normalization?.crop?.top) || 0;

    const mapped: DetectorQuestion = {
        ...detection,
    };

    if (detection.questionNumberBox) {
        mapped.questionNumberBox = {
            ...detection.questionNumberBox,
            x: detection.questionNumberBox.x + cropLeft,
            y: detection.questionNumberBox.y + cropTop,
        };
    }

    if (detection.region) {
        mapped.region = {
            ...detection.region,

            x1: detection.region.x1 + cropLeft,
            y1: detection.region.y1 + cropTop,

            x2: detection.region.x2 + cropLeft,
            y2: detection.region.y2 + cropTop,
        };
    }

    if (detection.geminiDetection) {
        mapped.geminiDetection = {
            ...detection.geminiDetection,

            x: detection.geminiDetection.x + cropLeft,
            y: detection.geminiDetection.y + cropTop,
        };
    }

    return mapped;
}

/* -------------------------------------------------------
   RUN GEMINI QUESTION DETECTOR
------------------------------------------------------- */

async function runQuestionDetector(
    imagePath: string,
    outputDir: string
): Promise<DetectorResult> {
    return new Promise((resolve, reject) => {
        const detectorPath = path.resolve(
            process.cwd(),
            "src/services/processing/ocrQuestionDetector.mjs"
        );

        if (!fs.existsSync(detectorPath)) {
            return reject(
                new Error(
                    `Question detector not found: ${detectorPath}`
                )
            );
        }

        fs.mkdirSync(outputDir, {
            recursive: true,
        });

        console.log(
            `Running Gemini question detector: ${imagePath}`
        );

        const child = spawn(
            process.execPath,
            [
                detectorPath,
                imagePath,
                outputDir,
            ],
            {
                cwd: process.cwd(),
                env: process.env,
                shell: false,
            }
        );

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
            const text = data.toString();

            stdout += text;

            console.log(
                `[Gemini Detector] ${text.trim()}`
            );
        });

        child.stderr.on("data", (data) => {
            const text = data.toString();

            stderr += text;

            console.error(
                `[Gemini Detector Error] ${text.trim()}`
            );
        });

        child.on("error", (error) => {
            reject(error);
        });

        child.on("close", (code) => {
            if (code !== 0) {
                return reject(
                    new Error(
                        `Gemini detector failed with code ${code}\n${stderr}`
                    )
                );
            }

            const resultPath = path.join(
                outputDir,
                "question-detection-result.json"
            );

            if (!fs.existsSync(resultPath)) {
                return reject(
                    new Error(
                        `Detector result file not found: ${resultPath}`
                    )
                );
            }

            try {
                const raw = fs.readFileSync(
                    resultPath,
                    "utf8"
                );

                const result = JSON.parse(raw);

                if (!result || !Array.isArray(result.questions)) {
                    return reject(
                        new Error(
                            "Invalid question detector result"
                        )
                    );
                }

                resolve(result);
            } catch (error) {
                reject(
                    new Error(
                        `Unable to parse detector result: ${error instanceof Error
                            ? error.message
                            : String(error)
                        }`
                    )
                );
            }
        });
    });
}

/* -------------------------------------------------------
   DEDUPLICATE GEMINI RESULTS
------------------------------------------------------- */

function deduplicateQuestions(
    questions: DetectorQuestion[]
): DetectorQuestion[] {
    const map = new Map<
        string,
        DetectorQuestion
    >();

    for (const question of questions) {
        if (
            !Number.isFinite(Number(question.qNo))
        ) {
            continue;
        }

        const key = getQuestionKey(
            question.qNo,
            question.subPart
        );

        const existing = map.get(key);

        if (!existing) {
            map.set(key, question);
            continue;
        }

        const currentConfidence =
            Number(question.confidence) || 0;

        const existingConfidence =
            Number(existing.confidence) || 0;

        if (
            currentConfidence >
            existingConfidence
        ) {
            map.set(key, question);
        }
    }

    return Array.from(map.values()).sort(
        (a, b) => {
            const ay =
                a.region?.y1 ??
                a.questionNumberBox?.y ??
                0;

            const by =
                b.region?.y1 ??
                b.questionNumberBox?.y ??
                0;

            return ay - by;
        }
    );
}

/* -------------------------------------------------------
   BUILD ANSWER REGIONS
------------------------------------------------------- */

/**
 * Convert Gemini detections into clickable answer areas.
 *
 * Example:
 *
 * 1(i)
 * 1(ii)
 * 1(iii)
 *
 * Each gets its own vertical region.
 */
function buildRegions(
    questions: DetectorQuestion[],
    pageWidth: number,
    pageHeight: number,
    exam: any
): PageRegion[] {
    const sorted = [...questions].sort(
        (a, b) => {
            const ay =
                a.region?.y1 ??
                a.questionNumberBox?.y ??
                0;

            const by =
                b.region?.y1 ??
                b.questionNumberBox?.y ??
                0;

            return ay - by;
        }
    );

    const regions: PageRegion[] = [];

    for (let index = 0; index < sorted.length; index++) {
        const current = sorted[index];
        const next = sorted[index + 1];

        const currentY =
            current.region?.y1 ??
            current.questionNumberBox?.y ??
            0;

        const nextY =
            next?.region?.y1 ??
            next?.questionNumberBox?.y ??
            pageHeight;

        /**
         * Keep a small area above the detected question
         * number so right-clicking around the label also
         * works.
         */
        const yTop = Math.max(
            0,
            Math.floor(currentY - 45)
        );

        /**
         * Bottom is before the next detected question.
         */
        let yBottom = Math.min(
            pageHeight,
            Math.floor(nextY - 1)
        );

        if (yBottom <= yTop) {
            yBottom = Math.min(
                pageHeight,
                yTop + 100
            );
        }

        const qNo = Number(current.qNo);

        const maxMarks = getMaxMarks(
            exam,
            qNo
        );

        const region: PageRegion = {
            qNo: String(qNo),

            ...(normalizeSubPart(
                current.subPart
            )
                ? {
                    subPart:
                        normalizeSubPart(
                            current.subPart
                        ),
                }
                : {}),

            yTop,
            yBottom,

            confidence:
                Number(current.confidence) || 0,

            detectionMethod: "gemini",

            ...(maxMarks !== undefined
                ? { maxMarks }
                : {}),

            reason: current.reason || "",

            verifiedReason:
                current.verifiedReason ?? null,

            reasonVerified:
                current.reasonVerified ?? false,

            ...(current.questionNumberBox
                ? {
                    questionNumberBox:
                        current.questionNumberBox,
                }
                : {}),

            ...(current.geminiDetection
                ? {
                    geminiDetection:
                        current.geminiDetection,
                }
                : {}),

            ...(current.region
                ? {
                    region: {
                        ...current.region,

                        /**
                         * Make sure region is within
                         * original page boundaries.
                         */
                        x1: Math.max(
                            0,
                            Math.min(
                                pageWidth,
                                current.region.x1
                            )
                        ),

                        y1: Math.max(
                            0,
                            Math.min(
                                pageHeight,
                                current.region.y1
                            )
                        ),

                        x2: Math.max(
                            0,
                            Math.min(
                                pageWidth,
                                current.region.x2
                            )
                        ),

                        y2: Math.max(
                            0,
                            Math.min(
                                pageHeight,
                                current.region.y2
                            )
                        ),
                    },
                }
                : {
                    region: {
                        x1: 0,
                        y1: yTop,
                        x2: pageWidth,
                        y2: yBottom,
                        width: pageWidth,
                        height:
                            yBottom - yTop,
                    },
                }),
        };

        regions.push(region);
    }

    return regions;
}

/* -------------------------------------------------------
   PDF RENDERER
------------------------------------------------------- */

async function runPdfRenderer(
    pdfPath: string,
    outputDir: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        const rendererPath = path.resolve(
            process.cwd(),
            "src/services/processing/pdfRenderer.mjs"
        );

        if (!fs.existsSync(rendererPath)) {
            return reject(
                new Error(
                    `PDF renderer not found: ${rendererPath}`
                )
            );
        }

        fs.mkdirSync(outputDir, {
            recursive: true,
        });

        const child = spawn(
            process.execPath,
            [
                rendererPath,
                pdfPath,
                outputDir,
            ],
            {
                cwd: process.cwd(),
                env: process.env,
                shell: false,
            }
        );

        let stderr = "";

        child.stdout.on("data", (data) => {
            console.log(
                `[PDF Renderer] ${data
                    .toString()
                    .trim()}`
            );
        });

        child.stderr.on("data", (data) => {
            const text = data.toString();

            stderr += text;

            console.error(
                `[PDF Renderer Error] ${text.trim()}`
            );
        });

        child.on("error", reject);

        child.on("close", (code) => {
            if (code !== 0) {
                return reject(
                    new Error(
                        `PDF renderer failed with code ${code}\n${stderr}`
                    )
                );
            }

            resolve();
        });
    });
}

/* -------------------------------------------------------
   GET RENDERED PAGES
------------------------------------------------------- */

function getRenderedPages(
    outputDir: string
): string[] {
    if (!fs.existsSync(outputDir)) {
        return [];
    }

    const files = fs
        .readdirSync(outputDir)
        .filter((file) => {
            const lower =
                file.toLowerCase();

            return (
                lower.endsWith(".png") ||
                lower.endsWith(".jpg") ||
                lower.endsWith(".jpeg")
            );
        })
        .sort((a, b) =>
            a.localeCompare(b, undefined, {
                numeric: true,
            })
        );

    return files.map((file) =>
        path.join(outputDir, file)
    );
}

/* -------------------------------------------------------
   IMAGE METADATA
------------------------------------------------------- */

async function getImageMetadata(
    imagePath: string
): Promise<{
    width: number;
    height: number;
}> {
    const sharpModule =
        await import("sharp");

    const sharp = sharpModule.default;

    const metadata =
        await sharp(imagePath).metadata();

    if (
        !metadata.width ||
        !metadata.height
    ) {
        throw new Error(
            `Unable to determine image dimensions: ${imagePath}`
        );
    }

    return {
        width: metadata.width,
        height: metadata.height,
    };
}

/* -------------------------------------------------------
   MAIN PROCESSOR
------------------------------------------------------- */

export async function processAnswerSheet(
    answerSheetId: string,
    job: Job<ProcessingJobData>
): Promise<void> {
    const jobData = job.data;

    console.log(
        "========================================"
    );

    console.log(
        `Processing Answer Sheet: ${answerSheetId}`
    );

    console.log(
        `PDF ID: ${jobData.pdfId}`
    );

    console.log(
        `Exam ID: ${jobData.examId}`
    );

    console.log(
        "========================================"
    );

    /* ---------------------------------------------------
       LOAD ANSWER SHEET
    --------------------------------------------------- */

    const answerSheet =
        await StudentAnswerSheet.findById(
            answerSheetId
        );

    if (!answerSheet) {
        throw new Error(
            `Answer sheet not found: ${answerSheetId}`
        );
    }

    /* ---------------------------------------------------
       LOAD EXAM
    --------------------------------------------------- */

    const exam =
        await Exam.findById(
            jobData.examId
        );

    if (!exam) {
        throw new Error(
            `Exam not found: ${jobData.examId}`
        );
    }
    const student = await Student.findById(jobData.studentId);

    if (!student) {
        throw new Error(
            `Student not found: ${jobData.studentId}`
        );
    }

    if (
        !Array.isArray(exam.questions) ||
        exam.questions.length === 0
    ) {
        throw new Error(
            "Exam does not contain questions"
        );
    }

    console.log(
        `Exam questions: ${exam.questions.length}`
    );

    /* ---------------------------------------------------
       PDF PATH
    --------------------------------------------------- */

    /**
     * IMPORTANT:
     *
     * Keep your existing answerSheet PDF path logic
     * here if your StudentAnswerSheet stores the path
     * differently.
     *
     * This supports common fields.
     */
    const answerSheetAny =
        answerSheet as any;

    const pdfPath = answerSheet.filePath;

    if (!pdfPath) {
        throw new Error(
            `PDF path not found for answer sheet: ${answerSheetId}`
        );
    }

    if (!fs.existsSync(pdfPath)) {
        throw new Error(
            `PDF file not found: ${pdfPath}`
        );
    }

    /* ---------------------------------------------------
       PROCESSING DIRECTORIES
    --------------------------------------------------- */

    const processingRoot =
        path.resolve(
            process.cwd(),
            "storage",
            "processing",
            String(jobData.pdfId)
        );

    const renderedDir =
        path.join(
            processingRoot,
            "rendered"
        );

    const detectorRoot =
        path.join(
            processingRoot,
            "detector"
        );

    fs.mkdirSync(
        renderedDir,
        {
            recursive: true,
        }
    );

    fs.mkdirSync(
        detectorRoot,
        {
            recursive: true,
        }
    );

    /* ---------------------------------------------------
       UPDATE STATUS
    --------------------------------------------------- */

    await StudentAnswerSheet.findByIdAndUpdate(
        answerSheetId,
        {
            processingStatus: "processing",
            processingProgress: 5,
        }
    );

    /* ---------------------------------------------------
       RENDER PDF
    --------------------------------------------------- */

    console.log(
        "Rendering PDF..."
    );

    await runPdfRenderer(
        pdfPath,
        renderedDir
    );

    const pageFiles =
        getRenderedPages(renderedDir);

    if (pageFiles.length === 0) {
        throw new Error(
            "No rendered pages found"
        );
    }

    console.log(
        `Rendered pages: ${pageFiles.length}`
    );

    await StudentAnswerSheet.findByIdAndUpdate(
        answerSheetId,
        {
            totalPages: pageFiles.length,
            processingProgress: 15,
        }
    );

    /* ---------------------------------------------------
       PROCESS EACH PAGE
    --------------------------------------------------- */

    const pages: PageInfo[] = [];

    /**
     * Used for continuation detection.
     *
     * IMPORTANT:
     *
     * This stores:
     *
     * 1:i
     * 1:ii
     * 1:iii
     *
     * instead of only:
     *
     * 1
     */
    const seenQuestionKeys =
        new Set<string>();

    for (
        let index = 0;
        index < pageFiles.length;
        index++
    ) {
        const pageNumber =
            index + 1;

        const imagePath =
            pageFiles[index];

        console.log(
            `----------------------------------------`
        );

        console.log(
            `Processing page ${pageNumber}/${pageFiles.length}`
        );

        console.log(
            `Image: ${imagePath}`
        );

        /* -----------------------------------------------
           IMAGE SIZE
        ------------------------------------------------ */

        const metadata =
            await getImageMetadata(
                imagePath
            );

        const pageWidth =
            metadata.width;

        const pageHeight =
            metadata.height;

        /* -----------------------------------------------
           PAGE DETECTOR DIRECTORY
        ------------------------------------------------ */

        const pageDetectorDir =
            path.join(
                detectorRoot,
                `page-${String(
                    pageNumber
                ).padStart(4, "0")}`
            );

        fs.mkdirSync(
            pageDetectorDir,
            {
                recursive: true,
            }
        );

        /* -----------------------------------------------
           RUN GEMINI DETECTOR
        ------------------------------------------------ */

        let detectorResult =
            await runQuestionDetector(
                imagePath,
                pageDetectorDir
            );

        console.log(
            `Gemini detections: ${detectorResult.questions.length
            }`
        );

        /* -----------------------------------------------
           MAP NORMALIZED COORDINATES
           BACK TO ORIGINAL PAGE
        ------------------------------------------------ */

        const mappedQuestions =
            detectorResult.questions.map(
                (question) =>
                    mapDetectorToOriginalCoordinates(
                        question,
                        detectorResult
                    )
            );

        /* -----------------------------------------------
           DEDUPLICATE
        ------------------------------------------------ */

        const questions =
            deduplicateQuestions(
                mappedQuestions
            );

        console.log(
            `Unique detections: ${questions.length}`
        );

        /* -----------------------------------------------
           LOG DETECTIONS
        ------------------------------------------------ */

        for (const question of questions) {
            console.log(
                `Detected: Q${question.qNo}` +
                `${question.subPart
                    ? `(${question.subPart})`
                    : ""
                }` +
                ` confidence=${question.confidence ?? 0
                }`
            );
        }

        /* -----------------------------------------------
           BUILD CLICKABLE REGIONS
        ------------------------------------------------ */

        const regions =
            buildRegions(
                questions,
                pageWidth,
                pageHeight,
                exam
            );

        /* -----------------------------------------------
           MARK SEEN QUESTIONS
        ------------------------------------------------ */

        for (const question of questions) {
            const key =
                getQuestionKey(
                    question.qNo,
                    question.subPart
                );

            seenQuestionKeys.add(key);
        }

        pages.push({
            pageNumber,
            width: pageWidth,
            height: pageHeight,
            regions,
        });

        /* -----------------------------------------------
           PROGRESS
        ------------------------------------------------ */

        const progress =
            15 +
            Math.round(
                ((index + 1) /
                    pageFiles.length) *
                75
            );

        await StudentAnswerSheet.findByIdAndUpdate(
            answerSheetId,
            {
                processingProgress:
                    Math.min(progress, 95),
            }
        );
    }

    /* ---------------------------------------------------
       SAVE COORDINATE MAP
    --------------------------------------------------- */

    console.log(
        "Saving CoordinateMap..."
    );

    const coordinateMap =
        await CoordinateMap.findOneAndUpdate(
            {
                pdfId: jobData.pdfId,
            },
            {
                studentId:
                    jobData.studentId,
                studentName:
                    student.name,

                examId:
                    jobData.examId,

                pdfId:
                    jobData.pdfId,

                pages,

                $inc: {
                    version: 1,
                },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        );

    /* ---------------------------------------------------
       UPDATE ANSWER SHEET
    --------------------------------------------------- */

    await StudentAnswerSheet.findByIdAndUpdate(
        answerSheetId,
        {
            coordinateMapId: coordinateMap._id,
            totalPages: pageFiles.length,
            processingProgress: 100,
            processingStatus: "ready",
            processingError: undefined,
        }
    );

    console.log(
        "========================================"
    );

    console.log(
        "Answer sheet processing completed"
    );

    console.log(
        `Pages: ${pages.length}`
    );

    console.log(
        `CoordinateMap: ${coordinateMap._id}`
    );

    console.log(
        "========================================"
    );
}