// Removes low-quality market entries: empty area, generic/duplicate names.
// Usage: node scripts/cleanup-markets.js

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

// Names that are streets/locations, not actual market names
const GENERIC_NAMES = [
	'jalan pasar malam',
	'pasar malam',
	'pasar malam (night market)',
	'tapak pasar malam',
	'gerai pasar malam',
	'pasar malam sabtu',
	'pasar malam ahad',
	'pasar malam (ahad)',
	'pasar malam isnin',
	'pasar malam (isnin)',
	'pasar malam khamis',
	'pasar malam selasa',
	'pasar malam jumaat',
	'pasar malam rabu',
	'pasar malam sabtu',
	'pasar malam jalan',
	'pasar malam',
	'pasar malam sg kandis',
	'pasar malam chester',
];

async function main() {
	const { data: markets } = await supabase
		.from('markets')
		.select('id, name, area');

	if (!markets?.length) { console.log('No markets found.'); return; }

	const toDelete = markets.filter((m) => {
		const nameLower = m.name.trim().toLowerCase();
		const areaEmpty = !m.area || m.area.trim() === '';

		const isGeneric = GENERIC_NAMES.includes(nameLower);

		// Also catch patterns like "Pasar Malam" with no area at all
		const isNamelessDuplicate = areaEmpty && (
			nameLower === 'pasar malam' ||
			nameLower === 'pasar malam.' ||
			nameLower.startsWith('jalan pasar malam') ||
			nameLower.startsWith('tapak pasar malam') ||
			nameLower.startsWith('gerai pasar malam')
		);

		return isGeneric || isNamelessDuplicate || areaEmpty;
	});

	console.log(`Found ${markets.length} markets total.`);
	console.log(`Removing ${toDelete.length} low-quality entries:\n`);
	toDelete.forEach((m) => console.log(`  - "${m.name}" (area: "${m.area}")`));

	if (!toDelete.length) { console.log('Nothing to remove.'); return; }

	const ids = toDelete.map((m) => m.id);
	const { error } = await supabase.from('markets').delete().in('id', ids);

	if (error) {
		console.error('\nDelete error:', error.message);
	} else {
		console.log(`\nDone. Removed ${toDelete.length} markets. ${markets.length - toDelete.length} remain.`);
	}
}

main().catch((err) => { console.error(err); process.exit(1); });
