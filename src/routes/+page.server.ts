import type { PageServerLoad } from './$types';
import { getTodayName } from '$lib/utils';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const today = getTodayName();

	const [{ data: openTonight }, { count: totalMarkets }, { count: statesCount }] =
		await Promise.all([
			supabase
				.from('markets')
				.select('*')
				.eq('is_verified', true)
				.eq('is_active', true)
				.contains('operating_days', [today])
				.order('created_at', { ascending: false })
				.limit(6),
			supabase
				.from('markets')
				.select('*', { count: 'exact', head: true })
				.eq('is_verified', true),
			supabase
				.from('markets')
				.select('state', { count: 'exact', head: true })
				.eq('is_verified', true)
		]);

	return {
		openTonight: openTonight ?? [],
		stats: {
			totalMarkets: totalMarkets ?? 0,
			openTonight: openTonight?.length ?? 0
		}
	};
};
