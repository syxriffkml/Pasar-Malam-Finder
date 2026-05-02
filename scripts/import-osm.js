// One-time script to import pasar malam data from OpenStreetMap into Supabase.
// Usage: node scripts/import-osm.js
// Requires SUPABASE_URL and SUPABASE_SERVICE_KEY in .env

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dependency needed)
const envPath = resolve(__dirname, '../.env');
const env = Object.fromEntries(
	readFileSync(envPath, 'utf8')
		.split('\n')
		.filter((l) => l.includes('=') && !l.startsWith('#'))
		.map((l) => l.split('=').map((s) => s.trim()))
);

const SUPABASE_URL = env['PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = env['SUPABASE_SERVICE_KEY'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
	console.error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Malaysian state name normalisation (OSM uses Malay names)
const STATE_MAP = {
	'Kuala Lumpur': 'Kuala Lumpur',
	'W.P. Kuala Lumpur': 'Kuala Lumpur',
	'Wilayah Persekutuan Kuala Lumpur': 'Kuala Lumpur',
	Selangor: 'Selangor',
	'Negeri Sembilan': 'Negeri Sembilan',
	Melaka: 'Melaka',
	'Johor Bahru': 'Johor',
	Johor: 'Johor',
	Perak: 'Perak',
	Kedah: 'Kedah',
	Kelantan: 'Kelantan',
	Terengganu: 'Terengganu',
	Pahang: 'Pahang',
	Perlis: 'Perlis',
	Penang: 'Pulau Pinang',
	'Pulau Pinang': 'Pulau Pinang',
	'George Town': 'Pulau Pinang',
	Sabah: 'Sabah',
	Sarawak: 'Sarawak',
	'W.P. Labuan': 'Labuan',
	'W.P. Putrajaya': 'Putrajaya',
};

const ENGLISH_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Parse OSM opening_hours into operating_days + start/end time.
// OSM format examples: "Fr-Sa 17:00-23:00", "Mo,Tu,Fr 18:00-22:00", "Su-Sa 17:00-01:00"
function parseOpeningHours(oh) {
	if (!oh) return { operating_days: ['Friday', 'Saturday'], start_time: '17:00', end_time: '23:00' };

	const OSM_DAY = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 };
	const days = new Set();
	let start_time = '17:00';
	let end_time = '23:00';

	// Extract time range
	const timeMatch = oh.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
	if (timeMatch) {
		start_time = timeMatch[1];
		end_time = timeMatch[2];
	}

	// Extract days — handle ranges (Fr-Sa) and lists (Mo,We,Fr)
	const dayPart = oh.replace(/\d{2}:\d{2}-\d{2}:\d{2}/, '').trim();
	const tokens = dayPart.split(',');
	for (const token of tokens) {
		const range = token.trim().match(/^([A-Z][a-z])-([A-Z][a-z])$/);
		if (range) {
			const start = OSM_DAY[range[1]];
			const end = OSM_DAY[range[2]];
			if (start !== undefined && end !== undefined) {
				let d = start;
				while (true) {
					days.add(ENGLISH_DAYS[d]);
					if (d === end) break;
					d = (d + 1) % 7;
				}
			}
		} else {
			const single = token.trim().slice(0, 2);
			if (OSM_DAY[single] !== undefined) days.add(ENGLISH_DAYS[OSM_DAY[single]]);
		}
	}

	return {
		operating_days: days.size > 0 ? [...days] : ['Friday', 'Saturday'],
		start_time,
		end_time,
	};
}

function normaliseState(osmState) {
	if (!osmState) return null;
	return STATE_MAP[osmState] ?? osmState;
}

async function fetchOSM() {
	const query = `[out:json][timeout:60];
nwr["name"~"pasar malam",i](1.0,99.6,7.4,119.3);
out center;`;

	console.log('Fetching from Overpass API…');
	const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
	const res = await fetch(url, {
		headers: {
			'Accept': 'application/json',
			'User-Agent': 'PasarMalamFinder/1.0 (data import; contact@pasarfinder.my)'
		}
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Overpass API error: ${res.status}\n${body.slice(0, 300)}`);
	}
	const json = await res.json();
	console.log(`Got ${json.elements.length} elements from OSM`);
	return json.elements;
}

// Generic names that are streets/locations, not real market names
const SKIP_NAMES = new Set([
	'pasar malam', 'pasar malam.', 'jalan pasar malam', 'tapak pasar malam',
	'gerai pasar malam', 'pasar malam (night market)', 'sppk pasar malam',
	'pasar malam sabtu', 'pasar malam ahad', 'pasar malam (ahad)',
	'pasar malam isnin', 'pasar malam (isnin)', 'pasar malam khamis',
	'pasar malam selasa', 'pasar malam jumaat', 'pasar malam rabu',
]);

// Extract area from market name — strip common prefixes like "Pasar Malam ", "Tapak Pasar Malam "
function extractAreaFromName(name) {
	const stripped = name
		.replace(/^(tapak\s+)?pasar\s+(malam|tani)\s*/i, '')
		.replace(/\s*\(.*?\)\s*$/, '') // remove trailing (day) like "(Sabtu)"
		.trim();
	return stripped.length > 2 ? stripped : '';
}

function mapElement(el) {
	const tags = el.tags ?? {};
	const lat = el.lat ?? el.center?.lat;
	const lng = el.lon ?? el.center?.lon;

	if (!lat || !lng || !tags.name) return null;

	// Skip purely generic names
	if (SKIP_NAMES.has(tags.name.trim().toLowerCase())) return null;

	const { operating_days, start_time, end_time } = parseOpeningHours(tags.opening_hours);

	const area =
		tags['addr:suburb'] ??
		tags['addr:city'] ??
		tags['addr:district'] ??
		tags['addr:town'] ??
		extractAreaFromName(tags.name);

	return {
		name: tags.name,
		area,
		state: normaliseState(tags['addr:state']) ?? '',
		address: tags['addr:full'] ?? tags['addr:street'] ?? tags.name,
		lat,
		lng,
		operating_days,
		start_time,
		end_time,
		description: tags.description ?? '',
		is_verified: true,
		is_active: true,
		submitted_by: null,
	};
}

async function main() {
	const elements = await fetchOSM();
	const markets = elements.map(mapElement).filter(Boolean);
	console.log(`Mapped ${markets.length} valid markets`);

	if (markets.length === 0) {
		console.log('Nothing to insert.');
		return;
	}

	// Upsert in batches of 50
	let inserted = 0;
	for (let i = 0; i < markets.length; i += 50) {
		const batch = markets.slice(i, i + 50);
		const { error } = await supabase.from('markets').insert(batch);
		if (error) {
			console.error('Upsert error:', error.message);
		} else {
			inserted += batch.length;
			console.log(`Inserted batch ${Math.floor(i / 50) + 1} (${inserted}/${markets.length})`);
		}
	}

	console.log(`Done. ${inserted} markets upserted.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
