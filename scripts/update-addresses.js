// Reverse-geocodes all markets via Nominatim (free, no API key)
// and updates the address column in Supabase.
// Rate limit: 1 req/sec as per Nominatim ToS.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
	readFileSync(resolve(__dirname, '../.env'), 'utf8')
		.split('\n')
		.filter((l) => l.includes('=') && !l.startsWith('#'))
		.map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const supabase = createClient(env['PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_KEY'], {
	auth: { autoRefreshToken: false, persistSession: false }
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function formatMalaysianAddress(addr) {
	const parts = [];

	// Street
	const street = addr.road || addr.pedestrian || addr.footway || addr.path || addr.residential;
	if (street) parts.push(street);

	// Neighbourhood / suburb
	const suburb =
		addr.neighbourhood || addr.suburb || addr.quarter || addr.village || addr.hamlet;
	if (suburb && suburb !== street) parts.push(suburb);

	// Postcode + city
	const city = addr.city || addr.town || addr.municipality || addr.county;
	if (addr.postcode && city) {
		parts.push(`${addr.postcode} ${city}`);
	} else if (addr.postcode) {
		parts.push(addr.postcode);
	} else if (city) {
		parts.push(city);
	}

	// State
	if (addr.state) parts.push(addr.state);

	return parts.join(', ');
}

async function reverseGeocode(lat, lng) {
	const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
	const res = await fetch(url, {
		headers: { 'User-Agent': 'PasarMalamFinder/1.0 (vexr777@gmail.com)' }
	});
	if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
	const data = await res.json();
	return data.address ?? null;
}

async function main() {
	const { data: markets, error } = await supabase
		.from('markets')
		.select('id, name, lat, lng')
		.eq('is_active', true);

	if (error) { console.error('Fetch error:', error.message); process.exit(1); }

	console.log(`Updating addresses for ${markets.length} markets…\n`);

	let updated = 0;
	let skipped = 0;

	for (const market of markets) {
		if (!market.lat || !market.lng) {
			console.log(`  SKIP  ${market.name} — no coordinates`);
			skipped++;
			continue;
		}

		try {
			await sleep(1100); // Nominatim: max 1 req/sec
			const addr = await reverseGeocode(market.lat, market.lng);

			if (!addr) {
				console.log(`  SKIP  ${market.name} — no address returned`);
				skipped++;
				continue;
			}

			const formatted = formatMalaysianAddress(addr);

			if (!formatted) {
				console.log(`  SKIP  ${market.name} — could not format address`);
				skipped++;
				continue;
			}

			const { error: updateErr } = await supabase
				.from('markets')
				.update({ address: formatted })
				.eq('id', market.id);

			if (updateErr) {
				console.log(`  ERR   ${market.name} — ${updateErr.message}`);
			} else {
				console.log(`  OK    ${market.name}\n        → ${formatted}`);
				updated++;
			}
		} catch (err) {
			console.log(`  ERR   ${market.name} — ${err.message}`);
			skipped++;
		}
	}

	console.log(`\nDone. Updated: ${updated} | Skipped: ${skipped}`);
}

main();
