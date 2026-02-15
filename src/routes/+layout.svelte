<!-- Root layout: provides global header, footer, and base styles -->
<script lang="ts">
	import './layout.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<!-- Header nav with logo and CTA -->
<header class="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-lg">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
		<a href="/" class="flex items-center">
			<img src="/logo.png" alt="SimpleMergePDF Logo" class="h-12" />
		</a>
		<nav class="flex items-center gap-6">
			<a href="/#merge-pdf" class="rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
				Merge PDFs
			</a>
		</nav>
	</div>
</header>

<!-- Page content -->
<main>
	{@render children()}
</main>

<!-- Global footer -->
<footer class="border-t border-slate-200 bg-slate-900 text-slate-400">
	<div class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
		<div class="mb-8 grid gap-8 md:grid-cols-3">
			<!-- Brand -->
			<div>
				<img src="/logo.png" alt="SimpleMergePDF Logo" class="mb-3 h-16" />
				<p class="text-sm leading-relaxed">Merge PDFs without the hassle. No subscription, no tracking, no BS.</p>
			</div>
			
			<!-- Contact -->
			<div>
				<h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Contact</h3>
				<a href="mailto:support@simplemergepdf.com" class="text-sm transition hover:text-white">support@simplemergepdf.com</a>
				<p class="text-sm leading-relaxed">a SimpleSaas, LLC company <br>Dyersburg TN 38024</p>
			</div>
			<!-- Legal links -->
			<div>
				<h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Legal</h3>
				<ul class="space-y-2 text-sm">
					<li><a href="/privacy-policy" class="transition hover:text-white">Privacy Policy</a></li>
					<li><a href="/terms-of-service" class="transition hover:text-white">Terms of Service</a></li>
					<li><a href="/refund-policy" class="transition hover:text-white">Refund Policy</a></li>
					<li><a href="/other-services" class="transition hover:text-white">Other SimpleSaaS Services</a></li>
				</ul>
			</div>
		</div>
		<div class="border-t border-slate-800 pt-8 text-center text-xs">
			<p>&copy; {new Date().getFullYear()} SimpleMergePDF. Secure payments powered by <a href="https://stripe.com" class="text-purple-400 transition hover:text-purple-300">Stripe</a>.</p>
			<p class="mt-1">Files are deleted immediately after processing. We store no personal data.</p>
		</div>
	</div>
</footer>
<a href="/other-services" class="text-sm transition hover:text-white">Other SimpleSaaS Services</a>