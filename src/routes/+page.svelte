<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { showAuthModal } from '$lib/stores';
	import { MALAY_DAYS, fromMalayDay, getTodayMalay, formatTime, getInitials, isOpenNow } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedDay = $state(getTodayMalay());
	let statMarkets = $state(0);
	let statTonight = $state(0);

	// Map
	let mapEl: HTMLDivElement;
	let LeafletLib: any = $state(null);
	let leafletMap: any = $state(null);
	let markersLayer: any = $state(null);

	const selectedEnglish = $derived(fromMalayDay(selectedDay));

	const filteredMarkets = $derived(
		(data.allMarkets ?? []).filter((m) => m.operating_days.includes(selectedEnglish))
	);

	const STAT_TARGETS = $derived({
		markets: data.stats?.totalMarkets ?? 0,
		tonight: data.stats?.openTonight ?? 0
	});

	function handleSearch(e: Event) {
		e.preventDefault();
		goto(searchQuery.trim() ? `/explore?q=${encodeURIComponent(searchQuery.trim())}` : '/explore');
	}

	function getCardBand(id: string): string {
		const n = id.charCodeAt(id.length - 1) % 3;
		return n === 0 ? '#f5c518' : n === 1 ? '#e0d8c8' : '#e5311d';
	}

	$effect(() => {
		if (!LeafletLib || !markersLayer || !leafletMap) return;
		const L = LeafletLib;

		markersLayer.clearLayers();

		const valid = filteredMarkets.filter((m) => m.lat && m.lng);
		valid.forEach((market) => {
			const icon = L.divIcon({
				className: '',
				html: `<div style="width:18px;height:18px;background:#e5311d;border-radius:50%;border:3px solid white;animation:pin-pulse 2.2s ease-out infinite;"></div>`,
				iconSize: [18, 18],
				iconAnchor: [9, 9],
				popupAnchor: [0, -12]
			});

			L.marker([market.lat, market.lng], { icon })
				.addTo(markersLayer)
				.bindPopup(
					`<div style="font-family:'Sora',sans-serif;min-width:160px;">
						<div style="font-family:'Anton',sans-serif;font-size:16px;text-transform:uppercase;color:#1a1209;">${market.name}</div>
						<div style="font-size:12px;color:#8a7d65;margin-top:4px;">${market.area}</div>
						<a href="/market/${market.id}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#e5311d;text-decoration:none;">View details →</a>
					</div>`,
					{ maxWidth: 220 }
				);
		});

		if (valid.length > 0) {
			const bounds = L.latLngBounds(valid.map((m) => [m.lat, m.lng]));
			leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, animate: true });
		}
	});

	onMount(() => {
		// Leaflet — async IIFE so onMount stays synchronous (required for cleanup return)
		(async () => {
			const leafletModule = await import('leaflet');
			await import('leaflet/dist/leaflet.css');
			const L = leafletModule.default ?? (leafletModule as unknown as typeof import('leaflet'));

			if (!mapEl) return;

			const map = L.map(mapEl, {
				center: [3.14, 101.69],
				zoom: 11,
				zoomControl: false,
				scrollWheelZoom: false,
				attributionControl: false
			});

			L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
				maxZoom: 19
			}).addTo(map);

			L.control.zoom({ position: 'topright' }).addTo(map);

			const layer = L.layerGroup().addTo(map);

			// Assign to $state vars so $effect can react
			LeafletLib = L;
			markersLayer = layer;
			leafletMap = map;

			setTimeout(() => map.invalidateSize(), 100);
		})();

		gsap.registerPlugin(ScrollTrigger);

		gsap.from('.hero-word', {
			y: 70,
			opacity: 0,
			stagger: 0.08,
			duration: 0.8,
			ease: 'power3.out',
			delay: 0.1
		});

		gsap.from(['.hero-sub', '.hero-search'], {
			y: 30,
			opacity: 0,
			stagger: 0.1,
			duration: 0.6,
			ease: 'power2.out',
			delay: 0.5
		});

		ScrollTrigger.create({
			trigger: '.stats-strip',
			start: 'top 88%',
			once: true,
			onEnter: () => {
				const proxy1 = { val: 0 };
				const proxy2 = { val: 0 };
				gsap.to(proxy1, {
					val: STAT_TARGETS.markets,
					duration: 2,
					ease: 'power2.out',
					onUpdate() { statMarkets = Math.round(proxy1.val); }
				});
				gsap.to(proxy2, {
					val: STAT_TARGETS.tonight,
					duration: 2,
					ease: 'power2.out',
					onUpdate() { statTonight = Math.round(proxy2.val); }
				});
			}
		});

		ScrollTrigger.create({
			trigger: '.cards-grid',
			start: 'top 88%',
			once: true,
			onEnter: () => {
				gsap.from('.cards-grid .card-item', {
					y: 40,
					opacity: 0,
					stagger: 0.08,
					duration: 0.55,
					ease: 'power2.out'
				});
			}
		});

		return () => {
			ScrollTrigger.getAll().forEach((t) => t.kill());
			leafletMap?.remove();
		};
	});
</script>

<svelte:head>
	<title>Pasar Malam Finder — Find Night Markets Near You</title>
</svelte:head>

<!-- ── HERO ─────────────────────────────────────────────────────────── -->
<section class="pg-hero">
	<div class="pg-wrap">

		<span class="pill-tag">
			<span class="blink-dot"></span>
			{data.stats?.openTonight ?? 0} markets open tonight · {selectedDay}
		</span>

		<h1 class="pg-h1">
			<span class="hero-word" style="display: block; color: #1a1209;">CARI</span>
			<span class="hero-word" style="display: block; font-family: 'Instrument Serif', serif; font-style: italic; color: #e5311d; text-transform: uppercase; font-weight: 700; letter-spacing: -0.02em; padding: 0 6px;">pasar malam</span>
			<span class="hero-word" style="display: block;">
				<span class="redbox">
					<span style="display: inline-block; transform: translateY(4px);">NEAR YOU</span>
				</span>
			</span>
		</h1>

		<p class="hero-sub" style="font-family: 'Sora', sans-serif; color: #8a7d65; max-width: 560px; margin: 26px 0 32px; line-height: 1.55;">
			A community-built directory of <b style="color: #1a1209; font-weight: 600;">{data.stats?.totalMarkets ?? 248} night markets</b> across Malaysia.
			Find the satay, the murtabak, the pisang goreng — verified by the people who actually showed up.
		</p>

		<form onsubmit={handleSearch} class="hero-search search-bar-wrap">
			<div class="search-bar">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8a7d65" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
					<circle cx="11" cy="11" r="7"></circle>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				</svg>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Try 'Taman Tun', 'Shah Alam' or 'char kway teow'…"
					class="search-input"
				/>
				<button type="submit" class="search-btn">Cari sekarang</button>
			</div>
		</form>

		<!-- Stats strip -->
		<div class="stats-strip">
			<div class="stat-cell">
				<div class="stat-num">{statMarkets}</div>
				<div class="stat-label">Markets listed</div>
			</div>
			<div class="stat-cell">
				<div class="stat-num">13</div>
				<div class="stat-label">States covered</div>
			</div>
			<div class="stat-cell">
				<div class="stat-num">4.7<small>K</small></div>
				<div class="stat-label">Verified reviews</div>
			</div>
			<div class="stat-cell last">
				<div class="stat-num">{statTonight}</div>
				<div class="stat-label">Open tonight</div>
			</div>
		</div>
	</div>
</section>

<!-- ── DAY FILTER ──────────────────────────────────────────────────── -->
<section class="pg-section">
	<div class="pg-wrap">
		<div class="pg-head">
			<div>
				<div class="eyebrow">Step 01 — pick a night</div>
				<h2 class="pg-h2">
					What <span class="serif-accent">day</span> are you free?
				</h2>
			</div>
			<div class="pg-meta">
				Showing markets for <b style="color: #1a1209;">{selectedDay} · {selectedDay === getTodayMalay() ? 'Tonight' : 'This week'}</b>
			</div>
		</div>

		<div class="day-pills">
			{#each MALAY_DAYS as day}
				{@const count = data.dayCounts?.[fromMalayDay(day)] ?? 0}
				<button
					onclick={() => (selectedDay = day)}
					class="day-pill-item {selectedDay === day ? 'active' : ''}"
				>
					{day}
					<span class="pill-count">{count}</span>
				</button>
			{/each}
		</div>
	</div>
</section>

<!-- ── MARKET CARDS ───────────────────────────────────────────────── -->
<section class="pg-section">
	<div class="pg-wrap">
		<div class="pg-head">
			<div>
				<div class="eyebrow">Step 02 — choose your spot</div>
				<h2 class="pg-h2">
					Markets <span class="serif-accent">tonight</span>
				</h2>
			</div>
			<div class="pg-meta">
				Sorted by · <b style="color: #1a1209;">Closest to you</b>
			</div>
		</div>

		{#if filteredMarkets.length > 0}
			<div class="cards-grid">
				{#each filteredMarkets.slice(0, 4) as market, i}
					{@const num = data.marketNumbers?.[market.id] ?? String(i + 1).padStart(3, '0')}
					{@const band = getCardBand(market.id)}
					<a href="/market/{market.id}" class="card-item"
						onmouseenter={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform='translateY(-3px)'; el.style.boxShadow='0 18px 40px -22px rgba(26,18,9,0.25)'; }}
						onmouseleave={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform=''; el.style.boxShadow=''; }}
					>
						<div style="height: 3px; background: {band};"></div>
						<div class="card-body">
							<div class="card-top-row">
								{#if isOpenNow(market.operating_days, market.start_time, market.end_time)}
									<span class="badge badge-open"><span class="b-dot"></span> Open now</span>
								{:else if market.is_verified}
									<span class="badge badge-verified"><span class="b-dot"></span> Verified</span>
								{:else}
									<span class="badge badge-unverified"><span class="b-dot"></span> Unverified</span>
								{/if}
								<span class="card-num">№ {num}</span>
							</div>
							<div class="card-name">{market.name}</div>
							<div class="card-area">📍 {market.area}</div>
							<div class="card-footer">
								<span class="card-day">
									{market.operating_days.join(', ')} · <em style="color: #8a7d65; font-style: normal; font-weight: 400;">{formatTime(market.start_time)} – {formatTime(market.end_time)}</em>
								</span>
								<span class="card-rating">★ 4.8</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
			{#if filteredMarkets.length > 4}
				<div style="text-align: center; margin-top: 20px;">
					<a href="/explore?day={selectedEnglish}" class="btn-secondary" style="font-size: 14px;">
						See all {filteredMarkets.length} markets on {selectedDay} →
					</a>
				</div>
			{/if}
		{:else}
			<div class="empty-state">
				<p style="font-family: 'Sora', sans-serif; color: #8a7d65; font-size: 14px;">No markets listed for {selectedDay} yet.</p>
			</div>
		{/if}
	</div>
</section>

<!-- ── CSS MAP ────────────────────────────────────────────────────── -->
<section class="pg-section">
	<div class="pg-wrap">
		<div class="pg-head">
			<div>
				<div class="eyebrow">Step 03 — see them on a map</div>
				<h2 class="pg-h2">
					Nearby <span class="serif-accent">tonight</span>
				</h2>
			</div>
			<div class="pg-meta">{filteredMarkets.length} markets within 8 km</div>
		</div>

		<div class="css-map-box">
			<div bind:this={mapEl} style="width:100%;height:100%;"></div>
			<div class="map-legend">
				<span class="blink-dot" style="width:7px;height:7px;"></span>
				{filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''} open on {selectedDay}
			</div>
		</div>
	</div>
</section>

<!-- ── MARKET DETAIL ─────────────────────────────────────────────── -->
{#if data.featuredMarket}
	{@const fm = data.featuredMarket}
	<section class="pg-section">
		<div class="pg-wrap">
			<div class="pg-head">
				<div>
					<div class="eyebrow">Detail view</div>
					<h2 class="pg-h2">
						Market <span class="serif-accent">profile</span>
					</h2>
				</div>
				<div class="pg-meta">№ {data.marketNumbers?.[fm.id] ?? '001'} · Last updated 12 May</div>
			</div>

			<div class="detail-card">
				<div class="detail-wm" aria-hidden="true">PM·{data.marketNumbers?.[fm.id] ?? '001'}</div>

				<div class="detail-eyebrow">
					<span class="blink-dot" style="width:7px;height:7px;"></span>
					Live · {fm.operating_days[0]} · open until {formatTime(fm.end_time)}
				</div>

				<h3 class="detail-name">
					Pasar Malam<br/>
					<span class="serif-accent">{fm.area}</span>
				</h3>

				<div style="color:#8a7d65;font-family:'Sora',sans-serif;font-size:15px;position:relative;z-index:1;">{fm.address}</div>

				<div class="chips-row">
					<span class="chip">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
						{formatTime(fm.start_time)} – {formatTime(fm.end_time)}
					</span>
					<span class="chip">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
						{fm.area}
					</span>
					<span class="chip">★ 4.8 · 312 reviews</span>
					<span class="chip">~120 stalls</span>
					<span class="chip">Halal-friendly</span>
					<span class="chip">Cash &amp; QR</span>
					<span class="chip">Parking nearby</span>
				</div>

				<div class="detail-actions">
					<button
						onclick={() => showAuthModal('Sign in to save markets')}
						class="btn-save"
						onmouseenter={(e)=>{const el=e.currentTarget as HTMLElement;el.style.background='#c92715';el.style.transform='translateY(-1px)';}}
						onmouseleave={(e)=>{const el=e.currentTarget as HTMLElement;el.style.background='#e5311d';el.style.transform='';}}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z"/></svg>
						Save market
					</button>
					<a href="/market/{fm.id}" class="btn-report"
						onmouseenter={(e)=>(e.currentTarget as HTMLElement).style.borderColor='#1a1209'}
						onmouseleave={(e)=>(e.currentTarget as HTMLElement).style.borderColor='#e0d8c8'}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
						Report issue
					</a>
				</div>
			</div>
		</div>
	</section>
{/if}

<!-- ── REVIEWS ────────────────────────────────────────────────────── -->
<section class="pg-section">
	<div class="pg-wrap">
		<div class="pg-head">
			<div>
				<div class="eyebrow">From the community</div>
				<h2 class="pg-h2">
					Recent <span class="serif-accent">reviews</span>
				</h2>
			</div>
			<div class="pg-meta">{data.stats?.totalReviews ?? 312} verified · this market</div>
		</div>

		<div class="reviews-grid">
			{#if data.recentReviews && data.recentReviews.length > 0}
				{#each data.recentReviews as review}
					{@const name = (review.profiles as { username?: string } | null)?.username ?? 'Anonymous'}
					{@const initials = getInitials(name)}
					<article class="review-card">
						<div class="review-head">
							<div class="avatar">{initials}</div>
							<div>
								<div class="review-name">{name}</div>
								<div class="review-meta">
									<span class="review-stars">{'★'.repeat(Math.max(1, Math.min(5, review.rating ?? 5)))}</span>
									<span>·</span><span>Verified visit</span>
								</div>
							</div>
						</div>
						<p class="review-body">{review.comment}</p>
					</article>
				{/each}
			{:else}
				<article class="review-card">
					<div class="review-head">
						<div class="avatar">AM</div>
						<div>
							<div class="review-name">Aisyah M.</div>
							<div class="review-meta">
								<span class="review-stars">★★★★★</span>
								<span>·</span><span>3 days ago</span><span>·</span><span>Verified visit</span>
							</div>
						</div>
					</div>
					<p class="review-body">
						The <b style="color:#1a1209;font-weight:600;">apam balik</b> stall near the entrance is unbeatable — crispy edges, generous peanut filling. Got there at 7pm and parking was already a nightmare, so come early.
					</p>
				</article>
				<article class="review-card">
					<div class="review-head">
						<div class="avatar">RK</div>
						<div>
							<div class="review-name">Ravi K.</div>
							<div class="review-meta">
								<span class="review-stars" style="letter-spacing:1px;">★★★★☆</span>
								<span>·</span><span>1 week ago</span><span>·</span><span>Verified visit</span>
							</div>
						</div>
					</div>
					<p class="review-body">
						Solid mix of food and clothing stalls. The <b style="color:#1a1209;font-weight:600;">satay</b> was excellent (RM1.20 a stick) but the <b style="color:#1a1209;font-weight:600;">char kway teow</b> guy near stall 40 has a queue for a reason.
					</p>
				</article>
			{/if}
		</div>
	</div>
</section>

<!-- ── FOOTER ─────────────────────────────────────────────────────── -->
<footer class="pg-footer">
	<div class="pg-wrap pg-footer-inner">
		<div class="footer-logo">PASAR.FINDER</div>
		<div style="font-family: 'Sora', sans-serif; color: #8a7d65; font-size: 13px;">Built by &amp; for the rakyat · © 2026</div>
	</div>
</footer>

<style>
	/* ── Wrappers ── */
	.pg-wrap {
		max-width: 1180px;
		margin: 0 auto;
		padding: 0 32px;
	}

	/* ── Hero ── */
	.pg-hero { padding: 68px 0 56px; position: relative; }

	.pg-h1 {
		font-family: 'Anton', sans-serif;
		font-size: clamp(44px, 11vw, 156px);
		line-height: 0.92;
		letter-spacing: -0.01em;
		text-transform: uppercase;
		margin: 22px 0 0;
	}

	.redbox {
		display: inline-block;
		background: #e5311d;
		color: white;
		padding: 6px 22px 12px;
		border-radius: 12px;
		transform: rotate(-1.2deg) translateY(12px);
	}

	.hero-sub { font-size: 17px; }

	/* ── Search bar ── */
	.search-bar-wrap { max-width: 720px; }
	.search-bar {
		background: white;
		border: 1px solid #e0d8c8;
		border-radius: 14px;
		padding: 8px 8px 8px 18px;
		display: flex;
		align-items: center;
		gap: 12px;
		box-shadow: 0 2px 0 rgba(26,18,9,0.04), 0 12px 32px -16px rgba(26,18,9,0.18);
	}
	.search-input {
		flex: 1;
		border: 0;
		outline: 0;
		background: transparent;
		font-family: 'Sora', sans-serif;
		font-size: 15px;
		color: #1a1209;
		padding: 12px 0;
		min-width: 0;
	}
	.search-input::placeholder { color: #8a7d65; }
	.search-btn {
		background: #e5311d;
		color: white;
		border: 0;
		border-radius: 8px;
		padding: 12px 22px;
		font-family: 'Sora', sans-serif;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
		transition: transform 0.15s ease, background 0.15s ease;
	}
	.search-btn:hover { background: #c92715; transform: translateY(-1px); }

	/* ── Stats strip ── */
	.stats-strip {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		margin-top: 56px;
		border-top: 1px solid #e0d8c8;
		border-bottom: 1px solid #e0d8c8;
	}
	.stat-cell {
		padding: 26px 24px;
		border-right: 1px solid #e0d8c8;
	}
	.stat-cell.last { border-right: none; }
	.stat-num {
		font-family: 'Anton', sans-serif;
		font-size: 56px;
		line-height: 1;
		color: #e5311d;
		letter-spacing: 0.01em;
	}
	.stat-num small { font-size: 22px; color: #e5311d; margin-left: 2px; }
	.stat-label {
		margin-top: 8px;
		font-family: 'Sora', sans-serif;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: #8a7d65;
		font-weight: 500;
	}

	/* ── Section layout ── */
	.pg-section { padding: 64px 0 8px; }
	.pg-section:last-of-type { padding-bottom: 80px; }

	.pg-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: 22px;
		gap: 24px;
	}

	.pg-h2 {
		font-family: 'Anton', sans-serif;
		font-size: 44px;
		letter-spacing: 0.01em;
		text-transform: uppercase;
		line-height: 1;
		margin: 0;
	}

	.serif-accent {
		font-family: 'Instrument Serif', serif;
		font-style: italic;
		font-weight: 700;
		font-size: 1.15em;
		text-transform: uppercase;
		color: #e5311d;
		-webkit-text-stroke: 0.6px #e5311d;
	}

	.pg-meta {
		font-family: 'Sora', sans-serif;
		font-size: 13px;
		color: #8a7d65;
		white-space: nowrap;
		flex-shrink: 0;
	}

	/* ── Day pills ── */
	.day-pills { display: flex; gap: 10px; flex-wrap: wrap; padding: 18px 0 8px; }

	.day-pill-item {
		background: white;
		border: 1px solid #e0d8c8;
		padding: 10px 22px;
		border-radius: 999px;
		font-family: 'Sora', sans-serif;
		font-size: 14px;
		font-weight: 500;
		color: #1a1209;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		transition: all 0.15s ease;
	}
	.day-pill-item:hover { border-color: #1a1209; }
	.day-pill-item.active { background: #e5311d; color: white; border-color: #e5311d; }
	.pill-count { font-size: 11px; opacity: 0.7; }
	.day-pill-item.active .pill-count { opacity: 0.85; }

	/* ── Cards ── */
	.cards-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		margin-top: 18px;
	}
	.card-item {
		background: white;
		border: 1px solid #e0d8c8;
		border-radius: 14px;
		overflow: hidden;
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		text-decoration: none;
		display: block;
	}
	.card-body { padding: 22px 22px 20px; }
	.card-top-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
	}
	.badge {
		font-family: 'Sora', sans-serif;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 5px 10px;
		border-radius: 6px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.b-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; display: inline-block; }
	.badge-open { background: #fdf0ee; color: #e5311d; border: 1px solid #f5c4bc; }
	.badge-verified { background: #f0e9d6; color: #1a1209; border: 1px solid #e0d8c8; }
	.badge-unverified { background: white; color: #8a7d65; border: 1px dashed #e0d8c8; }
	.card-num { font-family: 'Anton', sans-serif; font-size: 14px; color: #8a7d65; letter-spacing: 0.05em; }
	.card-name { font-family: 'Anton', sans-serif; font-size: 32px; line-height: 1; letter-spacing: 0.01em; text-transform: uppercase; color: #1a1209; }
	.card-area { color: #8a7d65; font-family: 'Sora', sans-serif; font-size: 13px; margin-top: 8px; display: flex; align-items: center; gap: 6px; }
	.card-footer { margin-top: 18px; padding-top: 14px; border-top: 1px solid #e0d8c8; display: flex; justify-content: space-between; align-items: center; font-family: 'Sora', sans-serif; font-size: 13px; }
	.card-day { color: #1a1209; font-weight: 500; }
	.card-rating { color: #e5311d; font-weight: 600; }

	/* ── CSS Map ── */
	.css-map-box {
		margin-top: 16px;
		height: 380px;
		position: relative;
		overflow: hidden;
		border: 1px solid #e0d8c8;
		border-radius: 14px;
	}
	.map-legend {
		position: absolute;
		left: 18px;
		bottom: 18px;
		background: white;
		border: 1px solid #e0d8c8;
		border-radius: 10px;
		padding: 12px 14px;
		font-family: 'Sora', sans-serif;
		font-size: 12px;
		color: #1a1209;
		display: flex;
		align-items: center;
		gap: 10px;
		box-shadow: 0 6px 20px -10px rgba(0,0,0,0.2);
	}

	/* ── Detail card ── */
	.detail-card {
		background: #fdf0ee;
		border: 1px solid #f5c4bc;
		border-radius: 16px;
		padding: 44px 44px 36px;
		position: relative;
		overflow: hidden;
	}
	.detail-wm {
		position: absolute;
		right: -30px;
		bottom: -40px;
		font-family: 'Anton', sans-serif;
		font-size: 240px;
		line-height: 0.85;
		color: rgba(229,49,29,0.07);
		pointer-events: none;
		user-select: none;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}
	.detail-eyebrow {
		font-family: 'Sora', sans-serif;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: #e5311d;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 10px;
		position: relative;
		z-index: 1;
	}
	.detail-name {
		font-family: 'Anton', sans-serif;
		font-size: clamp(40px, 7vw, 88px);
		line-height: 1;
		letter-spacing: 0.005em;
		margin: 14px 0 14px;
		text-transform: uppercase;
		position: relative;
		z-index: 1;
	}
	.chips-row { margin-top: 22px; display: flex; flex-wrap: wrap; gap: 10px; position: relative; z-index: 1; }
	.chip {
		background: white;
		border: 1px solid #f5c4bc;
		color: #e5311d;
		font-family: 'Sora', sans-serif;
		font-size: 13px;
		font-weight: 500;
		padding: 8px 14px;
		border-radius: 999px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.detail-actions { margin-top: 30px; display: flex; gap: 12px; flex-wrap: wrap; position: relative; z-index: 1; }
	.btn-save {
		font-family: 'Sora', sans-serif;
		font-size: 14px;
		font-weight: 600;
		padding: 14px 22px;
		border-radius: 10px;
		border: 0;
		cursor: pointer;
		background: #e5311d;
		color: white;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		transition: transform 0.15s ease, background 0.15s ease;
	}
	.btn-report {
		font-family: 'Sora', sans-serif;
		font-size: 14px;
		font-weight: 600;
		padding: 14px 22px;
		border-radius: 10px;
		border: 1px solid #e0d8c8;
		cursor: pointer;
		background: white;
		color: #1a1209;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
		transition: border-color 0.15s ease;
	}

	/* ── Reviews ── */
	.reviews-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 16px; }
	.review-card { background: white; border: 1px solid #e0d8c8; border-radius: 14px; padding: 24px; }
	.review-head { display: flex; gap: 14px; align-items: center; }
	.avatar {
		width: 46px;
		height: 46px;
		border-radius: 50%;
		background: #fdf0ee;
		color: #e5311d;
		display: grid;
		place-items: center;
		font-family: 'Anton', sans-serif;
		font-size: 18px;
		border: 1px solid #f5c4bc;
		flex-shrink: 0;
	}
	.review-name { font-family: 'Sora', sans-serif; font-weight: 600; font-size: 15px; color: #1a1209; }
	.review-meta { font-family: 'Sora', sans-serif; color: #8a7d65; font-size: 12px; margin-top: 2px; display: flex; gap: 8px; align-items: center; }
	.review-stars { color: #e5311d; font-size: 13px; letter-spacing: 1px; }
	.review-body { font-family: 'Sora', sans-serif; color: #8a7d65; font-size: 14px; line-height: 1.6; margin-top: 14px; }

	/* ── Footer ── */
	.pg-footer { border-top: 1px solid #e0d8c8; padding: 36px 0 56px; }
	.pg-footer-inner { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
	.footer-logo { font-family: 'Anton', sans-serif; color: #1a1209; font-size: 16px; letter-spacing: 0.04em; }

	/* ── Leaflet overrides ── */
	:global(.leaflet-control-zoom) {
		border: 1px solid #e0d8c8 !important;
		border-radius: 10px !important;
		overflow: hidden;
		box-shadow: none !important;
	}
	:global(.leaflet-control-zoom a) {
		width: 34px !important;
		height: 34px !important;
		line-height: 34px !important;
		font-size: 16px !important;
		color: #1a1209 !important;
		background: white !important;
		border-bottom: 1px solid #e0d8c8 !important;
		font-family: 'Sora', sans-serif !important;
	}
	:global(.leaflet-control-zoom a:hover) { background: #faf5eb !important; }
	:global(.leaflet-control-zoom-out) { border-bottom: none !important; }
	:global(.leaflet-popup-content-wrapper) {
		border-radius: 12px !important;
		box-shadow: 0 4px 20px rgba(26,18,9,0.12) !important;
		border: 1px solid #e0d8c8 !important;
		padding: 0 !important;
	}
	:global(.leaflet-popup-content) { margin: 14px 16px !important; }
	:global(.leaflet-popup-tip) { background: white !important; }
	:global(.leaflet-popup-close-button) { color: #8a7d65 !important; }

	/* ── Empty state ── */
	.empty-state { text-align: center; padding: 64px 24px; background: white; border-radius: 14px; border: 1px solid #e0d8c8; margin-top: 18px; }

	/* ── Pill tag ── */
	.pill-tag {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: white;
		border: 1px solid #e0d8c8;
		padding: 7px 14px;
		border-radius: 999px;
		font-family: 'Sora', sans-serif;
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.02em;
		color: #1a1209;
		box-shadow: 0 1px 0 rgba(0,0,0,0.02);
	}

	/* ══════════════════════════════════════
	   RESPONSIVE — tablet (≤ 900px)
	══════════════════════════════════════ */
	@media (max-width: 900px) {
		.stats-strip { grid-template-columns: repeat(2, 1fr); }
		.stat-cell { border-bottom: 1px solid #e0d8c8; }
		.stat-cell:nth-child(2) { border-right: none; }
		.stat-cell.last { border-bottom: none; border-right: none; }
		.stat-cell:nth-child(3) { border-right: 1px solid #e0d8c8; border-bottom: none; }
	}

	/* ══════════════════════════════════════
	   RESPONSIVE — mobile (≤ 640px)
	══════════════════════════════════════ */
	@media (max-width: 640px) {
		/* Wrapper padding */
		.pg-wrap { padding: 0 16px; }

		/* Hero */
		.pg-hero { padding: 36px 0 32px; }
		.pg-h1 { font-size: clamp(44px, 13vw, 88px); margin-top: 16px; }
		.redbox { padding: 4px 14px 9px; border-radius: 9px; }
		.hero-sub { font-size: 15px; margin: 18px 0 24px; }

		/* Search bar */
		.search-bar { padding: 6px 6px 6px 12px; gap: 8px; }
		.search-input { font-size: 14px; padding: 8px 0; }
		.search-btn { padding: 9px 14px; font-size: 13px; }

		/* Stats */
		.stats-strip { margin-top: 36px; grid-template-columns: 1fr 1fr; }
		.stat-cell { padding: 16px 14px; }
		.stat-num { font-size: 38px; }
		.stat-num small { font-size: 16px; }
		.stat-label { font-size: 10px; letter-spacing: 0.08em; }

		/* Sections */
		.pg-section { padding: 40px 0 4px; }
		.pg-section:last-of-type { padding-bottom: 56px; }
		.pg-head { flex-direction: column; align-items: flex-start; gap: 6px; margin-bottom: 16px; }
		.pg-meta { display: none; }
		.pg-h2 { font-size: 30px; }

		/* Day pills */
		.day-pill-item { padding: 8px 16px; font-size: 13px; }

		/* Cards */
		.cards-grid { grid-template-columns: 1fr; gap: 12px; }
		.card-body { padding: 16px 16px 14px; }
		.card-name { font-size: 24px; }
		.card-footer { flex-direction: column; align-items: flex-start; gap: 4px; }
		.card-rating { align-self: flex-end; margin-top: -20px; }

		/* Map */
		.css-map-box { height: 260px; }

		/* Detail card */
		.detail-card { padding: 24px 20px 20px; }
		.detail-wm { display: none; }
		.detail-name { font-size: 36px; }
		.chips-row { gap: 8px; }
		.chip { font-size: 12px; padding: 6px 12px; }
		.detail-actions { gap: 10px; }
		.btn-save, .btn-report { padding: 12px 16px; font-size: 13px; }

		/* Reviews */
		.reviews-grid { grid-template-columns: 1fr; }
		.review-card { padding: 18px; }

		/* Footer */
		.pg-footer { padding: 28px 0 40px; }
		.pg-footer-inner { flex-direction: column; align-items: flex-start; gap: 8px; }
	}
</style>
