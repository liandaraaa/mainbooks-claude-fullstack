const knex = require('knex');

const getConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      client: 'pg',
      connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      },
      pool: { min: 2, max: 10 },
    };
  }

  return {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'mainbooks_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
  };
};

const db = knex(getConfig());

module.exports = db;