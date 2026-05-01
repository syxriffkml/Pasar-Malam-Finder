import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/?auth=required');

	const [
		{ data: profile },
		{ data: favorites },
		{ data: submitted },
		{ data: userReviews }
	] = await Promise.all([
		supabase.from('profiles').select('*').eq('id', user.id).single(),
		supabase
			.from('favorites')
			.select('*, markets(*)')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false }),
		supabase
			.from('markets')
			.select('*')
			.eq('submitted_by', user.id)
			.order('created_at', { ascending: false }),
		supabase
			.from('reviews')
			.select('*, markets(name, id)')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
	]);

	let unverifiedMarkets = null;
	let pendingReports = null;

	if (profile?.is_admin) {
		const [{ data: unverified }, { data: reports }] = await Promise.all([
			supabase.from('markets').select('*').eq('is_verified', false).order('created_at'),
			supabase
				.from('reports')
				.select('*, markets(name, id), profiles(username)')
				.eq('status', 'pending')
				.order('created_at')
		]);
		unverifiedMarkets = unverified;
		pendingReports = reports;
	}

	return {
		profile,
		favorites: favorites ?? [],
		submitted: submitted ?? [],
		userReviews: userReviews ?? [],
		unverifiedMarkets,
		pendingReports
	};
};

export const actions: Actions = {
	approveMarket: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return { error: 'Unauthorized' };
		const data = await request.formData();
		await supabase
			.from('markets')
			.update({ is_verified: true })
			.eq('id', data.get('marketId'));
		return { success: true };
	},

	rejectMarket: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return { error: 'Unauthorized' };
		const data = await request.formData();
		await supabase.from('markets').delete().eq('id', data.get('marketId'));
		return { success: true };
	},

	resolveReport: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return { error: 'Unauthorized' };
		const data = await request.formData();
		await supabase
			.from('reports')
			.update({ status: 'resolved' })
			.eq('id', data.get('reportId'));
		return { success: true };
	}
};
