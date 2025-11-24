-- Fix Admin User Role
-- This script ensures admin@uiges.com has the admin role

-- Update admin@uiges.com to have admin role
UPDATE users 
SET role = 'admin', 
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@uiges.com';

-- Verify the change
SELECT 
    id, 
    name, 
    email, 
    role, 
    is_active, 
    created_at 
FROM users 
WHERE email = 'admin@uiges.com';

-- Display success message
SELECT 
    CASE 
        WHEN role = 'admin' THEN '✅ Admin role restored successfully!'
        ELSE '⚠️  Admin role not found - please check if user exists'
    END as status
FROM users 
WHERE email = 'admin@uiges.com';

