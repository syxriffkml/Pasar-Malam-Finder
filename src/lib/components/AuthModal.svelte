<script lang="ts">
	import { authModalStore, closeAuthModal, showToast } from '$lib/stores';
	import { invalidateAll } from '$app/navigation';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { fade, scale } from 'svelte/transition';

	let { supabase }: { supabase: SupabaseClient } = $props();

	let isSignUp = $state(false);
	let email = $state('');
	let password = $state('');
	let username = $state('');
	let loading = $state(false);
	let errorMsg = $state('');
	let showPassword = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		errorMsg = '';

		if (isSignUp) {
			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: { data: { username } }
			});
			if (error) {
				errorMsg = error.message;
			} else {
				showToast('Account created! Check your email to verify.', 'success');
				closeAuthModal();
				reset();
			}
		} else {
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) {
				errorMsg = error.message;
			} else {
				showToast('Welcome back!', 'success');
				closeAuthModal();
				await invalidateAll();
				reset();
			}
		}
		loading = false;
	}

	function reset() {
		email = '';
		password = '';
		username = '';
		errorMsg = '';
	}

	function handleClose() {
		closeAuthModal();
		reset();
	}
</script>

<style>
	/* Hide browser native password reveal button (Edge/Chrome) */
	.password-input::-ms-reveal,
	.password-input::-ms-clear {
		display: none;
	}
	.password-input::-webkit-credentials-auto-fill-button,
	.password-input::-webkit-contacts-auto-fill-button {
		display: none;
	}
</style>

{#if $authModalStore.open}
	<div
		class="fixed inset-0 z-[200] flex items-center justify-center p-4"
		transition:fade={{ duration: 150 }}
	>
		<!-- Backdrop -->
		<button
			class="absolute inset-0 bg-ink/40 backdrop-blur-sm"
			onclick={handleClose}
			aria-label="Close"
		></button>

		<!-- Modal -->
		<div
			class="relative bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 z-10"
			transition:scale={{ start: 0.95, duration: 200 }}
		>
			<!-- Close -->
			<button
				onclick={handleClose}
				aria-label="Close modal"
				class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-soft-surface text-muted transition-colors"
			>
				<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
					/>
				</svg>
			</button>

			<!-- Header -->
			<div class="mb-6">
				<div class="w-10 h-10 bg-red-tint rounded-xl flex items-center justify-center mb-3">
					<svg class="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
						/>
					</svg>
				</div>
				<h2 class="font-anton text-xl text-ink">
					{isSignUp ? 'Create Account' : 'Welcome Back'}
				</h2>
				{#if $authModalStore.message}
					<p class="text-muted text-sm font-sora mt-1">{$authModalStore.message}</p>
				{/if}
			</div>

			<!-- Form -->
			<form onsubmit={handleSubmit} class="flex flex-col gap-3">
				{#if isSignUp}
					<div>
						<label class="block text-xs font-sora font-medium text-muted mb-1.5" for="username">
							Username
						</label>
						<input
							id="username"
							type="text"
							bind:value={username}
							placeholder="e.g. nasi_lemak_fan"
							class="input-field"
							required
						/>
					</div>
				{/if}

				<div>
					<label class="block text-xs font-sora font-medium text-muted mb-1.5" for="email">
						Email
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="you@example.com"
						class="input-field"
						required
					/>
				</div>

				<div>
					<label class="block text-xs font-sora font-medium text-muted mb-1.5" for="password">
						Password
					</label>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="••••••••"
							class="input-field pr-10 password-input"
							minlength="6"
							required
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{#if showPassword}
								<!-- Eye-slash -->
								<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/>
								</svg>
							{:else}
								<!-- Eye -->
								<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
									<circle cx="12" cy="12" r="3"/>
								</svg>
							{/if}
						</button>
					</div>
				</div>

				{#if errorMsg}
					<p class="text-primary text-xs font-sora bg-red-tint border border-red-border rounded-lg px-3 py-2">
						{errorMsg}
					</p>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="btn-primary w-full py-3 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{#if loading}
						<span class="inline-flex items-center gap-2">
							<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"></path>
							</svg>
							{isSignUp ? 'Creating...' : 'Signing in...'}
						</span>
					{:else}
						{isSignUp ? 'Create Account' : 'Sign In'}
					{/if}
				</button>
			</form>

			<!-- Toggle -->
			<p class="text-center text-sm font-sora text-muted mt-4">
				{isSignUp ? 'Already have an account?' : "Don't have an account?"}
				<button
					onclick={() => {
						isSignUp = !isSignUp;
						errorMsg = '';
					}}
					class="text-primary font-semibold hover:underline ml-1"
				>
					{isSignUp ? 'Sign In' : 'Sign Up'}
				</button>
			</p>
		</div>
	</div>
{/if}
