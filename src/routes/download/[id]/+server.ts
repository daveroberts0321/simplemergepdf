// download/[id]: streams merged PDF from R2 for emailed download link
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const bucket = platform?.env?.MERGED_PDFS;
	if (!bucket) {
		error(503, 'Storage not configured');
	}

	const id = params.id;
	if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
		error(400, 'Invalid download ID');
	}

	const key = `merged/${id}.pdf`;
	const obj = await bucket.get(key);

	if (!obj) {
		error(404, 'Download link expired or not found');
	}

	// Stream the PDF to the response
	const headers = new Headers();
	obj.writeHttpMetadata(headers);
	headers.set('Content-Disposition', 'attachment; filename="merged.pdf"');

	return new Response(obj.body, {
		headers,
		status: 200
	});
};
