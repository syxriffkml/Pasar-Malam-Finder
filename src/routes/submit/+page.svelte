<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { gsap } from 'gsap';
	import { DAYS, STATES } from '$lib/utils';
	import { supabaseStore, showToast, showAuthModal, profileStore } from '$lib/stores';

	// Form state
	let step = $state(1);
	const TOTAL_STEPS = 3;

	// Step 1
	let marketName = $state('');
	let marketState = $state('');
	let area = $state('');
	let address = $state('');

	// Step 2
	let selectedDays: string[] = $state([]);
	let startTime = $state('17:00');
	let endTime = $state('23:00');
	let description = $state('');

	// Submission
	let loading = $state(false);
	let submitted = $state(false);
	let submittedMarketId = $state('');

	// DOM refs
	let steps: HTMLElement[] = [];
	let progressBar: HTMLDivElement = $state() as HTMLDivElement;

	function toggleDay(day: string) {
		if (selectedDays.includes(day)) {
			selectedDays = selectedDays.filter((d) => d !== day);
		} else {
			selectedDays = [...selectedDays, day];
		}
	}

	async function animateToStep(nextStep: number) {
		const currentEl = steps[step - 1];
		const nextEl = steps[nextStep - 1];
		if (!currentEl || !nextEl) {
			step = nextStep;
			return;
		}

		// Exit current
		await gsap.to(currentEl, {
			x: nextStep > step ? -60 : 60,
			opacity: 0,
			duration: 0.3,
			ease: 'power2.in'
		});
		currentEl.style.display = 'none';

		// Animate progress bar
		gsap.to(progressBar, {
			width: `${((nextStep - 1) / (TOTAL_STEPS - 1)) * 100}%`,
			duration: 0.4,
			ease: 'power2.out'
		});

		step = nextStep;
		nextEl.style.display = 'block';

		// Enter next
		gsap.from(nextEl, {
			x: nextStep > step - 1 ? 60 : -60,
			opacity: 0,
			duration: 0.4,
			ease: 'power2.out'
		});
	}

	function goNext() {
		if (step === 1) {
			if (!marketName.trim() || !marketState || !area.trim() || !address.trim()) {
				showToast('Please fill in all fields', 'error');
				return;
			}
		}
		if (step === 2) {
			if (selectedDays.length === 0) {
				showToast('Please select at least one operating day', 'error');
				return;
			}
		}
		if (step < TOTAL_STEPS) animateToStep(step + 1);
	}

	function goPrev() {
		if (step > 1) animateToStep(step - 1);
	}

	async function handleSubmit() {
		const user = $profileStore;
		const sb = $supabaseStore;
		if (!sb) return;
		if (!user) {
			showAuthModal('Sign in to submit a market');
			return;
		}

		loading = true;
		const { data, error } = await sb
			.from('markets')
			.insert({
				name: marketName.trim(),
				state: marketState,
				area: area.trim(),
				address: address.trim(),
				operating_days: selectedDays,
				start_time: startTime,
				end_time: endTime,
				description: description.trim(),
				lat: 0,
				lng: 0,
				is_verified: false,
				is_active: true,
				submitted_by: user.id
			})
			.select()
			.single();
		loading = false;

		if (error) {
			showToast(error.message, 'error');
		} else {
			submittedMarketId = data.id;
			submitted = true;

			// Animate success
			gsap.from('.success-card', {
				scale: 0.9,
				opacity: 0,
				duration: 0.6,
				ease: 'back.out(1.5)'
			});
		}
	}

	onMount(() => {
		// Init step display state
		steps.forEach((el, i) => {
			if (el) el.style.display = i === 0 ? 'block' : 'none';
		});

		// Progress bar initial
		gsap.set(progressBar, { width: '0%' });

		// Animate first step in
		if (steps[0]) {
			gsap.from(steps[0], { x: 40, opacity: 0, duration: 0.5, ease: 'power2.out' });
		}
	});
</script>

<svelte:head>
	<title>Submit a Market — Pasar Malam Finder</title>
</svelte:head>

{#if submitted}
	<!-- Success screen -->
	<div class="min-h-[80vh] flex items-center justify-center px-4">
		<div class="success-card text-center max-w-sm">
			<div
				class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
			>
				<svg class="w-8 h-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
					/>
				</svg>
			</div>
			<h1 class="font-anton text-3xl text-ink mb-3">Submitted!</h1>
			<p class="font-sora text-muted text-sm mb-8 leading-relaxed">
				Your listing has been received and will be reviewed by our team before going live. Thank
				you for contributing!
			</p>
			<div class="flex flex-col gap-3">
				<a href="/market/{submittedMarketId}" class="btn-primary w-full py-3 text-center">
					View Your Listing
				</a>
				<a href="/" class="btn-secondary w-full py-3 text-center"> Back to Home </a>
			</div>
		</div>
	</div>
{:else}
	<div class="max-w-2xl mx-auto px-4 py-12">
		<!-- Header -->
		<div class="mb-8">
			<p class="font-sora text-primary text-sm font-semibold uppercase tracking-wider mb-2">
				New Listing
			</p>
			<h1 class="font-anton text-4xl text-ink tracking-tight">Submit a Market</h1>
			<p class="font-sora text-muted text-sm mt-2">
				All submissions are reviewed before going live. Takes 2 minutes.
			</p>
		</div>

		<!-- Progress bar -->
		<div class="mb-8">
			<div class="flex justify-between mb-2">
				{#each Array(TOTAL_STEPS) as _, i}
					<div class="flex items-center gap-2 {i < TOTAL_STEPS - 1 ? 'flex-1' : ''}">
						<div
							class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-sora font-semibold shrink-0 transition-all
							{step > i + 1
								? 'bg-primary text-white'
								: step === i + 1
									? 'bg-primary text-white ring-4 ring-red-tint'
									: 'bg-soft-surface text-muted'}"
						>
							{#if step > i + 1}
								<svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
								</svg>
							{:else}
								{i + 1}
							{/if}
						</div>
						{#if i < TOTAL_STEPS - 1}
							<div class="flex-1 h-0.5 bg-border rounded-full overflow-hidden">
								<div
									class="h-full bg-primary rounded-full transition-all duration-500"
									style="width: {step > i + 1 ? 100 : 0}%"
								></div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
			<div class="flex justify-between">
				<span class="font-sora text-xs text-muted">Basic Info</span>
				<span class="font-sora text-xs text-muted">Schedule</span>
				<span class="font-sora text-xs text-muted">Review</span>
			</div>
		</div>

		<!-- Invisible progress bar for GSAP (hidden visual ref) -->
		<div class="hidden">
			<div bind:this={progressBar}></div>
		</div>

		<!-- Step panels -->
		<div class="bg-surface border border-border rounded-2xl p-6 md:p-8 relative overflow-hidden">
			<!-- Step 1: Basic Info -->
			<div bind:this={steps[0]}>
				<h2 class="font-anton text-2xl text-ink mb-6">Basic Information</h2>
				<div class="flex flex-col gap-4">
					<div>
						<label class="font-sora text-xs text-muted font-medium mb-1.5 block" for="market-name">
							Market Name <span class="text-primary">*</span>
						</label>
						<input
							id="market-name"
							type="text"
							bind:value={marketName}
							placeholder="e.g. Pasar Malam SS2"
							class="input-field"
						/>
					</div>
					<div>
						<label class="font-sora text-xs text-muted font-medium mb-1.5 block" for="market-state">
							State <span class="text-primary">*</span>
						</label>
						<select id="market-state" bind:value={marketState} class="input-field appearance-none">
							<option value="">Select a state</option>
							{#each STATES as s}
								<option value={s}>{s}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="font-sora text-xs text-muted font-medium mb-1.5 block" for="market-area">
							Area / Neighbourhood <span class="text-primary">*</span>
						</label>
						<input
							id="market-area"
							type="text"
							bind:value={area}
							placeholder="e.g. Petaling Jaya"
							class="input-field"
						/>
					</div>
					<div>
						<label class="font-sora text-xs text-muted font-medium mb-1.5 block" for="market-address">
							Full Address <span class="text-primary">*</span>
						</label>
						<input
							id="market-address"
							type="text"
							bind:value={address}
							placeholder="Street address"
							class="input-field"
						/>
					</div>
				</div>
			</div>

			<!-- Step 2: Schedule -->
			<div bind:this={steps[1]} style="display:none">
				<h2 class="font-anton text-2xl text-ink mb-6">Schedule & Details</h2>
				<div class="flex flex-col gap-5">
					<div>
						<p class="font-sora text-xs text-muted font-medium mb-2.5">
							Operating Days <span class="text-primary">*</span>
						</p>
						<div class="flex flex-wrap gap-2">
							{#each DAYS as day}
								<button
									type="button"
									onclick={() => toggleDay(day)}
									class="day-pill {selectedDays.includes(day) ? 'active' : ''}"
								>
									{day.slice(0, 3)}
								</button>
							{/each}
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="font-sora text-xs text-muted font-medium mb-1.5 block" for="start-time">
								Opening Time
							</label>
							<input id="start-time" type="time" bind:value={startTime} class="input-field" />
						</div>
						<div>
							<label class="font-sora text-xs text-muted font-medium mb-1.5 block" for="end-time">
								Closing Time
							</label>
							<input id="end-time" type="time" bind:value={endTime} class="input-field" />
						</div>
					</div>

					<div>
						<label class="font-sora text-xs text-muted font-medium mb-1.5 block" for="description">
							Description
						</label>
						<textarea
							id="description"
							bind:value={description}
							placeholder="Describe the market — what's special about it, popular stalls, etc."
							rows="4"
							class="input-field resize-none"
						></textarea>
					</div>
				</div>
			</div>

			<!-- Step 3: Review -->
			<div bind:this={steps[2]} style="display:none">
				<h2 class="font-anton text-2xl text-ink mb-6">Review & Submit</h2>
				<div class="flex flex-col gap-4">
					<!-- Summary card -->
					<div class="bg-soft-surface rounded-2xl p-5 flex flex-col gap-3">
						<div>
							<p class="font-sora text-xs text-muted">Market Name</p>
							<p class="font-anton text-xl text-ink mt-0.5">{marketName}</p>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<p class="font-sora text-xs text-muted">State</p>
								<p class="font-sora text-sm text-ink mt-0.5">{marketState}</p>
							</div>
							<div>
								<p class="font-sora text-xs text-muted">Area</p>
								<p class="font-sora text-sm text-ink mt-0.5">{area}</p>
							</div>
						</div>
						<div>
							<p class="font-sora text-xs text-muted">Address</p>
							<p class="font-sora text-sm text-ink mt-0.5">{address}</p>
						</div>
						<div>
							<p class="font-sora text-xs text-muted">Operating Days</p>
							<p class="font-sora text-sm text-ink mt-0.5">
								{selectedDays.join(', ') || '—'}
							</p>
						</div>
						<div>
							<p class="font-sora text-xs text-muted">Hours</p>
							<p class="font-sora text-sm text-ink mt-0.5">{startTime} – {endTime}</p>
						</div>
						{#if description}
							<div>
								<p class="font-sora text-xs text-muted">Description</p>
								<p class="font-sora text-sm text-ink mt-0.5 line-clamp-3">{description}</p>
							</div>
						{/if}
					</div>

					<p class="font-sora text-xs text-muted bg-red-tint border border-red-border rounded-xl px-4 py-3">
						Your listing will be reviewed before it appears publicly. We typically review within
						24–48 hours.
					</p>
				</div>
			</div>
		</div>

		<!-- Navigation buttons -->
		<div class="flex items-center justify-between mt-6">
			<button
				onclick={goPrev}
				class="btn-secondary py-2.5 px-6 {step === 1 ? 'invisible' : ''}"
				disabled={step === 1}
			>
				← Back
			</button>

			{#if step < TOTAL_STEPS}
				<button onclick={goNext} class="btn-primary py-2.5 px-8">
					Next →
				</button>
			{:else}
				<button
					onclick={handleSubmit}
					disabled={loading}
					class="btn-primary py-2.5 px-8 disabled:opacity-60"
				>
					{loading ? 'Submitting…' : 'Submit Listing'}
				</button>
			{/if}
		</div>
	</div>
{/if}
