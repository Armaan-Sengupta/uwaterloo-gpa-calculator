/**
 * Reads the text out of a PDF in the browser with pdf.js.
 * Quest transcripts are "locked" with an owner password that only forbids copying; pdf.js opens them
 * anyway, so the file never leaves the user's device. If a PDF needs a password to open, we ask for it.
 */
import * as pdfjsLib from "pdfjs-dist";
import { itemsToLines } from "./textLines";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.js", import.meta.url).toString();

export class PdfPasswordCancelled extends Error {}

/**
 * Extracts the text of a PDF file
 * @param {File} file The PDF chosen by the user
 * @returns {Promise<{text: string, wasRestricted: boolean}>} The text, and whether the PDF had copy restrictions
 */
export async function extractPdfText(file){
    const data = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjsLib.getDocument({ data });
    loadingTask.onPassword = (updatePassword, reason) => {
        const message = reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD
            ? "Incorrect password. Enter the password for this PDF:"
            : "This PDF needs a password to open. Enter it:";
        const password = window.prompt(message);
        if (password === null){
            loadingTask.destroy();
            return;
        }
        updatePassword(password);
    };

    let pdf;
    try {
        pdf = await loadingTask.promise;
    } catch (err){
        if (loadingTask.destroyed) throw new PdfPasswordCancelled("A password is needed to open this PDF.");
        throw err;
    }

    // getPermissions() is null when the PDF has no usage restrictions
    const wasRestricted = (await pdf.getPermissions()) !== null;
    const lines = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++){
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        lines.push(...itemsToLines(content.items));
    }
    await pdf.destroy();
    return { text: lines.join("\n"), wasRestricted };
}
