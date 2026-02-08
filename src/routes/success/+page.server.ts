import { env } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
import Stripe from 'stripe';
import type { PageServerLoad } from './$types';
import { sendConfirmationEmail } from '$lib/email';

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

	// Send confirmation email to the customer
	const senderEmail = paymentIntent.metadata.senderEmail;
	const faxNumber = paymentIntent.metadata.faxNumber;
	const senderName = paymentIntent.metadata.senderName;

	// Send the confirmation email asynchronously (don't wait for it to avoid blocking)
	sendConfirmationEmail(senderEmail, faxNumber, senderName).catch((err) => {
		console.error('Failed to send confirmation email:', err);
		// Don't fail the page load if email fails
	});

	return {
		senderEmail: paymentIntent.metadata.senderEmail,
		faxNumber: paymentIntent.metadata.faxNumber
	};
};
