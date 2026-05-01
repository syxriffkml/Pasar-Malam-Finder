<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} — Pasar Malam Finder</title>
</svelte:head>

<div class="min-h-[80vh] flex items-center justify-center px-4">
	<div class="text-center max-w-sm">
		<p class="font-anton text-primary" style="font-size: clamp(80px, 20vw, 140px); line-height: 1;">
			{page.status}
		</p>
		<h1 class="font-anton text-2xl text-ink mb-3 tracking-tight">
			{page.status === 404 ? 'Page not found' : (page.error?.message ?? 'Something went wrong')}
		</h1>
		<p class="font-sora text-muted text-sm mb-8 leading-relaxed">
			{page.status === 404
				? "That page doesn't exist — the market may have moved, or the link is broken."
				: 'An unexpected error occurred. Try refreshing the page.'}
		</p>
		<div class="flex flex-col sm:flex-row gap-3 justify-center">
			<a href="/" class="btn-primary inline-block py-3 px-8">Back to Home</a>
			<a href="/explore" class="btn-secondary inline-block py-3 px-8">Explore Markets</a>
		</div>
	</div>
</div>
