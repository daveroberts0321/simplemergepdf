<!-- +page.svelte: main landing page with hero, how-it-works, PDF merge form, Stripe checkout, benefits, pricing, and FAQ -->
<script lang="ts">
	// Imports for file conversion, Stripe checkout, and Svelte lifecycle
	import { convertImageToPdf } from '$lib/convert-image-to-pdf';
	import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';
	import { tick } from 'svelte';

	// data.stripePk comes from +page.server.ts load function
	let { data }: { data: { stripePk: string } } = $props();

	// Form state
	let files: File[] = $state([]);
	let converting = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();
	let senderEmail = $state('');

	// Payment flow state
	let showPayment = $state(false);
	let processing = $state(false);
	let formError = $state('');
	let stripe: Stripe | null = $state(null);
	let elements: StripeElements | null = $state(null);
	let paymentElementContainer: HTMLDivElement | undefined = $state();

	// handleFiles: accepts a FileList or File array, converts images to PDF, appends to files state
	async function handleFiles(fileList: FileList | File[] | null) {
		if (!fileList || fileList.length === 0) return;

		converting = true;
		try {
			const incoming = Array.from(fileList);
			const processed: File[] = [];

			for (const file of incoming) {
				// Convert image files (JPG/PNG) to PDF format
				if (file.type.startsWith('image/')) {
					const pdf = await convertImageToPdf(file);
					processed.push(pdf);
				} else {
					processed.push(file);
				}
			}

			files = [...files, ...processed];
		} finally {
			converting = false;
		}
	}

	// removeFile: removes a file from the upload list by index
	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
	}

	// continueToPayment: validates form, creates PaymentIntent, mounts Stripe Payment Element
	async function continueToPayment() {
		formError = '';

		// Validate all required fields before proceeding
		if (files.length < 2) { formError = 'Please upload at least two PDF files to merge.'; return; }
		if (!senderEmail.trim()) { formError = 'Please enter your email address.'; return; }

		processing = true;
		try {
			// Call API to create a Stripe PaymentIntent with merge metadata
			const res = await fetch('/api/create-payment-intent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					senderEmail: senderEmail.trim(),
					fileCount: files.length
				})
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: 'Failed to create payment.' }));
				formError = err.message || 'Failed to create payment. Please try again.';
				return;
			}

			const { clientSecret } = await res.json();

			// Load Stripe.js with public key from server
			stripe = await loadStripe(data.stripePk);
			if (!stripe) { formError = 'Failed to load payment processor.'; return; }

			// Create Stripe Elements and mount the Payment Element
			elements = stripe.elements({
				clientSecret,
				appearance: {
					theme: 'stripe',
					variables: { colorPrimary: '#9333ea', borderRadius: '8px' }
				}
			});
			const paymentElement = elements.create('payment');

			// Show the payment section then mount after DOM updates
			showPayment = true;
			await tick();
			if (paymentElementContainer) paymentElement.mount(paymentElementContainer);
		} catch {
			formError = 'Something went wrong. Please try again.';
		} finally {
			processing = false;
		}
	}

	// handlePayment: confirms the payment with Stripe and redirects to success page on completion
	async function handlePayment() {
		if (!stripe || !elements) return;

		processing = true;
		formError = '';

		// confirmPayment redirects to return_url on success; only returns here on error
		const { error } = await stripe.confirmPayment({
			elements,
			confirmParams: {
				return_url: `${window.location.origin}/success`
			}
		});

		if (error) {
			formError = error.message || 'Payment failed. Please try again.';
		}
		processing = false;
	}

	// goBack: resets payment state so user can edit form fields
	function goBack() {
		showPayment = false;
		elements = null;
		stripe = null;
		formError = '';
	}

</script>

<svelte:head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>SimpleMergePDF - Merge PDF Files Without Subscription or Tracking</title>
	<meta name="description" content="Merge unlimited PDF files for $2.99. No subscription, no account, no tracking. Files deleted immediately after processing." />
</svelte:head>

<!-- Hero section -->
<section class="relative overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-violet-800 px-4 py-20 text-white sm:py-28">
	<!-- Decorative gradient blob -->
	<div class="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-3xl"></div>
	<div class="pointer-events-none absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-3xl"></div>

	<div class="relative mx-auto max-w-4xl text-center">
		<span class="mb-4 inline-block rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-200">
			No account required
		</span>
		<h1 class="mb-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
			Merge PDFs.<br class="hidden sm:block" /> No Subscription.
		</h1>
		<p class="mx-auto mb-3 max-w-xl text-lg text-purple-200 sm:text-xl">
			Just <span class="font-bold text-white">$2.99</span> per merge
		</p>
		<p class="mx-auto mb-10 max-w-lg text-base text-purple-300">
			Upload your PDFs, pay, download. Files are deleted immediately after processing.
		</p>
		<a
			href="#merge-pdf"
			class="inline-block rounded-xl bg-white px-8 py-4 text-lg font-bold text-purple-900 shadow-xl transition hover:bg-purple-50 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
		>
			Merge PDFs Now
		</a>

		<!-- Trust indicators -->
		<div class="mt-10 flex flex-col items-center justify-center gap-3 text-sm text-purple-200 sm:flex-row sm:gap-6">
			<span class="flex items-center gap-2">
				<svg class="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
				Files deleted after processing
			</span>
			<span class="flex items-center gap-2">
				<svg class="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
				No data stored
			</span>
			<span class="flex items-center gap-2">
				<svg class="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
				HTTPS encrypted
			</span>
            <br> <!-- Line 2 -->
            <span class="flex items-center gap-2">
				<svg class="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
				Unlimited files
			</span>
			<span class="flex items-center gap-2">
				<svg class="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
				No Subscription Required
			</span>
			<span class="flex items-center gap-2">
				<svg class="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
				No Marketing Emails or Tracking
			</span>
            <span class="flex items-center gap-2"></span>
		</div>
	</div>
</section>

<!-- How it works section -->
<section class="bg-white px-4 py-20">
	<div class="mx-auto max-w-5xl">
		<h2 class="mb-14 text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">How It Works</h2>
		<div class="grid gap-10 md:grid-cols-3">
			<!-- Step 1 -->
			<div class="text-center">
				<div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700">1</div>
				<h3 class="mb-2 text-lg font-semibold text-slate-900">Upload Your PDFs</h3>
				<p class="text-sm leading-relaxed text-slate-500">Upload 2 or more PDF files. They'll be merged in the order you upload them.</p>
			</div>
			<!-- Step 2 -->
			<div class="text-center">
				<div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700">2</div>
				<h3 class="mb-2 text-lg font-semibold text-slate-900">Pay $2.99</h3>
				<p class="text-sm leading-relaxed text-slate-500">Secure one-time payment. No subscription or hidden fees.</p>
			</div>
			<!-- Step 3 -->
			<div class="text-center">
				<div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700">3</div>
				<h3 class="mb-2 text-lg font-semibold text-slate-900">Download Merged PDF</h3>
				<p class="text-sm leading-relaxed text-slate-500">Get your merged PDF instantly. Files are deleted after download.</p>
			</div>
		</div>
	</div>
</section>

<!-- Merge PDF form section -->
<section id="merge-pdf" class="scroll-mt-20 bg-slate-50 px-4 py-20">
	<div class="mx-auto max-w-2xl">
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
			<h2 class="mb-8 text-center text-2xl font-bold tracking-tight text-slate-900">Merge Your PDFs</h2>

			<!-- Error message banner -->
			{#if formError}
				<div class="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
					<svg class="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<span>{formError}</span>
				</div>
			{/if}

			{#if !showPayment}
				<!-- File upload dropzone -->
				<div class="mb-8">
					<label for="file-upload" class="mb-2 block text-sm font-semibold text-slate-700">Upload PDF Files (2 or more)</label>
					<div
						class="group cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center transition hover:border-purple-400 hover:bg-purple-50/30"
						role="button"
						tabindex="0"
				onclick={() => fileInput?.click()}
					onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput?.click(); } }}
						ondragover={(e: DragEvent) => e.preventDefault()}
						ondrop={(e: DragEvent) => { e.preventDefault(); handleFiles(e.dataTransfer?.files ?? null); }}
					>
						<svg class="mx-auto mb-3 h-10 w-10 text-slate-400 transition group-hover:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
						</svg>
						<p class="font-medium text-slate-700">Click to upload or drag and drop</p>
						<p class="mt-1 text-xs text-slate-400">PDF files only. Upload 2 or more files to merge.</p>
						<input
							bind:this={fileInput}
							id="file-upload"
							type="file"
							class="hidden"
							accept=".pdf"
							multiple
							onchange={(e: Event & { currentTarget: HTMLInputElement }) => handleFiles(e.currentTarget.files)}
						/>
					</div>

					<!-- Converting spinner -->
					{#if converting}
						<div class="mt-3 flex items-center gap-2 text-sm text-purple-600">
							<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							Processing files...
						</div>
					{/if}

					<!-- Uploaded file list -->
					{#if files.length > 0}
						<ul class="mt-3 space-y-2">
							{#each files as file, index (index)}
								<li class="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm">
									<span class="truncate text-slate-700">{file.name}</span>
									<button
										type="button"
										class="ml-3 shrink-0 text-slate-400 transition hover:text-red-500"
										onclick={() => removeFile(index)}
										aria-label="Remove {file.name}"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</li>
							{/each}
						</ul>
					{/if}

					<p class="mt-3 text-xs text-slate-500">
						<span class="font-medium">{files.length}</span> file{files.length === 1 ? '' : 's'} selected. Files will be merged in the order shown.
					</p>
				</div>

				<!-- Sender email input -->
				<div class="mb-8">
					<label for="sender-email" class="mb-2 block text-sm font-semibold text-slate-700">Your Email</label>
					<input
						id="sender-email"
						type="email"
						bind:value={senderEmail}
						placeholder="you@example.com"
						class="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
					/>
					<p class="mt-1.5 text-xs text-slate-400">Only used for download confirmation. Not stored.</p>
				</div>

				<!-- Price display -->
				<div class="mb-8 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-slate-700">Total:</span>
						<span class="text-2xl font-bold text-indigo-700">$2.99</span>
					</div>
					<p class="mt-1 text-xs text-slate-500">One-time payment. No subscription.</p>
				</div>

				<!-- Continue to payment button: validates form and creates PaymentIntent -->
				<button
					onclick={continueToPayment}
					disabled={processing}
					class="w-full rounded-xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-indigo-500 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if processing}
						<span class="inline-flex items-center gap-2">
							<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							Preparing payment...
						</span>
					{:else}
						Continue to Payment
					{/if}
				</button>

				<p class="mt-4 text-center text-xs text-slate-400">
					By proceeding, you agree that your files will be deleted immediately after download. Secure payment powered by Stripe.
				</p>

			{:else}
				<!-- Payment step: shows order summary and Stripe Payment Element -->

				<!-- Order summary -->
				<div class="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-slate-500">Files to merge:</span>
						<span class="font-medium text-slate-900">{files.length} PDF{files.length === 1 ? '' : 's'}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-500">Email:</span>
						<span class="font-medium text-slate-900">{senderEmail}</span>
					</div>
				</div>

				<!-- Price display -->
				<div class="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-slate-700">Total:</span>
						<span class="text-2xl font-bold text-indigo-700">$2.99</span>
					</div>
				</div>

				<!-- Stripe Payment Element mounts here -->
				<div class="mb-6">
					<div bind:this={paymentElementContainer}></div>
				</div>

				<!-- Pay button: confirms payment with Stripe -->
				<button
					onclick={handlePayment}
					disabled={processing}
					class="w-full rounded-xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-indigo-500 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if processing}
						<span class="inline-flex items-center gap-2">
							<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							Processing payment...
						</span>
						{:else}
						Pay $2.99
					{/if}
				</button>

				<!-- Back link to edit form details -->
				<button
					onclick={goBack}
					class="mt-4 w-full text-center text-sm text-slate-500 transition hover:text-indigo-600"
				>
					&larr; Back to edit details
				</button>
			{/if}
		</div>
	</div>
</section>

<!-- Why SimpleMergePDF benefits section -->
<section class="bg-white px-4 py-20">
	<div class="mx-auto max-w-5xl">
		<h2 class="mb-14 text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Why SimpleMergePDF?</h2>
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<!-- Benefit: No Subscription -->
			<div class="rounded-xl border border-slate-100 bg-slate-50/50 p-6 transition hover:shadow-md">
				<div class="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
				</div>
				<h3 class="mb-1 font-semibold text-slate-900">No Subscription</h3>
				<p class="text-sm leading-relaxed text-slate-500">One-time payment of $2.99. No recurring charges, no auto-renewal.</p>
			</div>
			<!-- Benefit: Complete Privacy -->
			<div class="rounded-xl border border-slate-100 bg-slate-50/50 p-6 transition hover:shadow-md">
				<div class="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
				</div>
				<h3 class="mb-1 font-semibold text-slate-900">Complete Privacy</h3>
				<p class="text-sm leading-relaxed text-slate-500">Files deleted immediately after processing. Zero tracking, zero data retention.</p>
			</div>
			<!-- Benefit: Unlimited Files -->
			<div class="rounded-xl border border-slate-100 bg-slate-50/50 p-6 transition hover:shadow-md">
				<div class="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
				</div>
				<h3 class="mb-1 font-semibold text-slate-900">Unlimited Files</h3>
				<p class="text-sm leading-relaxed text-slate-500">Merge as many PDFs as you need. No page limits or file restrictions.</p>
			</div>
			<!-- Benefit: Works Instantly -->
			<div class="rounded-xl border border-slate-100 bg-slate-50/50 p-6 transition hover:shadow-md">
				<div class="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
				</div>
				<h3 class="mb-1 font-semibold text-slate-900">Works Instantly</h3>
				<p class="text-sm leading-relaxed text-slate-500">No account creation. No verification emails. Upload, pay, download.</p>
			</div>
			<!-- Benefit: Secure & Encrypted -->
			<div class="rounded-xl border border-slate-100 bg-slate-50/50 p-6 transition hover:shadow-md">
				<div class="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
				</div>
				<h3 class="mb-1 font-semibold text-slate-900">Secure & Encrypted</h3>
				<p class="text-sm leading-relaxed text-slate-500">HTTPS throughout. Secure payment processing via Stripe.</p>
			</div>
			<!-- Benefit: Transparent Pricing -->
			<div class="rounded-xl border border-slate-100 bg-slate-50/50 p-6 transition hover:shadow-md">
				<div class="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				</div>
				<h3 class="mb-1 font-semibold text-slate-900">Transparent Pricing</h3>
				<p class="text-sm leading-relaxed text-slate-500">$2.99 flat. No hidden fees, no surprise charges.</p>
			</div>
		</div>
	</div>
</section>

<!-- Pricing section -->
<section class="bg-slate-50 px-4 py-20">
	<div class="mx-auto max-w-lg text-center">
		<h2 class="mb-8 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Simple, Honest Pricing</h2>
		<div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl sm:p-12">
			<div class="mb-2 text-5xl font-extrabold text-indigo-600">$2.99</div>
			<p class="mb-8 text-lg text-slate-500">per merge operation</p>
			<ul class="mb-8 space-y-3 text-left text-sm">
				{#each ['Unlimited PDF files per merge', 'No subscription or monthly fees', 'Files deleted after download', 'No watermarks or branding', 'Full refund if merge fails'] as item}
					<li class="flex items-start gap-2.5">
						<svg class="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
						<span class="text-slate-600">{item}</span>
					</li>
				{/each}
			</ul>
			<p class="text-sm font-medium text-slate-500">That's it. No hidden fees. No surprises.</p>
		</div>
	</div>
</section>

<!-- FAQ section -->
<section class="bg-white px-4 py-20">
	<div class="mx-auto max-w-3xl">
		<h2 class="mb-14 text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Frequently Asked Questions</h2>
		<div class="divide-y divide-slate-200">
			{#each [
				{ q: 'How does the PDF merge work?', a: 'Upload 2 or more PDF files and they will be combined into a single PDF in the order you upload them. The merged PDF is available for immediate download after payment.' },
				{ q: 'Is there a limit on file size or number of files?', a: 'No limits! Merge as many PDF files as you need, regardless of size. The only requirement is that you upload at least 2 PDFs.' },
				{ q: 'What if the merge fails?', a: "Full refund, no questions asked. We'll process it automatically within 24 hours if the merge operation fails." },
				{ q: 'Do you really delete my files?', a: 'Yes. Your files are deleted from our servers immediately after you download the merged PDF. No backups, no archives, no data retention.' },
				{ q: 'Can I rearrange the order of my PDFs?', a: 'Yes, the PDFs will be merged in the order they appear in your upload list. You can remove and re-upload files to change the order before payment.' },
				{ q: 'Do I need to create an account?', a: 'No. No account, no login, no password. Just upload, pay, and download.' },
				{ q: 'What format is the merged file?', a: 'The output is a standard PDF file that works with all PDF readers and editors.' },
				{ q: 'Can I merge the same files multiple times?', a: 'Each merge operation costs $2.99. If you need to merge the same files again, simply make another transaction.' }
			] as faq}
				<div class="py-5">
					<h3 class="mb-1.5 text-base font-semibold text-slate-900">{faq.q}</h3>
					<p class="text-sm leading-relaxed text-slate-500">{faq.a}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Final CTA section -->
<section class="bg-gradient-to-br from-indigo-950 to-indigo-800 px-4 py-20 text-white">
	<div class="mx-auto max-w-3xl text-center">
		<h2 class="mb-4 text-3xl font-bold sm:text-4xl">Ready to Merge Your PDFs?</h2>
		<p class="mb-10 text-lg text-indigo-200">No account. No subscription. No tracking. Just $2.99.</p>
		<a
			href="#merge-pdf"
			class="inline-block rounded-xl bg-white px-8 py-4 text-lg font-bold text-indigo-900 shadow-xl transition hover:bg-indigo-50 hover:shadow-2xl"
		>
			Merge PDFs Now
		</a>
	</div>
</section>

<!-- Sticky mobile CTA bar -->
<div class="fixed inset-x-0 bottom-0 z-50 border-t border-indigo-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm md:hidden">
	<a href="#merge-pdf" class="block w-full rounded-lg bg-indigo-600 py-3 text-center font-bold text-white transition hover:bg-indigo-500">
		Merge PDFs - $2.99
	</a>
</div>
