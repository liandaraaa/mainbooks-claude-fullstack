const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
  await knex('entitlements').del();
  await knex('books').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  const [adminUser, freeUser, premiumUser] = await knex('users').insert([
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@mainbooks.id',
      password_hash: adminHash,
      name: 'Admin MainBooks',
      tier_status: 'premium',
      sub_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      role: 'admin',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'user@mainbooks.id',
      password_hash: passwordHash,
      name: 'Budi Santoso',
      tier_status: 'free',
      sub_end_date: null,
      role: 'user',
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'premium@mainbooks.id',
      password_hash: passwordHash,
      name: 'Sari Dewi',
      tier_status: 'premium',
      sub_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      role: 'user',
    },
  ]).returning('*');

  const books = await knex('books').insert([
    {
      id: '10000000-0000-0000-0000-000000000001',
      title: 'Si Kancil dan Buaya',
      author: 'Raden Saleh',
      description: 'Kisah klasik si kancil yang cerdik berhasil melewati sungai dengan mengecoh para buaya. Cerita penuh kebijaksanaan dan kecerdikan untuk anak-anak.',
      cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      genre: 'Dongeng',
      pages: 48,
      language: 'id',
      is_sub_eligible: true,
      otp_price: null,
      is_active: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      title: 'Petualangan Timun Mas',
      author: 'Siti Rahayu',
      description: 'Perjalanan epik Timun Mas melawan raksasa hijau yang menakutkan. Cerita keberanian dan kecerdikan seorang gadis muda.',
      cover_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
      genre: 'Dongeng',
      pages: 64,
      language: 'id',
      is_sub_eligible: true,
      otp_price: null,
      is_active: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      title: 'Bintang di Langit Nusantara',
      author: 'Ahmad Tohari',
      description: 'Kisah anak-anak dari berbagai pulau di Indonesia yang bersatu dalam petualangan mencari bintang paling terang. Mengajarkan persatuan dan keberagaman.',
      cover_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
      genre: 'Petualangan',
      pages: 120,
      language: 'id',
      is_sub_eligible: false,
      otp_price: 45000,
      is_active: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      title: 'Rahasia Hutan Bambu',
      author: 'Dewi Lestari',
      description: 'Di balik hutan bambu yang misterius, tersimpan rahasia terbesar yang pernah ada. Kisah seru penuh teka-teki untuk anak usia 8-12 tahun.',
      cover_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      genre: 'Misteri',
      pages: 156,
      language: 'id',
      is_sub_eligible: true,
      otp_price: null,
      is_active: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      title: 'Sang Petualang Laut Jawa',
      author: 'Pramoedya Ananta',
      description: 'Pelayaran mendebarkan seorang bocah nelayan yang menemukan pulau tersembunyi di tengah Laut Jawa. Edisi premium dengan ilustrasi full-color.',
      cover_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      genre: 'Petualangan',
      pages: 200,
      language: 'id',
      is_sub_eligible: false,
      otp_price: 75000,
      is_active: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000006',
      title: 'Dinosaurus di Kebun Binatang',
      author: 'Arief Budiman',
      description: 'Ketika dinosaurus tiba-tiba muncul di kebun binatang kota, semua orang panik! Hanya Rani yang tahu cara mengembalikan mereka ke zamannya.',
      cover_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400',
      genre: 'Fantasi',
      pages: 88,
      language: 'id',
      is_sub_eligible: true,
      otp_price: null,
      is_active: true,
    },
  ]).returning('*');

  // Give premium user some entitlements
  await knex('entitlements').insert([
    {
      user_id: '00000000-0000-0000-0000-000000000003',
      book_id: '10000000-0000-0000-0000-000000000003',
      access_type: 'PURCHASE',
      granted_at: new Date(),
    },
  ]);
};
