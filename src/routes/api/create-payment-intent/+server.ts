import { env } from '$env/dynamic/private';
import Stripe from 'stripe';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	if (!body.senderEmail || !body.fileCount) {
		error(400, 'Missing required fields');
	}

	const stripe = new Stripe(env.STRIPE_SK!);

	const paymentIntent = await stripe.paymentIntents.create({
		amount: 299,
		currency: 'usd',
		metadata: {
			productId: env.PRODUCT_ID!,
			senderEmail: body.senderEmail,
			fileCount: String(body.fileCount),
			totalPages: String(body.totalPages || 0)
		}
	});

	return json({ clientSecret: paymentIntent.client_secret });
};
