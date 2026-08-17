-- ==============================================================================
-- DIRECT SEED: 50 RESTO LEADS UNTUK DI-PITCHING OTOMATIS OLEH AI N8N
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
ALTER TABLE IF EXISTS b2b_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b2b_outreach_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b2b_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b2b_samples DISABLE ROW LEVEL SECURITY;

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJg2jkErQZ2jERY6tPIgrAJ6Q', 'KULON', 'KULON', 'Indonesian restaurant', 'Singapore', 'Singapore', '30 Bali Ln, Singapore 189866', 'https://www.google.com/maps/place/KULON/data=!4m7!3m6!1s0x31da19b412e46883:0xa427c00a224fab63!8m2!3d1.3012255!4d103.8584004!16s%2Fg%2F11hs3v1bn1!19sChIJg2jkErQZ2jERY6tPIgrAJ6Q',
    '+65 6929 4686', NULL, 'http://kulonsingapore.com/', 'https://www.instagram.com/kulon.sg/', NULL, 4.7, 1050,
    50, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJuQv1boMZ2jEREqoyUkzXc44', 'IndoChili', 'IndoChili', 'Indonesian restaurant', 'Singapore', 'Singapore', '54 Zion Rd, Singapore 247779', 'https://www.google.com/maps/place/IndoChili/data=!4m7!3m6!1s0x31da19836ef50bb9:0x8e73d74c5232aa12!8m2!3d1.2929351!4d103.831227!16s%2Fg%2F11rvw520n!19sChIJuQv1boMZ2jEREqoyUkzXc44',
    '+65 8922 8185', NULL, 'http://www.indochili.com/', NULL, NULL, 4.7, 2743,
    40, 'cold', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJgaqGs3AZ2jERl_EaN01p4T8', 'Bara Food Tanjong Pagar', 'Bara Food Tanjong Pagar', 'Indonesian restaurant', 'Singapore', 'Singapore', 'Altez / Icon Village Extension, 16 Enggor St, #01-10, Singapore 079717', 'https://www.google.com/maps/place/Bara+Food+Tanjong+Pagar/data=!4m7!3m6!1s0x31da1970b386aa81:0x3fe1694d371af197!8m2!3d1.2744873!4d103.8443179!16s%2Fg%2F11frj609q2!19sChIJgaqGs3AZ2jERl_EaN01p4T8',
    '+65 8182 6876', 'hello@bara-food.com', 'https://www.bara-food.com/', 'https://www.instagram.com/barafoodsg', 'https://www.facebook.com/barafoodsg', 4.6, 550,
    100, 'hot', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJl_sOMpIZ2jERD5mQL7KxaE8', 'Tambuah Mas Indonesian Restaurant Paragon Orchard | Michelin Guide', 'Tambuah Mas Indonesian  Paragon Orchard', 'Indonesian restaurant', 'Singapore', 'Singapore', '290 Orchard Rd, #B1 - 44 Paragon, Singapore 238859', 'https://www.google.com/maps/place/Tambuah+Mas+Indonesian+Restaurant+Paragon+Orchard+%7C+Michelin+Guide/data=!4m7!3m6!1s0x31da1992320efb97:0x4f68b1b22f90990f!8m2!3d1.3036434!4d103.8349946!16s%2Fg%2F1tj86z1_!19sChIJl_sOMpIZ2jERD5mQL7KxaE8',
    '+65 8826 2181', 'enquiry@tambuahmas.com.sg', 'http://www.tambuahmas.com.sg/', NULL, NULL, 4.1, 1102,
    100, 'hot', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJaUlnRQwZ2jERiwbLKSHY6jI', 'Pagi Sore Indonesian Restaurant (Family Business in Singapore since 1989)', 'Pagi Sore Indonesian  (Family Business in  since 1989)', 'Indonesian restaurant', 'Singapore', 'Singapore', 'Telok Ayer St, #88 - 90, Singapore 048470', 'https://www.google.com/maps/place/Pagi+Sore+Indonesian+Restaurant+%28Family+Business+in+Singapore+since+1989%29/data=!4m7!3m6!1s0x31da190c45674969:0x32ead82129cb068b!8m2!3d1.2826195!4d103.8486534!16s%2Fg%2F1v_n913p!19sChIJaUlnRQwZ2jERiwbLKSHY6jI',
    '+65 6225 6002', NULL, 'https://www.pagi-sore.com/', 'http://www.instagram.com/pagisoresg', 'https://web.facebook.com/pagisore/?_rdc=1&_rdr', 4.1, 608,
    50, 'cold', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJDWFG1LAZ2jERJ-V97fY_0jo', 'Pondok Jawa Timur', 'Pondok Jawa Timur', 'Indonesian restaurant', 'Singapore', 'Singapore', '14 Scotts Rd, #05-22/23 Far East Plaza, Singapore 228213', 'https://www.google.com/maps/place/Pondok+Jawa+Timur/data=!4m7!3m6!1s0x31da19b0d446610d:0x3ad23ff6ed7de527!8m2!3d1.3075867!4d103.8335336!16s%2Fg%2F11b6_nqh4h!19sChIJDWFG1LAZ2jERJ-V97fY_0jo',
    '+65 6884 5853', NULL, 'http://www.pondokjawa.com/', NULL, NULL, 4.4, 777,
    50, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJVYq9cJIZ2jERq7n9M66I6Tw', 'Bebek Goreng Pak Ndut @Lucky Plaza', 'Bebek Goreng Pak Ndut', 'Indonesian restaurant', 'Singapore', 'Singapore', 'Lucky Plaza, 304 Orchard Rd, #01-42 Orchard, Singapore 238863', 'https://www.google.com/maps/place/Bebek+Goreng+Pak+Ndut+@Lucky+Plaza/data=!4m7!3m6!1s0x31da199270bd8a55:0x3ce988ae33fdb9ab!8m2!3d1.3045755!4d103.8340344!16s%2Fg%2F11g7zgnwrj!19sChIJVYq9cJIZ2jERq7n9M66I6Tw',
    '+65 6734 4787', NULL, 'http://www.bebekgorengpakndut.com.sg/', 'https://www.instagram.com/bebekgorengpakndut_sg/', 'https://www.facebook.com/bebekgorengpakndutSG/', 4.6, 2588,
    50, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJXQv0JrEZ2jERIvaikq75sfU', 'Rumah Makan Minang - Kandahar Street', 'Rumah Makan Minang', 'Indonesian restaurant', 'Singapore', 'Singapore', '18 & 18A Kandahar Street, Singapore 198884', 'https://www.google.com/maps/place/Rumah+Makan+Minang+-+Kandahar+Street/data=!4m7!3m6!1s0x31da19b126f40b5d:0xf5b1f9ae92a2f622!8m2!3d1.3022991!4d103.8595966!16s%2Fg%2F1tj30ms4!19sChIJXQv0JrEZ2jERIvaikq75sfU',
    '+65 6977 7064', 'enquiry@minang.sg', 'https://www.minang.sg/', 'https://www.instagram.com/minang.sg/?hl=en', 'https://www.facebook.com/minang.sg/', 4.3, 1529,
    100, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJDw5_RG0Z2jERl-F--4zrv6E', 'Cumi Bali', 'Cumi Bali', 'Indonesian restaurant', 'Singapore', 'Singapore', '50 Tras St, Singapore 078989', 'https://www.google.com/maps/place/Cumi+Bali/data=!4m7!3m6!1s0x31da196d447f0e0f:0xa1bfeb8cfb7ee197!8m2!3d1.2781374!4d103.844249!16s%2Fg%2F1vs1pcp6!19sChIJDw5_RG0Z2jERl-F--4zrv6E',
    '+65 6220 6619', NULL, 'http://www.cumibali.com/', NULL, NULL, 4.1, 724,
    40, 'cold', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJzd9lsXcZ2jERt4_hG0Sra1M', 'Kintamani Restaurant', 'Kintamani', 'Indonesian restaurant', 'Singapore', 'Singapore', '405 Havelock Rd, Level 3 Furama Riverfront, Singapore 169633', 'https://www.google.com/maps/place/Kintamani+Restaurant/data=!4m7!3m6!1s0x31da1977b165dfcd:0x536bab441be18fb7!8m2!3d1.2875615!4d103.8359488!16s%2Fg%2F1tf7k223!19sChIJzd9lsXcZ2jERt4_hG0Sra1M',
    '+65 6739 6463', NULL, 'http://www.furama.com/riverfront/Dining/Kintamani-Indonesian-Restaurant', NULL, NULL, 4.0, 1141,
    40, 'cold', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJ_W2jIrEZ2jERpx5zNEeliOg', 'Bumbu Restaurant', 'Bumbu', 'Indonesian restaurant', 'Singapore', 'Singapore', '44 Kandahar St, Singapore 198897', 'https://www.google.com/maps/place/Bumbu+Restaurant/data=!4m7!3m6!1s0x31da19b122a36dfd:0xe888a54734731ea7!8m2!3d1.3018761!4d103.8599942!16s%2Fg%2F1tf7v78b!19sChIJ_W2jIrEZ2jERpx5zNEeliOg',
    '+65 6392 8628', NULL, 'http://bumbu.com.sg/', NULL, NULL, 4.4, 606,
    50, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJDcZX2EkZ2jERHNNf5IhBLwU', 'WARUNG IJO | VEGETARIAN | VEGAN | INDONESIAN CUISINES | NO ALCOHOL | NO ONION GARLIC', 'WARUNG IJO', 'Vegetarian restaurant', 'Singapore', 'Singapore', '601 MacPherson Rd, #01-61 Grantral Mall Tai Seng, Singapore 368242', 'https://www.google.com/maps/place/WARUNG+IJO+%7C+VEGETARIAN+%7C+VEGAN+%7C+INDONESIAN+CUISINES+%7C+NO+ALCOHOL+%7C+NO+ONION+GARLIC/data=!4m7!3m6!1s0x31da1949d857c60d:0x52f4188e45fd31c!8m2!3d1.3338869!4d103.8881309!16s%2Fg%2F11h4qmbw93!19sChIJDcZX2EkZ2jERHNNf5IhBLwU',
    '+65 8857 8600', NULL, 'https://m.facebook.com/SGWarungIjo/', NULL, NULL, 4.6, 858,
    25, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJw5jBbmoX2jERxNe5hxety-A', 'THREE. by Garamika', 'THREE. by Garamika', 'Indonesian restaurant', 'Singapore', 'Singapore', '94 Lor 4 Toa Payoh, #01-22, Singapore 310094', 'https://www.google.com/maps/place/THREE.+by+Garamika/data=!4m7!3m6!1s0x31da176a6ec198c3:0xe0cbad1787b9d7c4!8m2!3d1.3388227!4d103.8496748!16s%2Fg%2F11k581v0qb!19sChIJw5jBbmoX2jERxNe5hxety-A',
    '+65 8027 1333', NULL, 'http://www.threebygaramika.com/', 'https://www.instagram.com/threebygaramika/', 'https://www.facebook.com/p/THREE-by-Garamika-100094721258961/', 4.6, 658,
    50, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJCVk-CakZ2jERxO4O4a_CsZw', 'Indo Rasa Singapore', 'Indo Rasa', 'Restaurant', 'Singapore', 'Singapore', '14 Scotts Rd, #01-23 Far East Plaza, Singapore 228213', 'https://www.google.com/maps/place/Indo+Rasa+Singapore/data=!4m7!3m6!1s0x31da19a9093e5909:0x9cb1c2afe10eeec4!8m2!3d1.3073044!4d103.8333325!16s%2Fg%2F11sss93fls!19sChIJCVk-CakZ2jERxO4O4a_CsZw',
    '+65 9720 2721', NULL, 'https://social.quandoo.com/en/groups/indo-rasa-singapore', NULL, NULL, 4.5, 437,
    50, 'cold', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJrWzudQAZ2jERUR9T0pkzXWM', 'Aleeya • Nusantara Heritage Cuisines', 'Aleeya • Nusantara Heritage Cuisines', 'Southeast Asian restaurant', 'Singapore', 'Singapore', '2 Dickson Rd, Singapore 209494', 'https://www.google.com/maps/place/Aleeya+%E2%80%A2+Nusantara+Heritage+Cuisines/data=!4m7!3m6!1s0x31da190075ee6cad:0x635d3399d2531f51!8m2!3d1.3051199!4d103.8546328!16s%2Fg%2F11w4jdk_lp!19sChIJrWzudQAZ2jERUR9T0pkzXWM',
    '+65 8299 5500', 'hello@aleeya.com.sg', 'https://www.aleeya.com.sg/', NULL, 'https://www.facebook.com/semplicelabs', 4.8, 1251,
    100, 'hot', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJ39UJUAAZ2jERzu5WB_RseMQ', 'INDONESIA BOLEH', 'INDONESIA BOLEH', 'Food court', 'Singapore', 'Singapore', '304 Orchard Rd, #04-61/62, Singapore 238863', 'https://www.google.com/maps/place/INDONESIA+BOLEH/data=!4m7!3m6!1s0x31da19005009d5df:0xc4786cf40756eece!8m2!3d1.3045755!4d103.8340344!16s%2Fg%2F11xly5wwf3!19sChIJ39UJUAAZ2jERzu5WB_RseMQ',
    '+65 8786 3687', NULL, 'https://www.indonesiabolehh.com/', 'https://www.instagram.com/indonesiabolehh', NULL, 4.7, 364,
    50, 'cold', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJA4r2SwAZ2jERNRgTy1LUKyM', 'Paris Van Java', 'Paris Van Java', 'Indonesian restaurant', 'Singapore', 'Singapore', '304 Orchard Rd, #01-45 Lucky Plaza, Singapore 238863', 'https://www.google.com/maps/place/Paris+Van+Java/data=!4m7!3m6!1s0x31da19004bf68a03:0x232bd452cb131835!8m2!3d1.3045795!4d103.8340621!16s%2Fg%2F11trh_0q5w!19sChIJA4r2SwAZ2jERNRgTy1LUKyM',
    '+65 6539 9313', 'samantha.lai@cfamsg.com', 'https://www.pvj.com.sg/', 'https://www.instagram.com/pvj.sg/?hl=en', 'https://www.facebook.com/profile.php?id=100089694045092', 4.7, 293,
    100, 'hot', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJL8ExUQAZ2jEREpPwvW3Uc2I', 'Bebek Goreng Pak Ndut @SingPost Centre', 'Bebek Goreng Pak Ndut', 'Indonesian restaurant', 'Singapore', 'Singapore', '10 Eunos Rd 8, B1-130 SingPost Centre, Singapore 408600', 'https://www.google.com/maps/place/Bebek+Goreng+Pak+Ndut+@SingPost+Centre/data=!4m7!3m6!1s0x31da19005131c12f:0x6273d46dbdf09312!8m2!3d1.3189418!4d103.8944605!16s%2Fg%2F11w37__7bw!19sChIJL8ExUQAZ2jEREpPwvW3Uc2I',
    '+65 6513 7787', NULL, 'https://bebekgorengpakndut.com.sg/', 'https://www.instagram.com/bebekgorengpakndut_sg/', 'https://www.facebook.com/bebekgorengpakndutSG/', 4.6, 263,
    50, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJt1JYLbcZ2jERKWJKL4mMLaM', 'Hjh Maimunah Restaurant and Catering', 'Hjh Maimunah  and Catering', 'Halal restaurant', 'Singapore', 'Singapore', '11 Jln Pisang, Singapore 199078', 'https://www.google.com/maps/place/Hjh+Maimunah+Restaurant+and+Catering/data=!4m7!3m6!1s0x31da19b72d5852b7:0xa32d8c892f4a6229!8m2!3d1.303149!4d103.8585258!16s%2Fg%2F1tkqxsy2!19sChIJt1JYLbcZ2jERKWJKL4mMLaM',
    '+65 6297 4294', NULL, 'https://www.hjmaimunah.com/en_SG', NULL, NULL, 4.5, 3357,
    40, 'cold', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJQ3_PQ6UZ2jERUffO6tdJdco', 'Tambuah Mas Great World | Halal Indonesian Restaurant', 'Tambuah Mas Great World', 'Indonesian restaurant', 'Singapore', 'Singapore', '1 Kim Seng Promenade, B1-110/111 Great World, Singapore 237994', 'https://www.google.com/maps/place/Tambuah+Mas+Great+World+%7C+Halal+Indonesian+Restaurant/data=!4m7!3m6!1s0x31da19a543cf7f43:0xca7549d7eacef751!8m2!3d1.2931253!4d103.8319286!16s%2Fg%2F11fq_bb3w1!19sChIJQ3_PQ6UZ2jERUffO6tdJdco',
    '+65 8711 2181', 'enquiry@tambuahmas.com.sg', 'http://www.tambuahmas.com.sg/', NULL, NULL, 4.2, 454,
    100, 'hot', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJ18C-mwoZ2jERiDU5EDJWsDU', 'Rendezvous Restaurant Hock Lock Kee', 'Rendezvous  Hock Lock Kee', 'Indonesian restaurant', 'Singapore', 'Singapore', '6 Eu Tong Sen St, #02-72 to 75/77/92 The Central, Singapore 059817', 'https://www.google.com/maps/place/Rendezvous+Restaurant+Hock+Lock+Kee/data=!4m7!3m6!1s0x31da190a9bbec0d7:0x35b0563210393588!8m2!3d1.289174!4d103.846216!16s%2Fg%2F11r97xg_w!19sChIJ18C-mwoZ2jERiDU5EDJWsDU',
    '+65 6339 7508', NULL, 'http://www.rendezvous-hlk.com.sg/', NULL, NULL, 4.2, 648,
    50, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJ3Tcl0IwZ2jER574jAh7p8qk', 'Chopstix & Rice | Indonesian Restaurant | Padang | Halal | Suntec City SG', 'Chopstix & Rice', 'Restaurant', 'Singapore', 'Singapore', '3 Temasek Blvd, B1-100 / 101, Singapore 038983', 'https://www.google.com/maps/place/Chopstix+%26+Rice+%7C+Indonesian+Restaurant+%7C+Padang+%7C+Halal+%7C+Suntec+City+SG/data=!4m7!3m6!1s0x31da198cd02537dd:0xa9f2e91e0223bee7!8m2!3d1.2950089!4d103.8599579!16s%2Fg%2F1tg6s6wl!19sChIJ3Tcl0IwZ2jER574jAh7p8qk',
    '+65 8533 7228', 'hello@chopstixandrice.com.sg', 'https://chopstixandrice.com.sg/', 'https://www.instagram.com/chopstixandricesg/', 'https://www.facebook.com/chopstixandrice', 4.5, 1326,
    100, 'hot', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJl3AtxBAY2jERX2eT1Y8ZrZE', 'Hjh Maimunah Restaurant & Catering Pte Ltd', 'Hjh Maimunah  & Catering Pte Ltd', 'Malaysian restaurant', 'Singapore', 'Singapore', '20 Joo Chiat Rd, Singapore 427357', 'https://www.google.com/maps/place/Hjh+Maimunah+Restaurant+%26+Catering+Pte+Ltd/data=!4m7!3m6!1s0x31da1810c42d7097:0x91ad198fd593675f!8m2!3d1.3154196!4d103.8980367!16s%2Fg%2F1tdxbt4l!19sChIJl3AtxBAY2jERX2eT1Y8ZrZE',
    '+65 6348 5457', NULL, 'http://www.hjmaimunah.com/', 'http://instagram.com/hjhmaimunahrestaurant', 'https://facebook.com/maimunahfoods', 4.5, 2585,
    50, 'cold', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJX3NOuyUZ2jERBmdQjnMNm3c', 'Ben’s Kitchen', 'Ben’s Kitchen', 'Indonesian restaurant', 'Singapore', 'Singapore', '273 Tanjong Katong Rd, Singapore 437056', 'https://www.google.com/maps/place/Ben%E2%80%99s+Kitchen/data=!4m7!3m6!1s0x31da1925bb4e735f:0x779b0d738e506706!8m2!3d1.3070829!4d103.895667!16s%2Fg%2F11k3wmcwxq!19sChIJX3NOuyUZ2jERBmdQjnMNm3c',
    '+65 6015 0232', 'press@calameo.com', 'https://www.calameo.com/read/008148936b9b0036006e6', NULL, NULL, 4.3, 378,
    100, 'hot', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJR9Ewo_oZ2jER2J9rBN5FUYE', 'Putra Minang Restaurant Bencoolen', 'Putra Minang  Bencoolen', 'Restaurant', 'Singapore', 'Singapore', '51 Bencoolen St, #01-05, Singapore 189630', 'https://www.google.com/maps/place/Putra+Minang+Restaurant+Bencoolen/data=!4m7!3m6!1s0x31da19faa330d147:0x815145de046b9fd8!8m2!3d1.2994205!4d103.8505094!16s%2Fg%2F11p02qpf64!19sChIJR9Ewo_oZ2jER2J9rBN5FUYE',
    '+65 8262 3535', 'john@oddle.me', 'https://www.putraminangsg.com/en_SG', NULL, NULL, 4.3, 635,
    100, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJUZ8cpagZ2jERGe6LM0UKpYk', 'Bali Thai', 'Bali Thai', 'Thai restaurant', 'Singapore', 'Singapore', '3 Temasek Blvd, Tower 5 #B1-121A 121B, Singapore 038983', 'https://www.google.com/maps/place/Bali+Thai/data=!4m7!3m6!1s0x31da19a8a51c9f51:0x89a50a45338bee19!8m2!3d1.2943391!4d103.8582311!16s%2Fg%2F1tdxyf0w!19sChIJUZ8cpagZ2jERGe6LM0UKpYk',
    '+65 6338 2066', NULL, 'http://www.balithai.com.sg/', NULL, 'https://www.facebook.com/balithaisingapore/', 4.7, 2508,
    50, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJ-_VlLioZ2jERU0eWh_TKqkI', 'Seroja', 'Seroja', 'Malaysian restaurant', 'Singapore', 'Singapore', '7 Fraser St, #01-30/31/32/33 Duo Galleria, Singapore 189356', 'https://www.google.com/maps/place/Seroja/data=!4m7!3m6!1s0x31da192a2e65f5fb:0x42aacaf487964753!8m2!3d1.2996321!4d103.8583743!16s%2Fg%2F11t4dhf54t!19sChIJ-_VlLioZ2jERU0eWh_TKqkI',
    '+65 8522 2926', 'info@seroja.sg', 'http://www.seroja.sg/', 'http://www.instagram.com/seroja.sg', 'http://www.facebook.com/seroja.sg', 4.7, 263,
    100, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJDVJoUZcZ2jERa-2r190qyew', 'Warung M. Nasir', 'Warung M. Nasir', 'Indonesian restaurant', 'Singapore', 'Singapore', '16 Collyer Quay, #02-10, Centre 049318', 'https://www.google.com/maps/place/Warung+M.+Nasir/data=!4m7!3m6!1s0x31da19975168520d:0xecc92addd7abed6b!8m2!3d1.2840798!4d103.8525004!16s%2Fg%2F1tdpcqn7!19sChIJDVJoUZcZ2jERa-2r190qyew',
    '+65 9010 5188', NULL, 'https://m.facebook.com/Warung-M-Nasir-166493446756104/', NULL, NULL, 4.0, 435,
    25, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJx-CItu0Z2jER4Rmphah97F0', 'INDOCAFÉ - Peranakan Dining', 'INDOCAFÉ - Peranakan Dining', 'Nyonya restaurant', 'Singapore', 'Singapore', '35 Scotts Rd, Singapore 228227', 'https://www.google.com/maps/place/INDOCAF%C3%89+-+Peranakan+Dining/data=!4m7!3m6!1s0x31da19edb688e0c7:0x5dec7da885a919e1!8m2!3d1.3111111!4d103.8355556!16s%2Fg%2F1thx1k4j!19sChIJx-CItu0Z2jER4Rmphah97F0',
    '+65 9430 7307', NULL, 'https://thehouseofindocafe.com/indocafe-peranakan-dining/', NULL, NULL, 4.3, 433,
    40, 'cold', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJ60mnCQAZ2jERELpXUwpVCJg', 'Indosoup Padang', 'Indosoup Padang', 'Indonesian restaurant', 'Singapore', 'Singapore', '10 Sinaran Dr, #04 02 Square 2, Singapore 307506', 'https://www.google.com/maps/place/Indosoup+Padang/data=!4m7!3m6!1s0x31da190009a749eb:0x9808550a5357ba10!8m2!3d1.3206513!4d103.8443689!16s%2Fg%2F11xgxls5wf!19sChIJ60mnCQAZ2jERELpXUwpVCJg',
    '+65 8786 3687', 'contact@indosouppadang.com', 'https://www.indosouppadang.com/', 'https://www.instagram.com/indosoupsingapore/', 'https://www.facebook.com/Indosoupsingapore-106843235102001', 4.4, 43,
    100, 'hot', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJE76FM5EZ2jERxpp1dMqaORs', 'Jtown Cafe', 'Jtown Cafe', 'Cafe', 'Singapore', 'Singapore', '220 Orchard Rd, B1-04/05 Midpoint Orchard, Singapore 238852', 'https://www.google.com/maps/place/Jtown+Cafe/data=!4m7!3m6!1s0x31da19913385be13:0x1b399aca74759ac6!8m2!3d1.3017142!4d103.8387216!16s%2Fg%2F1tls0c2f!19sChIJE76FM5EZ2jERxpp1dMqaORs',
    '+65 9230 5040', NULL, 'https://m.facebook.com/pages/category/Cafe/Jtown-Cafe-190066049482/', NULL, NULL, 4.3, 627,
    25, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJ0RSQEpIZ2jERrX-UIMhVn4Y', 'Ayam Penyet Ria - Lucky Plaza', 'Ayam Penyet Ria - Lucky Plaza', 'Indonesian restaurant', 'Singapore', 'Singapore', '304 Orchard Rd, #04-25/27, Singapore 238863', 'https://www.google.com/maps/place/Ayam+Penyet+Ria+-+Lucky+Plaza/data=!4m7!3m6!1s0x31da1992129014d1:0x869f55c820947fad!8m2!3d1.3045795!4d103.8340621!16s%2Fg%2F1tdd2smt!19sChIJ0RSQEpIZ2jERrX-UIMhVn4Y',
    '+65 6235 7385', NULL, 'https://ayampenyetria.com/', NULL, NULL, 4.0, 1146,
    50, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJj6KI8ZEZ2jERme6YLmR3qUY', 'Bali Thai (Ngee Ann City)', 'Bali Thai (Ngee Ann City)', 'Thai restaurant', 'Singapore', 'Singapore', '391A Orchard Rd, #05 - 29, Singapore 238873', 'https://www.google.com/maps/place/Bali+Thai+%28Ngee+Ann+City%29/data=!4m7!3m6!1s0x31da1991f188a28f:0x46a977642e98ee99!8m2!3d1.3027417!4d103.8344403!16s%2Fg%2F11g0vz62fx!19sChIJj6KI8ZEZ2jERme6YLmR3qUY',
    '+65 6235 5125', NULL, 'http://www.balithai.com.sg/', NULL, 'https://www.facebook.com/balithaisingapore/', 4.6, 831,
    50, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJ_ySdI-MZ2jERViomXdUPbng', 'Irna''s Taste Food & Cakes', 'Irna''s Taste Food & Cakes', 'Takeout Restaurant', 'Singapore', 'Singapore', '730 N Bridge Rd, Singapore 198698', 'https://www.google.com/maps/place/Irna%27s+Taste+Food+%26+Cakes/data=!4m7!3m6!1s0x31da19e3239d24ff:0x786e0fd55d262a56!8m2!3d1.3027436!4d103.8591025!16s%2Fg%2F11t630dnps!19sChIJ_ySdI-MZ2jERViomXdUPbng',
    '+65 8895 0735', NULL, 'https://sites.google.com/view/irnastastefoodandcakes', NULL, NULL, 4.8, 122,
    25, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJWUkLBLEZ2jERLvvF3Jjohgw', 'Ratu Lemper', 'Ratu Lemper', 'Halal restaurant', 'Singapore', 'Singapore', '31 Arab St, Singapore 199730', 'https://www.google.com/maps/place/Ratu+Lemper/data=!4m7!3m6!1s0x31da19b1040b4959:0xc86e898dcc5fb2e!8m2!3d1.3005084!4d103.8596527!16s%2Fg%2F11crzzv42w!19sChIJWUkLBLEZ2jERLvvF3Jjohgw',
    '+65 9813 2450', NULL, 'http://www.ratulemper.com/', NULL, NULL, 4.5, 113,
    40, 'cold', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJI29OfAAZ2jERcS8qAm017FU', 'Warung Leko', 'Warung Leko', 'Halal restaurant', 'Singapore', 'Singapore', '162 Rochor Rd, Singapore 188437', 'https://www.google.com/maps/place/Warung+Leko/data=!4m7!3m6!1s0x31da19007c4e6f23:0x55ec356d022a2f71!8m2!3d1.3008967!4d103.8553637!16s%2Fg%2F11yj7t00fp!19sChIJI29OfAAZ2jERcS8qAm017FU',
    '+65 8503 7499', NULL, 'https://www.warungleko.sg/', 'https://www.instagram.com/warunglekosg', 'https://www.facebook.com/warunglekosg', 4.8, 445,
    50, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJp4KAX2YZ2jERSsgU7a1uKyE', 'Indo Express', 'Indo Express', 'Indonesian restaurant', 'Singapore', 'Singapore', '304 Orchard Rd, #01-71 Lucky Plaza, Singapore 238863', 'https://www.google.com/maps/place/Indo+Express/data=!4m7!3m6!1s0x31da19665f8082a7:0x212b6eaded14c84a!8m2!3d1.3044367!4d103.8340348!16s%2Fg%2F11nmqdtlhk!19sChIJp4KAX2YZ2jERSsgU7a1uKyE',
    '+65 9188 1260', 'sales@indoexpressfood.com', 'http://www.indoexpressfood.com/', 'https://www.instagram.com/indoexpressluckyplaza/', NULL, 4.6, 437,
    100, 'hot', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJA3ttFOUZ2jERt3oparzl4X4', 'Papa Ayam 313@somerset', 'Papa Ayam 313', 'Restaurant', 'Singapore', 'Singapore', '313 Orchard Rd, #B3 - 49, Singapore 238895', 'https://www.google.com/maps/place/Papa+Ayam+313@somerset/data=!4m7!3m6!1s0x31da19e5146d7b03:0x7ee1e5bc6a297ab7!8m2!3d1.3010517!4d103.8384228!16s%2Fg%2F11h3c4nv3l!19sChIJA3ttFOUZ2jERt3oparzl4X4',
    '+65 8698 3921', 'papaayamteam.mgmt@gmail.com%20', 'http://www.papaayam.com/', 'https://www.instagram.com/p/CE1M-WyBDKb/', 'https://www.facebook.com/papaayamsg/', 4.5, 451,
    100, 'hot', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJzztE41sZ2jERhHNLe5xp1h0', 'HJH Maimunah Mini City Square', 'HJH Maimunah Mini City Square', 'Hawker stall', 'Singapore', 'Singapore', '180 Kitchener Rd, B3-04 CITY SQUARE MALL, Singapore 208539', 'https://www.google.com/maps/place/HJH+Maimunah+Mini+City+Square/data=!4m7!3m6!1s0x31da195be3443bcf:0x1dd6699c7b4b7384!8m2!3d1.3113982!4d103.8565897!16s%2Fg%2F11vxprdt_v!19sChIJzztE41sZ2jERhHNLe5xp1h0',
    '+65 6291 3132', NULL, 'https://www.hjmaimunah.com/', 'http://instagram.com/hjhmaimunahrestaurant', 'https://facebook.com/maimunahfoods', 4.2, 319,
    50, 'cold', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJh8WbICIZ2jERAkxFySfa0P4', 'Taliwang Restaurant', 'Taliwang', 'Indonesian restaurant', 'Singapore', 'Singapore', '6 Raffles Blvd, #03-131 Marina Square, Singapore 039594', 'https://www.google.com/maps/place/Taliwang+Restaurant/data=!4m7!3m6!1s0x31da1922209bc587:0xfed0da27c9454c02!8m2!3d1.2912061!4d103.8576768!16s%2Fg%2F11h3mv77nz!19sChIJh8WbICIZ2jERAkxFySfa0P4',
    '+65 6041 1665', 'john@oddle.me', 'https://taliwang.oddle.me/', NULL, NULL, 3.8, 308,
    100, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJeVkrb-sZ2jER1IRwmoLsR0k', 'Permata Singapore', 'Permata', 'Buffet restaurant', 'Singapore', 'Singapore', '73 Sultan Gate, Singapore 198497', 'https://www.google.com/maps/place/Permata+Singapore/data=!4m7!3m6!1s0x31da19eb6f2b5979:0x4947ec829a7084d4!8m2!3d1.302283!4d103.8602041!16s%2Fg%2F11pc1m95nf!19sChIJeVkrb-sZ2jER1IRwmoLsR0k',
    '+65 9082 9941', 'reservation@gedungkuning.sg', 'https://www.gedungkuning.sg/', NULL, NULL, 4.4, 679,
    100, 'hot', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJrZfSH_490i0RJOhvPq-CF10', 'Nusantara by Locavore Group', 'Nusantara by Locavore Group', 'Indonesian restaurant', 'Singapore', 'Singapore', 'Jl. Dewisita No.09C, Ubud, Kecamatan Ubud, Kabupaten Gianyar, Bali 80571, Indonesia', 'https://www.google.com/maps/place/Nusantara+by+Locavore+Group/data=!4m7!3m6!1s0x2dd23dfe1fd297ad:0x5d1782af3e6fe824!8m2!3d-8.5098135!4d115.2624829!16s%2Fg%2F11t5ssjyh3!19sChIJrZfSH_490i0RJOhvPq-CF10',
    '+62 877-4741-1496', 'reservations@restaurantnusantara.com', 'https://locavorenxt.com/family/nusantara', 'https://instagram.com/restaurantnusantara', 'https://www.facebook.com/NusantaraByLocavore', 4.6, 971,
    100, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJ1RWmsbsR2jERLuDjsG5wHcI', 'Kitchen Nusantara Singapore', 'Kitchen Nusantara', 'Delivery Restaurant', 'Singapore', 'Singapore', '808D Choa Chu Kang Ave 1, Singapore 684808', 'https://www.google.com/maps/place/Kitchen+Nusantara+Singapore/data=!4m7!3m6!1s0x31da11bbb1a615d5:0xc21d706eb0e3e02e!8m2!3d1.3749135!4d103.7455863!16s%2Fg%2F11z8rz87rf!19sChIJ1RWmsbsR2jERLuDjsG5wHcI',
    '+65 8218 8740', NULL, 'https://beacons.ai/kitchennusantara', NULL, NULL, 3.5, 2,
    25, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJjxYYxM6J2TERskSqbssPNUc', 'Nusantara Kitchen Indonesia', 'Nusantara Kitchen Indonesia', 'Food manufacturer', 'Singapore', 'Singapore', 'Pasir Putih Residence Blk. C No.7, Sadai, Kec. Bengkong, Kota Batam, Kepulauan Riau 29444, Indonesia', 'https://www.google.com/maps/place/Nusantara+Kitchen+Indonesia/data=!4m7!3m6!1s0x31d989cec418168f:0x47350fcb6eaa44b2!8m2!3d1.1551697!4d104.0302517!16s%2Fg%2F11v_5l9f8d!19sChIJjxYYxM6J2TERskSqbssPNUc',
    '+62 812-6682-8865', 'team@latofonts.com', 'https://www.nusantara-kitchen.com/', 'https://www.instagram.com/honshitsu.kitchen.sg?igshid=NzZlODBkYWE4Ng==', 'https://www.facebook.com/honshitsuhomekitchen?mibextid=LQQJ4d', 5.0, 9,
    100, 'hot', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJz6RkOGhJzDER0ZCjjAj8EmM', 'Rumah Makan Nusantara by Sunway Putra Hotel', 'Rumah Makan Nusantara by Sunway Putra Hotel', 'Indonesian restaurant', 'Singapore', 'Singapore', 'Level 9, Main Lobby, Sunway Putra Hotel, Chow Kit, 50350 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia', 'https://www.google.com/maps/place/Rumah+Makan+Nusantara+by+Sunway+Putra+Hotel/data=!4m7!3m6!1s0x31cc49683864a4cf:0x6312fc088ca390d1!8m2!3d3.1667247!4d101.6930213!16s%2Fg%2F11vdnt6nvd!19sChIJz6RkOGhJzDER0ZCjjAj8EmM',
    '+60 3-4040 9888', 'spkl.rmn@sunwayhotels.com', 'https://www.sunwayhotels.com/sunway-putra/dining/rmnusantara', 'https://www.instagram.com/sunwayputrahotel/', 'https://www.facebook.com/sunwayputrahotelkl', 4.8, 195,
    100, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJTbb6NQBv2jERYQk-9PCylE4', 'Restoran Sambal Bakar Nusantara, Tebrau, Johor Bahru (Best Sambal Bakar in Johor Bahru)', 'Restoran Sambal Bakar Nusantara, Tebrau, Johor Bahru (Best Sambal Bakar in Johor Bahru)', 'Halal restaurant', 'Singapore', 'Singapore', '01, Jalan Harmonium 35/1, Taman Desa Tebrau, 81100 Johor Bahru, Johor Darul Ta''zim, Malaysia', 'https://www.google.com/maps/place/Restoran+Sambal+Bakar+Nusantara,+Tebrau,+Johor+Bahru+%28Best+Sambal+Bakar+in+Johor+Bahru%29/data=!4m7!3m6!1s0x31da6f0035fab64d:0x4e94b2f0f43e0961!8m2!3d1.5546503!4d103.7893314!16s%2Fg%2F11w4sb8t_l!19sChIJTbb6NQBv2jERYQk-9PCylE4',
    '+60 11-7024 5066', 'hi@wa.link', 'https://wa.link/v1lwq3', 'https://www.instagram.com/whatsapp/?hl=en', 'https://www.facebook.com/profile.php?id=100064758844406', 4.7, 127,
    100, 'hot', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJzaygHJoZ2jERvRDwjYSL5w0', 'Nusantara Resto (Indonesian Restaurant)', 'Nusantara Resto (Indonesian )', 'nan', 'Singapore', 'Singapore', '107 Killiney Rd, Singapore 239554', 'https://www.google.com/maps/place/Nusantara+Resto+%28Indonesian+Restaurant%29/data=!4m7!3m6!1s0x31da199a1ca0accd:0xde78b848df010bd!8m2!3d1.2981289!4d103.8388316!16s%2Fg%2F1tfzt__7!19sChIJzaygHJoZ2jERvRDwjYSL5w0',
    '+65 6738 1049', NULL, 'https://www.facebook.com/NusantaraFusion/', NULL, NULL, 4.2, 11,
    25, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJkYkJbpIZ2jERpUV-zE8Tj5A', 'Ayam Penyet President - Lucky Plaza', 'Ayam Penyet President - Lucky Plaza', 'Indonesian restaurant', 'Singapore', 'Singapore', '304 Orchard Rd, #03-36-37 Lucky Plaza, Singapore 238863', 'https://www.google.com/maps/place/Ayam+Penyet+President+-+Lucky+Plaza/data=!4m7!3m6!1s0x31da19926e098991:0x908f134fcc7e45a5!8m2!3d1.3046547!4d103.8340113!16s%2Fg%2F11vj71n24m!19sChIJkYkJbpIZ2jERpUV-zE8Tj5A',
    '+65 6735 1262', NULL, 'https://ayampresident.com/contact-us/', NULL, NULL, 4.4, 672,
    40, 'cold', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJe6tPJHQX2jERhqVRjQ-ZtwQ', 'TEK-TEK Bidadari', 'TEK-TEK Bidadari', 'Indonesian restaurant', 'Singapore', 'Singapore', '106 Bidadari Park Dr, #01-05, MR03 Alkaff Vista, Singapore 340106', 'https://www.google.com/maps/place/TEK-TEK+Bidadari/data=!4m7!3m6!1s0x31da1774244fab7b:0x4b7990f8d51a586!8m2!3d1.3341255!4d103.8708376!16s%2Fg%2F11yl767gbg!19sChIJe6tPJHQX2jERhqVRjQ-ZtwQ',
    '+65 8899 2840', NULL, 'https://food.grab.com/sg/en/restaurant/tek-tek-indonesian-streetfood-bidadari-park-drive-delivery/4-C7UECAD1RJ2KEX?', 'https://www.instagram.com/grabfoodsg', 'https://www.facebook.com/grabsg', 4.3, 40,
    50, 'cold', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();

INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    'ChIJnWANJHE92jERoenR5ByI5IM', 'Rumah Makan Minang - Our Tampines Hub', 'Rumah Makan Minang - Our Tampines Hub', 'Indonesian restaurant', 'Singapore', 'Singapore', 'Our Tampines Hub, 1 Tampines Walk, #B1-47A, Singapore 528523', 'https://www.google.com/maps/place/Rumah+Makan+Minang+-+Our+Tampines+Hub/data=!4m7!3m6!1s0x31da3d71240d609d:0x83e4881ce4d1e9a1!8m2!3d1.3536011!4d103.9396535!16s%2Fg%2F11f3n3wkfz!19sChIJnWANJHE92jERoenR5ByI5IM',
    '+65 6977 7065', 'enquiry@minang.sg', 'https://www.minang.sg/', 'https://www.instagram.com/minang.sg/?hl=en', 'https://www.facebook.com/minang.sg/', 4.5, 1064,
    100, 'warm', 'pending', 0,
    NULL, NULL, NULL, '2026-08-17 20:58:28+00'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();
