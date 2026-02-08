import { env } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
import Stripe from 'stripe';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const paymentIntentId = url.searchParams.get('payment_intent');

	if (!paymentIntentId) {
		redirect(303, '/');
	}

	const stripe = new Stripe(env.STRIPE_SK!);
	const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

	if (paymentIntent.status !== 'succeeded') {
		error(400, 'Payment was not completed successfully.');
	}

	return {
		senderEmail: paymentIntent.metadata.senderEmail,
		fileCount: paymentIntent.metadata.fileCount,
		totalPages: paymentIntent.metadata.totalPages
	};
};
