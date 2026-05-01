-- Seed: 10 real pasar malams in KL / Selangor
-- Run AFTER running schema.sql

INSERT INTO public.markets (
  name, area, state, address, lat, lng,
  operating_days, start_time, end_time, description,
  is_verified, is_active
) VALUES

(
  'Pasar Malam SS2',
  'SS2, Petaling Jaya', 'Selangor',
  'Jalan SS 2/61, SS 2, 47300 Petaling Jaya, Selangor',
  3.1073, 101.6243,
  ARRAY['Monday'],
  '17:00', '23:00',
  'One of the most famous pasar malams in PJ, known for its wide variety of street food, fresh produce, and household items. A SS2 institution for decades.',
  TRUE, TRUE
),

(
  'Pasar Malam TTDI',
  'Taman Tun Dr Ismail, Kuala Lumpur', 'Wilayah Persekutuan Kuala Lumpur',
  'Jalan Tun Mohd Fuad 1, Taman Tun Dr Ismail, 60000 Kuala Lumpur',
  3.1501, 101.6244,
  ARRAY['Thursday'],
  '17:00', '22:00',
  'A beloved Thursday night market in the leafy TTDI neighbourhood. Popular with families for its grilled seafood, tropical fruits, and local kuih.',
  TRUE, TRUE
),

(
  'Pasar Malam Bangsar',
  'Bangsar, Kuala Lumpur', 'Wilayah Persekutuan Kuala Lumpur',
  'Jalan Telawi, Bangsar Baru, 59100 Kuala Lumpur',
  3.1318, 101.6725,
  ARRAY['Sunday'],
  '16:00', '23:00',
  'A vibrant Sunday night market in the trendy Bangsar Baru area. Great selection of ready-to-eat food, international snacks, and artisan goods.',
  TRUE, TRUE
),

(
  'Pasar Malam Wangsa Maju',
  'Wangsa Maju, Kuala Lumpur', 'Wilayah Persekutuan Kuala Lumpur',
  'Jalan Wangsa Delima 12, Wangsa Maju, 53300 Kuala Lumpur',
  3.2036, 101.7463,
  ARRAY['Saturday'],
  '16:00', '23:00',
  'A large Saturday market serving the Wangsa Maju community. Features lots of local hawker food, fresh fish, vegetables, and clothing stalls.',
  TRUE, TRUE
),

(
  'Pasar Malam Setapak',
  'Setapak, Kuala Lumpur', 'Wilayah Persekutuan Kuala Lumpur',
  'Jalan Gombak, Setapak, 53300 Kuala Lumpur',
  3.2022, 101.7029,
  ARRAY['Wednesday'],
  '17:00', '22:00',
  'A mid-week community market in Setapak offering affordable street food, noodles, satay, and fresh produce. Very popular with students and working families.',
  TRUE, TRUE
),

(
  'Pasar Malam Sri Petaling',
  'Sri Petaling, Kuala Lumpur', 'Wilayah Persekutuan Kuala Lumpur',
  'Jalan Radin Bagus, Sri Petaling, 57000 Kuala Lumpur',
  3.0782, 101.6944,
  ARRAY['Monday', 'Tuesday'],
  '16:00', '23:00',
  'Runs two evenings a week in Sri Petaling. Famous for char kuey teow, cendol, and an extensive row of Indonesian and Malay delicacies.',
  TRUE, TRUE
),

(
  'Pasar Malam USJ 21',
  'USJ 21, Subang Jaya', 'Selangor',
  'Jalan USJ 21/5, USJ 21, 47630 Subang Jaya, Selangor',
  3.0388, 101.5810,
  ARRAY['Wednesday'],
  '17:00', '23:00',
  'A well-organised Wednesday pasar malam in the USJ 21 residential area. Popular for its clean environment and variety of food from nasi lemak to Hainanese chicken rice.',
  TRUE, TRUE
),

(
  'Pasar Malam Puchong Jaya',
  'Puchong Jaya, Puchong', 'Selangor',
  'Jalan Kenari 5, Bandar Puchong Jaya, 47170 Puchong, Selangor',
  3.0282, 101.6253,
  ARRAY['Friday'],
  '16:00', '23:00',
  'A popular Friday evening market in Puchong Jaya. Known for affordable pricing, roasted meats, freshly squeezed juices, and a festive weekend atmosphere.',
  TRUE, TRUE
),

(
  'Pasar Malam Ampang Point',
  'Ampang, Selangor', 'Selangor',
  'Jalan Ampang Utama 1/1, Taman Ampang Utama, 68000 Ampang, Selangor',
  3.1501, 101.7640,
  ARRAY['Thursday', 'Sunday'],
  '17:00', '22:00',
  'Held twice a week near Ampang Point, this market is famous for its diverse food offerings including Thai, Indian, and Malay cuisine. Great evening hangout spot.',
  TRUE, TRUE
),

(
  'Pasar Malam Damansara Damai',
  'Damansara Damai, Petaling Jaya', 'Selangor',
  'Jalan Damai Utama 1, Damansara Damai, 47400 Petaling Jaya, Selangor',
  3.1667, 101.5959,
  ARRAY['Saturday'],
  '16:00', '23:00',
  'A thriving Saturday market in the Damansara Damai neighbourhood. Attracts large crowds for its extensive food court section, fresh seafood, and weekend deals.',
  TRUE, TRUE
);
