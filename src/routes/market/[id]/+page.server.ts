import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTodayName } from '$lib/utils';

export const load: PageServerLoad = async ({ depends, params, locals: { supabase, safeGetSession } }) => {
	depends('market:detail');
	const { user } = await safeGetSession();
	const today = getTodayName();

	const [{ data: market }, { data: reviews }, { data: related }] = await Promise.all([
		supabase.from('markets').select('*').eq('id', params.id).single(),
		supabase
			.from('reviews')
			.select('*, profiles(username)')
			.eq('market_id', params.id)
			.order('created_at', { ascending: false }),
		supabase
			.from('markets')
			.select('*')
			.neq('id', params.id)
			.eq('is_verified', true)
			.eq('is_active', true)
			.limit(3)
	]);

	if (!market) throw error(404, 'Market not found');

	let isFavorited = false;
	if (user) {
		const { data: fav } = await supabase
			.from('favorites')
			.select('id')
			.eq('user_id', user.id)
			.eq('market_id', params.id)
			.single();
		isFavorited = !!fav;
	}

	const avgRating =
		reviews && reviews.length > 0
			? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
			: 0;

	return {
		market,
		reviews: reviews ?? [],
		avgRating,
		isFavorited,
		related: related ?? [],
		user
	};
};
