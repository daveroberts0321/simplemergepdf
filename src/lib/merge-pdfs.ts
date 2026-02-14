import { PDFDocument } from 'pdf-lib';

export const MAX_TOTAL_PAGES = 500;
export const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100 MB

/** Count pages for each PDF file, returns an array of per-file page counts */
export async function countPagesPerFile(files: File[]): Promise<number[]> {
	const counts: number[] = [];
	for (const file of files) {
		const bytes = await file.arrayBuffer();
		const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
		counts.push(pdf.getPageCount());
	}
	return counts;
}

/** Merge multiple PDF files into a single PDF, returns a Blob */
export async function mergePdfs(files: File[]): Promise<Blob> {
	const merged = await PDFDocument.create();

	for (const file of files) {
		const bytes = await file.arrayBuffer();
		const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
		const pages = await merged.copyPages(pdf, pdf.getPageIndices());
		for (const page of pages) {
			merged.addPage(page);
		}
	}

	const mergedBytes = await merged.save();
	return new Blob([mergedBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
}
