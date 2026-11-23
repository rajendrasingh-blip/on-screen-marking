import {
    createWorker,
} from "tesseract.js";

const imagePath =
    "storage/processing/3ce14490-2bcc-410f-94e8-e2cca399d1e2/ocr/candidate-122-212.png";

try {

    console.log("[TEST] Starting Tesseract...");

    const worker =
        await createWorker(
            "eng",
            1,
            {
                logger: (m) => {
                    console.log("[TESS]", m);
                },
            }
        );

    console.log(
        "[TEST] Worker created successfully"
    );

    await worker.setParameters({
        tessedit_char_whitelist:
            "0123456789",

        tessedit_pageseg_mode:
            "10",

        user_defined_dpi:
            "300",
    });

    console.log(
        "[TEST] Parameters set successfully"
    );

    const result =
        await worker.recognize(
            imagePath
        );

    console.log(
        "[TEST] OCR TEXT:"
    );

    console.log(
        result?.data?.text
    );

    console.log(
        "[TEST] CONFIDENCE:",
        result?.data?.confidence
    );

    await worker.terminate();

    console.log(
        "[TEST] Finished"
    );

} catch (error) {

    console.error(
        "[TEST FAILED]"
    );

    console.error(error);
}