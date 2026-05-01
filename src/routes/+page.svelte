<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import MarketCard from '$lib/components/MarketCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let statMarkets = $state(0);
	let statStates = $state(0);
	let statTonight = $state(0);
	let statVerified = $state(0);

	// Target stat values (derived so they stay reactive to data)
	const STAT_TARGETS = $derived({
		markets: data.stats?.totalMarkets ?? 0,
		states: 13,
		tonight: data.stats?.openTonight ?? 0,
		verified: Math.round((data.stats?.totalMarkets ?? 0) * 0.8)
	});

	function handleSearch(e: Event) {
		e.preventDefault();
		if (searchQuery.trim()) {
			goto(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
		} else {
			goto('/explore');
		}
	}

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);

		// Hero word stagger
		gsap.from('.hero-word', {
			y: 70,
			opacity: 0,
			stagger: 0.08,
			duration: 0.8,
			ease: 'power3.out',
			delay: 0.1
		});

		// Search bar + pill fade in
		gsap.from('.hero-search', {
			y: 30,
			opacity: 0,
			duration: 0.6,
			ease: 'power2.out',
			delay: 0.55
		});

		// Stats counter animation
		ScrollTrigger.create({
			trigger: '.stats-section',
			start: 'top 85%',
			once: true,
			onEnter: () => {
				const statData = [
					{ proxy: { val: 0 }, target: STAT_TARGETS.markets, setter: (v: number) => (statMarkets = v) },
					{ proxy: { val: 0 }, target: STAT_TARGETS.states, setter: (v: number) => (statStates = v) },
					{ proxy: { val: 0 }, target: STAT_TARGETS.tonight, setter: (v: number) => (statTonight = v) },
					{ proxy: { val: 0 }, target: STAT_TARGETS.verified, setter: (v: number) => (statVerified = v) }
				];

				statData.forEach(({ proxy, target, setter }) => {
					gsap.to(proxy, {
						val: target,
						duration: 2,
						ease: 'power2.out',
						onUpdate: function () {
							setter(Math.round(proxy.val));
						}
					});
				});
			}
		});

		// Card reveal
		if (data.openTonight?.length) {
			ScrollTrigger.create({
				trigger: '.cards-section',
				start: 'top 88%',
				once: true,
				onEnter: () => {
					gsap.from('.cards-section .market-card', {
						y: 40,
						opacity: 0,
						stagger: 0.1,
						duration: 0.6,
						ease: 'power2.out'
					});
				}
			});
		}

		return () => {
			ScrollTrigger.getAll().forEach((t) => t.kill());
		};
	});
</script>

<svelte:head>
	<title>Pasar Malam Finder — Find Night Markets Near You</title>
</svelte:head>

<!-- ── HERO ──────────────────────────────────────────────────────── -->
<section class="relative min-h-[92vh] flex flex-col items-center justify-center px-4 overflow-hidden pt-10 pb-20">
	<!-- Dot grid background -->
	<div
		class="absolute inset-0 pointer-events-none"
		style="background-image: radial-gradient(circle, rgba(26,18,9,0.07) 1px, transparent 1px); background-size: 28px 28px;"
	></div>

	<!-- Red glow blob -->
	<div
		class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
		style="background: radial-gradient(circle, rgba(229,49,29,0.06) 0%, transparent 70%);"
	></div>

	<div class="relative z-10 text-center max-w-4xl mx-auto">
		<!-- Blinking pill tag -->
		<div class="hero-search inline-flex items-center gap-2 bg-red-tint border border-red-border rounded-full px-4 py-2 mb-8">
			<span class="w-2 h-2 rounded-full bg-primary animate-blink"></span>
			<span class="font-sora text-primary text-sm font-medium">
				{data.stats?.openTonight ?? 0} markets open tonight
			</span>
		</div>

		<!-- Heading: CARI / pasar malam / NEAR YOU -->
		<h1 class="leading-none mb-8 overflow-hidden">
			<span
				class="hero-word block font-anton text-ink uppercase tracking-tight"
				style="font-size: clamp(3.5rem, 11vw, 8rem);"
			>
				CARI
			</span>
			<span
				class="hero-word block font-instrument italic text-primary"
				style="font-size: clamp(3rem, 9vw, 7rem);"
			>
				pasar malam
			</span>
			<span
				class="hero-word block font-anton text-ink uppercase tracking-tight"
				style="font-size: clamp(3.5rem, 11vw, 8rem);"
			>
				NEAR YOU
			</span>
		</h1>

		<!-- Search bar -->
		<form onsubmit={handleSearch} class="hero-search w-full max-w-xl mx-auto">
			<div
				class="flex items-center bg-surface border-[1.5px] border-border rounded-xl h-12 px-3 gap-2 focus-within:border-primary transition-colors shadow-sm"
			>
				<svg class="w-5 h-5 text-muted shrink-0" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
					/>
				</svg>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by name, area or state…"
					class="flex-1 bg-transparent text-ink placeholder:text-muted text-sm font-sora focus:outline-none"
				/>
				<button
					type="submit"
					class="bg-primary text-white text-sm font-sora font-medium rounded-lg px-4 py-1.5 hover:bg-[#c4291a] transition-colors shrink-0"
				>
					Cari sekarang
				</button>
			</div>
		</form>
	</div>

	<!-- Scroll indicator -->
	<div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
		<span class="font-sora text-xs text-muted">Scroll</span>
		<svg class="w-4 h-4 text-muted animate-bounce" viewBox="0 0 20 20" fill="currentColor">
			<path
				fill-rule="evenodd"
				d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
			/>
		</svg>
	</div>
</section>

<!-- ── STATS ─────────────────────────────────────────────────────── -->
<section class="stats-section border-y border-border bg-surface">
	<div class="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
		{#each [
			{ id: 'markets', value: statMarkets, label: 'Pasar Malams' },
			{ id: 'states', value: statStates, label: 'States Covered' },
			{ id: 'tonight', value: statTonight, label: 'Open Tonight' },
			{ id: 'verified', value: statVerified, label: 'Verified Listings' }
		] as stat, i}
			<div
				class="text-center py-10 px-4 {i % 2 === 0 && i < 3
					? 'border-r border-border'
					: ''} {i < 2 ? 'border-b border-border md:border-b-0' : ''} {i === 1 ? 'md:border-r md:border-border' : ''} {i === 2 ? 'md:border-r md:border-border' : ''}"
			>
				<div class="font-anton text-primary text-4xl md:text-5xl tabular-nums">
					{stat.value}{stat.id !== 'states' ? '+' : ''}
				</div>
				<div class="font-sora text-muted text-sm mt-1.5">{stat.label}</div>
			</div>
		{/each}
	</div>
</section>

<!-- ── OPEN TONIGHT ──────────────────────────────────────────────── -->
<section class="cards-section py-16 md:py-24 px-4">
	<div class="max-w-6xl mx-auto">
		<div class="flex items-end justify-between mb-10">
			<div>
				<p class="font-sora text-primary text-sm font-semibold uppercase tracking-wider mb-2">
					Tonight
				</p>
				<h2 class="section-title">Open right now</h2>
			</div>
			<a href="/explore" class="btn-secondary text-sm py-2 px-5 hidden sm:block">
				See all →
			</a>
		</div>

		{#if data.openTonight && data.openTonight.length > 0}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each data.openTonight as market}
					<MarketCard {market} />
				{/each}
			</div>
			<div class="text-center mt-8 sm:hidden">
				<a href="/explore" class="btn-secondary">See all markets</a>
			</div>
		{:else}
			<div class="text-center py-16 bg-surface rounded-2xl border border-border">
				<div class="text-4xl mb-4">🌙</div>
				<p class="font-sora text-muted text-sm">No markets listed for tonight yet.</p>
				<a href="/submit" class="inline-block mt-4 btn-primary text-sm py-2 px-5">
					Add one →
				</a>
			</div>
		{/if}
	</div>
</section>

<!-- ── CTA BAND ──────────────────────────────────────────────────── -->
<section class="bg-ink py-20 px-4 relative overflow-hidden">
	<div
		class="absolute inset-0 pointer-events-none opacity-10"
		style="background-image: radial-gradient(circle, rgba(245,197,24,0.3) 1px, transparent 1px); background-size: 32px 32px;"
	></div>
	<div class="max-w-2xl mx-auto text-center relative z-10">
		<p class="font-sora text-sm font-medium uppercase tracking-widest text-accent mb-4">
			Know a pasar malam?
		</p>
		<h2 class="font-anton text-white text-4xl md:text-5xl tracking-tight mb-6">
			Help the community.<br />Submit a listing.
		</h2>
		<p class="font-sora text-[#a89880] text-sm mb-8 max-w-md mx-auto">
			All submissions are reviewed before going live. It only takes 2 minutes.
		</p>
		<a href="/submit" class="btn-primary inline-block text-base py-3 px-8">
			Submit a Market
		</a>
	</div>
</section>
