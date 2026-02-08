import { jsPDF } from 'jspdf';

/**
 * Converts an image file (JPG/PNG) to a single-page PDF sized to US Letter.
 * The image is scaled to fit within the page margins while preserving aspect ratio.
 */
export async function convertImageToPdf(file: File): Promise<File> {
	const imageData = await readFileAsDataURL(file);
	const dimensions = await getImageDimensions(imageData);

	const pdf = new jsPDF({ orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait', unit: 'pt', format: 'letter' });

	const pageWidth = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();

	// 36pt (0.5in) margins
	const margin = 36;
	const maxWidth = pageWidth - margin * 2;
	const maxHeight = pageHeight - margin * 2;

	const scale = Math.min(maxWidth / dimensions.width, maxHeight / dimensions.height, 1);
	const scaledWidth = dimensions.width * scale;
	const scaledHeight = dimensions.height * scale;

	// Center the image on the page
	const x = (pageWidth - scaledWidth) / 2;
	const y = (pageHeight - scaledHeight) / 2;

	const format = file.type === 'image/png' ? 'PNG' : 'JPEG';
	pdf.addImage(imageData, format, x, y, scaledWidth, scaledHeight);

	const blob = pdf.output('blob');
	const pdfName = file.name.replace(/\.(jpe?g|png)$/i, '.pdf');
	return new File([blob], pdfName, { type: 'application/pdf' });
}

function readFileAsDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = dataUrl;
	});
}
