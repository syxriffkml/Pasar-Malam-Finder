<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { supabaseStore, profileStore } from '$lib/stores';
	import Navbar from '$lib/components/Navbar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

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
</script>

<Navbar user={data.user} profile={data.profile} />

<main>
	{@render children()}
</main>

<Toast />
<AuthModal supabase={data.supabase} />
