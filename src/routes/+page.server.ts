import type { PageServerLoad } from './$types';
import { getTodayName, DAYS } from '$lib/utils';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const today = getTodayName();

	const [
		{ data: allMarkets },
		{ data: openTonight },
		{ count: totalMarkets },
		{ count: totalReviews },
		{ data: recentReviews },
		{ data: allRatings }
	] = await Promise.all([
		supabase
			.from('markets')
			.select('*')
			.eq('is_verified', true)
			.eq('is_active', true)
			.order('created_at', { ascending: true }),
		supabase
			.from('markets')
			.select('id')
			.eq('is_verified', true)
			.eq('is_active', true)
			.contains('operating_days', [today]),
		supabase
			.from('markets')
			.select('*', { count: 'exact', head: true })
			.eq('is_verified', true),
		supabase
			.from('reviews')
			.select('*', { count: 'exact', head: true }),
		supabase
			.from('reviews')
			.select('*, profiles(username)')
			.order('created_at', { ascending: false })
			.limit(2),
		supabase.from('reviews').select('market_id, rating')
	]);

	// Per-day market counts (keyed by English day name)
	const dayCounts: Record<string, number> = {};
	DAYS.forEach((day) => {
		dayCounts[day] = (allMarkets ?? []).filter((m) => m.operating_days.includes(day)).length;
	});

	// Average rating per market
	const ratingsMap: Record<string, number> = {};
	(allRatings ?? []).forEach(({ market_id, rating }) => {
		if (!ratingsMap[market_id]) ratingsMap[market_id] = 0;
		ratingsMap[market_id] += rating;
	});
	const ratingCounts: Record<string, number> = {};
	(allRatings ?? []).forEach(({ market_id }) => {
		ratingCounts[market_id] = (ratingCounts[market_id] ?? 0) + 1;
	});
	Object.keys(ratingsMap).forEach((id) => {
		ratingsMap[id] = Math.round((ratingsMap[id] / ratingCounts[id]) * 10) / 10;
	});

	// Market index map for display numbers (№ 001, № 002…)
	const marketNumbers: Record<string, string> = {};
	(allMarkets ?? []).forEach((m, i) => {
		marketNumbers[m.id] = String(i + 1).padStart(3, '0');
	});

	return {
		allMarkets: allMarkets ?? [],
		featuredMarket: allMarkets?.[0] ?? null,
		dayCounts,
		marketNumbers,
		ratingsMap,
		recentReviews: recentReviews ?? [],
		stats: {
			totalMarkets: totalMarkets ?? 0,
			openTonight: openTonight?.length ?? 0,
			totalReviews: totalReviews ?? 0
		}
	};
};
