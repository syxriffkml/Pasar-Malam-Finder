<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabaseStore, showToast, showAuthModal } from '$lib/stores';
	import type { User } from '@supabase/supabase-js';
	import type { Profile } from '$lib/types';

	let {
		user,
		profile
	}: {
		user: User | null | undefined;
		profile: Profile | null | undefined;
	} = $props();

	let menuOpen = $state(false);
	let dropdownOpen = $state(false);

	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/explore', label: 'Explore' },
		{ href: '/submit', label: 'Submit' }
	];

	async function signOut() {
		const sb = $supabaseStore;
		if (!sb) return;
		await sb.auth.signOut();
		showToast('Signed out');
		goto('/');
	}

	function handleSubmitClick(e: MouseEvent) {
		if (!user) {
			e.preventDefault();
			showAuthModal('Sign in to submit a market');
		}
	}
</script>

<nav
	class="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-border"
	style="border-color: #e0d8c8"
>
	<div class="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2 shrink-0">
			<span class="font-anton text-ink text-xl tracking-tight leading-none">Pasar<br />Malam</span>
			<span
				class="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0"
				aria-hidden="true"
			>
				<span class="w-2 h-2 rounded-full bg-white"></span>
			</span>
		</a>

		<!-- Desktop nav -->
		<div class="hidden md:flex items-center gap-1">
			{#each navLinks as link}
				<a
					href={link.href}
					onclick={link.href === '/submit' ? handleSubmitClick : undefined}
					class="font-sora text-sm px-4 py-2 rounded-lg transition-colors
					{$page.url.pathname === link.href
						? 'text-primary font-semibold bg-red-tint'
						: 'text-muted hover:text-ink hover:bg-soft-surface'}"
				>
					{link.label}
				</a>
			{/each}
		</div>

		<!-- Desktop auth -->
		<div class="hidden md:flex items-center gap-2">
			{#if user}
				<div class="relative">
					<button
						onclick={() => (dropdownOpen = !dropdownOpen)}
						class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-soft-surface transition-colors"
					>
						<div
							class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-sora font-semibold text-sm"
						>
							{(profile?.username ?? user.email ?? 'U')[0].toUpperCase()}
						</div>
						<span class="font-sora text-sm text-ink">{profile?.username ?? 'Account'}</span>
						<svg
							class="w-4 h-4 text-muted transition-transform {dropdownOpen ? 'rotate-180' : ''}"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
							/>
						</svg>
					</button>

					{#if dropdownOpen}
						<div
							class="absolute right-0 top-full mt-2 w-44 bg-surface border border-border rounded-xl shadow-lg overflow-hidden"
						>
							<a
								href="/profile"
								onclick={() => (dropdownOpen = false)}
								class="flex items-center gap-2 px-4 py-3 text-sm font-sora text-ink hover:bg-soft-surface transition-colors"
							>
								<svg class="w-4 h-4 text-muted" viewBox="0 0 20 20" fill="currentColor">
									<path
										d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a4 4 0 118 0 4 4 0 01-8 0zM2 18a8 8 0 1116 0H2z"
									/>
								</svg>
								My Profile
							</a>
							<button
								onclick={signOut}
								class="w-full flex items-center gap-2 px-4 py-3 text-sm font-sora text-muted hover:bg-soft-surface transition-colors border-t border-border"
							>
								<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h7a1 1 0 000-2H4V5h6a1 1 0 000-2H3zm11.293 4.293a1 1 0 011.414 1.414L14.414 10l1.293 1.293a1 1 0 01-1.414 1.414L13 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L11.586 10l-1.293-1.293a1 1 0 011.414-1.414L13 8.586l1.293-1.293z"
									/>
								</svg>
								Sign Out
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<button onclick={() => showAuthModal()} class="btn-secondary text-sm py-2 px-5">
					Sign In
				</button>
			{/if}
		</div>

		<!-- Mobile hamburger -->
		<button
			onclick={() => (menuOpen = !menuOpen)}
			class="md:hidden p-2 rounded-lg hover:bg-soft-surface transition-colors"
			aria-label="Menu"
		>
			<div class="w-5 flex flex-col gap-1.5 transition-all">
				<span
					class="block h-0.5 bg-ink transition-transform origin-center {menuOpen
						? 'rotate-45 translate-y-2'
						: ''}"
				></span>
				<span class="block h-0.5 bg-ink transition-opacity {menuOpen ? 'opacity-0' : ''}"></span>
				<span
					class="block h-0.5 bg-ink transition-transform origin-center {menuOpen
						? '-rotate-45 -translate-y-2'
						: ''}"
				></span>
			</div>
		</button>
	</div>

	<!-- Mobile menu -->
	{#if menuOpen}
		<div class="md:hidden bg-surface border-t border-border px-4 py-4 flex flex-col gap-1">
			{#each navLinks as link}
				<a
					href={link.href}
					onclick={() => (menuOpen = false)}
					class="font-sora text-sm px-4 py-3 rounded-xl transition-colors
					{$page.url.pathname === link.href
						? 'text-primary font-semibold bg-red-tint'
						: 'text-ink hover:bg-soft-surface'}"
				>
					{link.label}
				</a>
			{/each}
			<div class="border-t border-border mt-2 pt-2">
				{#if user}
					<a
						href="/profile"
						onclick={() => (menuOpen = false)}
						class="block font-sora text-sm px-4 py-3 rounded-xl text-ink hover:bg-soft-surface"
					>
						My Profile
					</a>
					<button
						onclick={signOut}
						class="w-full text-left font-sora text-sm px-4 py-3 rounded-xl text-muted hover:bg-soft-surface"
					>
						Sign Out
					</button>
				{:else}
					<button
						onclick={() => {
							menuOpen = false;
							showAuthModal();
						}}
						class="w-full btn-primary text-sm py-2.5"
					>
						Sign In
					</button>
				{/if}
			</div>
		</div>
	{/if}
</nav>

<!-- Backdrop for dropdown -->
{#if dropdownOpen}
	<button
		class="fixed inset-0 z-40"
		onclick={() => (dropdownOpen = false)}
		aria-label="Close dropdown"
	></button>
{/if}
