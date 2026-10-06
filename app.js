"use strict";

/*
====================================================
CRYSTAL 5D CONVERTER
Image analysis + DMC color matching
====================================================
*/

// ==================================================
// DOM ELEMENTS
// ==================================================

const imageInput = document.getElementById("imageInput");
const fileName = document.getElementById("fileName");
const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const drillSize = document.getElementById("drillSize");
const generateButton = document.getElementById("generateButton");
const previewContainer = document.getElementById("previewContainer");
const columnsCount = document.getElementById("columnsCount");
const rowsCount = document.getElementById("rowsCount");
const totalCrystals = document.getElementById("totalCrystals");
const colorKey = document.getElementById("colorKey");

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

if (imageInput) {
    imageInput.addEventListener("change", handleImageUpload);
}

function handleImageUpload(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please choose a valid image file.");
        imageInput.value = "";
        return;
    }

    // تنظيف الرابط السابق لمنع استهلاك الذاكرة
    if (state.imageURL) {
        URL.revokeObjectURL(state.imageURL);
    }

    const url = URL.createObjectURL(file);
    state.imageURL = url;

    const image = new Image();

    image.onload = function () {
        state.image = image;
        state.imageWidth = image.naturalWidth;
        state.imageHeight = image.naturalHeight;

        if (fileName) {
            fileName.textContent = `${file.name} — ${state.imageWidth} × ${state.imageHeight}px`;
        }

        showImagePreview();
        calculateGrid();
    };

    image.onerror = function () {
        alert("The image could not be loaded.");
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
    if (!state.image || !previewContainer) {
        return;
    }

    previewContainer.innerHTML = "";

    const image = document.createElement("img");
    image.src = state.imageURL;
    image.alt = "Uploaded image preview";
    image.style.maxWidth = "100%";
    image.style.height = "auto";
    image.style.borderRadius = "8px";

    previewContainer.appendChild(image);
}

// ==================================================
// INPUT LISTENERS
// ==================================================

if (widthInput) widthInput.addEventListener("input", calculateGrid);
if (heightInput) heightInput.addEventListener("input", calculateGrid);
if (drillSize) drillSize.addEventListener("change", calculateGrid);

// ==================================================
// GRID CALCULATION
// =
