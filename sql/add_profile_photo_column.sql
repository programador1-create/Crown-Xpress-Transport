-- Add profile_photo column to employees table
ALTER TABLE employees 
ADD COLUMN profile_photo TEXT;

-- Add comment to document the purpose
COMMENT ON COLUMN employees.profile_photo IS 'Base64 encoded profile photo data (max 5MB)';
