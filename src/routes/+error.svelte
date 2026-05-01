<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="min-h-[70vh] flex items-center justify-center px-4">
	<div class="text-center">
		<p class="font-anton text-primary text-8xl mb-4">{$page.status}</p>
		<h1 class="font-anton text-3xl text-ink mb-2">{$page.error?.message ?? 'Something went wrong'}</h1>
		<p class="font-sora text-muted text-sm mb-8">
			{$page.status === 404
				? "We couldn't find what you were looking for."
				: 'An unexpected error occurred.'}
		</p>
		<a href="/" class="btn-primary inline-block py-3 px-8">Back to Home</a>
	</div>
</div>
