const { Pool, types } = require('pg');
require('dotenv').config();

// Override timestamp parsing to return raw string (no timezone conversion)
// OID 1114 is TIMESTAMP WITHOUT TIME ZONE
types.setTypeParser(1114, function(val) {
  return val; // Return raw string instead of Date object
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'uiges_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 500, // Increased from 200 to 500 for 2500 concurrent candidates
  min: 10, // Minimum 10 connections always ready
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased from 2000 to 5000ms
  acquireTimeoutMillis: 30000, // Max time to wait for a connection
  maxUses: 7500, // Max uses per connection before recycling
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Set timezone to UTC for all connections to prevent timestamp conversion
pool.on('connect', (client) => {
  client.query('SET timezone = "UTC"');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool
};

