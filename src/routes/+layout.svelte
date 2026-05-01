<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { onNavigate } from '$app/navigation';
	import { gsap } from 'gsap';
	import { supabaseStore, profileStore } from '$lib/stores';
	import Navbar from '$lib/components/Navbar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	let transitionBar: HTMLDivElement;

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

	// Page transition – thin red/amber gradient bar at top
	onNavigate(() => {
		if (!transitionBar) return;
		gsap.set(transitionBar, { scaleX: 0, opacity: 1 });

		return new Promise<void>((resolve) => {
			gsap.to(transitionBar, {
				scaleX: 0.85,
				duration: 0.28,
				ease: 'power2.out',
				onComplete: resolve
			});
		});
	});

	// After navigation completes, finish bar animation
	$effect(() => {
		// runs after each navigation settle
	});

	function finishTransition() {
		if (!transitionBar) return;
		gsap.to(transitionBar, {
			scaleX: 1,
			duration: 0.15,
			ease: 'power1.out',
			onComplete: () => {
				gsap.to(transitionBar, {
					opacity: 0,
					duration: 0.25,
					delay: 0.05,
					onComplete: () => gsap.set(transitionBar, { scaleX: 0, opacity: 1 })
				});
			}
		});
	}
</script>

<svelte:window onpageshow={finishTransition} />

<!-- Page transition indicator -->
<div class="page-transition-bar" bind:this={transitionBar}></div>

<Navbar user={data.user} profile={data.profile} />

<main>
	{@render children()}
</main>

<Toast />
<AuthModal supabase={data.supabase} />
