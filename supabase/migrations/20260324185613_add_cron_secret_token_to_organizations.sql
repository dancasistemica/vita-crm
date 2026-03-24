-- Add cron_secret_token column to organizations table
ALTER TABLE organizations ADD COLUMN cron_secret_token TEXT UNIQUE DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX idx_organizations_cron_secret_token ON organizations(cron_secret_token);

-- Add comment for documentation
COMMENT ON COLUMN organizations.cron_secret_token IS 'Secret token for Cron-Job.org authentication. Each organization has a unique token for secure webhook calls.';
