<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import MarketCard from '$lib/components/MarketCard.svelte';
	import StarRating from '$lib/components/StarRating.svelte';
	import { showToast } from '$lib/stores';
	import { formatDate } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let activeTab = $state<'favorites' | 'submitted' | 'reviews'>('favorites');
</script>

<svelte:head>
	<title>My Profile — Pasar Malam Finder</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 py-10">
	<!-- Profile header -->
	<div class="flex items-center gap-4 mb-10">
		<div
			class="w-14 h-14 rounded-full bg-primary text-white font-sora font-bold text-xl flex items-center justify-center shrink-0"
		>
			{(data.profile?.username ?? 'U')[0].toUpperCase()}
		</div>
		<div>
			<h1 class="font-anton text-3xl text-ink tracking-tight">
				{data.profile?.username ?? 'My Profile'}
			</h1>
			<div class="flex items-center gap-2 mt-1">
				{#if data.profile?.is_admin}
					<span class="bg-ink text-white text-xs font-sora font-semibold px-2.5 py-0.5 rounded-full">
						Admin
					</span>
				{/if}
				<span class="font-sora text-muted text-sm">
					{data.favorites.length} saved · {data.submitted.length} submitted
				</span>
			</div>
		</div>
	</div>

	<!-- Tab navigation -->
	<div class="flex gap-1 mb-8 border-b border-border">
		{#each [
			{ key: 'favorites', label: `Saved (${data.favorites.length})` },
			{ key: 'submitted', label: `Submitted (${data.submitted.length})` },
			{ key: 'reviews', label: `Reviews (${data.userReviews.length})` }
		] as tab}
			<button
				onclick={() => (activeTab = tab.key as typeof activeTab)}
				class="pb-3 px-4 font-sora text-sm font-medium border-b-2 transition-all
				{activeTab === tab.key
					? 'border-primary text-primary'
					: 'border-transparent text-muted hover:text-ink'}"
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Tab: Saved markets -->
	{#if activeTab === 'favorites'}
		{#if data.favorites.length === 0}
			<div class="text-center py-16 bg-surface rounded-2xl border border-border">
				<div class="text-4xl mb-3">💾</div>
				<p class="font-sora text-muted text-sm">No saved markets yet.</p>
				<a href="/explore" class="inline-block mt-4 btn-primary text-sm py-2 px-6">Explore Markets</a>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each data.favorites as fav}
					{#if fav.markets}
						<MarketCard market={fav.markets} />
					{/if}
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Tab: Submitted markets -->
	{#if activeTab === 'submitted'}
		{#if data.submitted.length === 0}
			<div class="text-center py-16 bg-surface rounded-2xl border border-border">
				<div class="text-4xl mb-3">📍</div>
				<p class="font-sora text-muted text-sm">You haven't submitted any markets yet.</p>
				<a href="/submit" class="inline-block mt-4 btn-primary text-sm py-2 px-6">Submit a Market</a>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each data.submitted as market}
					<a
						href="/market/{market.id}"
						class="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-red-border transition-colors"
					>
						<div class="min-w-0">
							<h3 class="font-anton text-lg text-ink truncate">{market.name}</h3>
							<p class="font-sora text-sm text-muted mt-0.5">{market.area}, {market.state}</p>
						</div>
						<div class="shrink-0">
							{#if market.is_verified}
								<span class="badge-verified">Verified</span>
							{:else}
								<span class="badge-pending">Pending Review</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Tab: Reviews -->
	{#if activeTab === 'reviews'}
		{#if data.userReviews.length === 0}
			<div class="text-center py-16 bg-surface rounded-2xl border border-border">
				<div class="text-4xl mb-3">⭐</div>
				<p class="font-sora text-muted text-sm">No reviews yet.</p>
			</div>
		{:else}
			<div class="flex flex-col gap-4">
				{#each data.userReviews as review}
					<div class="bg-surface border border-border rounded-2xl p-4">
						<div class="flex items-start justify-between gap-3 mb-2">
							<div>
								<a href="/market/{review.markets?.id}" class="font-anton text-lg text-ink hover:text-primary transition-colors">
									{review.markets?.name ?? 'Unknown Market'}
								</a>
								<div class="mt-1">
									<StarRating value={review.rating} size="sm" />
								</div>
							</div>
							<p class="font-sora text-xs text-muted shrink-0">{formatDate(review.created_at)}</p>
						</div>
						{#if review.comment}
							<p class="font-sora text-sm text-muted leading-relaxed">{review.comment}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- ── ADMIN PANEL ─────────────────────────────────────────── -->
	{#if data.profile?.is_admin}
		<div class="mt-16 pt-10 border-t border-border">
			<div class="flex items-center gap-3 mb-8">
				<span class="bg-ink text-white text-xs font-sora font-bold px-3 py-1 rounded-full uppercase tracking-wide">
					Admin
				</span>
				<h2 class="font-anton text-2xl text-ink">Admin Panel</h2>
			</div>

			<!-- Unverified markets -->
			<div class="mb-10">
				<h3 class="font-sora font-semibold text-sm text-muted uppercase tracking-wider mb-4">
					Pending Markets ({data.unverifiedMarkets?.length ?? 0})
				</h3>
				{#if !data.unverifiedMarkets?.length}
					<p class="font-sora text-sm text-muted py-4 text-center bg-surface rounded-xl border border-border">
						All caught up!
					</p>
				{:else}
					<div class="flex flex-col gap-3">
						{#each data.unverifiedMarkets as market}
							<div class="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between gap-4">
								<div class="min-w-0">
									<h4 class="font-anton text-lg text-ink truncate">{market.name}</h4>
									<p class="font-sora text-sm text-muted">{market.area}, {market.state}</p>
								</div>
								<div class="flex items-center gap-2 shrink-0">
									<form
										method="POST"
										action="?/approveMarket"
										use:enhance={() => {
											return async ({ result }) => {
												if (result.type === 'success') {
													showToast(`${market.name} approved`);
													invalidateAll();
												}
											};
										}}
									>
										<input type="hidden" name="marketId" value={market.id} />
										<button type="submit" class="btn-primary text-sm py-1.5 px-4">
											Approve
										</button>
									</form>
									<form
										method="POST"
										action="?/rejectMarket"
										use:enhance={() => {
											return async ({ result }) => {
												if (result.type === 'success') {
													showToast(`Market rejected`, 'error');
													invalidateAll();
												}
											};
										}}
									>
										<input type="hidden" name="marketId" value={market.id} />
										<button type="submit" class="btn-ghost text-sm text-primary">
											Reject
										</button>
									</form>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Pending reports -->
			<div>
				<h3 class="font-sora font-semibold text-sm text-muted uppercase tracking-wider mb-4">
					Open Reports ({data.pendingReports?.length ?? 0})
				</h3>
				{#if !data.pendingReports?.length}
					<p class="font-sora text-sm text-muted py-4 text-center bg-surface rounded-xl border border-border">
						No open reports.
					</p>
				{:else}
					<div class="flex flex-col gap-3">
						{#each data.pendingReports as report}
							<div class="bg-surface border border-border rounded-2xl p-4">
								<div class="flex items-start justify-between gap-4">
									<div class="min-w-0">
										<div class="flex items-center gap-2 mb-1">
											<span class="badge-pending capitalize">{report.type}</span>
											<p class="font-sora text-sm font-semibold text-ink truncate">
												{report.markets?.name}
											</p>
										</div>
										<p class="font-sora text-xs text-muted">
											Reported by {report.profiles?.username ?? 'Anonymous'} · {formatDate(report.created_at)}
										</p>
										{#if report.notes}
											<p class="font-sora text-sm text-muted mt-2 italic">"{report.notes}"</p>
										{/if}
									</div>
									<form
										method="POST"
										action="?/resolveReport"
										use:enhance={() => {
											return async ({ result }) => {
												if (result.type === 'success') {
													showToast('Report resolved');
													invalidateAll();
												}
											};
										}}
									>
										<input type="hidden" name="reportId" value={report.id} />
										<button type="submit" class="btn-secondary text-sm py-1.5 px-4 shrink-0">
											Resolve
										</button>
									</form>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
