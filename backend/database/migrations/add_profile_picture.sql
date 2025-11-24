-- Add profile_picture column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_picture ON users(profile_picture);

