import { env } from '$env/dynamic/private';
import Stripe from 'stripe';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const stripe = new Stripe(env.STRIPE_SK!);
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		error(400, 'Missing stripe-signature header');
	}

	let event: Stripe.Event;
	try {
		const body = await request.text();
		event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET!);
	} catch (err) {
		console.error('[WEBHOOK] Signature verification failed:', err);
		error(400, 'Invalid signature');
	}

	if (event.type === 'payment_intent.succeeded') {
		const paymentIntent = event.data.object as Stripe.PaymentIntent;
		console.log('[WEBHOOK] Payment succeeded:', {
			id: paymentIntent.id,
			amount: paymentIntent.amount,
			currency: paymentIntent.currency,
			email: paymentIntent.metadata.senderEmail
		});
	}

	return json({ received: true });
};
