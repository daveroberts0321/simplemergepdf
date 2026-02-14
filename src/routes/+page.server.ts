// +page.server.ts: loads Stripe public key and price from STRIPE_PRICE_ID for display
import { env } from '$env/dynamic/private';
import Stripe from 'stripe';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const stripePk = env.STRIPE_PK || '';
	let priceDisplay = '$3.99';

	if (env.STRIPE_PRICE_ID && env.STRIPE_SK) {
		try {
			const stripe = new Stripe(env.STRIPE_SK);
			const price = await stripe.prices.retrieve(env.STRIPE_PRICE_ID);
			const amount = price.unit_amount ?? 399;
			priceDisplay = `$${(amount / 100).toFixed(2)}`;
		} catch {
			// Fallback to default if Stripe fetch fails
		}
	}

	return { stripePk, priceDisplay };
};
