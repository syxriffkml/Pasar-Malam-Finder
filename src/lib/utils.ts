export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
