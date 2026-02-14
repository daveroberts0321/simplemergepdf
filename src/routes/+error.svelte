<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Page Not Found' : 'Error'} - SimpleMergePDF</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-slate-50 px-4 py-16">
	<div class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-10">
		<div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
			{#if page.status === 404}
				<span class="text-3xl font-bold text-purple-600">404</span>
			{:else}
				<svg class="h-10 w-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
			{/if}
		</div>

		<h1 class="mb-4 text-3xl font-bold text-slate-900">
			{#if page.status === 404}
				Page Not Found
			{:else}
				Something Went Wrong
			{/if}
		</h1>

		<p class="mb-8 text-base leading-relaxed text-slate-600">
			{#if page.status === 404}
				The page you're looking for doesn't exist or has been moved.
			{:else}
				{page.error?.message || 'An unexpected error occurred. Please try again.'}
			{/if}
		</p>

		<a
			href="/"
			class="inline-block rounded-xl bg-purple-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-purple-500 hover:shadow-xl"
		>
			Back to Home
		</a>
	</div>
</div>
