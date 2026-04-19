#!/bin/bash
echo "DATABASE_URL exists: $( [ -n "$DATABASE_URL" ] && echo 'YES' || echo 'NO' )"
echo "Running migrations..."
NODE_ENV=production npx knex migrate:latest
echo "Running seeds..."
NODE_ENV=production npx knex seed:run
echo "Starting server..."
node src/index.js