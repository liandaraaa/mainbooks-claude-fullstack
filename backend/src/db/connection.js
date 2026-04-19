const knex = require('knex');

const env = process.env.NODE_ENV || 'development';

let config;

if (process.env.DATABASE_URL) {
  config = {
    client: 'postgresql',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    migrations: { directory: './src/db/migrations' },
    seeds: { directory: './src/db/seeds' },
    pool: { min: 2, max: 10 },
  };
} else {
  const knexfile = require('../../knexfile');
  config = knexfile[env];
}

const db = knex(config);

module.exports = db;