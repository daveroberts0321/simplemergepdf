<!-- success/+page.svelte: shown after 3D Secure redirect — lets user re-upload and merge for free -->
<script lang="ts">
	import { countPagesPerFile, mergePdfs, MAX_TOTAL_PAGES, MAX_TOTAL_SIZE } from '$lib/merge-pdfs';
	import { convertImageToPdf } from '$lib/convert-image-to-pdf';

	let { data } = $props();

	// File upload state
	let files: File[] = $state([]);
	let converting = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();

	// Stats
	let filePageCounts: number[] = $state([]);
	let totalPages: number = $state(0);
	let totalFileSize: number = $state(0);
	let countingPages: boolean = $state(false);

	// Merge state
	let merging: boolean = $state(false);
	let mergedPdfUrl: string = $state('');
	let mergeComplete: boolean = $state(false);
	let formError = $state('');

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	async function updateStats() {
		if (files.length === 0) {
			filePageCounts = [];
			totalPages = 0;
			totalFileSize = 0;
			return;
		}
		countingPages = true;
		totalFileSize = files.reduce((sum, f) => sum + f.size, 0);
		try {
			filePageCounts = await countPagesPerFile(files);
			totalPages = filePageCounts.reduce((sum, c) => sum + c, 0);
			if (totalPages > MAX_TOTAL_PAGES) {
				formError = `Total page count (${totalPages}) exceeds the maximum of ${MAX_TOTAL_PAGES} pages.`;
			} else if (formError.includes('exceeds the maximum')) {
				formError = '';
			}
		} catch {
			formError = 'Failed to count pages. Please check your PDFs.';
		} finally {
			countingPages = false;
		}
	}

	async function handleFiles(fileList: FileList | File[] | null) {
		if (!fileList || fileList.length === 0) return;
		converting = true;
		try {
			const incoming = Array.from(fileList);
			const processed: File[] = [];
			for (const file of incoming) {
				if (file.type.startsWith('image/')) {
					const pdf = await convertImageToPdf(file);
					processed.push(pdf);
				} else {
					processed.push(file);
				}
			}
			files = [...files, ...processed];
			const newTotalSize = files.reduce((sum, f) => sum + f.size, 0);
			if (newTotalSize > MAX_TOTAL_SIZE) {
				formError = `Total file size (${formatFileSize(newTotalSize)}) exceeds the 100 MB limit.`;
			} else if (formError.includes('100 MB limit')) {
				formError = '';
			}
		} finally {
			converting = false;
		}
		await updateStats();
	}

	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
		updateStats();
	}

	async function handleMerge() {
		formError = '';
		if (files.length < 2) { formError = 'Please upload at least two PDF files.'; return; }
		if (totalPages > MAX_TOTAL_PAGES) {
			formError = `Page limit exceeded (${totalPages} / ${MAX_TOTAL_PAGES}).`;
			return;
		}
		if (totalFileSize > MAX_TOTAL_SIZE) {
			formError = `Size limit exceeded (${formatFileSize(totalFileSize)} / 100 MB).`;
			return;
		}

		merging = true;
		try {
			const mergedBlob = await mergePdfs(files);
			mergedPdfUrl = URL.createObjectURL(mergedBlob);
			mergeComplete = true;
		} catch {
			formError = 'PDF merge failed. Please check your files and try again.';
		} finally {
			merging = false;
		}
	}

	function downloadMergedPdf() {
		if (!mergedPdfUrl) return;
		const a = document.createElement('a');
		a.href = mergedPdfUrl;
		a.download = 'merged.pdf';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
</script>

<svelte:head>
	<title>Payment Confirmed - SimpleMergePDF</title>
</svelte:head>

<div class="min-h-[calc(100vh-10rem)] bg-slate-50 px-4 py-16">
	<div class="mx-auto max-w-2xl">
		<!-- Payment confirmation banner -->
		<div class="mb-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-10">
			<div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
				<svg class="h-10 w-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			</div>
			<h1 class="mb-4 text-3xl font-bold text-purple-700">Payment Confirmed!</h1>
			<p class="mb-2 text-base leading-relaxed text-slate-600">
				Your payment was successful. Upload your files below to merge and download.
			</p>
			<p class="text-sm text-slate-500">
				A receipt was sent to <span class="font-semibold text-slate-800">{data.senderEmail}</span>.
			</p>
		</div>

		<!-- Merge UI -->
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
			<h2 class="mb-6 text-center text-2xl font-bold tracking-tight text-slate-900">Merge & Download</h2>

			{#if formError}
				<div class="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
					<svg class="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<span>{formError}</span>
				</div>
			{/if}

			{#if mergeComplete}
				<div class="text-center">
					<div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
						<svg class="h-10 w-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h3 class="mb-2 text-xl font-bold text-slate-900">Your PDF is Ready!</h3>
					<p class="mb-8 text-sm text-slate-500">
						{files.length} file{files.length === 1 ? '' : 's'} merged ({totalPages} pages).
					</p>
					<button
						onclick={downloadMergedPdf}
						class="w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-500 hover:shadow-xl active:scale-[0.98]"
					>
						<span class="inline-flex items-center gap-2">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
							</svg>
							Download Merged PDF
						</span>
					</button>
					<a href="/" class="mt-4 block text-sm text-slate-500 transition hover:text-purple-600">
						Back to Home
					</a>
				</div>
			{:else if merging}
				<div class="py-12 text-center">
					<svg class="mx-auto mb-4 h-12 w-12 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
					<h3 class="mb-2 text-lg font-semibold text-slate-900">Merging Your PDFs...</h3>
					<p class="text-sm text-slate-500">This may take a moment.</p>
				</div>
			{:else}
				<!-- Dropzone -->
				<div class="mb-6">
					<label for="success-file-upload" class="mb-2 block text-sm font-semibold text-slate-700">
						Upload PDF Files <span class="font-normal text-slate-400">(2 or more)</span>
					</label>
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
						<p class="mt-1 text-xs text-slate-400">PDF files, up to {MAX_TOTAL_PAGES} pages &amp; 100 MB total.</p>
						<input
							bind:this={fileInput}
							id="success-file-upload"
							type="file"
							class="hidden"
							accept=".pdf"
							multiple
							onchange={(e: Event & { currentTarget: HTMLInputElement }) => handleFiles(e.currentTarget.files)}
						/>
					</div>

					{#if converting}
						<div class="mt-3 flex items-center gap-2 text-sm text-purple-600">
							<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							Processing files...
						</div>
					{/if}

					{#if countingPages}
						<div class="mt-3 flex items-center gap-2 text-sm text-purple-600">
							<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							Counting pages...
						</div>
					{/if}

					{#if files.length > 0}
						<ul class="mt-3 space-y-2">
							{#each files as file, index (index)}
								<li class="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm">
									<span class="truncate text-slate-700">{file.name}</span>
									<span class="ml-2 flex shrink-0 items-center gap-3">
										<span class="text-xs text-slate-400">
											{formatFileSize(file.size)}{#if filePageCounts[index] != null} &middot; {filePageCounts[index]} pg{filePageCounts[index] === 1 ? '' : 's'}{/if}
										</span>
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
									</span>
								</li>
							{/each}
						</ul>
					{/if}

					{#if files.length > 0}
						<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
							<span><span class="font-semibold text-slate-800">{files.length}</span> file{files.length === 1 ? '' : 's'}</span>
							<span class="text-slate-300">|</span>
							<span><span class="font-semibold text-slate-800">{totalPages}</span> / {MAX_TOTAL_PAGES} pages</span>
							<span class="text-slate-300">|</span>
							<span><span class="font-semibold text-slate-800">{formatFileSize(totalFileSize)}</span> / 100 MB</span>
						</div>
					{/if}

					{#if totalPages > MAX_TOTAL_PAGES}
						<div class="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
							<svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
							<span>Page limit exceeded: {totalPages} / {MAX_TOTAL_PAGES} pages.</span>
						</div>
					{/if}

					{#if totalFileSize > MAX_TOTAL_SIZE}
						<div class="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
							<svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
							<span>Size limit exceeded: {formatFileSize(totalFileSize)} / 100 MB.</span>
						</div>
					{/if}
				</div>

				<button
					onclick={handleMerge}
					disabled={files.length < 2 || totalPages > MAX_TOTAL_PAGES || totalFileSize > MAX_TOTAL_SIZE || countingPages}
					class="w-full rounded-xl bg-purple-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-purple-500 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
				>
					Merge & Download
				</button>

				<div class="mt-6 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800">
					<div class="flex items-start gap-3">
						<svg class="mt-0.5 h-5 w-5 shrink-0 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span class="text-left">Your payment covers this merge. If you experience any issues, contact support for a full refund.</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
