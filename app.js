"use strict";

/*
====================================================
CRYSTAL 5D CONVERTER
Optimized Async Conversion for Mobile
====================================================
*/

// ==================================================
// DOM
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
// SYMBOLS PALETTE FOR CANVAS
// ==================================================

const SYMBOLS_LIST = [
    "A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", 
    "N", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "@", "#", "$", "%", "&", "*", "+", "=", "?", "!", "♦", "♠", "♣", "♥"
];

// Cache to speed up color distance lookups
const colorMatchCache = new Map();

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

const MM_PER_CM = 10;

// ==================================================
// IMAGE UPLOAD
// ==================================================

if (imageInput) {
    imageInput.addEventListener("change", handleImageUpload);
}

function handleImageUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please choose a valid image file.");
        imageInput.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        const url = e.target.result;
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
            state.imageURL = null;
            state.image = null;
        };

        image.src = url;
    };

    reader.readAsDataURL(file);
}

// ==================================================
// PREVIEW & INPUTS
// ==================================================

function showImagePreview() {
    if (!state.image || !previewContainer) return;

    previewContainer.innerHTML = "";

    const image = document.createElement("img");
    image.src = state.imageURL;
    image.alt = "Uploaded image preview";
    image.style.maxWidth = "100%";
    image.style.height = "auto";
    image.style.borderRadius = "8px";

    previewContainer.appendChild(image);
}

if (widthInput) widthInput.addEventListener("input", calculateGrid);
if (heightInput) heightInput.addEventListener("input", calculateGrid);
if (drillSize) drillSize.addEventListener("change", calculateGrid);

function calculateGrid() {
    if (!widthInput || !heightInput || !drillSize) return;

    const widthCm = Number(widthInput.value);
    const heightCm = Number(heightInput.value);
    const drillMm = Number(drillSize.value);

    if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm) || widthCm <= 0 || heightCm <= 0) {
        resetStats();
        return;
    }

    if (!Number.isFinite(drillMm) || drillMm <= 0) {
        resetStats();
        return;
    }

    state.canvasWidthCm = widthCm;
    state.canvasHeightCm = heightCm;
    state.drillSizeMm = drillMm;

    const widthMm = widthCm * MM_PER_CM;
    const heightMm = heightCm * MM_PER_CM;

    state.columns = Math.max(1, Math.round(widthMm / drillMm));
    state.rows = Math.max(1, Math.round(heightMm / drillMm));
    state.totalCells = state.columns * state.rows;

    updateStats();
}

function updateStats() {
    if (columnsCount) columnsCount.textContent = formatNumber(state.columns);
    if (rowsCount) rowsCount.textContent = formatNumber(state.rows);
    if (totalCrystals) totalCrystals.textContent = formatNumber(state.totalCells);
}

function resetStats() {
    state.columns = 0;
    state.rows = 0;
    state.totalCells = 0;
    updateStats();
}

function formatNumber(value) {
    return Number(value).toLocaleString("en-US");
}

function hexToRgb(hex) {
    const clean = hex.replace("#", "").trim();
    return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16)
    };
}

function findClosestCrystal(r, g, b) {
    const cacheKey = `${r},${g},${b}`;
    if (colorMatchCache.has(cacheKey)) {
        return colorMatchCache.get(cacheKey);
    }

    if (typeof CRYSTAL_PALETTE === "undefined") {
        throw new Error("CRYSTAL_PALETTE is not defined. Check palette.js");
    }

    let closest = null;
    let smallestDistance = Infinity;

    for (let i = 0; i < CRYSTAL_PALETTE.length; i++) {
        const color = CRYSTAL_PALETTE[i];
        const rgb = hexToRgb(color.hex);
        const red = r - rgb.r;
        const green = g - rgb.g;
        const blue = b - rgb.b;
        const distance = 0.299 * red * red + 0.587 * green * green + 0.114 * blue * blue;

        if (distance < smallestDistance) {
            smallestDistance = distance;
            closest = color;
        }
    }

    colorMatchCache.set(cacheKey, closest);
    return closest;
}

function getTextColorForBackground(hex) {
    const rgb = hexToRgb(hex);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#FFFFFF";
}

// ==================================================
// FAST ASYNC IMAGE ANALYSIS
// ==================================================

async function analyzeImageAsync() {
    const canvas = document.createElement("canvas");
    canvas.width = state.columns;
    canvas.height = state.rows;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(state.image, 0, 0, state.columns, state.rows);

    const imageData = ctx.getImageData(0, 0, state.columns, state.rows);
    const pixels = imageData.data;

    const grid = new Array(state.rows);
    const colorsUsed = new Map();
    let symbolIndex = 0;

    for (let y = 0; y < state.rows; y++) {
        grid[y] = new Array(state.columns);

        for (let x = 0; x < state.columns; x++) {
            const index = (y * state.columns + x) * 4;
            const r = pixels[index];
            const g = pixels[index + 1];
            const b = pixels[index + 2];

            const crystal = findClosestCrystal(r, g, b);

            if (!colorsUsed.has(crystal.code)) {
                const assignedSymbol = SYMBOLS_LIST[symbolIndex % SYMBOLS_LIST.length];
                symbolIndex++;

                colorsUsed.set(crystal.code, {
                    code: crystal.code,
                    name: crystal.name,
                    hex: crystal.hex,
                    symbol: assignedSymbol,
                    quantity: 1
                });
            } else {
                colorsUsed.get(crystal.code).quantity++;
            }

            const colorData = colorsUsed.get(crystal.code);
            grid[y][x] = {
                ...crystal,
                symbol: colorData.symbol
            };
        }

        // تحرير معالج الموبايل كل 20 سطر لمنع تجميد الشاشة
        if (y % 20 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    state.grid = grid;
    state.colorsUsed = colorsUsed;
}

// ==================================================
// RENDER CANVAS
// ==================================================

function renderCrystalCanvas() {
    if (!state.grid || state.grid.length === 0 || !previewContainer) return;

    previewContainer.innerHTML = "";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const cellSize = 14; 

    canvas.width = state.columns * cellSize;
    canvas.height = state.rows * cellSize;
    canvas.style.maxWidth = "100%";
    canvas.style.height = "auto";
    canvas.style.borderRadius = "8px";
    canvas.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";

    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let y = 0; y < state.rows; y++) {
        for (let x = 0; x < state.columns; x++) {
            const crystal = state.grid[y][x];

            ctx.fillStyle = crystal.hex;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

            ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

            ctx.fillStyle = getTextColorForBackground(crystal.hex);
            ctx.fillText(
                crystal.symbol,
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2 + 0.5
            );
        }
    }

    previewContainer.appendChild(canvas);
}

// ==================================================
// RENDER COLOR KEY
// ==================================================

function renderColorKey() {
    if (!colorKey) return;

    if (!state.colorsUsed || state.colorsUsed.size === 0) {
        colorKey.textContent = "No colors generated.";
        return;
    }

    const colors = Array.from(state.colorsUsed.values());
    colors.sort((a, b) => b.quantity - a.quantity);

    const table = document.createElement("table");
    table.className = "color-table";

    table.innerHTML = `
        <thead>
            <tr>
                <th>Symbol</th>
                <th>DMC Code</th>
                <th>Color Name</th>
                <th>HEX</th>
                <th>Quantity</th>
            </tr>
        </thead>
    `;

    const tbody = document.createElement("tbody");

    for (const color of colors) {
        const row = document.createElement("tr");
        const textColor = getTextColorForBackground(color.hex);

        row.innerHTML = `
            <td>
                <span style="display:inline-block; width:22px; height:22px; line-height:22px; background-color:${color.hex}; color:${textColor}; text-align:center; border-radius:4px; font-weight:bold; border:1px solid #ccc;">
                    ${escapeHtml(color.symbol)}
                </span>
            </td>
            <td><strong>${escapeHtml(color.code)}</strong></td>
            <td>${escapeHtml(color.name)}</td>
            <td>${escapeHtml(color.hex)}</td>
            <td>${formatNumber(color.quantity)}</td>
        `;

        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    colorKey.innerHTML = "";
    colorKey.appendChild(table);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ==================================================
// GENERATE BUTTON
// ==================================================

if (generateButton) {
    generateButton.addEventListener("click", handleGenerate);
}

async function handleGenerate() {
    if (!state.image) {
        alert("Please upload an image first.");
        return;
    }

    try {
        generateButton.disabled = true;
        generateButton.textContent = "Processing... Please wait";

        calculateGrid();

        // 1. تحويل الصورة بسرعة وبدون تجميد
        await analyzeImageAsync();

        // 2. رسم اللوحة والرموز
        renderCrystalCanvas();

        // 3. طباعة الجدول
        renderColorKey();

    } catch (error) {
        alert(error.message);
    } finally {
        generateButton.disabled = false;
        generateButton.textContent = "Generate Crystal Canvas";
    }
}
