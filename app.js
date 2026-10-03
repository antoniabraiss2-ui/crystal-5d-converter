// ==========================================
// CRYSTAL 5D CONVERTER
// Main Application Logic
// ==========================================

"use strict";


// ==========================================
// DOM ELEMENTS
// ==========================================

const imageInput = document.getElementById("imageInput");

const fileName = document.getElementById("fileName");

const widthInput = document.getElementById("widthInput");

const heightInput = document.getElementById("heightInput");

const drillSize = document.getElementById("drillSize");

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


// ==========================================
// APPLICATION STATE
// ==========================================

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

    totalCells: 0

};


// ==========================================
// CONSTANTS
// ==========================================

// 2.5 mm crystal means approximately
// 4 crystals per centimeter.

const MILLIMETERS_PER_CENTIMETER = 10;


// ==========================================
// IMAGE UPLOAD
// ==========================================

imageInput.addEventListener(
    "change",
    handleImageUpload
);


function handleImageUpload(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }


    // Check that the file is actually an image.

    if (!file.type.startsWith("image/")) {

        alert(
            "Please choose a valid image file."
        );

        imageInput.value = "";

        return;
    }


    // Remove previous object URL.

    if (state.imageURL) {

        URL.revokeObjectURL(
            state.imageURL
        );
    }


    // Create a temporary URL.

    const imageURL =
        URL.createObjectURL(file);


    state.imageURL = imageURL;


    // Create image object.

    const image = new Image();


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


        // Show image preview.

        showImagePreview();


        // Calculate initial grid.

        calculateGrid();
    };


    image.onerror = function () {

        alert(
            "The image could not be loaded."
        );

        URL.revokeObjectURL(imageURL);

        state.imageURL = null;

        state.image = null;
    };


    image.src = imageURL;
}


// ==========================================
// SHOW IMAGE PREVIEW
// ==========================================

function showImagePreview() {

    if (!state.image) {
        return;
    }


    previewContainer.innerHTML = "";


    const previewImage =
        document.createElement("img");


    previewImage.src =
        state.imageURL;


    previewImage.alt =
        "Uploaded image preview";


    previewContainer.appendChild(
        previewImage
    );
}


// ==========================================
// INPUT LISTENERS
// ==========================================

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


// ==========================================
// CALCULATE GRID
// ==========================================

function calculateGrid() {

    const widthCm =
        Number(widthInput.value);

    const heightCm =
        Number(heightInput.value);

    const drillSizeMm =
        Number(drillSize.value);


    // Validate dimensions.

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
        !Number.isFinite(drillSizeMm) ||
        drillSizeMm <= 0
    ) {

        resetStats();

        return;
    }


    state.canvasWidthCm =
        widthCm;

    state.canvasHeightCm =
        heightCm;

    state.drillSizeMm =
        drillSizeMm;


    // Convert centimeters to millimeters.

    const widthMm =
        widthCm *
        MILLIMETERS_PER_CENTIMETER;


    const heightMm =
        heightCm *
        MILLIMETERS_PER_CENTIMETER;


    // Calculate number of crystals.

    const columns =
        Math.round(
            widthMm /
            drillSizeMm
        );


    const rows =
        Math.round(
            heightMm /
            drillSizeMm
        );


    state.columns =
        Math.max(1, columns);


    state.rows =
        Math.max(1, rows);


    state.totalCells =
        state.columns *
        state.rows;


    updateStats();
}


// ==========================================
// UPDATE STATISTICS
// ==========================================

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


// ==========================================
// RESET STATISTICS
// ==========================================

function resetStats() {

    state.columns = 0;

    state.rows = 0;

    state.totalCells = 0;

    updateStats();
}


// ==========================================
// NUMBER FORMATTER
// ==========================================

function formatNumber(number) {

    return Number(number)
        .toLocaleString("en-US");
}


// ==========================================
// GENERATE BUTTON
// ==========================================

generateButton.addEventListener(
    "click",
    generateCanvas
);


function generateCanvas() {

    if (!state.image) {

        alert(
            "Please upload an image first."
        );

        return;
    }


    calculateGrid();


    console.log(
        "Crystal Canvas:",
        {
            widthCm:
                state.canvasWidthCm,

            heightCm:
                state.canvasHeightCm,

            drillSizeMm:
                state.drillSizeMm,

            columns:
                state.columns,

            rows:
                state.rows,

            totalCells:
                state.totalCells
        }
    );


    alert(
        `Canvas calculated successfully!\n\n` +

        `Size: ` +
        `${state.canvasWidthCm} × ` +
        `${state.canvasHeightCm} cm\n` +

        `Grid: ` +
        `${state.columns} × ` +
        `${state.rows}\n\n` +

        `Total crystals: ` +
        `${formatNumber(state.totalCells)}`
    );
}


// ==========================================
// INITIAL CALCULATION
// ==========================================

calculateGrid();