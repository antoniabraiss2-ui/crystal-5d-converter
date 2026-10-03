"use strict";

/*
====================================================
CRYSTAL 5D CONVERTER
STEP 5
Image analysis + DMC color matching
====================================================
*/


// ==================================================
// DOM
// ==================================================

const imageInput =
    document.getElementById("imageInput");

const fileName =
    document.getElementById("fileName");

const widthInput =
    document.getElementById("widthInput");

const heightInput =
    document.getElementById("heightInput");

const drillSize =
    document.getElementById("drillSize");

const generateButton =
    document.getElementById("generateButton");

const previewContainer =
    document.getElementById("previewContainer");

const columnsCount =
    document.getElementById("columnsCount");

const rowsCount =
    document.getElementById("rowsCount");

const totalCrystals =
    document.getElementById("totalCrystals");

const colorKey =
    document.getElementById("colorKey");


// ==================================================
// APPLICATION STATE
// ==================================================

const state = {

    image: null,

    imageURL: null,

    imageWidth: 0,

    imageHeight: 0,

    canvasWidthCm: 30,

    canvasHeightCm: 40,

    drillSizeMm: 2.5,

    columns: 0,

    rows: 0,

    totalCells: 0,

    grid: [],

    colorsUsed: new Map()

};


// ==================================================
// CONSTANTS
// ==================================================

const MM_PER_CM = 10;


// ==================================================
// IMAGE UPLOAD
// ==================================================

imageInput.addEventListener(
    "change",
    handleImageUpload
);


function handleImageUpload(event) {

    const file =
        event.target.files[0];

    if (!file) {
        return;
    }


    if (!file.type.startsWith("image/")) {

        alert(
            "Please choose a valid image file."
        );

        imageInput.value = "";

        return;
    }


    if (state.imageURL) {

        URL.revokeObjectURL(
            state.imageURL
        );
    }


    const url =
        URL.createObjectURL(file);

    state.imageURL = url;


    const image =
        new Image();


    image.onload = function () {

        state.image = image;

        state.imageWidth =
            image.naturalWidth;

        state.imageHeight =
            image.naturalHeight;


        fileName.textContent =
            `${file.name} — ` +
            `${state.imageWidth} × ` +
            `${state.imageHeight}px`;


        showImagePreview();

        calculateGrid();
    };


    image.onerror = function () {

        alert(
            "The image could not be loaded."
        );

        URL.revokeObjectURL(url);

        state.imageURL = null;

        state.image = null;
    };


    image.src = url;
}


// ==================================================
// ORIGINAL IMAGE PREVIEW
// ==================================================

function showImagePreview() {

    if (!state.image) {
        return;
    }


    previewContainer.innerHTML = "";


    const image =
        document.createElement("img");


    image.src =
        state.imageURL;

    image.alt =
        "Uploaded image preview";


    previewContainer.appendChild(
        image
    );
}


// ==================================================
// INPUTS
// ==================================================

widthInput.addEventListener(
    "input",
    calculateGrid
);


heightInput.addEventListener(
    "input",
    calculateGrid
);


drillSize.addEventListener(
    "change",
    calculateGrid
);


// ==================================================
// GRID CALCULATION
// ==================================================

function calculateGrid() {

    const widthCm =
        Number(widthInput.value);

    const heightCm =
        Number(heightInput.value);

    const drillMm =
        Number(drillSize.value);


    if (
        !Number.isFinite(widthCm) ||
        !Number.isFinite(heightCm) ||
        widthCm <= 0 ||
        heightCm <= 0
    ) {

        resetStats();

        return;
    }


    if (
        !Number.isFinite(drillMm) ||
        drillMm <= 0
    ) {

        resetStats();

        return;
    }


    state.canvasWidthCm =
        widthCm;

    state.canvasHeightCm =
        heightCm;

    state.drillSizeMm =
        drillMm;


    const widthMm =
        widthCm * MM_PER_CM;

    const heightMm =
        heightCm * MM_PER_CM;


    state.columns =
        Math.max(
            1,
            Math.round(
                widthMm / drillMm
            )
        );


    state.rows =
        Math.max(
            1,
            Math.round(
                heightMm / drillMm
            )
        );


    state.totalCells =
        state.columns *
        state.rows;


    updateStats();
}


// ==================================================
// STATS
// ==================================================

function updateStats() {

    columnsCount.textContent =
        formatNumber(
            state.columns
        );

    rowsCount.textContent =
        formatNumber(
            state.rows
        );

    totalCrystals.textContent =
        formatNumber(
            state.totalCells
        );
}


function resetStats() {

    state.columns = 0;

    state.rows = 0;

    state.totalCells = 0;

    updateStats();
}


// ==================================================
// NUMBER FORMAT
// ==================================================

function formatNumber(value) {

    return Number(value)
        .toLocaleString("en-US");
}


// ==================================================
// RGB → HEX
// ==================================================

function rgbToHex(r, g, b) {

    return (
        "#" +
        [r, g, b]
            .map(value =>
                Math
                    .max(0, Math.min(255, value))
                    .toString(16)
                    .padStart(2, "0")
            )
            .join("")
            .toUpperCase()
    );
}


// ==================================================
// HEX → RGB
// ==================================================

function hexToRgb(hex) {

    const clean =
        hex
            .replace("#", "")
            .trim();


    if (clean.length !== 6) {

        throw new Error(
            `Invalid HEX color: ${hex}`
        );
    }


    return {

        r: parseInt(
            clean.substring(0, 2),
            16
        ),

        g: parseInt(
            clean.substring(2, 4),
            16
        ),

        b: parseInt(
            clean.substring(4, 6),
            16
        )
    };
}


// ==================================================
// COLOR DISTANCE
// ==================================================

function colorDistance(
    r1,
    g1,
    b1,
    r2,
    g2,
    b2
) {

    const red =
        r1 - r2;

    const green =
        g1 - g2;

    const blue =
        b1 - b2;


    /*
     * Weighted RGB distance.
     *
     * Human vision is more sensitive
     * to green than blue.
     */

    return (
        0.299 * red * red +
        0.587 * green * green +
        0.114 * blue * blue
    );
}


// ==================================================
// FIND CLOSEST CRYSTAL COLOR
// ==================================================

function findClosestCrystal(
    r,
    g,
    b
) {

    let closest =
        null;

    let smallestDistance =
        Infinity;


    for (
        const color
        of CRYSTAL_PALETTE
    ) {

        const rgb =
            hexToRgb(
                color.hex
            );


        const distance =
            colorDistance(
                r,
                g,
                b,
                rgb.r,
                rgb.g,
                rgb.b
            );


        if (
            distance <
            smallestDistance
        ) {

            smallestDistance =
                distance;

            closest =
                color;
        }
    }


    return closest;
}


// ==================================================
// CREATE ANALYSIS CANVAS
// ==================================================

function createAnalysisCanvas() {

    if (!state.image) {
        return null;
    }


    const canvas =
        document.createElement("canvas");


    canvas.width =
        state.columns;

    canvas.height =
        state.rows;


    const ctx =
        canvas.getContext(
            "2d",
            {
                willReadFrequently: true
            }
        );


    /*
     * IMPORTANT:
     *
     * We draw the complete source image
     * directly into the exact number of
     * crystal cells.
     *
     * This means:
     *
     * 30 × 40 cm
     *
     * with 2.5 mm crystals
     *
     * becomes approximately:
     *
     * 120 × 160 cells.
     */


    ctx.drawImage(
        state.image,

        0,
        0,
        state.columns,
        state.rows
    );


    return canvas;
}


// ==================================================
// ANALYZE IMAGE
// ==================================================

function analyzeImage() {

    if (!state.image) {

        throw new Error(
            "No image loaded."
        );
    }


    if (
        state.columns <= 0 ||
        state.rows <= 0
    ) {

        throw new Error(
            "Invalid grid dimensions."
        );
    }


    const canvas =
        createAnalysisCanvas();


    if (!canvas) {

        throw new Error(
            "Could not create analysis canvas."
        );
    }


    const ctx =
        canvas.getContext(
            "2d",
            {
                willReadFrequently: true
            }
        );


    const imageData =
        ctx.getImageData(
            0,
            0,
            state.columns,
            state.rows
        );


    const pixels =
        imageData.data;


    const grid =
        new Array(
            state.rows
        );


    const colorsUsed =
        new Map();


    for (
        let y = 0;
        y < state.rows;
        y++
    ) {

        grid[y] =
            new Array(
                state.columns
            );


        for (
            let x = 0;
            x < state.columns;
            x++
        ) {

            const index =
                (
                    y *
                    state.columns +
                    x
                ) * 4;


            const r =
                pixels[index];

            const g =
                pixels[index + 1];

            const b =
                pixels[index + 2];


            const crystal =
                findClosestCrystal(
                    r,
                    g,
                    b
                );


            grid[y][x] =
                crystal;


            if (
                colorsUsed.has(
                    crystal.code
                )
            ) {

                colorsUsed.get(
                    crystal.code
                ).quantity++;

            } else {

                colorsUsed.set(
                    crystal.code,
                    {
                        code:
                            crystal.code,

                        name:
                            crystal.name,

                        hex:
                            crystal.hex,

                        quantity: 1
                    }
                );
            }
        }
    }


    state.grid =
        grid;

    state.colorsUsed =
        colorsUsed;


    return grid;
}


// ==================================================
// COLOR KEY
// ==================================================

function renderColorKey() {

    if (
        !state.colorsUsed ||
        state.colorsUsed.size === 0
    ) {

        colorKey.textContent =
            "No colors generated.";

        return;
    }


    const colors =
        Array.from(
            state.colorsUsed.values()
        );


    colors.sort(
        (a, b) =>
            b.quantity -
            a.quantity
    );


    const table =
        document.createElement(
            "table"
        );


    table.className =
        "color-table";


    table.innerHTML = `
        <thead>
            <tr>
                <th>DMC Code</th>
                <th>Color</th>
                <th>HEX</th>
                <th>Quantity</th>
            </tr>
        </thead>
    `;


    const tbody =
        document.createElement(
            "tbody"
        );


    for (
        const color
        of colors
    ) {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `
            <td>
                <strong>
                    ${escapeHtml(color.code)}
                </strong>
            </td>

            <td>
                ${escapeHtml(color.name)}
            </td>

            <td>
                ${escapeHtml(color.hex)}
            </td>

            <td>
                ${formatNumber(color.quantity)}
            </td>
        `;


        tbody.appendChild(
            row
        );
    }


    table.appendChild(
        tbody
    );


    colorKey.innerHTML =
        "";


    colorKey.appendChild(
        table
    );
}


// ==================================================
// HTML ESCAPE
// ==================================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ==================================================
// GENERATE
// ==================================================

generateButton.addEventListener(
    "click",
    handleGenerate
);


function handleGenerate() {

    if (!state.image) {

        alert(
            "Please upload an image first."
        );

        return;
    }


    try {

        generateButton.disabled =
            true;

        generateButton.textContent =
            "Processing...";


        calculateGrid();


        /*
         * Safety limit.
         *
         * We do NOT want the browser
         * freezing because somebody enters
         * an absurd canvas size.
         */

        const MAX_CELLS =
            2000000;


        if (
            state.totalCells >
            MAX_CELLS
        ) {

            throw new Error(
                "The selected canvas is too large. " +
                "Please choose a smaller size."
            );
        }


        analyzeImage