import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/?auth=required');

	const [{ data: profile }, { data: favorites }, { data: userReviews }] = await Promise.all([
		supabase.from('profiles').select('*').eq('id', user.id).single(),
		supabase
			.from('favorites')
			.select('*, markets(*)')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false }),
		supabase
			.from('reviews')
			.select('*, markets(name, id)')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
	]);

	let pendingReports = null;

	if (profile?.is_admin) {
		const { data: reports } = await supabase
			.from('reports')
			.select('*, markets(name, id), profiles(username)')
			.eq('status', 'pending')
			.order('created_at');
		pendingReports = reports;
	}

	return {
		profile,
		favorites: favorites ?? [],
		userReviews: userReviews ?? [],
		pendingReports
	};
};

export const actions: Actions = {
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
