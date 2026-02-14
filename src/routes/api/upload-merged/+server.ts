// upload-merged: receives merged PDF from client, stores in R2, sends email with download link
import { env } from '$env/dynamic/private';
import { json, error } from '@sveltejs/kit';
import Stripe from 'stripe';
import { sendConfirmationEmail } from '$lib/email';
import type { RequestHandler } from './$types';

const MAX_UPLOAD_SIZE = 100 * 1024 * 1024; // 100 MB

export const POST: RequestHandler = async ({ request, platform }) => {
	const bucket = platform?.env?.MERGED_PDFS;
	if (!bucket) {
		error(503, 'Storage not configured');
	}

	const contentType = request.headers.get('content-type') || '';
	if (!contentType.includes('multipart/form-data')) {
		error(400, 'Expected multipart/form-data');
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const paymentIntentId = formData.get('paymentIntentId') as string | null;
	const senderEmail = formData.get('senderEmail') as string | null;

	if (!file || !paymentIntentId || !senderEmail?.trim()) {
		error(400, 'Missing file, paymentIntentId, or senderEmail');
	}

	if (file.size > MAX_UPLOAD_SIZE) {
		error(400, 'File too large (max 100 MB)');
	}

	if (file.type !== 'application/pdf') {
		error(400, 'File must be a PDF');
	}

	// Verify payment succeeded with Stripe
	const stripe = new Stripe(env.STRIPE_SK!);
	const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
	if (paymentIntent.status !== 'succeeded') {
		error(400, 'Payment not completed');
	}

	// Generate unique key for R2
	const id = crypto.randomUUID();
	const key = `merged/${id}.pdf`;

	// Stream upload to R2 (avoids loading full file into memory)
	const arrayBuffer = await file.arrayBuffer();
	await bucket.put(key, arrayBuffer, {
		httpMetadata: {
			contentType: 'application/pdf',
			contentDisposition: 'attachment; filename="merged.pdf"'
		},
		customMetadata: {
			uploadedAt: new Date().toISOString(),
			senderEmail: senderEmail.trim()
		}
	});

	// Build download URL (use request origin for local dev, env for prod)
	const origin = env.SITE_URL || new URL(request.url).origin;
	const downloadUrl = `${origin}/download/${id}`;

	// Format price from PaymentIntent amount (cents)
	const priceDisplay = `$${(paymentIntent.amount / 100).toFixed(2)}`;

	// Send confirmation email with download link (don't await - fire and forget)
	sendConfirmationEmail(senderEmail.trim(), downloadUrl, priceDisplay).catch((err) =>
		console.error('[UPLOAD] Email failed:', err)
	);

	return json({ downloadId: id, downloadUrl });
};
