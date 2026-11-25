import fs from "node:fs";
import path from "node:path";

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";

const pdfPath = process.argv[2];
const outputDir = process.argv[3];

if (!pdfPath || !outputDir) {
    console.error(
        "Usage: node pdfRenderer.mjs <pdfPath> <outputDir>"
    );

    process.exit(1);
}

if (!fs.existsSync(pdfPath)) {
    console.error(
        `PDF not found: ${pdfPath}`
    );

    process.exit(1);
}

fs.mkdirSync(outputDir, {
    recursive: true,
});

const pdfData = new Uint8Array(
    fs.readFileSync(pdfPath)
);

console.log(
    "Starting PDF.js..."
);

const loadingTask =
    pdfjsLib.getDocument({

        data: pdfData,

        // --------------------------------
        // WASM
        // --------------------------------

        wasmUrl:
            "http://127.0.0.1:5001/pdfjs/wasm/",

        useWasm: true,

        // Node.js mein browser ImageDecoder
        // use nahi karna
        isImageDecoderSupported: false,

        // Security
        enableScripting: false,
    });

const pdf =
    await loadingTask.promise;

console.log(
    `PDF loaded. Total pages: ${pdf.numPages}`
);


for (
    let pageNumber = 1;
    pageNumber <= pdf.numPages;
    pageNumber++
) {

    console.log(
        `Rendering page ${pageNumber}/${pdf.numPages}`
    );

    const page =
        await pdf.getPage(
            pageNumber
        );

    const scale = 1.5;

    const viewport =
        page.getViewport({
            scale,
        });

    const width =
        Math.ceil(viewport.width);

    const height =
        Math.ceil(viewport.height);

    const canvas =
        createCanvas(
            width,
            height
        );

    const context =
        canvas.getContext("2d");

    await page.render({
        canvasContext: context,
        viewport,
    }).promise;

    const outputFile =
        path.join(
            outputDir,
            `page-${String(
                pageNumber
            ).padStart(4, "0")}.png`
        );

    const buffer =
        canvas.toBuffer(
            "image/png"
        );

    fs.writeFileSync(
        outputFile,
        buffer
    );

    console.log(
        `Saved: ${outputFile}`
    );
}

console.log(
    "PDF rendering completed."
);