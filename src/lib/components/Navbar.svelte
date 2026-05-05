<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { gsap } from 'gsap';
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
	let scrolled = $state(false);
	let menuEl: HTMLDivElement;
	let backdropEl: HTMLDivElement;

	const isHomePage = $derived(page.url.pathname === '/');
	const isTransparent = $derived(isHomePage && !scrolled);

	onMount(() => {
		const onScroll = () => { scrolled = window.scrollY > 60; };
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

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

	function openMenu() {
		menuOpen = true;
		document.body.style.overflow = 'hidden';
		gsap.set(menuEl, { visibility: 'visible', x: '100%' });
		gsap.set(backdropEl, { visibility: 'visible', opacity: 0, pointerEvents: 'auto' });
		gsap.to(menuEl, { x: '0%', duration: 0.45, ease: 'power3.inOut' });
		gsap.to(backdropEl, { opacity: 1, duration: 0.35, ease: 'power2.out' });
	}

	function closeMenu() {
		gsap.to(menuEl, {
			x: '100%',
			duration: 0.4,
			ease: 'power3.inOut',
			onComplete: () => {
				menuOpen = false;
				gsap.set(menuEl, { visibility: 'hidden' });
				document.body.style.overflow = '';
			}
		});
		gsap.to(backdropEl, {
			opacity: 0,
			duration: 0.3,
			ease: 'power2.in',
			onComplete: () => gsap.set(backdropEl, { visibility: 'hidden', pointerEvents: 'none' })
		});
	}

	function toggleMenu() {
		if (menuOpen) closeMenu();
		else openMenu();
	}
</script>

<nav
	class="fixed inset-x-0 top-0 z-50 transition-all duration-400"
	style="
		background: {isTransparent ? 'transparent' : 'rgba(250,245,235,0.97)'};
		backdrop-filter: {isTransparent ? 'none' : 'blur(14px)'};
		-webkit-backdrop-filter: {isTransparent ? 'none' : 'blur(14px)'};
		border-bottom: 1px solid {isTransparent ? 'transparent' : '#e0d8c8'};
	"
>
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
			<span class="font-anton transition-colors duration-400" style="font-size: 22px; letter-spacing: 0.04em; color: {isTransparent ? '#faf5eb' : '#1a1209'};">
				PASAR<span class="text-primary">.</span>FINDER
			</span>
		</a>

		<!-- Desktop center links -->
		<div class="hidden md:flex items-center gap-7">
			{#each navLinks as link}
				{@const isActive = page.url.pathname === link.href || (page.url.pathname === '/explore' && link.href.startsWith('/explore'))}
				<a
					href={link.href}
					class="font-sora transition-all duration-400"
					style="font-size: 14px; color: {isTransparent ? 'rgba(250,245,235,0.75)' : '#1a1209'}; opacity: {isActive ? '1' : '0.75'};"
					onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
					onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.opacity = isActive ? '1' : '0.75')}
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
						class="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"
						onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = isTransparent ? 'rgba(250,245,235,0.1)' : '#f0e9d6')}
						onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
					>
						<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-sora font-semibold text-sm">
							{(profile?.username ?? 'U')[0].toUpperCase()}
						</div>
						<span class="font-sora text-sm transition-colors duration-400" style="color: {isTransparent ? 'rgba(250,245,235,0.8)' : '#1a1209'};">{profile?.username ?? 'Account'}</span>
						<svg
							class="w-4 h-4 transition-transform {dropdownOpen ? 'rotate-180' : ''}"
							style="color: {isTransparent ? 'rgba(250,245,235,0.45)' : '#8a7d65'};"
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
					class="font-sora font-medium cursor-pointer transition-all duration-400 hover:opacity-85"
					style="
						background: {isTransparent ? 'rgba(250,245,235,0.1)' : '#1a1209'};
						border: 1px solid {isTransparent ? 'rgba(250,245,235,0.22)' : 'transparent'};
						color: {isTransparent ? '#faf5eb' : '#ffffff'};
						padding: 9px 16px; border-radius: 8px; font-size: 13px;
					"
				>
					Sign in
				</button>
			{/if}
		</div>

		<!-- Hamburger button -->
		<button
			onclick={toggleMenu}
			class="md:hidden p-2 rounded-lg transition-colors"
			aria-label="Menu"
		>
			<div class="w-5 flex flex-col gap-1.5">
				<span class="block h-0.5 transition-all duration-400 origin-center {menuOpen ? 'rotate-45 translate-y-2' : ''}" style="background: {isTransparent ? '#faf5eb' : '#1a1209'};"></span>
				<span class="block h-0.5 transition-all duration-400 {menuOpen ? 'opacity-0' : ''}" style="background: {isTransparent ? '#faf5eb' : '#1a1209'};"></span>
				<span class="block h-0.5 transition-all duration-400 origin-center {menuOpen ? '-rotate-45 -translate-y-2' : ''}" style="background: {isTransparent ? '#faf5eb' : '#1a1209'};"></span>
			</div>
		</button>
	</div>
</nav>

<!-- Backdrop (tablet: dims content behind drawer) -->
<div
	bind:this={backdropEl}
	class="fixed inset-0 z-[58] md:hidden"
	style="visibility: hidden; opacity: 0; pointer-events: none; background: rgba(26,18,9,0.45);"
	onclick={closeMenu}
	aria-hidden="true"
></div>

<!-- Slide-in menu panel -->
<div
	bind:this={menuEl}
	class="nav-drawer fixed top-0 right-0 z-[59] h-full flex flex-col md:hidden"
	style="visibility: hidden; transform: translateX(100%);"
>
	<!-- Panel header -->
	<div class="flex items-center justify-between px-6 py-5 shrink-0">
		<!-- Brand visible on mobile only -->
		<a href="/" onclick={closeMenu} class="sm:hidden flex items-center gap-2">
			<div
				class="w-6 h-6 bg-primary rounded-[5px] flex items-center justify-center"
				style="transform: rotate(-4deg);"
				aria-hidden="true"
			>
				<span class="font-anton text-white leading-none" style="font-size: 15px;">P</span>
			</div>
			<span class="font-anton text-white" style="font-size: 19px; letter-spacing: 0.04em;">
				PASAR<span class="text-primary">.</span>FINDER
			</span>
		</a>
		<span class="menu-label hidden sm:block font-anton" style="font-size: 18px; letter-spacing: 0.06em;">MENU</span>

		<!-- Close button -->
		<button
			onclick={closeMenu}
			class="close-btn p-2 rounded-lg transition-opacity hover:opacity-60"
			aria-label="Close menu"
		>
			<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
				<path d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- Nav links -->
	<div class="flex-1 flex flex-col px-6 overflow-y-auto">
		<nav class="flex flex-col mt-6 gap-2">
			{#each navLinks as link}
				<a
					href={link.href}
					onclick={closeMenu}
					class="nav-link font-anton transition-opacity hover:opacity-60 leading-tight"
					style="font-size: clamp(38px, 11vw, 52px); letter-spacing: 0.02em; opacity: {page.url.pathname.startsWith('/explore') && link.href.startsWith('/explore') ? '1' : page.url.pathname === link.href ? '1' : '0.35'};"
				>
					{link.label.toUpperCase()}
				</a>
			{/each}
		</nav>
	</div>

	<!-- Auth section -->
	<div class="shrink-0 px-6 pb-8 pt-4 auth-section">
		{#if user}
			<a
				href="/profile"
				onclick={closeMenu}
				class="flex items-center gap-3 px-4 py-3 rounded-xl transition-opacity hover:opacity-70"
			>
				<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-sora font-semibold text-sm shrink-0">
					{(profile?.username ?? user.email ?? 'U')[0].toUpperCase()}
				</div>
				<div>
					<p class="font-sora text-sm font-medium username-text">{profile?.username ?? 'Account'}</p>
					<p class="font-sora text-xs profile-label">My Profile</p>
				</div>
			</a>
			<button
				onclick={() => { closeMenu(); signOut(); }}
				class="w-full text-left font-sora text-sm px-4 py-3 rounded-xl transition-opacity hover:opacity-70 signout-btn"
			>
				Sign Out
			</button>
		{:else}
			<button
				onclick={() => { closeMenu(); showAuthModal(); }}
				class="w-full font-sora font-medium text-white cursor-pointer rounded-lg"
				style="background: #e5311d; padding: 13px 16px; border: none; font-size: 14px;"
			>
				Sign in
			</button>
		{/if}
	</div>
</div>

{#if dropdownOpen}
	<button
		class="fixed inset-0 z-40"
		onclick={() => (dropdownOpen = false)}
		aria-label="Close dropdown"
	></button>
{/if}

<style>
	/* Mobile: fullscreen dark panel */
	.nav-drawer {
		width: 100vw;
		background: #1a1209;
	}

	.nav-link {
		color: #ffffff;
	}

	.close-btn {
		color: rgba(255, 255, 255, 0.7);
	}

	.auth-section {
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.username-text {
		color: #ffffff;
	}

	.profile-label {
		color: rgba(255, 255, 255, 0.45);
	}

	.signout-btn {
		color: rgba(255, 255, 255, 0.4);
	}

	.menu-label {
		color: rgba(255, 255, 255, 0);
	}

	/* Tablet (sm+): side drawer, light theme */
	@media (min-width: 640px) {
		.menu-label {
			color: #1a1209;
			text-decoration: underline;
			text-decoration-color: #f97316;
			text-underline-offset: 5px;
			text-decoration-thickness: 2px;
		}
		.nav-drawer {
			width: 280px;
			background: #faf5eb;
			border-left: 1px solid #e0d8c8;
			box-shadow: -12px 0 40px rgba(26, 18, 9, 0.12);
		}

		.nav-link {
			color: #1a1209;
		}

		.close-btn {
			color: #8a7d65;
		}

		.auth-section {
			border-top: 1px solid #e0d8c8;
		}

		.username-text {
			color: #1a1209;
		}

		.profile-label {
			color: #8a7d65;
		}

		.signout-btn {
			color: #8a7d65;
		}
	}
</style>
