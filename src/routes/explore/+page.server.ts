import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, url }) => {
	const q = url.searchParams.get('q') ?? '';
	const day = url.searchParams.get('day') ?? '';
	const state = url.searchParams.get('state') ?? '';

	let query = supabase
		.from('markets')
		.select('*')
		.eq('is_verified', true)
		.eq('is_active', true);

	if (q) {
		query = query.or(`name.ilike.%${q}%,area.ilike.%${q}%,state.ilike.%${q}%`);
	}
	if (day) {
		query = query.contains('operating_days', [day]);
	}
	if (state) {
		query = query.eq('state', state);
	}

	const { data: markets } = await query.order('name');

	return { markets: markets ?? [], q, day, state };
};
