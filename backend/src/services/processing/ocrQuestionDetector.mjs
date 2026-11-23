import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

import {
    detectQuestionNumbersWithGemini,
} from "./questionNumberGemini.mjs";


// ============================================================================
// CONFIG
// ============================================================================

const MIN_QUESTION_NO = 1;
const MAX_QUESTION_NO = 30;


// ============================================================================
// GENERIC HELPERS
// ============================================================================

function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}


function safeNumber(value, fallback = 0) {
    const n = Number(value);

    return Number.isFinite(n)
        ? n
        : fallback;
}


// ============================================================================
// SCAN PAGE NORMALIZATION
// ============================================================================
//
// Removes obvious dark scanner margins.
//
// Gemini receives the normalized FULL PAGE.
// No question-number-column crop is created.
//
// ============================================================================

async function normalizeCapturedPage(
    imagePath,
    outputPath
) {

    const {
        data,
        info,
    } = await sharp(imagePath)
        .removeAlpha()
        .raw()
        .toBuffer({
            resolveWithObject: true,
        });


    const width = info.width;
    const height = info.height;
    const channels = info.channels;


    const columnLooksLikePaper = x => {

        let bright = 0;
        let sampled = 0;


        for (
            let y = 0;
            y < height;
            y += 4
        ) {

            const idx =
                (
                    y * width + x
                ) * channels;


            const brightness =
                (
                    data[idx] +
                    data[idx + 1] +
                    data[idx + 2]
                ) / 3;


            if (
                brightness >= 120
            ) {
                bright++;
            }


            sampled++;
        }


        return (
            sampled > 0 &&
            bright / sampled >= 0.16
        );
    };


    const rowLooksLikePaper = y => {

        let bright = 0;
        let sampled = 0;


        for (
            let x = 0;
            x < width;
            x += 4
        ) {

            const idx =
                (
                    y * width + x
                ) * channels;


            const brightness =
                (
                    data[idx] +
                    data[idx + 1] +
                    data[idx + 2]
                ) / 3;


            if (
                brightness >= 120
            ) {
                bright++;
            }


            sampled++;
        }


        return (
            sampled > 0 &&
            bright / sampled >= 0.16
        );
    };


    const firstStable = (
        limit,
        predicate,
        direction
    ) => {

        const run = 12;


        if (direction > 0) {

            for (
                let start = 0;
                start <= limit - run;
                start++
            ) {

                let valid = true;


                for (
                    let i = 0;
                    i < run;
                    i++
                ) {

                    if (
                        !predicate(start + i)
                    ) {

                        valid = false;
                        break;
                    }
                }


                if (valid) {
                    return start;
                }
            }


            return 0;
        }


        for (
            let start = limit - 1;
            start >= run - 1;
            start--
        ) {

            let valid = true;


            for (
                let i = 0;
                i < run;
                i++
            ) {

                if (
                    !predicate(start - i)
                ) {

                    valid = false;
                    break;
                }
            }


            if (valid) {
                return start;
            }
        }


        return limit - 1;
    };


    const left =
        firstStable(
            width,
            columnLooksLikePaper,
            1
        );


    const right =
        firstStable(
            width,
            columnLooksLikePaper,
            -1
        );


    const top =
        firstStable(
            height,
            rowLooksLikePaper,
            1
        );


    const bottom =
        firstStable(
            height,
            rowLooksLikePaper,
            -1
        );


    const cropWidth =
        right - left + 1;


    const cropHeight =
        bottom - top + 1;


    // Do not crop unusual scans too aggressively.
    if (
        cropWidth < width * 0.45 ||
        cropHeight < height * 0.45
    ) {

        return {

            imagePath,

            crop: {

                left: 0,
                top: 0,

                width,
                height,

                sourceWidth:
                    width,

                sourceHeight:
                    height,

                applied: false,
            },
        };
    }


    const normalizedPath =
        path.join(
            outputPath,
            "normalized-page.png"
        );


    await sharp(imagePath)
        .extract({

            left,
            top,

            width:
                cropWidth,

            height:
                cropHeight,
        })
        .png()
        .toFile(
            normalizedPath
        );


    return {

        imagePath:
            normalizedPath,

        crop: {

            left,
            top,

            width:
                cropWidth,

            height:
                cropHeight,

            sourceWidth:
                width,

            sourceHeight:
                height,

            applied: true,
        },
    };
}


// ============================================================================
// VALIDATE GEMINI QUESTION
// ============================================================================
//
// Gemini is responsible for detecting the question.
//
// Backend reason verification can later add/replace the reason.
// We intentionally keep "reason" in the final object.
//
// ============================================================================

function normalizeGeminiQuestion(
    question,
    pageWidth,
    pageHeight
) {

    const qNo =
        Number(question?.qNo);


    if (
        !Number.isInteger(qNo) ||
        qNo < MIN_QUESTION_NO ||
        qNo > MAX_QUESTION_NO
    ) {

        return null;
    }


    const x =
        clamp(
            Math.round(
                safeNumber(question?.x)
            ),
            0,
            Math.max(0, pageWidth - 1)
        );


    const y =
        clamp(
            Math.round(
                safeNumber(question?.y)
            ),
            0,
            Math.max(0, pageHeight - 1)
        );


    const width =
        clamp(
            Math.round(
                safeNumber(
                    question?.width,
                    1
                )
            ),
            1,
            Math.max(1, pageWidth - x)
        );


    const height =
        clamp(
            Math.round(
                safeNumber(
                    question?.height,
                    1
                )
            ),
            1,
            Math.max(1, pageHeight - y)
        );


    let confidence =
        safeNumber(
            question?.confidence,
            0
        );


    // Support both:
    // 0.95
    // and
    // 95
    if (confidence > 1) {
        confidence = confidence / 100;
    }


    confidence =
        clamp(
            confidence,
            0,
            1
        );


    const reason =
        String(
            question?.reason ||
            ""
        ).trim();


    return {

        qNo,

        subPart:
            question?.subPart ??
            null,

        x,

        y,

        width,

        height,

        confidence,

        reason,
    };
}


// ============================================================================
// REMOVE DUPLICATE GEMINI DETECTIONS
// ============================================================================
//
// Gemini can occasionally return the same question twice.
// Keep one detection for the same qNo and nearby Y position.
//
// ============================================================================

function deduplicateQuestions(
    questions
) {

    const sorted =
        [...questions].sort(
            (a, b) =>
                a.y - b.y ||
                a.qNo - b.qNo
        );


    const result = [];


    for (
        const question of sorted
    ) {

        const duplicate =
            result.find(existing => {

                if (
                    existing.qNo !==
                    question.qNo
                ) {

                    return false;
                }


                const existingCenter =
                    existing.y +
                    existing.height / 2;


                const currentCenter =
                    question.y +
                    question.height / 2;


                return (
                    Math.abs(
                        existingCenter -
                        currentCenter
                    ) <= 50
                );
            });


        if (!duplicate) {

            result.push(
                question
            );

            continue;
        }


        // Keep higher confidence.
        if (
            question.confidence >
            duplicate.confidence
        ) {

            const index =
                result.indexOf(
                    duplicate
                );


            result[index] =
                question;
        }
    }


    return result.sort(
        (a, b) =>
            a.y - b.y
    );
}


// ============================================================================
// CREATE ANSWER REGIONS
// ============================================================================
//
// Each question gets a vertical answer area.
//
// Example:
//
// Q1
// ┌──────────────────────────────┐
// │ answer of Q1                 │
// │                              │
// ├──────────────────────────────┤
// Q2
// │ answer of Q2                 │
// └──────────────────────────────┘
//
// Examiner screen can right-click anywhere inside this region.
//
// ============================================================================

function createAnswerRegions(
    detections,
    pageWidth,
    pageHeight
) {

    const sorted =
        [...detections].sort(
            (a, b) =>
                (
                    a.y +
                    a.height / 2
                ) -
                (
                    b.y +
                    b.height / 2
                )
        );


    return sorted.map(
        (
            current,
            index
        ) => {

            const next =
                sorted[index + 1];


            const currentCenter =
                current.y +
                current.height / 2;


            const nextCenter =
                next
                    ? next.y +
                    next.height / 2
                    : null;


            // Small area above the question number
            // is considered part of the same answer.
            const regionTop =
                Math.max(
                    0,
                    Math.round(
                        currentCenter - 45
                    )
                );


            const regionBottom =
                nextCenter !== null
                    ? Math.max(
                        regionTop + 1,
                        Math.round(
                            nextCenter - 45
                        )
                    )
                    : pageHeight;


            return {

                qNo:
                    current.qNo,

                subPart:
                    current.subPart ??
                    null,


                // -------------------------------------------------------------
                // Answer area
                // -------------------------------------------------------------

                region: {

                    x1: 0,

                    y1:
                        regionTop,

                    x2:
                        pageWidth,

                    y2:
                        regionBottom,

                    width:
                        pageWidth,

                    height:
                        regionBottom -
                        regionTop,
                },


                // -------------------------------------------------------------
                // Question number detected by Gemini
                // -------------------------------------------------------------

                questionNumberBox: {

                    x:
                        current.x,

                    y:
                        current.y,

                    width:
                        current.width,

                    height:
                        current.height,
                },


                // -------------------------------------------------------------
                // Gemini information
                // -------------------------------------------------------------

                confidence:
                    current.confidence,

                detectionMethod:
                    "gemini",


                // IMPORTANT:
                // Keep AI reason.
                //
                // Later backend verification can replace/add:
                //
                // reason
                // verifiedReason
                // reasonVerified
                //
                // -------------------------------------------------------------

                reason:
                    current.reason,

                verifiedReason:
                    current.verifiedReason ??
                    null,

                reasonVerified:
                    current.reasonVerified ??
                    false,


                // Keep original Gemini data useful
                // for debugging / backend verification.
                geminiDetection: {

                    x:
                        current.x,

                    y:
                        current.y,

                    width:
                        current.width,

                    height:
                        current.height,

                    confidence:
                        current.confidence,

                    reason:
                        current.reason,
                },
            };
        }
    );
}


// ============================================================================
// OPTIONAL BACKEND REASON VERIFICATION HOOK
// ============================================================================
//
// IMPORTANT:
//
// Abhi actual backend verification function aapke project me jo bhi hai,
// usko yahan call kiya ja sakta hai.
//
// Example future:
//
// const verified = await verifyQuestionReason({
//     imagePath,
//     qNo,
//     reason,
// });
//
// Then:
//
// question.verifiedReason = verified.reason;
// question.reasonVerified = true;
//
//
//
// Is function ko intentionally empty rakha gaya hai taaki existing backend
// verification code disturb na ho.
//
// ============================================================================

async function verifyReasonsWithBackend(
    questions,
    context = {}
) {

    // -------------------------------------------------------------------------
    // KEEP EXISTING BACKEND VERIFICATION HERE
    // -------------------------------------------------------------------------
    //
    // Agar aapke paas already backend verification function/API hai,
    // isi function ke andar call karein.
    //
    // Abhi Gemini ka original "reason" preserve rahega.
    //
    // -------------------------------------------------------------------------

    return questions;
}


// ============================================================================
// MAIN
// ============================================================================

async function main() {

    let imagePath =
        process.argv[2];


    const outputPath =
        process.argv[3];


    if (
        !imagePath ||
        !outputPath
    ) {

        console.error(
            "Usage: node ocrQuestionDetector.mjs <imagePath> <outputDir>"
        );

        process.exit(1);
    }


    await fs.mkdir(
        outputPath,
        {
            recursive: true,
        }
    );


    // =========================================================================
    // 1. NORMALIZE PAGE
    // =========================================================================

    const normalization =
        await normalizeCapturedPage(
            imagePath,
            outputPath
        );


    imagePath =
        normalization.imagePath;


    // =========================================================================
    // 2. PAGE SIZE
    // =========================================================================

    const metadata =
        await sharp(
            imagePath
        ).metadata();


    const width =
        safeNumber(
            metadata.width
        );


    const height =
        safeNumber(
            metadata.height
        );


    if (
        !width ||
        !height
    ) {

        throw new Error(
            "Unable to read image dimensions"
        );
    }


    console.log("");

    console.log(
        "=============================================="
    );

    console.log(
        "AI QUESTION NUMBER DETECTOR"
    );

    console.log(
        "=============================================="
    );

    console.log(
        `Image: ${imagePath}`
    );

    console.log(
        `Size: ${width}x${height}`
    );

    console.log(
        `Normalization: ${
            normalization.crop.applied
                ? "applied"
                : "not applied"
        }`
    );


    // =========================================================================
    // 3. GEMINI FULL PAGE DETECTION
    // =========================================================================
    //
    // IMPORTANT:
    //
    // Gemini receives the COMPLETE PAGE.
    //
    // No:
    // - question-number column detection
    // - ROI
    // - Tesseract
    // - connected components
    // - OCR candidate detection
    //
    // Gemini coordinates MUST be full-page coordinates.
    //
    // =========================================================================

    console.log("");

    console.log(
        "=============================================="
    );

    console.log(
        "GEMINI FULL PAGE QUESTION DETECTION"
    );

    console.log(
        "=============================================="
    );


    let geminiQuestions = [];


    try {

        const detected =
            await detectQuestionNumbersWithGemini({

                imagePath,

                imageWidth:
                    width,

                imageHeight:
                    height,
            });


        // ---------------------------------------------------------------------
        // Normalize / validate Gemini response
        // ---------------------------------------------------------------------

        geminiQuestions =
            Array.isArray(detected)
                ? detected
                    .map(
                        question =>
                            normalizeGeminiQuestion(
                                question,
                                width,
                                height
                            )
                    )
                    .filter(Boolean)
                : [];


    } catch (error) {

        console.error("");

        console.error(
            "[GEMINI ERROR]"
        );

        console.error(
            error?.message ||
            error
        );


        geminiQuestions = [];
    }


    // =========================================================================
    // 4. REMOVE DUPLICATES
    // =========================================================================

    geminiQuestions =
        deduplicateQuestions(
            geminiQuestions
        );


    console.log("");

    console.log(
        "GEMINI QUESTIONS"
    );

    console.log(
        JSON.stringify(
            geminiQuestions,
            null,
            2
        )
    );


    // =========================================================================
    // 5. BACKEND REASON VERIFICATION
    // =========================================================================
    //
    // Gemini reason remains available.
    //
    // Backend verification can add:
    //
    // verifiedReason
    // reasonVerified
    //
    // without losing the original AI reason.
    //
    // =========================================================================

    geminiQuestions =
        await verifyReasonsWithBackend(
            geminiQuestions,
            {
                imagePath,

                pageWidth:
                    width,

                pageHeight:
                    height,
            }
        );


    // =========================================================================
    // 6. CREATE ANSWER REGIONS
    // =========================================================================

    const answerRegions =
        createAnswerRegions(
            geminiQuestions,
            width,
            height
        );


    // =========================================================================
    // 7. FINAL RESULT
    // =========================================================================

    const finalResult = {

        pageWidth:
            width,

        pageHeight:
            height,


        normalization:
            normalization.crop,


        // Original Gemini detections
        //
        // Contains:
        // qNo
        // x
        // y
        // width
        // height
        // confidence
        // reason
        //
        geminiQuestions,


        // Examiner screen should mainly use this.
        questions:
            answerRegions,
    };


    console.log("");

    console.log(
        "=============================================="
    );

    console.log(
        "FINAL QUESTION DETECTION RESULT"
    );

    console.log(
        "=============================================="
    );


    console.log(
        JSON.stringify(
            finalResult,
            null,
            2
        )
    );


    // =========================================================================
    // 8. SAVE RESULT
    // =========================================================================

    const resultPath =
        path.join(
            outputPath,
            "question-detection-result.json"
        );


    await fs.writeFile(
        resultPath,
        JSON.stringify(
            finalResult,
            null,
            2
        ),
        "utf8"
    );


    console.log("");

    console.log(
        `Saved result: ${resultPath}`
    );


    return finalResult;
}


// ============================================================================
// RUN
// ============================================================================

main().catch(error => {

    console.error(
        "AI question detector failed:",
        error
    );


    process.exit(1);
});