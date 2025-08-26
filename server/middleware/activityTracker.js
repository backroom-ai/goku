import pool from '../config/database.js';

// Middleware to track user activity
export const trackUserActivity = async (req, res, next) => {
  // Only track activity for authenticated users
  if (req.user && req.user.id) {
    try {
      // Update last_active timestamp
      await pool.query(
        'UPDATE users SET last_active = NOW() WHERE id = $1',
        [req.user.id]
      );
    } catch (error) {
      // Log error but don't block the request
      console.error('Activity tracking error:', error);
    }
  }
  
  next();
};

export default trackUserActivity;
