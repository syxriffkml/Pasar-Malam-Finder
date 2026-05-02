<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import StarRating from '$lib/components/StarRating.svelte';
	import MarketCard from '$lib/components/MarketCard.svelte';
	import { supabaseStore, showToast, showAuthModal } from '$lib/stores';
	import { formatTime, formatDate, isOpenNow } from '$lib/utils';

	let miniMapEl: HTMLDivElement;

	let copied = $state(false);
	function copyLink() {
		navigator.clipboard.writeText(window.location.href);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { fade, scale } from 'svelte/transition';

	let { data }: { data: PageData } = $props();

	// Review form
	let reviewRating = $state(0);
	let reviewComment = $state('');
	let reviewLoading = $state(false);

	// Report modal
	let showReportModal = $state(false);
	let reportType = $state<'closed' | 'moved'>('closed');
	let reportNotes = $state('');
	let reportLoading = $state(false);

	// Favorite
	let favorited = $state(false);
	let heartEl: SVGElement;

	$effect(() => {
		favorited = data.isFavorited;
	});

	async function toggleFavorite() {
		if (!data.user) {
			showAuthModal('Sign in to save markets');
			return;
		}
		const sb = $supabaseStore;
		if (!sb) return;

		// GSAP heart burst
		const tl = gsap.timeline();
		tl.to(heartEl, { scale: 1.5, duration: 0.15, ease: 'power2.out' }).to(heartEl, {
			scale: 1,
			duration: 0.5,
			ease: 'elastic.out(1, 0.5)'
		});

		if (favorited) {
			await sb.from('favorites').delete().eq('user_id', data.user.id).eq('market_id', data.market.id);
			favorited = false;
			showToast('Removed from saved', 'info');
		} else {
			await sb.from('favorites').insert({ user_id: data.user.id, market_id: data.market.id });
			favorited = true;
			showToast('Saved to your profile!');
		}
	}

	async function submitReview(e: Event) {
		e.preventDefault();
		if (!data.user) {
			showAuthModal('Sign in to write a review');
			return;
		}
		if (reviewRating === 0) {
			showToast('Please select a star rating', 'error');
			return;
		}
		const sb = $supabaseStore;
		if (!sb) return;

		reviewLoading = true;
		const { error } = await sb.from('reviews').insert({
			market_id: data.market.id,
			user_id: data.user.id,
			rating: reviewRating,
			comment: reviewComment
		});
		reviewLoading = false;

		if (error) {
			showToast(error.message, 'error');
		} else {
			showToast('Review submitted!');
			reviewRating = 0;
			reviewComment = '';
			invalidateAll();
		}
	}

	async function submitReport(e: Event) {
		e.preventDefault();
		if (!data.user) {
			showAuthModal('Sign in to report');
			return;
		}
		const sb = $supabaseStore;
		if (!sb) return;

		reportLoading = true;
		const { error } = await sb.from('reports').insert({
			market_id: data.market.id,
			user_id: data.user.id,
			type: reportType,
			notes: reportNotes
		});
		reportLoading = false;

		if (error) {
			showToast(error.message, 'error');
		} else {
			showToast('Report submitted. Thank you!');
			showReportModal = false;
			reportNotes = '';
		}
	}

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);

		// Mini map
		if (data.market.lat && data.market.lng && miniMapEl) {
			(async () => {
				const leaflet = await import('leaflet');
				await import('leaflet/dist/leaflet.css');
				const L = leaflet.default ?? (leaflet as unknown as typeof import('leaflet'));
				const map = L.map(miniMapEl, {
					center: [data.market.lat, data.market.lng],
					zoom: 15,
					zoomControl: false,
					dragging: false,
					scrollWheelZoom: false,
					doubleClickZoom: false
				});
				L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
					attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
					maxZoom: 19
				}).addTo(map);
				const icon = L.divIcon({
					html: `<div style="width:14px;height:14px;background:#e5311d;border-radius:50%;border:3px solid white;animation:map-pulse 2.2s ease-out infinite;"></div>`,
					className: '',
					iconSize: [14, 14],
					iconAnchor: [7, 7]
				});
				L.marker([data.market.lat, data.market.lng], { icon }).addTo(map);
				setTimeout(() => map.invalidateSize(), 100);
			})();
		}

		// Header slides in from left
		gsap.from('.market-header-content', {
			x: -40,
			opacity: 0,
			duration: 0.7,
			ease: 'power3.out',
			delay: 0.1
		});

		gsap.from('.market-action-row', {
			y: 20,
			opacity: 0,
			duration: 0.5,
			ease: 'power2.out',
			delay: 0.35
		});

		// Parallax on header background ghost text
		gsap.to('.ghost-watermark', {
			x: -60,
			ease: 'none',
			scrollTrigger: {
				trigger: '.market-header',
				start: 'top top',
				end: 'bottom top',
				scrub: 1.5
			}
		});

		// Reviews stagger
		gsap.from('.review-item', {
			y: 20,
			opacity: 0,
			stagger: 0.08,
			duration: 0.5,
			ease: 'power2.out',
			scrollTrigger: {
				trigger: '.reviews-list',
				start: 'top 88%'
			}
		});

		return () => {
			ScrollTrigger.getAll().forEach((t) => t.kill());
		};
	});
</script>

<svelte:head>
	<title>{data.market.name} — Pasar Malam Finder</title>
	<meta property="og:type" content="website" />
	<meta property="og:title" content="{data.market.name} — Pasar Malam Finder" />
	<meta property="og:description" content="{data.market.description ? data.market.description.slice(0, 160) : `${data.market.name} — a pasar malam in ${data.market.area}, ${data.market.state}.`}" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="{data.market.name} — Pasar Malam Finder" />
	<meta name="twitter:description" content="{data.market.description ? data.market.description.slice(0, 160) : `${data.market.name} — a pasar malam in ${data.market.area}, ${data.market.state}.`}" />
</svelte:head>

<!-- ── MARKET HEADER ─────────────────────────────────────────────── -->
<section
	class="market-header relative bg-red-tint border-b border-red-border px-4 py-10 overflow-hidden"
>
	<!-- Ghost watermark -->
	<div
		class="ghost-watermark absolute top-0 right-0 select-none pointer-events-none overflow-hidden"
		style="font-family: Anton, sans-serif; font-size: clamp(3rem, 12vw, 11rem); color: rgba(229,49,29,0.07); line-height: 1; white-space: nowrap; transform: translateX(5%);"
		aria-hidden="true"
	>
		{data.market.name}
	</div>

	<div class="relative z-10 max-w-5xl mx-auto">
		<div class="market-header-content">
			<!-- State badge -->
			<div class="inline-flex items-center gap-1.5 mb-4">
				<span class="badge-verified">{data.market.state}</span>
				{#if isOpenNow(data.market.operating_days, data.market.start_time, data.market.end_time)}
					<span class="badge-open">Open now</span>
				{:else if data.market.is_verified}
					<span class="badge-verified">Verified</span>
				{:else}
					<span class="badge-pending">Pending Review</span>
				{/if}
			</div>

			<!-- Market name -->
			<h1 class="font-anton text-ink text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-4 max-w-2xl">
				{data.market.name}
			</h1>

			<!-- Info chips -->
			<div class="flex flex-wrap gap-2 mb-2">
				<span class="chip">
					<svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
						/>
					</svg>
					{data.market.area}
				</span>
				<span class="chip">
					<svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
						/>
					</svg>
					{data.market.operating_days.join(', ')}
				</span>
				<span class="chip">
					<svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
						/>
					</svg>
					{formatTime(data.market.start_time)} – {formatTime(data.market.end_time)}
				</span>
			</div>

			<p class="font-sora text-muted text-sm mt-2 max-w-lg">{data.market.address}</p>
		</div>

		<!-- Action buttons -->
		<div class="market-action-row flex items-center gap-3 mt-6">
			<button
				onclick={toggleFavorite}
				class="flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-sora text-sm font-medium transition-all
				{favorited
					? 'bg-primary text-white hover:bg-[#c4291a]'
					: 'bg-surface border-[1.5px] border-border text-ink hover:border-red-border'}"
			>
				<svg
					bind:this={heartEl}
					class="w-4 h-4"
					viewBox="0 0 20 20"
					fill={favorited ? 'currentColor' : 'none'}
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
					/>
				</svg>
				{favorited ? 'Saved' : 'Save'}
			</button>

			<button onclick={copyLink} class="btn-ghost flex items-center gap-2 text-sm">
				{#if copied}
					<svg class="w-4 h-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
					</svg>
					Copied!
				{:else}
					<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
						<path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
					</svg>
					Share
				{/if}
			</button>

			<button
				onclick={() => (showReportModal = true)}
				class="btn-ghost flex items-center gap-2 text-sm"
			>
				<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 7l2.55 2.4A1 1 0 0116 11H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
					/>
				</svg>
				Report
			</button>
		</div>
	</div>
</section>

<!-- ── BODY ──────────────────────────────────────────────────────── -->
<div class="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
	<!-- Main column -->
	<div class="lg:col-span-2 flex flex-col gap-8">
		<!-- Description -->
		{#if data.market.description}
			<div>
				<h2 class="font-anton text-xl text-ink mb-3">About</h2>
				<p class="font-sora text-muted text-sm leading-relaxed">{data.market.description}</p>
			</div>
		{/if}

		<!-- Rating summary -->
		<div class="flex items-center gap-4 bg-surface border border-border rounded-2xl p-5">
			<div class="text-center">
				<div class="font-anton text-primary text-5xl">
					{data.avgRating > 0 ? data.avgRating.toFixed(1) : '—'}
				</div>
				<div class="font-sora text-muted text-xs mt-1">out of 5</div>
			</div>
			<div class="w-px h-12 bg-border"></div>
			<div>
				<StarRating value={Math.round(data.avgRating)} size="lg" />
				<p class="font-sora text-muted text-xs mt-1.5">
					{data.reviews.length} review{data.reviews.length !== 1 ? 's' : ''}
				</p>
			</div>
		</div>

		<!-- Write review -->
		<div class="bg-surface border border-border rounded-2xl p-5">
			<h2 class="font-anton text-xl text-ink mb-4">Write a Review</h2>
			{#if data.user}
				<form onsubmit={submitReview} class="flex flex-col gap-4">
					<div>
						<p class="font-sora text-xs text-muted mb-2">Your rating</p>
						<StarRating
							value={reviewRating}
							interactive={true}
							size="lg"
							onChange={(v) => (reviewRating = v)}
						/>
					</div>
					<div>
						<label class="font-sora text-xs text-muted mb-1.5 block" for="review-comment">
							Comment (optional)
						</label>
						<textarea
							id="review-comment"
							bind:value={reviewComment}
							placeholder="Share your experience…"
							rows="3"
							class="input-field resize-none"
						></textarea>
					</div>
					<button
						type="submit"
						disabled={reviewLoading}
						class="btn-primary self-start py-2.5 px-6 disabled:opacity-60"
					>
						{reviewLoading ? 'Submitting…' : 'Submit Review'}
					</button>
				</form>
			{:else}
				<div class="text-center py-6 bg-soft-surface rounded-xl">
					<p class="font-sora text-muted text-sm mb-3">Sign in to write a review</p>
					<button onclick={() => showAuthModal('Sign in to review this market')} class="btn-primary text-sm py-2 px-6">
						Sign In
					</button>
				</div>
			{/if}
		</div>

		<!-- Reviews list -->
		<div>
			<h2 class="font-anton text-xl text-ink mb-4">
				Reviews ({data.reviews.length})
			</h2>
			<div class="reviews-list flex flex-col gap-4">
				{#if data.reviews.length === 0}
					<p class="font-sora text-muted text-sm text-center py-8 bg-surface rounded-2xl border border-border">
						No reviews yet. Be the first!
					</p>
				{:else}
					{#each data.reviews as review}
						<div class="review-item bg-surface border border-border rounded-2xl p-4">
							<div class="flex items-start gap-3 mb-3">
								<div
									class="w-9 h-9 rounded-full bg-primary text-white font-sora font-semibold text-sm flex items-center justify-center shrink-0"
								>
									{(review.profiles?.username ?? '?')[0].toUpperCase()}
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between gap-2">
										<p class="font-sora font-semibold text-sm text-ink truncate">
											{review.profiles?.username ?? 'Anonymous'}
										</p>
										<p class="font-sora text-xs text-muted shrink-0">
											{formatDate(review.created_at)}
										</p>
									</div>
									<StarRating value={review.rating} size="sm" />
								</div>
							</div>
							{#if review.comment}
								<p class="font-sora text-sm text-muted leading-relaxed">{review.comment}</p>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<!-- Sidebar -->
	<div class="flex flex-col gap-5">
		<!-- Mini map -->
		{#if data.market.lat && data.market.lng}
			<div class="bg-surface border border-border rounded-2xl overflow-hidden">
				<div bind:this={miniMapEl} class="w-full" style="height: 180px;"></div>
				<a
					href="https://www.google.com/maps/search/?api=1&query={data.market.lat},{data.market.lng}"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-3 px-4 py-3 hover:bg-soft-surface transition-colors border-t border-border"
				>
					<svg class="w-4 h-4 text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />
					</svg>
					<span class="font-sora text-sm font-semibold text-ink">Get Directions</span>
					<svg class="w-4 h-4 text-muted ml-auto" viewBox="0 0 20 20" fill="currentColor">
						<path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
						<path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
					</svg>
				</a>
			</div>
		{/if}

		<!-- Details -->
		<div class="bg-surface border border-border rounded-2xl p-4">
			<h3 class="font-anton text-sm uppercase tracking-wider text-muted mb-3">Details</h3>
			<div class="flex flex-col gap-3">
				<div>
					<p class="font-sora text-xs text-muted">Address</p>
					<p class="font-sora text-sm text-ink mt-0.5">{data.market.address}</p>
				</div>
				<div>
					<p class="font-sora text-xs text-muted">Operating Days</p>
					<p class="font-sora text-sm text-ink mt-0.5">{data.market.operating_days.join(', ')}</p>
				</div>
				<div>
					<p class="font-sora text-xs text-muted">Hours</p>
					<p class="font-sora text-sm text-ink mt-0.5">
						{formatTime(data.market.start_time)} – {formatTime(data.market.end_time)}
					</p>
				</div>
			</div>
		</div>

		<!-- Related markets -->
		{#if data.related.length > 0}
			<div>
				<h3 class="font-anton text-sm uppercase tracking-wider text-muted mb-3">Nearby Markets</h3>
				<div class="flex flex-col gap-3">
					{#each data.related as m}
						<MarketCard market={m} />
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- ── REPORT MODAL ──────────────────────────────────────────────── -->
{#if showReportModal}
	<div
		class="fixed inset-0 z-[200] flex items-center justify-center p-4"
		transition:fade={{ duration: 150 }}
	>
		<button
			class="absolute inset-0 bg-ink/40 backdrop-blur-sm"
			onclick={() => (showReportModal = false)}
			aria-label="Close"
		></button>

		<div
			class="relative bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 z-10"
			transition:scale={{ start: 0.95, duration: 200 }}
		>
			<button
				onclick={() => (showReportModal = false)}
				aria-label="Close modal"
				class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-soft-surface text-muted transition-colors"
			>
				<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
				</svg>
			</button>

			<h2 class="font-anton text-xl text-ink mb-1">Report Market</h2>
			<p class="font-sora text-xs text-muted mb-5">Help keep the community accurate</p>

			<form onsubmit={submitReport} class="flex flex-col gap-4">
				<div>
					<p class="font-sora text-xs text-muted mb-2">Issue type</p>
					<div class="flex gap-2">
						{#each ['closed', 'moved'] as type}
							<button
								type="button"
								onclick={() => (reportType = type as 'closed' | 'moved')}
								class="flex-1 py-2.5 px-4 rounded-xl border-[1.5px] font-sora text-sm transition-all capitalize
								{reportType === type
									? 'bg-primary text-white border-primary'
									: 'border-border text-muted hover:border-red-border'}"
							>
								{type}
							</button>
						{/each}
					</div>
				</div>

				<div>
					<label class="font-sora text-xs text-muted mb-1.5 block" for="report-notes">
						Additional notes (optional)
					</label>
					<textarea
						id="report-notes"
						bind:value={reportNotes}
						placeholder="Any extra details…"
						rows="3"
						class="input-field resize-none"
					></textarea>
				</div>

				<button
					type="submit"
					disabled={reportLoading}
					class="btn-primary w-full py-3 disabled:opacity-60"
				>
					{reportLoading ? 'Sending…' : 'Submit Report'}
				</button>
			</form>
		</div>
	</div>
{/if}
