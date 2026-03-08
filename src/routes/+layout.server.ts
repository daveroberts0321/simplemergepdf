import type { LayoutServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: LayoutServerLoad = async () => {
	const origin = env.ORIGIN ?? '';
	const host = origin.replace(/^https?:\/\//, '').split('/')[0] ?? '';
	const appId = host.split('.')[0] ?? '';
	const appName = appId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	return {
		posthogKey: env.POSTHOG_API_KEY ?? '',
		posthogHost: env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
		posthogAppId: appId,
		posthogAppName: appName,
		posthogAppUrl: origin
	};
};
