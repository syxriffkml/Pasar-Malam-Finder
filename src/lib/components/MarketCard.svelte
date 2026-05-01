<script lang="ts">
	import type { Market } from '$lib/types';
	import { isOpenNow, formatTime, getCardBandColor } from '$lib/utils';

	interface Props {
		market: Market;
		class?: string;
		highlight?: boolean;
	}

	let { market, class: className = '', highlight = false }: Props = $props();

	const openNow = $derived(isOpenNow(market.operating_days, market.start_time, market.end_time));
	const bandColor = $derived(getCardBandColor(market.id));
</script>

<a
	href="/market/{market.id}"
	class="market-card block {highlight ? 'ring-2 ring-primary' : ''} {className}"
>
	<!-- Colored top band -->
	<div class="h-[3px]" style="background: {bandColor}"></div>

	<div class="p-4">
		<!-- Name + badges -->
		<div class="flex items-start justify-between gap-2 mb-2">
			<h3 class="font-anton text-ink text-lg leading-tight tracking-tight line-clamp-2">
				{market.name}
			</h3>
			<div class="flex flex-wrap gap-1 justify-end shrink-0 mt-0.5">
				{#if openNow}
					<span class="badge-open">Open now</span>
				{:else if market.is_verified}
					<span class="badge-verified">Verified</span>
				{:else}
					<span class="badge-pending">Unverified</span>
				{/if}
			</div>
		</div>

		<!-- Location -->
		<div class="flex items-center gap-1.5 text-muted text-sm font-sora mb-1">
			<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
				<path
					fill-rule="evenodd"
					d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
				/>
			</svg>
			<span class="truncate">{market.area}, {market.state}</span>
		</div>

		<!-- Days + hours -->
		<div class="flex items-center gap-3 text-xs font-sora text-muted">
			<span>{market.operating_days.join(', ')}</span>
			<span class="text-border">·</span>
			<span>{formatTime(market.start_time)} – {formatTime(market.end_time)}</span>
		</div>
	</div>
</a>
