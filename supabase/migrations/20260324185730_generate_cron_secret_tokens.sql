-- Generate unique cron_secret_token for all organizations without one
UPDATE organizations
SET cron_secret_token = 'cron_sk_' || id::text || '_' || encode(gen_random_bytes(16), 'hex')
WHERE cron_secret_token IS NULL;-- Generate unique cron_secret_token for all organizations without one
UPDATE organizations
SET cron_secret_token = 'cron_sk_' || id::text || '_' || encode(gen_random_bytes(16), 'hex')
WHERE cron_secret_token IS NULL;
