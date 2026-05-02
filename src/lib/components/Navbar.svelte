<script lang="ts">
	import { page } from '$app/state';
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
		{ href: '/explore', label: 'Markets' },
		{ href: '/explore#map', label: 'Map' },
		{ href: '/explore#reviews', label: 'Reviews' }
	];

	async function signOut() {
		const sb = $supabaseStore;
		if (!sb) return;
		await sb.auth.signOut();
		showToast('Signed out');
		goto('/');
	}


</script>

<nav class="sticky top-0 z-50 bg-cream/95 backdrop-blur-md" style="border-bottom: 1px solid #e0d8c8;">
	<div class="max-w-[1180px] mx-auto px-8 flex items-center justify-between" style="padding-top: 22px; padding-bottom: 22px;">

		<!-- Brand -->
		<a href="/" class="flex items-center gap-2.5 shrink-0">
			<div
				class="w-7 h-7 bg-primary rounded-[6px] flex items-center justify-center"
				style="transform: rotate(-4deg);"
				aria-hidden="true"
			>
				<span class="font-anton text-white leading-none" style="font-size: 18px;">P</span>
			</div>
			<span class="font-anton text-ink" style="font-size: 22px; letter-spacing: 0.04em;">
				PASAR<span class="text-primary">.</span>FINDER
			</span>
		</a>

		<!-- Desktop center links -->
		<div class="hidden md:flex items-center gap-7">
			{#each navLinks as link}
				<a
					href={link.href}
					class="font-sora text-ink transition-opacity"
					style="font-size: 14px; opacity: {page.url.pathname === link.href || (page.url.pathname === '/explore' && link.href.startsWith('/explore')) ? '1' : '0.75'};"
					onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
					onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.opacity = page.url.pathname === '/explore' && link.href.startsWith('/explore') ? '1' : page.url.pathname === link.href ? '1' : '0.75')}
				>
					{link.label}
				</a>
			{/each}
		</div>

		<!-- Desktop auth -->
		<div class="hidden md:flex items-center gap-3 shrink-0">
			{#if user}
				<div class="relative">
					<button
						onclick={() => (dropdownOpen = !dropdownOpen)}
						class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-soft-surface transition-colors"
					>
						<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-sora font-semibold text-sm">
							{(profile?.username ?? user.email ?? 'U')[0].toUpperCase()}
						</div>
						<span class="font-sora text-sm text-ink">{profile?.username ?? 'Account'}</span>
						<svg
							class="w-4 h-4 text-muted transition-transform {dropdownOpen ? 'rotate-180' : ''}"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
						</svg>
					</button>

					{#if dropdownOpen}
						<div class="absolute right-0 top-full mt-2 w-44 bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
							<a
								href="/profile"
								onclick={() => (dropdownOpen = false)}
								class="flex items-center gap-2 px-4 py-3 text-sm font-sora text-ink hover:bg-soft-surface transition-colors"
							>
								<svg class="w-4 h-4 text-muted" viewBox="0 0 20 20" fill="currentColor">
									<path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a4 4 0 118 0 4 4 0 01-8 0zM2 18a8 8 0 1116 0H2z" />
								</svg>
								My Profile
							</a>
							<button
								onclick={signOut}
								class="w-full flex items-center gap-2 px-4 py-3 text-sm font-sora text-muted hover:bg-soft-surface transition-colors border-t border-border"
							>
								<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h7a1 1 0 000-2H4V5h6a1 1 0 000-2H3zm11.293 4.293a1 1 0 011.414 1.414L14.414 10l1.293 1.293a1 1 0 01-1.414 1.414L13 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L11.586 10l-1.293-1.293a1 1 0 011.414-1.414L13 8.586l1.293-1.293z" />
								</svg>
								Sign Out
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<button
					onclick={() => showAuthModal()}
					class="font-sora font-medium text-white cursor-pointer transition-opacity hover:opacity-80"
					style="background: #1a1209; padding: 9px 16px; border-radius: 8px; font-size: 13px; border: none;"
				>
					Sign in
				</button>
			{/if}
		</div>

		<!-- Mobile hamburger -->
		<button
			onclick={() => (menuOpen = !menuOpen)}
			class="md:hidden p-2 rounded-lg hover:bg-soft-surface transition-colors"
			aria-label="Menu"
		>
			<div class="w-5 flex flex-col gap-1.5">
				<span class="block h-0.5 bg-ink transition-transform origin-center {menuOpen ? 'rotate-45 translate-y-2' : ''}"></span>
				<span class="block h-0.5 bg-ink transition-opacity {menuOpen ? 'opacity-0' : ''}"></span>
				<span class="block h-0.5 bg-ink transition-transform origin-center {menuOpen ? '-rotate-45 -translate-y-2' : ''}"></span>
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
					{page.url.pathname === link.href ? 'text-primary font-semibold bg-red-tint' : 'text-ink hover:bg-soft-surface'}"
				>
					{link.label}
				</a>
			{/each}
			<div class="border-t border-border mt-2 pt-2">
				{#if user}
					<a href="/profile" onclick={() => (menuOpen = false)} class="block font-sora text-sm px-4 py-3 rounded-xl text-ink hover:bg-soft-surface">
						My Profile
					</a>
					<button onclick={signOut} class="w-full text-left font-sora text-sm px-4 py-3 rounded-xl text-muted hover:bg-soft-surface">
						Sign Out
					</button>
				{:else}
					<button
						onclick={() => { menuOpen = false; showAuthModal(); }}
						class="w-full font-sora font-medium text-white cursor-pointer"
						style="background: #1a1209; padding: 12px; border-radius: 8px; font-size: 14px; border: none;"
					>
						Sign in
					</button>
				{/if}
			</div>
		</div>
	{/if}
</nav>

{#if dropdownOpen}
	<button
		class="fixed inset-0 z-40"
		onclick={() => (dropdownOpen = false)}
		aria-label="Close dropdown"
	></button>
{/if}
