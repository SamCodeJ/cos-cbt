const { Pool, types } = require('pg');
require('dotenv').config();

// Override timestamp parsing to return raw string (no timezone conversion)
// OID 1114 is TIMESTAMP WITHOUT TIME ZONE
types.setTypeParser(1114, function(val) {
  return val; // Return raw string instead of Date object
});

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'uiges_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 75, // Optimized for 4 workers on 16GB RAM for 2000 users
  min: 5, // Keep a few connections warm
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased to 10s to survive the initial login spike
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

