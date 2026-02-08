import { env } from '$env/dynamic/private';
import Stripe from 'stripe';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	if (!body.faxNumber || !body.senderName || !body.senderEmail) {
		error(400, 'Missing required fields');
	}

	const stripe = new Stripe(env.STRIPE_SK!);

	const paymentIntent = await stripe.paymentIntents.create({
		amount: 399,
		currency: 'usd',
		metadata: {
			productId: env.PRODUCT_ID!,
			faxNumber: body.faxNumber,
			senderName: body.senderName,
			senderEmail: body.senderEmail
		}
	});

	return json({ clientSecret: paymentIntent.client_secret });
};
