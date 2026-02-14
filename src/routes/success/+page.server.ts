import { env } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
import Stripe from 'stripe';
import { sendConfirmationEmail } from '$lib/email';
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

	// Fire-and-forget email — don't block page load
	const senderEmail = paymentIntent.metadata.senderEmail;
	if (senderEmail) {
		sendConfirmationEmail(senderEmail).catch(() => {});
	}

	return {
		paymentIntentId,
		senderEmail,
		fileCount: paymentIntent.metadata.fileCount,
		totalPages: paymentIntent.metadata.totalPages
	};
};
