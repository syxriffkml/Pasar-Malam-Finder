// Generates and updates descriptions for markets that have none.
// Usage: node scripts/generate-descriptions.js
// Requires PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env

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

// Rotate through these templates based on market id hash
const TEMPLATES = [
	(m, days, time) =>
		`${m.name} is a lively night market in ${m.area}, ${m.state}, drawing crowds every ${days} from ${time}. Expect rows of local hawker stalls serving everything from char kuey teow and nasi lemak to fresh coconut drinks and grilled satay.`,

	(m, days, time) =>
		`Tucked in the heart of ${m.area}, this popular ${m.state} pasar malam comes alive every ${days} evening. Stalls open from ${time}, offering a mix of Malay, Chinese, and Indian street food alongside fresh produce and household goods.`,

	(m, days, time) =>
		`A community favourite in ${m.area}, ${m.name} has been feeding the neighbourhood every ${days} since it opened. Running from ${time}, it's the go-to spot for affordable home-style cooking, tropical fruits, and roadside snacks.`,

	(m, days, time) =>
		`Every ${days}, ${m.area} in ${m.state} comes alive as ${m.name} sets up its rows of stalls from ${time}. From piping hot soups to sweet kuih and freshly grilled meats — there's something for the whole family.`,

	(m, days, time) =>
		`${m.name} is one of ${m.area}'s most visited weekly markets. Open every ${days} from ${time}, it serves up a colourful spread of street food, local produce, and budget-friendly eats that keep regulars coming back.`,

	(m, days, time) =>
		`Set in ${m.area}, ${m.state}, this bustling pasar malam runs every ${days} from ${time}. It's a reliable neighbourhood staple known for its wide variety of local delicacies, from rojak and cendol to noodles and grilled seafood.`,

	(m, days, time) =>
		`If you're in ${m.area} on a ${days.split(',')[0]}, don't miss ${m.name}. Open from ${time}, this vibrant street market is packed with food vendors, fresh goods, and the unmistakable buzz of a true Malaysian pasar malam.`,

	(m, days, time) =>
		`${m.name} brings the neighbourhood together every ${days} evening in ${m.area}, ${m.state}. From ${time}, vendors line the street with everything from traditional Malay kuih and mamak favourites to fresh fruit and household essentials.`,
];

function hashIndex(str, len) {
	let h = 0;
	for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	return h % len;
}

function formatDays(days) {
	if (!days?.length) return 'selected evenings';
	if (days.length === 1) return days[0];
	if (days.length === 2) return days.join(' and ');
	return days.slice(0, -1).join(', ') + ' and ' + days[days.length - 1];
}

function formatTime(start, end) {
	const fmt = (t) => {
		const [h, m] = t.split(':').map(Number);
		const ampm = h >= 12 ? 'pm' : 'am';
		const hour = h > 12 ? h - 12 : h || 12;
		return m ? `${hour}:${String(m).padStart(2, '0')}${ampm}` : `${hour}${ampm}`;
	};
	return `${fmt(start)} – ${fmt(end)}`;
}

async function main() {
	const { data: markets, error } = await supabase
		.from('markets')
		.select('id, name, area, state, operating_days, start_time, end_time, description')
		.eq('is_active', true);

	if (error || !markets?.length) {
		console.error('Could not fetch markets:', error?.message);
		process.exit(1);
	}

	// Only update markets with blank/missing descriptions
	const needsDesc = markets.filter(
		(m) => !m.description || m.description.trim().length < 20
	);

	console.log(`${markets.length} total markets, ${needsDesc.length} need descriptions.\n`);

	let updated = 0;
	for (const m of needsDesc) {
		const tmpl = TEMPLATES[hashIndex(m.id, TEMPLATES.length)];
		const days = formatDays(m.operating_days);
		const time = formatTime(m.start_time || '17:00', m.end_time || '23:00');
		const description = tmpl(m, days, time);

		const { error: err } = await supabase
			.from('markets')
			.update({ description })
			.eq('id', m.id);

		if (err) {
			console.warn(`  [FAIL] ${m.name}: ${err.message}`);
		} else {
			updated++;
			console.log(`  [OK] ${m.name}`);
		}
	}

	console.log(`\nDone. ${updated} markets updated.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
