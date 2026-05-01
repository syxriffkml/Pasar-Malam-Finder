<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { gsap } from 'gsap';
	import { DAYS, STATES, getTodayName, isOpenToday } from '$lib/utils';
	import MarketCard from '$lib/components/MarketCard.svelte';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';
	import type { PageData } from './$types';
	import type { Market } from '$lib/types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let activeDay = $state('');
	let activeState = $state('');
	let highlightId: string | null = $state(null);

	// Sync initial URL params into state
	$effect(() => {
		searchQuery = data.q ?? '';
		activeDay = data.day ?? '';
		activeState = data.state ?? '';
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

	// Click a card → highlight + pan map to pin
	function handleCardClick(market: Market) {
		highlightId = market.id;
		if (mapInstance && markersMap.has(market.id)) {
			mapInstance.panTo([market.lat, market.lng], { animate: true, duration: 0.5 });
			const marker = markersMap.get(market.id);
			marker?.openPopup();
			// Animate the active pin
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

		// Clear existing
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
				`<div class="p-1">
					<p class="font-bold text-sm text-[#1a1209] mb-0.5">${market.name}</p>
					<p class="text-xs text-[#8a7d65]">${market.area}, ${market.state}</p>
					<a href="/market/${market.id}" class="text-xs text-[#e5311d] font-semibold mt-1 block">View details →</a>
				</div>`
			);
			marker.on('click', () => {
				highlightId = market.id;
			});
			markersMap.set(market.id, marker);

			const pinEl = marker.getElement()?.querySelector('.map-pin');
			if (pinEl) pins.push(pinEl as HTMLElement);
		});

		// Drop bounce animation for pins
		if (pins.length > 0) {
			gsap.from(pins, {
				y: -30,
				opacity: 0,
				stagger: 0.05,
				duration: 0.8,
				ease: 'bounce.out'
			});
		}
	}

	// Re-render map markers when data changes
	$effect(() => {
		if (mapLoaded && mapInstance) {
			updateMapMarkers(data.markets);
		}
	});

	// Pill active state animation
	$effect(() => {
		const activePill = document.querySelector('.day-pill.active');
		if (activePill) {
			gsap.from(activePill, {
				scale: 0.9,
				duration: 0.2,
				ease: 'back.out(2)'
			});
		}
	});

	onMount(() => {
		initMap();
		// Cards stagger
		gsap.from('.explore-card', {
			y: 30,
			opacity: 0,
			stagger: 0.07,
			duration: 0.5,
			ease: 'power2.out'
		});
	});

	onDestroy(() => {
		mapInstance?.remove();
	});
</script>

<svelte:head>
	<title>Explore Pasar Malams — Pasar Malam Finder</title>
</svelte:head>

<div class="min-h-screen">
	<!-- Page header -->
	<div class="bg-surface border-b border-border px-4 py-6">
		<div class="max-w-6xl mx-auto">
			<h1 class="font-anton text-3xl text-ink tracking-tight">Explore Markets</h1>
			<p class="font-sora text-muted text-sm mt-1">
				{data.markets.length} market{data.markets.length !== 1 ? 's' : ''} found
			</p>
		</div>
	</div>

	<div class="max-w-6xl mx-auto px-4 py-6">
		<div class="flex flex-col lg:flex-row gap-6">
			<!-- ── LEFT PANEL ─────────────────────────────────────── -->
			<div class="lg:w-[420px] shrink-0 flex flex-col gap-5">
				<!-- Search -->
				<div
					class="flex items-center bg-surface border-[1.5px] border-border rounded-xl h-11 px-3 gap-2 focus-within:border-primary transition-colors"
				>
					<svg class="w-4 h-4 text-muted shrink-0" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
						/>
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
							onclick={() => {
								searchQuery = '';
								applyFilters();
							}}
							class="text-muted hover:text-ink transition-colors"
						>
							<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								/>
							</svg>
						</button>
					{/if}
				</div>

				<!-- Day filter pills -->
				<div>
					<p class="font-sora text-xs text-muted uppercase tracking-wider mb-2.5">Day</p>
					<div class="flex flex-wrap gap-2">
						{#each DAYS as day}
							<button
								onclick={() => toggleDay(day)}
								class="day-pill {activeDay === day ? 'active' : day === today ? 'has-markets' : ''}"
							>
								{day.slice(0, 3)}
							</button>
						{/each}
					</div>
				</div>

				<!-- State dropdown -->
				<div>
					<p class="font-sora text-xs text-muted uppercase tracking-wider mb-2.5">State</p>
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

				<!-- Market cards list -->
				<div class="flex flex-col gap-3 mt-1">
					{#if data.markets.length === 0}
						<div class="text-center py-10 bg-surface rounded-2xl border border-border">
							<p class="text-2xl mb-2">🔍</p>
							<p class="font-sora text-muted text-sm">No markets match your filters.</p>
							<button
								onclick={() => {
									searchQuery = '';
									activeDay = '';
									activeState = '';
									goto('/explore', { replaceState: true });
								}}
								class="text-primary text-sm font-sora font-semibold mt-2 hover:underline"
							>
								Clear all filters
							</button>
						</div>
					{:else}
						{#each data.markets as market}
							<div
								class="explore-card"
								onclick={() => handleCardClick(market)}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && handleCardClick(market)}
							>
								<MarketCard {market} highlight={highlightId === market.id} />
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- ── MAP ──────────────────────────────────────────── -->
			<div class="relative flex-1 min-h-[300px] sm:min-h-[460px] lg:min-h-0 lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)] rounded-2xl overflow-hidden border border-border">
				<div bind:this={mapContainer} class="w-full h-full min-h-[300px] sm:min-h-[460px]"></div>
				{#if !mapLoaded}
					<div class="absolute inset-0 bg-soft-surface flex items-center justify-center rounded-2xl">
						<div class="text-center">
							<div
								class="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"
							></div>
							<p class="font-sora text-sm text-muted">Loading map…</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
