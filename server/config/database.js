import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
  // TCP Keep-Alive settings
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Additional connection options for stability
  options: '--tcp_keepalives_idle=600 --tcp_keepalives_interval=30 --tcp_keepalives_count=3'
});

// Enhanced error handling and reconnection logic
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const baseDelay = 1000; // 1 second

const exponentialBackoff = (attempt) => {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
};

const handleConnectionError = async (err) => {
  console.error('Database connection error:', err.message);
  
  if (reconnectAttempts < maxReconnectAttempts) {
    const delay = exponentialBackoff(reconnectAttempts);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await pool.query('SELECT 1');
        console.log('Database reconnection successful');
        reconnectAttempts = 0; // Reset on successful connection
      } catch (retryErr) {
        reconnectAttempts++;
        handleConnectionError(retryErr);
      }
    }, delay);
  } else {
    console.error('Max reconnection attempts reached. Manual intervention required.');
  }
};

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
  reconnectAttempts = 0; // Reset on successful connection
});

pool.on('error', (err) => {
  handleConnectionError(err);
});

// Handle pool acquisition errors
pool.on('acquire', () => {
  // Connection acquired from pool
});

pool.on('remove', () => {
  // Connection removed from pool
});

export default pool;