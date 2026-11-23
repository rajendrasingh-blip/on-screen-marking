import dotenv from "dotenv";
dotenv.config();

import fs from "fs/promises";

import {
    GoogleGenAI,
    Type,
} from "@google/genai";


const apiKey =
    process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error(
        "GEMINI_API_KEY is missing in .env"
    );
}


const ai =
    new GoogleGenAI({
        apiKey,
    });


const MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash-lite";


// ============================================================================
// DETECT QUESTION NUMBERS FROM WHOLE PAGE
// ============================================================================

export async function detectQuestionNumbersWithGemini({
    imagePath,
    imageWidth,
    imageHeight,
}) {

    try {

        // --------------------------------------------------------------------
        // READ FULL PAGE IMAGE
        // --------------------------------------------------------------------

        const imageBuffer =
            await fs.readFile(
                imagePath
            );


        const base64Image =
            imageBuffer.toString(
                "base64"
            );


        // ====================================================================
        // PROMPT
        // ====================================================================

        const prompt = `

You are analyzing the FULL PAGE image of a student's scanned handwritten
answer sheet.

Your task is to identify EVERY genuine MAIN QUESTION NUMBER that marks
the START of a student's answer on this page.

The student may write the question number in DIFFERENT locations.

IMPORTANT:
Do NOT assume that question numbers only exist in a question-number column.

A question number can appear in ANY of these three situations:

1. LEFT QUESTION-NUMBER COLUMN
   - Inside the question-number column
   - Slightly to the left of the column
   - Slightly to the right of the column
   - Minor alignment/position variation is allowed

2. PAGE HEADER / TOP AREA
   Examples:
   Q1
   Q.1
   Q. 1
   Q. No. 1
   Q No 1
   Question 1
   Ans 1
   Answer 1
   1
   1.
   1)
   etc.

3. INSIDE THE ANSWER AREA
   After finishing one answer, the student may write the next
   question number somewhere in the middle or right side of the page
   before starting the next answer.

Examples:

Q1
[answer text...]

Q2
[answer text...]

or:

1
[answer text...]

2
[answer text...]

or:

Answer 1
[answer text...]

Answer 2
[answer text...]

or:

1(i)
[answer text...]

1(ii)
[answer text...]

2(a)
[answer text...]


===============================================================================
VALID QUESTION NUMBERS
===============================================================================

Main question numbers are integers from 1 to 30.

A two-digit number such as 13 is ONE question number.

Do not split 13 into 1 and 3.


===============================================================================
SUB-PARTS
===============================================================================

A question can contain a sub-part.

Examples:

1(i)
1(ii)
1(iii)

2(a)
2(b)
2(c)

The Arabic number is the MAIN question number.

The Roman numeral or alphabetic character is the SUB-PART.

For:

1(i)

return:

qNo = 1
subPart = "i"

For:

2(b)

return:

qNo = 2
subPart = "b"


IMPORTANT:

The sub-part itself must NEVER be treated as a main question number.

For example:

1(i)

must NOT become:

qNo = 1
qNo = 1

It is ONE answer-entry detection with:

qNo = 1
subPart = i


===============================================================================
VERY IMPORTANT - DO NOT FALSELY DETECT NORMAL TEXT
===============================================================================

The page contains handwritten answer text.

Numbers can naturally occur inside normal answer sentences.

For example:

"Question 1 was discussed..."

"1 kg = 1000 grams"

"There are 5 reasons..."

"Example 2..."

These numbers are NOT automatically question numbers.

Only identify a number as a QUESTION MARKER when the surrounding visual
context indicates that the student is starting or identifying an answer.

Consider:

- Position
- Nearby words such as Q, Q., Question, Ans, Answer
- Question-number formatting
- Whether the number appears at the beginning of an answer
- Nearby handwritten answer text
- Whether the number visually separates one answer from another
- Whether it appears in the left question-number region
- Whether it appears in the page header
- Whether it appears immediately before a new answer


===============================================================================
PRINTED CONTENT
===============================================================================

The answer sheet may contain printed/template content.

IGNORE:

- Printed question numbers
- Printed instructions
- Printed headings
- Printed page numbers
- Printed table numbers
- Printed borders
- Printed lines
- Printed boxes
- Printed labels
- Template text
- Examiner markings
- Red/black correction marks if they are not student question markers

PRIORITIZE STUDENT HANDWRITING.

The student handwriting may be blue, black or another scan-altered color.


===============================================================================
QUESTION NUMBER LOCATION
===============================================================================

For every genuine question marker, determine where it occurs.

Return one of:

"left_column"

"header"

"inline"


Meaning:

left_column:
Question number is in or near the left question-number column.

header:
Question number is in the top/header area of the page.

inline:
Question number occurs inside the answer-writing area, usually before
the student starts the next answer.


===============================================================================
QUESTION NUMBER BOUNDING BOX
===============================================================================

For every question marker return the bounding box of the MAIN QUESTION NUMBER.

x:
left coordinate

y:
top coordinate

width:
width

height:
height

The bounding box should contain the main Arabic question number.

For:

1(i)

the main bounding box should primarily cover "1".

For:

Q1

the bounding box should cover the question marker / number area,
including the Q only if necessary for accurate localization.

Do NOT create a huge bounding box covering the answer text.


===============================================================================
ANSWER REGION
===============================================================================

For every detected question marker, also estimate the answer-writing region
associated with that question.

The answer region should represent the area where the student's answer
for this question is written.

Return:

answerX
answerY
answerWidth
answerHeight

IMPORTANT:

Do NOT include the question marker itself unnecessarily.

The answer region should generally begin immediately AFTER the question
number/header marker and continue until the next question marker or the
bottom of the page.

If the next question marker exists, use it as the approximate boundary.

The answer region can include the normal left/right writing area of the page.

Do not assume that the answer always starts immediately to the right of
the question number.

The student may begin writing below the question marker.


===============================================================================
QUESTION ORDER
===============================================================================

Return detections in visual top-to-bottom order.

Do NOT rely only on numeric sequence.

Read every visible question marker independently.

Do NOT automatically assume:

1 -> 2 -> 3 -> 4

The student may skip questions.

The same main question number may appear more than once because of
sub-parts or repeated answer entries.

DO NOT blindly copy a previous question number.


===============================================================================
DUPLICATES
===============================================================================

Do not deduplicate genuine separate occurrences.

If the page genuinely contains:

1(i)
1(ii)

return both.

If two separate answer entries genuinely contain question number 1,
return both.


===============================================================================
IMPORTANT DECISION RULE
===============================================================================

Before returning a detection, ask:

"Does this handwriting visually function as a marker identifying the
start of a student's answer?"

If YES:
return it.

If it is merely a number occurring inside normal answer text:
DO NOT return it.


===============================================================================
OUTPUT
===============================================================================

Return ONLY JSON.

Format:

{
  "questions": [
    {
      "qNo": 1,
      "subPart": null,
      "markerType": "left_column",
      "x": 100,
      "y": 200,
      "width": 40,
      "height": 38,
      "answerX": 150,
      "answerY": 245,
      "answerWidth": 900,
      "answerHeight": 500,
      "confidence": 0.96
    }
  ]
}

If no genuine question marker is visible:

{
  "questions": []
}

`;


        // ====================================================================
        // GEMINI
        // ====================================================================

        const response =
            await ai.models.generateContent({

                model: MODEL,

                contents: [

                    {
                        role: "user",

                        parts: [

                            {
                                text: prompt,
                            },

                            {
                                inlineData: {

                                    mimeType:
                                        "image/png",

                                    data:
                                        base64Image,
                                },
                            },

                        ],
                    },

                ],

                config: {

                    temperature: 0,

                    responseMimeType:
                        "application/json",

                    responseSchema: {

                        type:
                            Type.OBJECT,

                        properties: {

                            questions: {

                                type:
                                    Type.ARRAY,

                                items: {

                                    type:
                                        Type.OBJECT,

                                    properties: {

                                        qNo: {
                                            type:
                                                Type.INTEGER,
                                        },

                                        subPart: {
                                            type:
                                                Type.STRING,

                                            nullable:
                                                true,
                                        },

                                        markerType: {
                                            type:
                                                Type.STRING,
                                        },

                                        x: {
                                            type:
                                                Type.NUMBER,
                                        },

                                        y: {
                                            type:
                                                Type.NUMBER,
                                        },

                                        width: {
                                            type:
                                                Type.NUMBER,
                                        },

                                        height: {
                                            type:
                                                Type.NUMBER,
                                        },

                                        answerX: {
                                            type:
                                                Type.NUMBER,
                                        },

                                        answerY: {
                                            type:
                                                Type.NUMBER,
                                        },

                                        answerWidth: {
                                            type:
                                                Type.NUMBER,
                                        },

                                        answerHeight: {
                                            type:
                                                Type.NUMBER,
                                        },

                                        confidence: {
                                            type:
                                                Type.NUMBER,
                                        },

                                    },

                                    required: [

                                        "qNo",

                                        "markerType",

                                        "x",

                                        "y",

                                        "width",

                                        "height",

                                        "answerX",

                                        "answerY",

                                        "answerWidth",

                                        "answerHeight",

                                        "confidence",

                                    ],

                                },

                            },

                        },

                        required: [
                            "questions",
                        ],

                    },

                },

            });


        // ====================================================================
        // RAW RESPONSE
        // ====================================================================

        const rawText =
            response.text || "";


        console.log(
            "\n[GEMINI RAW RESPONSE]"
        );

        console.log(
            rawText
        );


        // ====================================================================
        // PARSE JSON
        // ====================================================================

        let parsedGemini;

        try {

            parsedGemini =
                JSON.parse(
                    rawText
                );

        } catch (error) {

            console.error(
                "[GEMINI JSON PARSE ERROR]",
                error
            );

            return [];

        }


        const rawQuestions =
            Array.isArray(
                parsedGemini?.questions
            )
                ? parsedGemini.questions
                : [];


        console.log(
            "\n[GEMINI RAW QUESTIONS COUNT]",
            rawQuestions.length
        );


        // ====================================================================
        // VALIDATION
        // ====================================================================

        const GEMINI_COORDINATE_SCALE =
            1000;

        const MIN_QUESTION_NO =
            1;

        const MAX_QUESTION_NO =
            30;


        const VALID_MARKER_TYPES = [
            "left_column",
            "header",
            "inline",
        ];


        const questions =
            rawQuestions

                .filter(
                    question => {

                        // --------------------------------------------
                        // qNo
                        // --------------------------------------------

                        if (
                            !Number.isInteger(
                                question.qNo
                            )
                        ) {
                            return false;
                        }


                        if (
                            question.qNo <
                            MIN_QUESTION_NO ||

                            question.qNo >
                            MAX_QUESTION_NO
                        ) {
                            return false;
                        }


                        // --------------------------------------------
                        // marker type
                        // --------------------------------------------

                        if (
                            !VALID_MARKER_TYPES.includes(
                                question.markerType
                            )
                        ) {
                            return false;
                        }


                        // --------------------------------------------
                        // coordinates
                        // --------------------------------------------

                        const numericFields = [

                            "x",
                            "y",
                            "width",
                            "height",

                            "answerX",
                            "answerY",
                            "answerWidth",
                            "answerHeight",

                            "confidence",

                        ];


                        for (
                            const field
                            of numericFields
                        ) {

                            if (
                                !Number.isFinite(
                                    Number(
                                        question[field]
                                    )
                                )
                            ) {

                                return false;

                            }

                        }


                        // --------------------------------------------
                        // marker size
                        // --------------------------------------------

                        if (
                            question.width <= 0 ||
                            question.height <= 0
                        ) {

                            return false;

                        }


                        // --------------------------------------------
                        // answer size
                        // --------------------------------------------

                        if (
                            question.answerWidth <= 0 ||
                            question.answerHeight <= 0
                        ) {

                            return false;

                        }


                        // --------------------------------------------
                        // confidence
                        // --------------------------------------------

                        if (
                            question.confidence < 0 ||
                            question.confidence > 1
                        ) {

                            return false;

                        }


                        return true;

                    }
                )


                // ====================================================================
                // COORDINATE NORMALIZATION
                // ====================================================================

                .map(
                    question => {

                        const x =
                            (
                                Number(
                                    question.x
                                ) /
                                GEMINI_COORDINATE_SCALE
                            ) *
                            imageWidth;


                        const y =
                            (
                                Number(
                                    question.y
                                ) /
                                GEMINI_COORDINATE_SCALE
                            ) *
                            imageHeight;


                        const width =
                            (
                                Number(
                                    question.width
                                ) /
                                GEMINI_COORDINATE_SCALE
                            ) *
                            imageWidth;


                        const height =
                            (
                                Number(
                                    question.height
                                ) /
                                GEMINI_COORDINATE_SCALE
                            ) *
                            imageHeight;


                        const answerX =
                            (
                                Number(
                                    question.answerX
                                ) /
                                GEMINI_COORDINATE_SCALE
                            ) *
                            imageWidth;


                        const answerY =
                            (
                                Number(
                                    question.answerY
                                ) /
                                GEMINI_COORDINATE_SCALE
                            ) *
                            imageHeight;


                        const answerWidth =
                            (
                                Number(
                                    question.answerWidth
                                ) /
                                GEMINI_COORDINATE_SCALE
                            ) *
                            imageWidth;


                        const answerHeight =
                            (
                                Number(
                                    question.answerHeight
                                ) /
                                GEMINI_COORDINATE_SCALE
                            ) *
                            imageHeight;


                        return {

                            qNo:
                                Number(
                                    question.qNo
                                ),

                            subPart:
                                typeof question.subPart ===
                                    "string"

                                    ? question.subPart.trim()

                                    : null,

                            markerType:
                                question.markerType,

                            x,

                            y,

                            width,

                            height,

                            answerX,

                            answerY,

                            answerWidth,

                            answerHeight,

                            confidence:
                                Number(
                                    question.confidence
                                ),

                        };

                    }
                )


                // ====================================================================
                // SORT TOP -> BOTTOM
                // ====================================================================

                .sort(
                    (a, b) =>
                        a.y - b.y
                );


        // ====================================================================
        // LOG
        // ====================================================================

        console.log(
            "\n[GEMINI VALIDATED QUESTIONS]"
        );

        console.log(
            JSON.stringify(
                questions,
                null,
                2
            )
        );


        console.log(
            "\n[GEMINI VALIDATED QUESTIONS COUNT]",
            questions.length
        );


        return questions;


    } catch (error) {

        console.error(
            "[GEMINI WHOLE PAGE DETECTION ERROR]"
        );

        console.error(
            error?.message ||
            error
        );

        return [];

    }

}