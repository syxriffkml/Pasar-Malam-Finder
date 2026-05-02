<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { DAYS, STATES, getTodayName, isOpenToday } from '$lib/utils';
	import MarketCard from '$lib/components/MarketCard.svelte';
	import type { PageData } from './$types';
	import type { Market } from '$lib/types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let activeDay = $state('');
	let activeState = $state('');
	let highlightId: string | null = $state(null);
	let displayCount = $state(0);

	// Sync initial URL params into state
	$effect(() => {
		searchQuery = data.q ?? '';
		activeDay = data.day ?? '';
		activeState = data.state ?? '';
	});

	// Animate market count on data change
	$effect(() => {
		const target = data.markets.length;
		const proxy = { val: displayCount };
		gsap.to(proxy, {
			val: target,
			duration: 0.6,
			ease: 'power2.out',
			onUpdate() { displayCount = Math.round(proxy.val); }
		});
	});

	let mapLoaded = $state(false);

	// Leaflet map refs
	let mapContainer: HTMLDivElement;
	let mapInstance: ReturnType<typeof import('leaflet')['map']> | null = null;
	let markersMap = new Map<string, import('leaflet').Marker>();
	let L: typeof import('leaflet') | null = null;

	const today = getTodayName();

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchQuery.trim()) params.set('q', searchQuery.trim());
		if (activeDay) params.set('day', activeDay);
		if (activeState) params.set('state', activeState);
		goto(`/explore?${params.toString()}`, { replaceState: true });
	}

	function toggleDay(day: string) {
		activeDay = activeDay === day ? '' : day;
		applyFilters();
	}

	function handleStateChange(e: Event) {
		activeState = (e.target as HTMLSelectElement).value;
		applyFilters();
	}

	let searchTimeout: ReturnType<typeof setTimeout>;
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(applyFilters, 350);
	}

	function handleCardClick(market: Market) {
		highlightId = market.id;
		if (mapInstance && markersMap.has(market.id)) {
			mapInstance.panTo([market.lat, market.lng], { animate: true, duration: 0.5 });
			const marker = markersMap.get(market.id);
			marker?.openPopup();
			document.querySelectorAll('.map-pin').forEach((el) => el.classList.remove('active'));
			const pinEl = marker?.getElement()?.querySelector('.map-pin');
			pinEl?.classList.add('active');
		}
	}

	async function initMap() {
		if (!mapContainer || mapLoaded) return;
		const leaflet = await import('leaflet');
		await import('leaflet/dist/leaflet.css');
		L = leaflet.default ?? (leaflet as unknown as typeof import('leaflet'));

		mapInstance = L.map(mapContainer, {
			center: [3.139, 101.6869],
			zoom: 11,
			zoomControl: true
		});

		L.tileLayer(
			'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
			{
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				maxZoom: 19
			}
		).addTo(mapInstance);

		mapLoaded = true;
		setTimeout(() => mapInstance?.invalidateSize(), 100);
		updateMapMarkers(data.markets);
	}

	function updateMapMarkers(markets: Market[]) {
		if (!mapInstance || !L) return;

		markersMap.forEach((m) => m.remove());
		markersMap.clear();

		const pins: HTMLElement[] = [];

		markets.forEach((market) => {
			if (!market.lat || !market.lng || !L) return;

			const icon = L.divIcon({
				html: `<div class="map-pin" style="width:18px;height:18px;background:#e5311d;border-radius:50%;border:3px solid white;animation:map-pulse 2.2s ease-out infinite;"></div>`,
				className: '',
				iconSize: [18, 18],
				iconAnchor: [9, 9]
			});

			const marker = L.marker([market.lat, market.lng], { icon });
			marker.addTo(mapInstance!);
			marker.bindPopup(
				`<div style="font-family:'Sora',sans-serif;padding:4px 2px;">
					<div style="font-family:'Anton',sans-serif;font-size:15px;color:#1a1209;letter-spacing:0.03em;">${market.name}</div>
					<div style="font-size:12px;color:#8a7d65;margin-top:3px;">${market.area}, ${market.state}</div>
					<a href="/market/${market.id}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:#e5311d;text-decoration:none;">View details →</a>
				</div>`
			);
			marker.on('click', () => { highlightId = market.id; });
			markersMap.set(market.id, marker);

			const pinEl = marker.getElement()?.querySelector('.map-pin');
			if (pinEl) pins.push(pinEl as HTMLElement);
		});

		if (pins.length > 0) {
			gsap.from(pins, {
				y: -24,
				opacity: 0,
				stagger: 0.04,
				duration: 0.7,
				ease: 'bounce.out'
			});
		}
	}

	$effect(() => {
		if (mapLoaded && mapInstance) {
			updateMapMarkers(data.markets);
		}
	});

	// Re-animate cards when filter results change
	let prevMarketIds = '';
	$effect(() => {
		const ids = data.markets.map((m) => m.id).join(',');
		if (ids !== prevMarketIds) {
			prevMarketIds = ids;
			// Small delay so DOM updates first
			setTimeout(() => {
				const cards = document.querySelectorAll('.explore-card');
				if (cards.length > 0) {
					gsap.fromTo(cards,
						{ y: 20, opacity: 0 },
						{ y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'power2.out' }
					);
				}
			}, 30);
		}
	});

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);

		initMap();

		// Header word-by-word entrance
		const headWords = document.querySelectorAll('.explore-head-word');
		if (headWords.length) {
			gsap.from(headWords, {
				y: 48,
				opacity: 0,
				stagger: 0.08,
				duration: 0.7,
				ease: 'power3.out'
			});
		}

		// Eyebrow + subtitle
		gsap.from('.explore-eyebrow', {
			opacity: 0,
			y: 12,
			duration: 0.5,
			delay: 0.15,
			ease: 'power2.out'
		});
		gsap.from('.explore-subtitle', {
			opacity: 0,
			y: 14,
			duration: 0.55,
			delay: 0.25,
			ease: 'power2.out'
		});
		gsap.from('.explore-count-wrap', {
			opacity: 0,
			scale: 0.9,
			duration: 0.5,
			delay: 0.4,
			ease: 'back.out(2)'
		});

		// Left panel slide in
		gsap.from('.explore-filters', {
			x: -28,
			opacity: 0,
			duration: 0.6,
			delay: 0.35,
			ease: 'power3.out'
		});

		// Map panel
		gsap.from('.explore-map-panel', {
			x: 28,
			opacity: 0,
			duration: 0.6,
			delay: 0.45,
			ease: 'power3.out'
		});

		// Initial cards
		const cards = document.querySelectorAll('.explore-card');
		if (cards.length > 0) {
			gsap.from(cards, {
				y: 30,
				opacity: 0,
				stagger: 0.07,
				duration: 0.5,
				ease: 'power2.out',
				delay: 0.5
			});
		}
	});

	onDestroy(() => {
		mapInstance?.remove();
	});
</script>

<svelte:head>
	<title>Explore Pasar Malams — Pasar Malam Finder</title>
</svelte:head>

<!-- ── HERO HEADER ─────────────────────────────────────────── -->
<div class="bg-cream border-b border-border px-4 pt-12 pb-10 overflow-hidden">
	<div class="max-w-6xl mx-auto">

		<div class="explore-eyebrow eyebrow flex items-center gap-2 mb-4">
			<span class="blink-dot"></span>
			Pasar Malam Finder
		</div>

		<div class="overflow-hidden mb-3" style="line-height:1;">
			<h1 class="font-anton text-ink tracking-tight" style="font-size: clamp(52px, 8vw, 96px);">
				<span class="explore-head-word inline-block" style="margin-right: 0.18em;">EXPLORE</span><span
					class="explore-head-word serif-accent inline-block"
				>markets</span>
			</h1>
		</div>

		<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mt-4">
			<p class="explore-subtitle font-sora text-muted" style="font-size:15px;">
				Find night markets near you, tonight or any night.
			</p>

			<div class="explore-count-wrap flex items-center gap-2 shrink-0">
				<span
					class="font-anton text-primary"
					style="font-size: clamp(28px, 4vw, 36px); line-height:1;"
				>{displayCount}</span>
				<span class="font-sora text-muted text-sm leading-snug">
					market{displayCount !== 1 ? 's' : ''}<br>found
				</span>
			</div>
		</div>

	</div>
</div>

<!-- ── BODY ─────────────────────────────────────────────────── -->
<div class="max-w-6xl mx-auto px-4 py-6">
	<div class="flex flex-col lg:flex-row gap-6">

		<!-- ── LEFT PANEL ─────────────────────────────────────── -->
		<div class="explore-filters lg:w-[420px] shrink-0 flex flex-col gap-5">

			<!-- Search -->
			<div
				class="flex items-center bg-surface border-[1.5px] border-border rounded-xl h-11 px-3 gap-2 focus-within:border-primary transition-colors"
			>
				<svg class="w-4 h-4 text-muted shrink-0" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
				</svg>
				<input
					type="text"
					bind:value={searchQuery}
					oninput={handleSearchInput}
					placeholder="Name, area, state…"
					class="flex-1 bg-transparent text-ink placeholder:text-muted text-sm font-sora focus:outline-none"
				/>
				{#if searchQuery}
					<button
						aria-label="Clear search"
						onclick={() => { searchQuery = ''; applyFilters(); }}
						class="text-muted hover:text-ink transition-colors"
					>
						<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
						</svg>
					</button>
				{/if}
			</div>

			<!-- Day filter pills -->
			<div>
				<p class="eyebrow mb-3">Day</p>
				<div class="flex flex-wrap gap-2">
					{#each DAYS as day}
						<button
							onclick={() => toggleDay(day)}
							class="day-pill {activeDay === day ? 'active' : day === today ? 'has-markets' : ''}"
							onmouseenter={(e) => {
								if (activeDay !== day) gsap.to(e.currentTarget, { scale: 1.06, duration: 0.15, ease: 'power2.out' });
							}}
							onmouseleave={(e) => {
								gsap.to(e.currentTarget, { scale: 1, duration: 0.15, ease: 'power2.out' });
							}}
						>
							{day.slice(0, 3)}
						</button>
					{/each}
				</div>
			</div>

			<!-- State dropdown -->
			<div>
				<p class="eyebrow mb-3">State</p>
				<select
					value={activeState}
					onchange={handleStateChange}
					class="input-field appearance-none"
				>
					<option value="">All states</option>
					{#each STATES as s}
						<option value={s}>{s}</option>
					{/each}
				</select>
			</div>

			<!-- Divider -->
			{#if activeDay || activeState || searchQuery}
				<button
					onclick={() => {
						searchQuery = '';
						activeDay = '';
						activeState = '';
						goto('/explore', { replaceState: true });
					}}
					class="flex items-center gap-2 font-sora text-sm text-muted hover:text-primary transition-colors self-start"
				>
					<svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
					</svg>
					Clear all filters
				</button>
			{/if}

			<!-- Market cards list -->
			<div class="flex flex-col gap-3">
				{#if data.markets.length === 0}
					<div class="text-center py-14 bg-surface rounded-2xl border border-border">
						<p class="text-3xl mb-3">🔍</p>
						<p class="font-sora text-muted text-sm">No markets match your filters.</p>
					</div>
				{:else}
					{#each data.markets as market}
						<div
							class="explore-card cursor-pointer"
							onclick={() => handleCardClick(market)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && handleCardClick(market)}
							onmouseenter={(e) => {
								gsap.to(e.currentTarget, { y: -3, duration: 0.2, ease: 'power2.out' });
							}}
							onmouseleave={(e) => {
								gsap.to(e.currentTarget, { y: 0, duration: 0.2, ease: 'power2.out' });
							}}
						>
							<MarketCard {market} highlight={highlightId === market.id} />
						</div>
					{/each}
				{/if}
			</div>

		</div>

		<!-- ── MAP ──────────────────────────────────────────── -->
		<div class="explore-map-panel relative flex-1 min-h-[300px] sm:min-h-[460px] lg:min-h-0 lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)] rounded-2xl overflow-hidden border border-border">
			<div bind:this={mapContainer} class="w-full h-full min-h-[300px] sm:min-h-[460px]"></div>
			{#if !mapLoaded}
				<div class="absolute inset-0 bg-soft-surface flex items-center justify-center rounded-2xl">
					<div class="text-center">
						<div class="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
						<p class="font-sora text-sm text-muted">Loading map…</p>
					</div>
				</div>
			{/if}
		</div>

	</div>
</div>
