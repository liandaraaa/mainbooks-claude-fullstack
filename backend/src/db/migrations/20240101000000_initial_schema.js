exports.up = async function (knex) {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('name').notNullable();
    table.string('tier_status').notNullable().defaultTo('free'); // free | premium
    table.timestamp('sub_end_date').nullable();
    table.string('role').notNullable().defaultTo('user'); // user | admin
    table.timestamps(true, true);
  });

  // Books table
  await knex.schema.createTable('books', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title').notNullable();
    table.string('author').notNullable();
    table.text('description').nullable();
    table.string('cover_url').nullable();
    table.string('genre').nullable();
    table.integer('pages').nullable();
    table.string('language').notNullable().defaultTo('id');
    table.boolean('is_sub_eligible').notNullable().defaultTo(true);
    table.decimal('otp_price', 10, 2).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('version').notNullable().defaultTo(1);
    table.timestamps(true, true);
  });

  // Entitlements table
  await knex.schema.createTable('entitlements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('book_id').notNullable().references('id').inTable('books').onDelete('CASCADE');
    table.string('access_type').notNullable(); // SUB | PURCHASE
    table.timestamp('granted_at').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);
    table.unique(['user_id', 'book_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('entitlements');
  await knex.schema.dropTableIfExists('books');
  await knex.schema.dropTableIfExists('users');
};
