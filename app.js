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

        // 1. تحليل الصورة وتوليد شبكة الألوان
        analyzeImage();

        // 2. عرض جدول الألوان والأكواد المستعملة
        renderColorKey();

        alert("Processing completed successfully!");

    } catch (error) {

        alert(error.message);

    } finally {

        generateButton.disabled = false;

        generateButton.textContent = "Generate Grid";

    }
}
