import { writable } from 'svelte/store';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from './types';

// ── Supabase client store ──────────────────────────────────────────
export const supabaseStore = writable<SupabaseClient | null>(null);

// ── Current user profile ──────────────────────────────────────────
export const profileStore = writable<Profile | null>(null);

// ── Toast notifications ───────────────────────────────────────────
export type Toast = {
	id: string;
	type: 'success' | 'error' | 'info';
	message: string;
};

export const toastStore = writable<Toast[]>([]);

export function showToast(message: string, type: Toast['type'] = 'success') {
	const id = crypto.randomUUID();
	toastStore.update((t) => [...t, { id, type, message }]);
	setTimeout(() => {
		toastStore.update((t) => t.filter((x) => x.id !== id));
	}, 4000);
}

// ── Auth modal ────────────────────────────────────────────────────
export type AuthModalState = {
	open: boolean;
	message: string;
};

export const authModalStore = writable<AuthModalState>({ open: false, message: '' });

export function showAuthModal(message = 'Sign in to continue') {
	authModalStore.set({ open: true, message });
}

export function closeAuthModal() {
	authModalStore.set({ open: false, message: '' });
}
