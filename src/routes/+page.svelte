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
	let ctaSectionEl: HTMLDivElement;
	let ctaWaveBack: SVGElement;
	let ctaWaveFront: SVGElement;
	let heroEl: HTMLElement;
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

		let glowTween: any;

		gsap.registerPlugin(ScrollTrigger);

		// Hero line-reveal — unlock overflow on complete so glow can spill out
		gsap.from('.hero-line-inner', {
			y: '115%',
			duration: 1.15,
			stagger: 0.12,
			ease: 'power4.out',
			delay: 0.2,
			onComplete: () => {
				document.querySelectorAll('.hero-line-wrap').forEach((el) => {
					(el as HTMLElement).style.overflow = 'visible';
				});
			}
		});
		gsap.from('.hero-top-strip', { opacity: 0, y: -16, duration: 0.6, ease: 'power2.out', delay: 0.1 });
		gsap.from('.hero-data', { opacity: 0, x: 32, duration: 1.1, ease: 'power3.out', delay: 1.0 });
		gsap.from('.hero-scroll', { opacity: 0, duration: 0.6, delay: 1.25 });

		// Stats live in the hero now — count up on load
		const proxy1 = { val: 0 };
		const proxy2 = { val: 0 };
		gsap.to(proxy1, { val: STAT_TARGETS.markets, duration: 2.2, ease: 'power2.out', delay: 1.1, onUpdate() { statMarkets = Math.round(proxy1.val); } });
		gsap.to(proxy2, { val: STAT_TARGETS.tonight, duration: 2.2, ease: 'power2.out', delay: 1.1, onUpdate() { statTonight = Math.round(proxy2.val); } });

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

		// CTA wave parallax
		if (ctaSectionEl) {
			gsap.from('.cta-text-block', {
				y: 50,
				opacity: 0,
				duration: 0.9,
				ease: 'power3.out',
				scrollTrigger: { trigger: ctaSectionEl, start: 'top 80%', once: true }
			});
			gsap.to(ctaWaveBack, {
				y: -50,
				scrollTrigger: {
					trigger: ctaSectionEl,
					start: 'top bottom',
					end: 'bottom top',
					scrub: 2
				}
			});
			gsap.to(ctaWaveFront, {
				y: -90,
				scrollTrigger: {
					trigger: ctaSectionEl,
					start: 'top bottom',
					end: 'bottom top',
					scrub: 1.2
				}
			});
		}

		return () => {
			ScrollTrigger.getAll().forEach((t) => t.kill());
			leafletMap?.remove();
			glowTween?.kill();
		};
	});
</script>

<svelte:head>
	<title>Pasar Malam Finder — Find Night Markets Near You</title>
</svelte:head>

<!-- ── HERO ─────────────────────────────────────────────────────────── -->
<section class="hero" bind:this={heroEl}>

	<!-- Main content -->
	<div class="hero-inner">

		<!-- Top strip -->
		<div class="hero-top-strip">
			<span class="hero-pill">
				<span class="blink-dot"></span>
				{data.stats?.openTonight ?? 0} open tonight · {selectedDay}
			</span>
			<span class="hero-top-r">Est. 2026 · Malaysia</span>
		</div>

		<!-- Title block — line reveal -->
		<h1 class="hero-title-block">
			<div class="hero-line-wrap">
				<div class="hero-line-inner">
					<span class="hero-label">FIND YOUR</span>
				</div>
			</div>
			<div class="hero-line-wrap">
				<div class="hero-line-inner">
					<span class="hero-h-xl">PASAR</span>
				</div>
			</div>
			<div class="hero-line-wrap">
				<div class="hero-line-inner">
					<em class="hero-h-xl hero-malam">MALAM</em>
				</div>
			</div>
			<div class="hero-line-wrap">
				<div class="hero-line-inner">
					<div class="hero-tonight-wrap">
						<span class="hero-h-tonight">TONIGHT<span class="hero-dot">.</span></span>
					</div>
				</div>
			</div>
		</h1>
	</div>

	<!-- Right: full-scale typographic data composition -->
	<div class="hero-data">

		<!-- Featured: 105 with vertical rotated label -->
		<div class="hd-feature">
			<div class="hd-vert-label">Night Markets</div>
			<div class="hd-feature-num">{statMarkets}</div>
		</div>

		<div class="hd-rule"></div>

		<!-- Secondary: 13 states + 4.7K reviews -->
		<div class="hd-secondary">
			<div class="hd-sec-item">
				<div class="hd-sec-num">13</div>
				<div class="hd-sec-lbl">States</div>
			</div>
			<div class="hd-sec-sep"></div>
			<div class="hd-sec-item">
				<div class="hd-sec-num">4.7<em>K</em></div>
				<div class="hd-sec-lbl">Reviews</div>
			</div>
		</div>

		<div class="hd-rule"></div>

		<!-- Live: open tonight -->
		<div class="hd-live">
			<span class="hd-dot"></span>
			<span class="hd-live-num">{statTonight}</span>
			<div class="hd-live-text">
				<span>Open</span>
				<span>Tonight</span>
			</div>
		</div>

	</div>

	<!-- Scroll hint -->
	<div class="hero-scroll">
		<span class="hero-scroll-text">SCROLL</span>
		<svg class="hero-scroll-arrow" width="16" height="24" viewBox="0 0 16 24" fill="none" stroke="rgba(250,245,235,0.3)" stroke-width="2" stroke-linecap="round">
			<line x1="8" y1="0" x2="8" y2="20"/><polyline points="2 14 8 20 14 14"/>
		</svg>
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
								<span class="card-rating">★ {data.ratingsMap?.[market.id]?.toFixed(1) ?? '—'}</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
			{#if filteredMarkets.length > 4}
				<div style="text-align: center; margin-top: 52px; position: relative; z-index: 2;">
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
					<span class="chip">★ {data.ratingsMap?.[fm.id]?.toFixed(1) ?? '—'}</span>
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

<!-- ── CTA WAVE ───────────────────────────────────────────────────── -->
<div class="cta-section" bind:this={ctaSectionEl}>

	<!-- Top wave: transitions cream → dark -->
	<div class="cta-top-wave" aria-hidden="true">
		<svg viewBox="0 0 1440 88" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M0,88 L0,44 C120,8 240,72 360,44 C480,16 600,68 720,40 C840,12 960,60 1080,36 C1200,12 1320,56 1440,32 L1440,88 Z" fill="#faf5eb"/>
		</svg>
	</div>

	<!-- Content -->
	<div class="pg-wrap cta-text-block">
		<!-- Lantern SVG decorations -->
		<svg class="cta-lantern cta-lantern-l" viewBox="0 0 40 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<line x1="20" y1="0" x2="20" y2="10" stroke="#f5c518" stroke-width="2"/>
			<rect x="6" y="10" width="28" height="6" rx="3" fill="#e5311d"/>
			<rect x="4" y="16" width="32" height="38" rx="8" fill="#e5311d" opacity="0.9"/>
			<rect x="8" y="16" width="4" height="38" rx="2" fill="#f97316" opacity="0.6"/>
			<rect x="18" y="16" width="4" height="38" rx="2" fill="#f97316" opacity="0.6"/>
			<rect x="28" y="16" width="4" height="38" rx="2" fill="#f97316" opacity="0.6"/>
			<rect x="4" y="54" width="32" height="6" rx="3" fill="#e5311d"/>
			<line x1="20" y1="60" x2="20" y2="72" stroke="#f5c518" stroke-width="2"/>
			<ellipse cx="20" cy="35" rx="10" ry="12" fill="#f5c518" opacity="0.18"/>
		</svg>
		<svg class="cta-lantern cta-lantern-r" viewBox="0 0 40 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<line x1="20" y1="0" x2="20" y2="10" stroke="#f5c518" stroke-width="2"/>
			<rect x="6" y="10" width="28" height="6" rx="3" fill="#f97316"/>
			<rect x="4" y="16" width="32" height="38" rx="8" fill="#f97316" opacity="0.9"/>
			<rect x="8" y="16" width="4" height="38" rx="2" fill="#f5c518" opacity="0.6"/>
			<rect x="18" y="16" width="4" height="38" rx="2" fill="#f5c518" opacity="0.6"/>
			<rect x="28" y="16" width="4" height="38" rx="2" fill="#f5c518" opacity="0.6"/>
			<rect x="4" y="54" width="32" height="6" rx="3" fill="#f97316"/>
			<line x1="20" y1="60" x2="20" y2="72" stroke="#f5c518" stroke-width="2"/>
			<ellipse cx="20" cy="35" rx="10" ry="12" fill="#f5c518" opacity="0.18"/>
		</svg>

		<div class="cta-eyebrow">
			<span class="blink-dot" style="background:#f5c518;box-shadow:0 0 6px #f5c518;"></span>
			Community · Open Submission
		</div>
		<h2 class="cta-heading">
			Know a market<br/>
			<em class="cta-accent">we're missing?</em>
		</h2>
		<p class="cta-body">
			Help us build Malaysia's most complete pasar malam guide.<br/>
			Submit a market in minutes — free and open to everyone.
		</p>
		<div class="cta-btn-row">
			<button
				class="cta-btn"
				onclick={() => alert('Market submission coming soon! 🎉')}
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
				</svg>
				Submit a Market
			</button>
			<span class="cta-soon">Feature coming soon</span>
		</div>
	</div>

	<!-- Animated wave layers -->
	<div class="cta-waves" aria-hidden="true">
		<svg bind:this={ctaWaveBack} class="cta-wave-svg cta-wave-svg--back" viewBox="0 0 1440 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M0,100 C180,40 360,140 540,90 C720,40 900,130 1080,80 C1260,30 1380,100 1440,75 L1440,180 L0,180 Z" fill="#0d3060"/>
		</svg>
		<svg bind:this={ctaWaveFront} class="cta-wave-svg cta-wave-svg--front" viewBox="0 0 1440 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M0,120 C200,60 400,150 600,100 C800,50 1000,130 1200,85 C1320,62 1400,105 1440,88 L1440,180 L0,180 Z" fill="#1a5fff"/>
		</svg>
	</div>
</div>

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
	.hero {
		position: relative;
		min-height: 100vh;
		background: #0f0c07;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.hero::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse 70% 60% at 8% 55%, rgba(229,49,29,0.08) 0%, transparent 65%);
		pointer-events: none;
		z-index: 0;
	}

	.hero-inner {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		padding-top: clamp(96px, 12vh, 130px);
		padding-bottom: clamp(60px, 10vh, 100px);
		padding-left: clamp(24px, 4vw, 56px);
		padding-right: clamp(24px, 4vw, 56px);
		flex: 1;
		/* full-bleed — no max-width so the type fills from the left edge */
	}

	.hero-top-strip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 52px;
	}

	.hero-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: rgba(250,245,235,0.07);
		border: 1px solid rgba(250,245,235,0.13);
		border-radius: 999px;
		padding: 7px 16px;
		font-family: 'Sora', sans-serif;
		font-size: 12px;
		font-weight: 500;
		color: rgba(250,245,235,0.6);
		letter-spacing: 0.03em;
	}

	.blink-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #e5311d;
		animation: blink-pulse 2s ease-in-out infinite;
		display: inline-block;
		flex-shrink: 0;
	}

	@keyframes blink-pulse {
		0%, 100% { box-shadow: 0 0 0 0 rgba(229,49,29,0.5); }
		50% { box-shadow: 0 0 0 7px rgba(229,49,29,0); }
	}

	.hero-top-r {
		font-family: 'Sora', sans-serif;
		font-size: 12px;
		color: rgba(250,245,235,0.22);
		letter-spacing: 0.07em;
	}

	.hero-title-block {
		margin: 0;
		padding: 0;
		font-size: 0;
	}

	.hero-line-wrap {
		overflow: hidden;
		line-height: 0.9;
	}

	.hero-line-inner {
		display: block;
		will-change: transform;
	}

	.hero-label {
		display: block;
		font-family: 'Sora', sans-serif;
		font-size: clamp(11px, 1.1vw, 14px);
		font-weight: 600;
		letter-spacing: 0.45em;
		text-transform: uppercase;
		color: rgba(250,245,235,0.28);
		padding-bottom: 18px;
	}

	.hero-h-xl {
		display: block;
		font-family: 'Anton', sans-serif;
		font-size: clamp(72px, 19vw, 275px);
		line-height: 0.88;
		letter-spacing: -0.025em;
		text-transform: uppercase;
		color: #faf5eb;
	}

	.hero-malam {
		font-family: 'Instrument Serif', serif !important;
		font-style: italic !important;
		font-weight: 700;
		color: #e5311d;
		-webkit-text-stroke: 0px;
	}

	.hero-tonight-wrap {
		position: relative;
		display: block;
	}

	.hero-h-tonight {
		display: block;
		position: relative;
		z-index: 1;
		font-family: 'Anton', sans-serif;
		font-size: clamp(38px, 10vw, 148px);
		line-height: 1;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: transparent;
		-webkit-text-stroke: 1.5px rgba(245,197,24,0.7);
		padding-top: 4px;
	}

	.hero-dot {
		color: #e5311d;
		-webkit-text-stroke: 1.5px #e5311d;
	}

	/* ── Right: typographic data composition ── */
	.hero-data {
		position: absolute;
		right: clamp(36px, 5vw, 80px);
		top: 50%;
		transform: translateY(-50%);
		z-index: 3;
		width: clamp(260px, 36vw, 520px);
		/* thin spine on the left */
		border-left: 1px solid rgba(250,245,235,0.1);
		padding-left: clamp(20px, 2.5vw, 36px);
	}

	/* Featured: huge outlined 105 + rotated label */
	.hd-feature {
		display: flex;
		align-items: flex-end;
		gap: 14px;
	}

	.hd-vert-label {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		font-family: 'Sora', sans-serif;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.28em;
		color: rgba(250,245,235,0.2);
		flex-shrink: 0;
		padding-bottom: 4px;
	}

	.hd-feature-num {
		font-family: 'Anton', sans-serif;
		font-size: clamp(100px, 13vw, 186px);
		line-height: 0.86;
		letter-spacing: -0.03em;
		color: transparent;
		-webkit-text-stroke: 1.5px rgba(250,245,235,0.42);
		display: inline-block;
		transform: skewX(-4deg);
	}

	.hd-rule {
		height: 1px;
		background: rgba(250,245,235,0.1);
		margin: 18px 0;
	}

	/* Secondary: 13 + 4.7K side by side */
	.hd-secondary {
		display: flex;
		align-items: flex-end;
		gap: 0;
	}

	.hd-sec-item { flex: 1; }

	.hd-sec-sep {
		width: 1px;
		height: 64px;
		background: rgba(250,245,235,0.1);
		margin: 0 clamp(18px, 2.5vw, 32px);
		align-self: flex-end;
		margin-bottom: 26px;
		flex-shrink: 0;
	}

	.hd-sec-num {
		font-family: 'Anton', sans-serif;
		font-size: clamp(52px, 7vw, 96px);
		line-height: 1;
		color: rgba(250,245,235,0.78);
		letter-spacing: -0.01em;
	}

	.hd-sec-num em {
		font-style: normal;
		font-size: 0.44em;
		opacity: 0.65;
		letter-spacing: 0;
	}

	.hd-sec-lbl {
		font-family: 'Sora', sans-serif;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.24em;
		color: rgba(250,245,235,0.22);
		margin-top: 5px;
	}

	/* Live: red open-tonight */
	.hd-live {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.hd-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #e5311d;
		flex-shrink: 0;
		animation: blink-pulse 2s ease-in-out infinite;
	}

	.hd-live-num {
		font-family: 'Anton', sans-serif;
		font-size: clamp(64px, 8.5vw, 118px);
		line-height: 1;
		color: #e5311d;
		letter-spacing: -0.02em;
	}

	.hd-live-text {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.hd-live-text span {
		font-family: 'Sora', sans-serif;
		font-size: clamp(9px, 1vw, 13px);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.24em;
		color: rgba(250,245,235,0.32);
		line-height: 1.5;
		display: block;
	}

	.hero-search-box {
		background: rgba(250,245,235,0.06);
		border: 1px solid rgba(250,245,235,0.12);
		border-radius: 14px;
		padding: 10px 10px 10px 18px;
		display: flex;
		align-items: center;
		gap: 12px;
		transition: border-color 0.2s ease, background 0.2s ease;
	}

	.hero-search-box:focus-within {
		border-color: rgba(250,245,235,0.28);
		background: rgba(250,245,235,0.09);
	}

	.hero-input {
		flex: 1;
		border: 0;
		outline: 0;
		background: transparent;
		font-family: 'Sora', sans-serif;
		font-size: 14px;
		color: #faf5eb;
		padding: 12px 0;
		min-width: 0;
	}

	.hero-input::placeholder { color: rgba(250,245,235,0.28); }

	.hero-search-btn {
		background: #e5311d;
		color: white;
		border: 0;
		border-radius: 10px;
		padding: 12px 22px;
		font-family: 'Sora', sans-serif;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		transition: transform 0.15s ease, background 0.15s ease;
	}

	.hero-search-btn:hover { background: #c92715; transform: translateY(-1px); }

	/* Scroll hint */
	.hero-scroll {
		position: absolute;
		bottom: 32px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		z-index: 2;
	}

	.hero-scroll-text {
		font-family: 'Sora', sans-serif;
		font-size: 10px;
		letter-spacing: 0.26em;
		color: rgba(250,245,235,0.22);
		text-transform: uppercase;
	}

	.hero-scroll-arrow { animation: scroll-bounce 1.8s ease-in-out infinite; }

	@keyframes scroll-bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(5px); }
	}

	/* Eyebrow labels */
	.eyebrow {
		font-family: 'Sora', sans-serif;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: #8a7d65;
		margin-bottom: 8px;
	}

	/* ── Stats strip ── */
	.stats-strip {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
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
		isolation: isolate;
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
		.hero-data { display: none; }
	}

	/* ══════════════════════════════════════
	   RESPONSIVE — mobile (≤ 640px)
	══════════════════════════════════════ */
	@media (max-width: 640px) {
		/* Wrapper padding */
		.pg-wrap { padding: 0 16px; }

		/* Hero — mobile */
		.hero-inner { padding-top: 60px; padding-bottom: 70px; padding-left: 20px; padding-right: 20px; }
		.hero-top-strip { margin-bottom: 32px; }
		.hero-top-r { display: none; }
		.hero-label { letter-spacing: 0.3em; padding-bottom: 12px; }
		.hero-h-xl { font-size: clamp(64px, 18vw, 110px); }
		.hero-h-tonight { font-size: clamp(24px, 9vw, 50px); }
		.hero-data { display: none; }
		.hero-scroll { bottom: 20px; }

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

		/* CTA mobile */
		.cta-section { padding: 0 0 0; }
		.cta-text-block { padding: 40px 16px 160px; }
		.cta-heading { font-size: clamp(36px, 12vw, 56px); }
		.cta-lantern-l { left: -10px; width: 48px; }
		.cta-lantern-r { right: -10px; width: 48px; }
	}

	/* ── CTA Wave Section ── */
	.cta-section {
		position: relative;
		background: #071a2e;
		margin-top: -2px;
		overflow: hidden;
	}

	.cta-top-wave {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		line-height: 0;
	}
	.cta-top-wave svg {
		display: block;
		width: 100%;
		height: 88px;
	}

	.cta-text-block {
		position: relative;
		z-index: 2;
		padding: 120px 32px 200px;
		text-align: center;
	}

	.cta-eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: 'Sora', sans-serif;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #f5c518;
		margin-bottom: 28px;
	}

	.cta-heading {
		font-family: 'Anton', sans-serif;
		font-size: clamp(48px, 8vw, 100px);
		line-height: 0.95;
		letter-spacing: -0.01em;
		text-transform: uppercase;
		color: #faf5eb;
		margin: 0 0 24px;
	}

	.cta-accent {
		font-family: 'Instrument Serif', serif;
		font-style: italic;
		font-weight: 700;
		font-size: 1.08em;
		text-transform: uppercase;
		color: #f5c518;
		-webkit-text-stroke: 0.6px #f5c518;
		display: block;
	}

	.cta-body {
		font-family: 'Sora', sans-serif;
		font-size: 16px;
		color: rgba(250, 245, 235, 0.55);
		line-height: 1.7;
		max-width: 480px;
		margin: 0 auto 40px;
	}

	.cta-btn-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.cta-btn {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		background: #f5c518;
		color: #071a2e;
		font-family: 'Sora', sans-serif;
		font-size: 15px;
		font-weight: 700;
		padding: 14px 28px;
		border-radius: 10px;
		border: none;
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
		box-shadow: 0 4px 24px rgba(245, 197, 24, 0.35);
	}
	.cta-btn:hover {
		background: #ffd93d;
		transform: translateY(-2px);
		box-shadow: 0 8px 32px rgba(245, 197, 24, 0.5);
	}

	.cta-soon {
		font-family: 'Sora', sans-serif;
		font-size: 12px;
		color: rgba(250, 245, 235, 0.35);
		letter-spacing: 0.06em;
	}

	/* Lantern decorations */
	.cta-lantern {
		position: absolute;
		top: 100px;
		opacity: 0.85;
		filter: drop-shadow(0 0 12px rgba(245, 197, 24, 0.4));
	}
	.cta-lantern-l { left: 5%; width: 56px; }
	.cta-lantern-r { right: 5%; width: 56px; }

	/* Wave layers */
	.cta-waves {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 180px;
		pointer-events: none;
	}
	.cta-wave-svg {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 180px;
		will-change: transform;
	}
	.cta-wave-svg--back  { z-index: 1; }
	.cta-wave-svg--front { z-index: 2; }
</style>
