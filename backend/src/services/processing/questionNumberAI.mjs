import fs from "fs/promises";
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const MODEL =
    process.env.OPENAI_VISION_MODEL ||
    "gpt-5.6-luna";


/**
 * Ask vision model to identify handwritten question numbers
 * from the already-detected Question Number Column.
 *
 * IMPORTANT:
 * - We are NOT asking AI to find the column.
 * - We are NOT asking AI to inspect the answer body.
 * - The supplied image is already the Question Number Column crop.
 */
export async function detectQuestionNumbersWithAI({
    imagePath,
    pageWidth,
    pageHeight,
    columnX1,
    columnX2,
    columnY1 = 0,
    columnY2 = pageHeight,
}) {
    const imageBuffer =
        await fs.readFile(imagePath);

    const base64 =
        imageBuffer.toString("base64");


    const imageDataUrl =
        `data:image/png;base64,${base64}`;


    const response =
        await client.responses.create({
            model: MODEL,

            input: [
                {
                    role: "user",

                    content: [
                        {
                            type: "input_text",

                            text: `
You are reading the Question Number column of an examination answer sheet.

The image contains ONLY the detected Question Number column.

Students have handwritten question numbers such as:
1
2
3
7
13
18
21
etc.

Your job is ONLY to identify handwritten question numbers.

Rules:

1. Read ONLY question numbers.
2. Ignore answer text.
3. Ignore handwriting that is not a question number.
4. Ignore printed lines and borders.
5. Ignore examiner marks.
6. A question number can be one or two digits.
7. Valid question numbers are 1 to 30.
8. Do NOT invent a number.
9. If a number is unclear, set confidence lower.
10. Return the vertical bounding box of each detected question number relative to the supplied column image.
11. Return results from top to bottom.
12. If nothing can be confidently identified, return an empty array.

Very important:
A handwritten "13" must be returned as 13, not 1, 3, or 31.

Return ONLY JSON matching the requested schema.
`,
                        },

                        {
                            type: "input_image",

                            image_url:
                                imageDataUrl,
                        },
                    ],
                },
            ],

            text: {
                format: {
                    type: "json_schema",

                    name:
                        "question_number_detection",

                    strict: true,

                    schema: {
                        type: "object",

                        properties: {
                            questions: {
                                type: "array",

                                items: {
                                    type: "object",

                                    properties: {
                                        qNo: {
                                            type: "integer",
                                            minimum: 1,
                                            maximum: 30,
                                        },

                                        x: {
                                            type: "number",
                                        },

                                        y: {
                                            type: "number",
                                        },

                                        width: {
                                            type: "number",
                                        },

                                        height: {
                                            type: "number",
                                        },

                                        confidence: {
                                            type: "number",
                                            minimum: 0,
                                            maximum: 1,
                                        },
                                    },

                                    required: [
                                        "qNo",
                                        "x",
                                        "y",
                                        "width",
                                        "height",
                                        "confidence",
                                    ],

                                    additionalProperties: false,
                                },
                            },
                        },

                        required: [
                            "questions",
                        ],

                        additionalProperties: false,
                    },
                },
            },
        });


    const outputText =
        response.output_text ||
        '{"questions":[]}';


    let parsed;

    try {
        parsed =
            JSON.parse(
                outputText
            );
    } catch (error) {
        console.error(
            "[AI OCR] Invalid JSON:",
            outputText
        );

        return [];
    }


    const questions =
        Array.isArray(
            parsed?.questions
        )
            ? parsed.questions
            : [];


    // ============================================================
    // Validate AI output locally
    // ============================================================

    const validated =
        questions
            .filter(question => {

                if (
                    !Number.isInteger(
                        question.qNo
                    )
                ) {
                    return false;
                }

                if (
                    question.qNo < 1 ||
                    question.qNo > 30
                ) {
                    return false;
                }

                if (
                    !Number.isFinite(
                        question.y
                    )
                ) {
                    return false;
                }

                if (
                    !Number.isFinite(
                        question.height
                    )
                ) {
                    return false;
                }

                if (
                    question.y < 0 ||
                    question.y >= pageHeight
                ) {
                    return false;
                }

                if (
                    question.height <= 0
                ) {
                    return false;
                }

                return true;
            })
            .map(question => ({
                qNo:
                    question.qNo,

                x:
                    Number(
                        question.x
                    ),

                y:
                    Number(
                        question.y
                    ),

                width:
                    Number(
                        question.width
                    ),

                height:
                    Number(
                        question.height
                    ),

                confidence:
                    Number(
                        question.confidence
                    ),
            }))
            .sort(
                (a, b) =>
                    a.y -
                    b.y
            );


    return validated;
}