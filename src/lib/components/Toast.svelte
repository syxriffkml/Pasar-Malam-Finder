<script lang="ts">
	import { toastStore } from '$lib/stores';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
</script>

<div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none" aria-live="polite">
	{#each $toastStore as toast (toast.id)}
		<div
			in:fly={{ y: 20, duration: 250 }}
			out:fly={{ y: 20, duration: 200 }}
			animate:flip={{ duration: 200 }}
			class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border border-border min-w-[260px] max-w-xs
			{toast.type === 'success'
				? 'bg-surface'
				: toast.type === 'error'
					? 'bg-[#fff5f3] border-red-border'
					: 'bg-surface'}"
		>
			{#if toast.type === 'success'}
				<span
					class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0"
				>
					<svg class="w-3.5 h-3.5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						/>
					</svg>
				</span>
			{:else if toast.type === 'error'}
				<span class="w-6 h-6 rounded-full bg-red-tint flex items-center justify-center shrink-0">
					<svg class="w-3.5 h-3.5 text-primary" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						/>
					</svg>
				</span>
			{:else}
				<span
					class="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0"
				>
					<svg class="w-3.5 h-3.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						/>
					</svg>
				</span>
			{/if}
			<p
				class="font-sora text-sm text-ink leading-snug"
			>
				{toast.message}
			</p>
		</div>
	{/each}
</div>
