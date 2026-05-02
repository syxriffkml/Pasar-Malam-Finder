// Generates realistic seed reviews for all markets using the 12 seed users.
// Usage: node scripts/generate-reviews.js
// Run AFTER import-osm.js. Seed users must already exist (created by this script if missing).

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
const env = Object.fromEntries(
	readFileSync(envPath, 'utf8')
		.split('\n')
		.filter((l) => l.includes('=') && !l.startsWith('#'))
		.map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const supabase = createClient(env['PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_KEY'], {
	auth: { autoRefreshToken: false, persistSession: false }
});

const SEED_USERS = [
	{ username: 'amirul_kl',     email: 'amirul_kl@seed.pasarfinder.my' },
	{ username: 'siti_foodie',   email: 'siti_foodie@seed.pasarfinder.my' },
	{ username: 'hafiz_jalan',   email: 'hafiz_jalan@seed.pasarfinder.my' },
	{ username: 'nurul_eats',    email: 'nurul_eats@seed.pasarfinder.my' },
	{ username: 'razif_market',  email: 'razif_market@seed.pasarfinder.my' },
	{ username: 'farah_makan',   email: 'farah_makan@seed.pasarfinder.my' },
	{ username: 'daniel_kl',     email: 'daniel_kl@seed.pasarfinder.my' },
	{ username: 'mei_ling_88',   email: 'mei_ling_88@seed.pasarfinder.my' },
	{ username: 'ravi_foodhunt', email: 'ravi_foodhunt@seed.pasarfinder.my' },
	{ username: 'aishah_pm',     email: 'aishah_pm@seed.pasarfinder.my' },
	{ username: 'zul_street',    email: 'zul_street@seed.pasarfinder.my' },
	{ username: 'linda_kl',      email: 'linda_kl@seed.pasarfinder.my' },
];

// rating → pool of comments
const REVIEW_POOLS = {
	5: [
		'Absolutely love this place! The variety of food stalls is amazing — everything from nasi lemak to grilled seafood. Always come back every week.',
		'Best pasar malam in the area! The char kuey teow here is unbeatable. Parking can be tricky but totally worth it.',
		'Sangat best! Pelbagai jenis makanan tersedia. Harga pun berpatutan. Wajib datang kalau nak makan sedap!',
		'One of my favourite weekly spots. The atmosphere is great, stalls are clean, and the food is freshly made. Highly recommend the grilled chicken!',
		'Came here with the whole family and everyone loved it. Kids enjoyed the kuih-muih section. Will definitely be back!',
		'The rojak and cendol here are top tier. Market is well-organised and not too overcrowded. A solid 5 stars.',
		'Murah, sedap, dan suasana yang meriah! Ini adalah pasar malam kegemaran saya. Datang awal kalau nak elak sesak.',
		'Great selection of Malay, Chinese, and Indian food all in one place. The freshly squeezed juices are a must-try!',
	],
	4: [
		'Good market overall. Lots of food options and the prices are reasonable. Gets a bit crowded on weekends though.',
		'Nice pasar malam! The satay stall near the entrance is really good. Parking is a bit limited but manageable.',
		'Decent variety of stalls. Food quality is generally good. Wish they had more seating area but still enjoyable.',
		'Selalu datang sini setiap minggu. Makanan sedap dan harga okay. Kadang-kadang ada stall baru yang menarik.',
		'Pretty good experience. The mee goreng mamak and apam balik here are worth trying. Can get busy after 7pm.',
		'Solid pasar malam. The produce section has really fresh vegetables and fruits at fair prices. Food stalls are tasty.',
		'Enjoyed my visit here. Good mix of food and non-food stalls. The air is a bit smoky from the grill stalls but expected.',
		'Bagus! Banyak pilihan makanan dan harga berpatutan. Suasana rancak dan sesuai untuk semua peringkat umur.',
	],
	3: [
		'Average market. Food is okay but nothing particularly stands out. Gets very crowded and a bit hard to walk around.',
		'Boleh tahan lah. Ada beberapa stall yang sedap tapi ada juga yang biasa-biasa je. Harga masih okay.',
		'It\'s alright. A decent neighbourhood market but I\'ve seen better. The laksa stall is probably the highlight.',
		'Okay for a quick dinner option nearby. Nothing exceptional but serves its purpose. Parking is the main issue.',
		'Fair market. Some stalls are great, others not so much. Hit or miss depending on what you order.',
	],
};

function hashNum(str, seed = 0) {
	let h = seed;
	for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	return h;
}

function pick(arr, hash) {
	return arr[hash % arr.length];
}

// Each market gets 2–4 reviews from different seed users
function buildReviews(market, userIds) {
	const base = hashNum(market.id);
	const count = 2 + (base % 3); // 2, 3, or 4 reviews
	const reviews = [];

	// Shuffle user order per market
	const shuffled = [...userIds].sort((a, b) => hashNum(a + market.id) - hashNum(b + market.id));

	for (let i = 0; i < count; i++) {
		const userId = shuffled[i % shuffled.length];
		const ratingSeed = hashNum(market.id + userId);

		// Weight toward higher ratings (realistic distribution)
		const roll = ratingSeed % 10;
		const rating = roll < 4 ? 5 : roll < 7 ? 4 : roll < 9 ? 4 : 3;

		const pool = REVIEW_POOLS[rating];
		const comment = pick(pool, hashNum(market.id + userId + String(i)));

		// Spread created_at over past 6 months
		const daysAgo = (hashNum(market.id + String(i)) % 180) + 1;
		const created_at = new Date(Date.now() - daysAgo * 86400 * 1000).toISOString();

		reviews.push({ market_id: market.id, user_id: userId, rating, comment, created_at });
	}

	return reviews;
}

async function ensureSeedUsers() {
	const ids = [];
	for (const u of SEED_USERS) {
		const { data: existing } = await supabase
			.from('profiles').select('id').eq('username', u.username).maybeSingle();

		if (existing) { ids.push(existing.id); continue; }

		const { data, error } = await supabase.auth.admin.createUser({
			email: u.email,
			password: crypto.randomUUID(),
			email_confirm: true,
			user_metadata: { username: u.username }
		});
		if (error) { console.warn(`  Could not create ${u.username}: ${error.message}`); continue; }
		await supabase.from('profiles').update({ username: u.username }).eq('id', data.user.id);
		ids.push(data.user.id);
		console.log(`  Created seed user: ${u.username}`);
	}
	return ids;
}

async function main() {
	console.log('Checking seed users…');
	const userIds = await ensureSeedUsers();
	if (!userIds.length) { console.error('No seed users — aborting.'); process.exit(1); }
	console.log(`${userIds.length} seed users ready.\n`);

	const { data: markets, error } = await supabase
		.from('markets').select('id, name').eq('is_active', true);
	if (error || !markets?.length) { console.error('No markets found.'); process.exit(1); }

	console.log(`Generating reviews for ${markets.length} markets…\n`);

	let total = 0;
	for (const market of markets) {
		const reviews = buildReviews(market, userIds);
		const { error: err } = await supabase
			.from('reviews')
			.upsert(reviews, { onConflict: 'market_id,user_id', ignoreDuplicates: true });

		if (err) {
			console.warn(`  [FAIL] ${market.name}: ${err.message}`);
		} else {
			total += reviews.length;
			console.log(`  [OK] ${market.name} — ${reviews.length} reviews`);
		}
	}

	console.log(`\nDone. ${total} reviews inserted.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
