<script lang="ts">
	interface Props {
		type?: 'card' | 'text' | 'title';
		count?: number;
	}

	let { type = 'card', count = 3 }: Props = $props();
</script>

{#if type === 'card'}
	{#each Array(count) as _}
		<div class="bg-surface rounded-card border-[1.5px] border-border overflow-hidden">
			<div class="h-[3px] skeleton"></div>
			<div class="p-4 flex flex-col gap-3">
				<div class="flex justify-between gap-2">
					<div class="skeleton h-5 rounded w-2/3"></div>
					<div class="skeleton h-5 rounded w-16"></div>
				</div>
				<div class="skeleton h-4 rounded w-1/2"></div>
				<div class="skeleton h-3 rounded w-3/4"></div>
			</div>
		</div>
	{/each}
{:else if type === 'text'}
	{#each Array(count) as _}
		<div class="skeleton h-4 rounded w-full"></div>
	{/each}
{:else if type === 'title'}
	<div class="skeleton h-8 rounded w-1/3 mb-2"></div>
	<div class="skeleton h-4 rounded w-1/2"></div>
{/if}
