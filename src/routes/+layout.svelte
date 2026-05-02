<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { invalidate, onNavigate, afterNavigate } from '$app/navigation';
	import { gsap } from 'gsap';
	import { supabaseStore, profileStore } from '$lib/stores';
	import Navbar from '$lib/components/Navbar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	let loaderEl: HTMLDivElement;
	let navCount = 0;

	// Sync supabase + profile into stores
	$effect(() => {
		supabaseStore.set(data.supabase);
		profileStore.set(data.profile ?? null);
	});

	// Listen for auth changes on the client
	onMount(() => {
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});
		return () => subscription.unsubscribe();
	});

	// Initial page load — animate words in then slide overlay up
	onMount(() => {
		const tl = gsap.timeline();
		tl.from('.loader-word', {
			y: 60,
			opacity: 0,
			stagger: 0.1,
			duration: 0.5,
			ease: 'power3.out'
		})
		.to(loaderEl, {
			yPercent: -100,
			duration: 0.7,
			ease: 'power4.inOut',
			delay: 0.5
		})
		.set(loaderEl, { display: 'none' });
	});

	// On every client-side navigation: flash the overlay in
	onNavigate(() => {
		if (!loaderEl) return;
		gsap.set(loaderEl, { display: 'flex', yPercent: 0 });
		gsap.set('.loader-word', { y: 60, opacity: 0 });

		return new Promise<void>((resolve) => {
			gsap.to('.loader-word', {
				y: 0,
				opacity: 1,
				stagger: 0.06,
				duration: 0.28,
				ease: 'power3.out',
				onComplete: resolve
			});
		});
	});

	// After new page renders: slide overlay out
	afterNavigate(() => {
		navCount++;
		if (navCount <= 1) return; // initial load is handled by onMount
		if (!loaderEl) return;
		gsap.to(loaderEl, {
			yPercent: -100,
			duration: 0.55,
			ease: 'power4.inOut',
			delay: 0.15,
			onComplete: () => gsap.set(loaderEl, { display: 'none', yPercent: 0 })
		});
	});
</script>

<!-- Global loading overlay -->
<div
	bind:this={loaderEl}
	class="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
	style="background: #1a1209;"
>
	<div class="overflow-hidden">
		<span class="loader-word inline-block font-anton text-white" style="font-size: clamp(48px, 10vw, 96px); letter-spacing: 0.04em;">PASAR</span>
	</div>
	<div class="overflow-hidden">
		<span class="loader-word inline-block serif-accent" style="font-size: clamp(40px, 9vw, 84px); -webkit-text-stroke: 0.6px #e5311d;">MALAM</span>
	</div>
	<div class="overflow-hidden mt-4">
		<span class="loader-word inline-block font-sora text-white/40" style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">Pasar Malam Finder</span>
	</div>
</div>

<Navbar user={data.user} profile={data.profile} />

<main>
	{@render children()}
</main>

<Toast />
<AuthModal supabase={data.supabase} />
