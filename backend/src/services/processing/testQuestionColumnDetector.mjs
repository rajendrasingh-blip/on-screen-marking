import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/*
|--------------------------------------------------------------------------
| QUESTION NUMBER COLUMN DETECTOR V2
|--------------------------------------------------------------------------
|
| We DO NOT remove left blank space.
|
| We DO NOT assume fixed X position.
|
| We detect printed vertical separators first.
|
| Layout:
|
| BLANK | EXAMINER | QUESTION NO | ANSWER
|               L1        L2
|                   ↑
|              target column
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| SEARCH AREA
|--------------------------------------------------------------------------
|
| We ignore only the extreme image borders.
| This is NOT blank-space removal.
|
*/

const SEARCH_X_START_PERCENT = 0.05;
const SEARCH_X_END_PERCENT = 0.60;

const SEARCH_Y_START_PERCENT = 0.08;
const SEARCH_Y_END_PERCENT = 0.94;


/*
|--------------------------------------------------------------------------
| LINE DETECTION
|--------------------------------------------------------------------------
*/

const BAND_COUNT = 24;

const X_NEIGHBOR = 3;

const MIN_VERTICAL_COVERAGE = 0.18;

const MIN_COLUMN_WIDTH = 18;
const MAX_COLUMN_WIDTH = 80;


/*
|--------------------------------------------------------------------------
| RED / PINK LINE DETECTION
|--------------------------------------------------------------------------
*/

const RED_DOMINANCE = 12;
const RED_MIN = 70;


/*
|--------------------------------------------------------------------------
| GRAYSCALE LINE DETECTION
|--------------------------------------------------------------------------
|
| Printed line can become faded/gray after scanning.
|
|--------------------------------------------------------------------------
*/

const EDGE_THRESHOLD = 28;


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}


function grayValue(r, g, b) {

    return (
        0.299 * r +
        0.587 * g +
        0.114 * b
    );
}


/*
|--------------------------------------------------------------------------
| Get RGB pixel
|--------------------------------------------------------------------------
*/

function getPixel(
    data,
    width,
    x,
    y,
    channels
) {

    const index =
        (y * width + x) * channels;

    return {
        r: data[index],
        g: data[index + 1],
        b: data[index + 2]
    };
}


/*
|--------------------------------------------------------------------------
| RED / PINK SCORE
|--------------------------------------------------------------------------
*/

function redScore(
    data,
    width,
    x,
    y,
    channels
) {

    const {
        r,
        g,
        b
    } =
        getPixel(
            data,
            width,
            x,
            y,
            channels
        );

    const brightness =
        grayValue(r, g, b);

    const dominance =
        r - Math.max(g, b);

    if (
        brightness >= RED_MIN &&
        dominance >= RED_DOMINANCE
    ) {

        return 1;
    }

    return 0;
}


/*
|--------------------------------------------------------------------------
| VERTICAL EDGE SCORE
|--------------------------------------------------------------------------
|
| Instead of saying:
|
| "dark pixel = line"
|
| we check whether there is a vertical boundary:
|
| bright | dark | bright
|
| or
|
| dark | bright | dark
|
|--------------------------------------------------------------------------
*/

function verticalEdgeScore(
    data,
    width,
    height,
    x,
    y,
    channels
) {

    if (
        x <= X_NEIGHBOR ||
        x >= width - X_NEIGHBOR - 1
    ) {
        return 0;
    }

    const center =
        getPixel(
            data,
            width,
            x,
            y,
            channels
        );

    const left =
        getPixel(
            data,
            width,
            x - X_NEIGHBOR,
            y,
            channels
        );

    const right =
        getPixel(
            data,
            width,
            x + X_NEIGHBOR,
            y,
            channels
        );

    const centerGray =
        grayValue(
            center.r,
            center.g,
            center.b
        );

    const leftGray =
        grayValue(
            left.r,
            left.g,
            left.b
        );

    const rightGray =
        grayValue(
            right.r,
            right.g,
            right.b
        );

    /*
    |--------------------------------------------------------------------------
    | A vertical line should differ from BOTH sides.
    |--------------------------------------------------------------------------
    */

    const sideAverage =
        (
            leftGray +
            rightGray
        ) / 2;

    const difference =
        Math.abs(
            sideAverage -
            centerGray
        );

    if (
        difference >=
        EDGE_THRESHOLD
    ) {

        return Math.min(
            1,
            difference / 100
        );
    }

    return 0;
}


/*
|--------------------------------------------------------------------------
| SCORE ONE X POSITION
|--------------------------------------------------------------------------
*/

function scoreX(
    data,
    width,
    height,
    x,
    yStart,
    yEnd,
    channels
) {

    let redHits = 0;
    let edgeHits = 0;

    let totalScore = 0;

    const totalPixels =
        Math.max(
            1,
            yEnd - yStart
        );

    for (
        let y = yStart;
        y < yEnd;
        y++
    ) {

        let redFound = false;
        let edgeFound = false;

        /*
        |--------------------------------------------------------------------------
        | Horizontal tolerance
        |--------------------------------------------------------------------------
        */

        for (
            let dx = -2;
            dx <= 2;
            dx++
        ) {

            const xx = x + dx;

            if (
                xx < 0 ||
                xx >= width
            ) {
                continue;
            }

            if (
                redScore(
                    data,
                    width,
                    xx,
                    y,
                    channels
                )
            ) {

                redFound = true;
            }

            const edge =
                verticalEdgeScore(
                    data,
                    width,
                    height,
                    xx,
                    y,
                    channels
                );

            if (
                edge > 0
            ) {

                edgeFound = true;
                totalScore += edge;
            }
        }

        if (redFound) {
            redHits++;
            totalScore += 1.5;
        }

        if (edgeFound) {
            edgeHits++;
        }
    }

    const redCoverage =
        redHits /
        totalPixels;

    const edgeCoverage =
        edgeHits /
        totalPixels;

    /*
    |--------------------------------------------------------------------------
    | Combined coverage
    |--------------------------------------------------------------------------
    */

    const combinedCoverage =
        Math.max(
            redCoverage,
            edgeCoverage
        );

    return {
        x,

        score:
            totalScore,

        redCoverage,

        edgeCoverage,

        coverage:
            combinedCoverage
    };
}


/*
|--------------------------------------------------------------------------
| DETECT VERTICAL LINES
|--------------------------------------------------------------------------
*/

function detectVerticalLines(
    data,
    width,
    height,
    channels
) {

    const xStart =
        Math.floor(
            width *
            SEARCH_X_START_PERCENT
        );

    const xEnd =
        Math.floor(
            width *
            SEARCH_X_END_PERCENT
        );

    const yStart =
        Math.floor(
            height *
            SEARCH_Y_START_PERCENT
        );

    const yEnd =
        Math.floor(
            height *
            SEARCH_Y_END_PERCENT
        );

    const bandHeight =
        Math.floor(
            (
                yEnd - yStart
            ) /
            BAND_COUNT
        );

    console.log("");
    console.log(
        "=============================================="
    );

    console.log(
        "VERTICAL LINE DETECTION V2"
    );

    console.log(
        "=============================================="
    );

    console.log(
        `Search X: ${xStart} - ${xEnd}`
    );

    console.log(
        `Search Y: ${yStart} - ${yEnd}`
    );

    console.log(
        `Bands: ${BAND_COUNT}`
    );

    console.log("");

    const allPeaks = [];

    /*
    |--------------------------------------------------------------------------
    | Each horizontal band
    |--------------------------------------------------------------------------
    */

    for (
        let band = 0;
        band < BAND_COUNT;
        band++
    ) {

        const currentYStart =
            yStart +
            band * bandHeight;

        const currentYEnd =
            band === BAND_COUNT - 1
                ? yEnd
                : currentYStart +
                  bandHeight;

        let best = null;

        /*
        |--------------------------------------------------------------------------
        | Scan X
        |--------------------------------------------------------------------------
        */

        for (
            let x = xStart;
            x <= xEnd;
            x++
        ) {

            const result =
                scoreX(
                    data,
                    width,
                    height,
                    x,
                    currentYStart,
                    currentYEnd,
                    channels
                );

            if (
                result.coverage <
                MIN_VERTICAL_COVERAGE
            ) {
                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | Prefer RED printed lines.
            |--------------------------------------------------------------------------
            */

            const priorityScore =
                result.score +
                result.redCoverage * 100;

            if (
                !best ||
                priorityScore >
                best.priorityScore
            ) {

                best = {
                    ...result,

                    yStart:
                        currentYStart,

                    yEnd:
                        currentYEnd,

                    priorityScore
                };
            }
        }

        if (best) {

            allPeaks.push(best);

            console.log(
                `[BAND ${String(band + 1).padStart(2, "0")}] ` +
                `x=${best.x} ` +
                `red=${(best.redCoverage * 100).toFixed(1)}% ` +
                `edge=${(best.edgeCoverage * 100).toFixed(1)}%`
            );

        } else {

            console.log(
                `[BAND ${String(band + 1).padStart(2, "0")}] no line`
            );
        }
    }

    return allPeaks;
}


/*
|--------------------------------------------------------------------------
| CLUSTER X POSITIONS
|--------------------------------------------------------------------------
*/

function clusterLines(
    peaks
) {

    const sorted =
        [...peaks].sort(
            (a, b) =>
                a.x - b.x
        );

    const clusters = [];

    for (
        const peak of sorted
    ) {

        const last =
            clusters[
                clusters.length - 1
            ];

        if (
            !last ||
            Math.abs(
                peak.x -
                last.centerX
            ) > 10
        ) {

            clusters.push({
                centerX:
                    peak.x,

                peaks: [
                    peak
                ]
            });

            continue;
        }

        last.peaks.push(
            peak
        );

        last.centerX =
            Math.round(
                last.peaks.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum + item.x,
                    0
                ) /
                last.peaks.length
            );
    }

    return clusters
        .map(
            cluster => {

                const redCoverage =
                    cluster.peaks.reduce(
                        (
                            sum,
                            item
                        ) =>
                            sum +
                            item.redCoverage,
                        0
                    ) /
                    cluster.peaks.length;

                const edgeCoverage =
                    cluster.peaks.reduce(
                        (
                            sum,
                            item
                        ) =>
                            sum +
                            item.edgeCoverage,
                        0
                    ) /
                    cluster.peaks.length;

                const score =
                    cluster.peaks.reduce(
                        (
                            sum,
                            item
                        ) =>
                            sum +
                            item.score,
                        0
                    );

                return {
                    x:
                        cluster.centerX,

                    bands:
                        cluster.peaks.length,

                    redCoverage,

                    edgeCoverage,

                    score
                };
            }
        );
}


/*
|--------------------------------------------------------------------------
| SELECT QUESTION NUMBER COLUMN
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| We don't simply choose strongest two lines.
|
| We need a pair which:
|
| - has repeated presence
| - is reasonably close
| - is inside the page
| - looks like a narrow column
|
|--------------------------------------------------------------------------
*/

function selectQuestionColumn(
    lines
) {

    console.log("");
    console.log(
        "=============================================="
    );

    console.log(
        "LINE CLUSTERS"
    );

    console.log(
        "=============================================="
    );

    for (
        const line of lines
    ) {

        console.log(
            `x=${line.x} | ` +
            `bands=${line.bands}/${BAND_COUNT} | ` +
            `red=${(line.redCoverage * 100).toFixed(1)}% | ` +
            `edge=${(line.edgeCoverage * 100).toFixed(1)}%`
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Remove weak lines
    |--------------------------------------------------------------------------
    */

    const strongLines =
        lines.filter(
            line =>
                line.bands >= 4 ||
                line.redCoverage >= 0.10
        );

    console.log("");

    console.log(
        `Strong lines: ${strongLines.length}`
    );

    if (
        strongLines.length < 2
    ) {

        return null;
    }

    const pairs = [];

    /*
    |--------------------------------------------------------------------------
    | Test every possible pair
    |--------------------------------------------------------------------------
    */

    for (
        let i = 0;
        i < strongLines.length;
        i++
    ) {
        for (
            let j = i + 1;
            j < strongLines.length;
            j++
        ) {

            const left =
                strongLines[i];

            const right =
                strongLines[j];

            const width =
                right.x -
                left.x;

            if (
                width <
                MIN_COLUMN_WIDTH
            ) {
                continue;
            }

            if (
                width >
                MAX_COLUMN_WIDTH
            ) {
                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | Pair score
            |--------------------------------------------------------------------------
            */

            const repeatedScore =
                (
                    left.bands +
                    right.bands
                ) * 20;

            const redScoreValue =
                (
                    left.redCoverage +
                    right.redCoverage
                ) * 150;

            const edgeScore =
                (
                    left.edgeCoverage +
                    right.edgeCoverage
                ) * 80;

            /*
            |--------------------------------------------------------------------------
            | Prefer width around typical Q.No column.
            |--------------------------------------------------------------------------
            */

            const widthScore =
                40 -
                Math.abs(
                    width - 40
                );

            const pairScore =
                repeatedScore +
                redScoreValue +
                edgeScore +
                widthScore;

            pairs.push({
                x1:
                    left.x,

                x2:
                    right.x,

                width,

                pairScore,

                left,

                right
            });
        }
    }

    if (
        pairs.length === 0
    ) {

        return null;
    }

    pairs.sort(
        (
            a,
            b
        ) =>
            b.pairScore -
            a.pairScore
    );

    console.log("");
    console.log(
        "=============================================="
    );

    console.log(
        "TOP COLUMN PAIRS"
    );

    console.log(
        "=============================================="
    );

    for (
        const pair of pairs.slice(
            0,
            10
        )
    ) {

        console.log(
            `x1=${pair.x1} ` +
            `x2=${pair.x2} ` +
            `width=${pair.width} ` +
            `score=${pair.pairScore.toFixed(1)}`
        );
    }

    return pairs[0];
}


/*
|--------------------------------------------------------------------------
| SAVE VISUALIZATION
|--------------------------------------------------------------------------
*/

async function saveVisualization(
    imagePath,
    outputDir,
    width,
    height,
    column
) {

    const padding = 10;

    const left =
        clamp(
            column.x1 - padding,
            0,
            width - 1
        );

    const right =
        clamp(
            column.x2 + padding,
            left + 1,
            width
        );

    const cropWidth =
        right - left;

    const outputPath =
        path.join(
            outputDir,
            "question-number-column-v2.png"
        );

    await sharp(imagePath)
        .extract({
            left,
            top: 0,
            width: cropWidth,
            height
        })
        .png()
        .toFile(outputPath);

    console.log("");

    console.log(
        `Saved visualization: ${outputPath}`
    );
}


/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {

    const imagePath =
        process.argv[2];

    const outputDir =
        process.argv[3];

    if (
        !imagePath ||
        !outputDir
    ) {

        console.error(
            "Usage:"
        );

        console.error(
            "node testQuestionColumnDetector.mjs <imagePath> <outputDir>"
        );

        process.exit(1);
    }

    await fs.mkdir(
        outputDir,
        {
            recursive: true
        }
    );

    console.log("");
    console.log(
        "=============================================="
    );

    console.log(
        "QUESTION NUMBER COLUMN DETECTOR V2"
    );

    console.log(
        "=============================================="
    );

    /*
    |--------------------------------------------------------------------------
    | Load image
    |--------------------------------------------------------------------------
    */

    const image =
        sharp(imagePath)
            .removeAlpha();

    const metadata =
        await image.metadata();

    const width =
        metadata.width;

    const height =
        metadata.height;

    if (
        !width ||
        !height
    ) {

        throw new Error(
            "Unable to read image size"
        );
    }

    console.log(
        `Image size: ${width}x${height}`
    );

    /*
    |--------------------------------------------------------------------------
    | RGB buffer
    |--------------------------------------------------------------------------
    */

    const {
        data,
        info
    } =
        await image
            .raw()
            .toBuffer({
                resolveWithObject: true
            });

    /*
    |--------------------------------------------------------------------------
    | Detect lines
    |--------------------------------------------------------------------------
    */

    const peaks =
        detectVerticalLines(
            data,
            width,
            height,
            info.channels
        );

    /*
    |--------------------------------------------------------------------------
    | Cluster
    |--------------------------------------------------------------------------
    */

    const lines =
        clusterLines(
            peaks
        );

    /*
    |--------------------------------------------------------------------------
    | Select Q.No column
    |--------------------------------------------------------------------------
    */

    const selected =
        selectQuestionColumn(
            lines
        );

    console.log("");

    console.log(
        "=============================================="
    );

    if (!selected) {

        console.log(
            "QUESTION NUMBER COLUMN NOT DETECTED"
        );

        console.log(
            "=============================================="
        );

        process.exit(0);
    }

    console.log(
        "QUESTION NUMBER COLUMN DETECTED"
    );

    console.log(
        "=============================================="
    );

    console.log(
        `x1    = ${selected.x1}`
    );

    console.log(
        `x2    = ${selected.x2}`
    );

    console.log(
        `width = ${selected.width}`
    );

    console.log(
        `score = ${selected.pairScore.toFixed(1)}`
    );

    console.log(
        `left bands = ${selected.left.bands}/${BAND_COUNT}`
    );

    console.log(
        `right bands = ${selected.right.bands}/${BAND_COUNT}`
    );

    /*
    |--------------------------------------------------------------------------
    | Save column crop
    |--------------------------------------------------------------------------
    */

    await saveVisualization(
        imagePath,
        outputDir,
        width,
        height,
        selected
    );

    /*
    |--------------------------------------------------------------------------
    | Final JSON
    |--------------------------------------------------------------------------
    */

    console.log("");

    console.log(
        JSON.stringify({
            pageWidth:
                width,

            pageHeight:
                height,

            questionNumberColumn: {
                x1:
                    selected.x1,

                x2:
                    selected.x2,

                width:
                    selected.width
            },

            confidence: {
                score:
                    Number(
                        selected.pairScore.toFixed(2)
                    ),

                leftBands:
                    selected.left.bands,

                rightBands:
                    selected.right.bands,

                leftRedCoverage:
                    Number(
                        (
                            selected.left.redCoverage *
                            100
                        ).toFixed(2)
                    ),

                rightRedCoverage:
                    Number(
                        (
                            selected.right.redCoverage *
                            100
                        ).toFixed(2)
                    )
            }
        })
    );
}


main().catch(
    error => {

        console.error(
            "Detector error:",
            error
        );

        process.exit(1);
    }
);