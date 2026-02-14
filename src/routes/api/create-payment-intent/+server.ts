import { env } from '$env/dynamic/private';
import Stripe from 'stripe';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	let body: { senderEmail?: string; fileCount?: number; totalPages?: number };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid request body');
	}

	if (!body.senderEmail || !body.fileCount) {
		error(400, 'Missing required fields');
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.senderEmail)) {
		error(400, 'Invalid email address');
	}

	const priceId = env.STRIPE_PRICE_ID;
	if (!priceId) {
		error(500, 'STRIPE_PRICE_ID not configured');
	}

	const stripe = new Stripe(env.STRIPE_SK!);

	// Fetch the canonical price from Stripe so the amount is never hardcoded
	const price = await stripe.prices.retrieve(priceId);
	if (!price.unit_amount) {
		error(500, 'Could not determine price');
	}

	const productId = typeof price.product === 'string' ? price.product : price.product?.id;

	const paymentIntent = await stripe.paymentIntents.create({
		amount: price.unit_amount,
		currency: price.currency,
		metadata: {
			productId: env.PRODUCT_ID || productId || '',
			priceId,
			senderEmail: body.senderEmail,
			fileCount: String(body.fileCount),
			totalPages: String(body.totalPages || 0)
		}
	});

	return json({ clientSecret: paymentIntent.client_secret });
};
