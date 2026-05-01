export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MALAY_DAYS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

export function toMalayDay(englishDay: string): string {
	const idx = DAYS.indexOf(englishDay);
	return idx >= 0 ? MALAY_DAYS[idx] : englishDay;
}

export function fromMalayDay(malayDay: string): string {
	const idx = MALAY_DAYS.indexOf(malayDay);
	return idx >= 0 ? DAYS[idx] : malayDay;
}

export function getTodayMalay(): string {
	return MALAY_DAYS[new Date().getDay()];
}

export const STATES = [
	'Johor',
	'Kedah',
	'Kelantan',
	'Melaka',
	'Negeri Sembilan',
	'Pahang',
	'Perak',
	'Perlis',
	'Pulau Pinang',
	'Sabah',
	'Sarawak',
	'Selangor',
	'Terengganu',
	'Wilayah Persekutuan Kuala Lumpur',
	'Wilayah Persekutuan Labuan',
	'Wilayah Persekutuan Putrajaya'
];

export function getTodayName(): string {
	return DAYS[new Date().getDay()];
}

export function isOpenToday(operatingDays: string[]): boolean {
	return operatingDays.includes(getTodayName());
}

export function isOpenNow(operatingDays: string[], startTime: string, endTime: string): boolean {
	if (!isOpenToday(operatingDays)) return false;
	const now = new Date();
	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	const [sh, sm] = startTime.split(':').map(Number);
	const [eh, em] = endTime.split(':').map(Number);
	return currentMinutes >= sh * 60 + sm && currentMinutes <= eh * 60 + em;
}

export function formatTime(time: string): string {
	if (!time) return '';
	const [h, m] = time.split(':').map(Number);
	const ampm = h >= 12 ? 'PM' : 'AM';
	const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
	return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('en-MY', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

export function getInitials(name: string): string {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase() ?? '')
		.join('');
}

export function getCardBandColor(id: string): string {
	const colors = ['#e5311d', '#f5c518', '#e5311d', '#f5c518'];
	const idx = id.charCodeAt(id.length - 1) % colors.length;
	return colors[idx];
}
