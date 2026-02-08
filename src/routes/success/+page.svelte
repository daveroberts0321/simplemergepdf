<!-- success/+page.svelte: payment confirmation page shown after successful Stripe checkout -->
<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Payment Confirmed - SimpleMergePDF</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-slate-50 px-4 py-16">
	<div class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-10">
		<!-- Green checkmark icon -->
		<div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
			<svg class="h-10 w-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</div>

		<!-- Heading -->
		<h1 class="mb-4 text-3xl font-bold text-purple-700">Payment Confirmed!</h1>

		<!-- Confirmation details -->
		<p class="mb-6 text-base leading-relaxed text-slate-600">
			Your PDFs have been merged successfully.
			A download link has been sent to <span class="font-semibold text-slate-800">{data.senderEmail}</span>.
		</p>

		<!-- Privacy info box -->
		<div class="mb-8 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800">
			<div class="flex items-start gap-3">
				<svg class="mt-0.5 h-5 w-5 shrink-0 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span class="text-left">Your documents have been permanently deleted from our servers. We do not store any files or personal information.</span>
			</div>
		</div>

		<!-- Merge another PDF CTA -->
		<a
			href="/"
			class="inline-block rounded-xl bg-purple-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-purple-500 hover:shadow-xl"
		>
			Merge More PDFs
		</a>
	</div>
</div>
