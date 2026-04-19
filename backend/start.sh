#!/bin/bash
echo "Running migrations..."
NODE_ENV=production npx knex migrate:latest
echo "Running seeds..."
NODE_ENV=production npx knex seed:run
echo "Starting server..."
node src/index.js