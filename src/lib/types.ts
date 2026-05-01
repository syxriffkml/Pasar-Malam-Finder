export type Profile = {
	id: string;
	username: string;
	is_admin: boolean;
	created_at: string;
};

export type Market = {
	id: string;
	name: string;
	area: string;
	state: string;
	address: string;
	lat: number;
	lng: number;
	operating_days: string[];
	start_time: string;
	end_time: string;
	description: string;
	is_verified: boolean;
	is_active: boolean;
	submitted_by: string;
	created_at: string;
};

export type Review = {
	id: string;
	market_id: string;
	user_id: string;
	rating: number;
	comment: string;
	created_at: string;
	profiles?: Profile;
};

export type Report = {
	id: string;
	market_id: string;
	user_id: string;
	type: 'closed' | 'moved';
	notes: string;
	status: 'pending' | 'resolved';
	created_at: string;
	markets?: Market;
	profiles?: Profile;
};

export type Favorite = {
	id: string;
	user_id: string;
	market_id: string;
	created_at: string;
	markets?: Market;
};
