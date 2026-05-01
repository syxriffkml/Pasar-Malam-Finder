<script lang="ts">
	interface Props {
		value?: number;
		max?: number;
		interactive?: boolean;
		size?: 'sm' | 'md' | 'lg';
		onChange?: (val: number) => void;
	}

	let {
		value = 0,
		max = 5,
		interactive = false,
		size = 'md',
		onChange
	}: Props = $props();

	let hovered = $state(0);

	const sizeMap = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' };

	function handleClick(star: number) {
		if (interactive && onChange) onChange(star);
	}
</script>

<div class="flex items-center gap-0.5" role={interactive ? 'group' : undefined} aria-label="Rating">
	{#each Array.from({ length: max }, (_, i) => i + 1) as star}
		<button
			type="button"
			class="star-btn {interactive ? '' : 'cursor-default pointer-events-none'}"
			onclick={() => handleClick(star)}
			onmouseenter={() => { if (interactive) hovered = star; }}
			onmouseleave={() => { if (interactive) hovered = 0; }}
			aria-label="{star} star{star > 1 ? 's' : ''}"
		>
			<svg
				class="{sizeMap[size]} transition-colors"
				viewBox="0 0 20 20"
				fill={star <= (interactive ? hovered || value : value) ? '#e5311d' : 'none'}
				stroke={star <= (interactive ? hovered || value : value) ? '#e5311d' : '#d1c9b8'}
				stroke-width="1.5"
			>
				<path
					d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
				/>
			</svg>
		</button>
	{/each}
</div>
